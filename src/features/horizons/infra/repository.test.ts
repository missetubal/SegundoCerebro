import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { db } from '@/shared/db';
import { horizons } from '@/shared/db';
import { createUserFixtures } from '@/test/fixtures';
import {
  createHorizon,
  deleteHorizon,
  type Horizon,
  listHorizons,
  moveHorizon,
  renameHorizon,
} from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

async function names(userId: string): Promise<string[]> {
  return (await listHorizons(userId)).map((horizon) => horizon.name);
}

async function horizonNamed(userId: string, name: string): Promise<Horizon> {
  const horizon = (await listHorizons(userId)).find((item) => item.name === name);
  if (!horizon) throw new Error(`Horizon ${name} not found`);
  return horizon;
}

describe('listHorizons', () => {
  it('seeds the default horizons on first access', async () => {
    const userId = await fixtures.createUser();

    expect(await names(userId)).toEqual(['Curto', 'Médio', 'Longo', 'Contínuo']);
  });

  it('seeds only once on concurrent first access', async () => {
    const userId = await fixtures.createUser();

    await Promise.all([listHorizons(userId), listHorizons(userId), listHorizons(userId)]);

    expect(await db.$count(horizons, eq(horizons.userId, userId))).toBe(4);
  });

  it('does not recreate defaults after the user deletes all of them', async () => {
    const userId = await fixtures.createUser();
    for (const horizon of await listHorizons(userId)) {
      await deleteHorizon(userId, horizon.id);
    }

    expect(await listHorizons(userId)).toEqual([]);
  });

  it('still seeds when a default name already exists', async () => {
    const userId = await fixtures.createUser();
    await db.insert(horizons).values({ userId, name: 'curto', sortOrder: 1 });

    expect(await names(userId)).toEqual(['curto', 'Médio', 'Longo', 'Contínuo']);
  });

  it('does not write once the defaults were seeded', async () => {
    const userId = await fixtures.createUser();
    await listHorizons(userId);
    const insert = vi.spyOn(db, 'insert');
    const execute = vi.spyOn(db, 'execute');

    await listHorizons(userId);

    expect(insert).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    insert.mockRestore();
    execute.mockRestore();
  });
});

describe('createHorizon', () => {
  it('appends the new horizon to the end', async () => {
    const userId = await fixtures.createUser();
    await listHorizons(userId);

    const result = await createHorizon(userId, 'Este trimestre');

    expect(result.ok).toBe(true);
    expect(await names(userId)).toEqual([
      'Curto',
      'Médio',
      'Longo',
      'Contínuo',
      'Este trimestre',
    ]);
  });

  it('seeds the defaults first when called before any listing', async () => {
    const userId = await fixtures.createUser();

    expect(await createHorizon(userId, 'Curto')).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
    expect((await createHorizon(userId, 'Este ano')).ok).toBe(true);
    expect(await names(userId)).toEqual([
      'Curto',
      'Médio',
      'Longo',
      'Contínuo',
      'Este ano',
    ]);
  });

  it('rejects a duplicate name ignoring case', async () => {
    const userId = await fixtures.createUser();
    await listHorizons(userId);

    expect(await createHorizon(userId, 'curto')).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
  });
});

describe('renameHorizon', () => {
  it('renames a default horizon keeping its position', async () => {
    const userId = await fixtures.createUser();
    const curto = await horizonNamed(userId, 'Curto');

    const result = await renameHorizon(userId, curto.id, 'Até 3 meses');

    expect(result.ok).toBe(true);
    expect(await names(userId)).toEqual(['Até 3 meses', 'Médio', 'Longo', 'Contínuo']);
  });

  it('reports duplicate names', async () => {
    const userId = await fixtures.createUser();
    const curto = await horizonNamed(userId, 'Curto');

    expect(await renameHorizon(userId, curto.id, 'LONGO')).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
  });
});

describe('moveHorizon', () => {
  it('moves a horizon down and keeps it at the edges', async () => {
    const userId = await fixtures.createUser();
    const curto = await horizonNamed(userId, 'Curto');

    await moveHorizon(userId, curto.id, 'down');
    expect(await names(userId)).toEqual(['Médio', 'Curto', 'Longo', 'Contínuo']);

    const medio = await horizonNamed(userId, 'Médio');
    expect(await moveHorizon(userId, medio.id, 'up')).toBe(true);
    expect(await names(userId)).toEqual(['Médio', 'Curto', 'Longo', 'Contínuo']);
  });

  it('applies concurrent moves without losing any', async () => {
    const userId = await fixtures.createUser();
    const curto = await horizonNamed(userId, 'Curto');
    const continuo = await horizonNamed(userId, 'Contínuo');

    await Promise.all([
      moveHorizon(userId, curto.id, 'down'),
      moveHorizon(userId, continuo.id, 'up'),
    ]);

    expect(await names(userId)).toEqual(['Médio', 'Curto', 'Contínuo', 'Longo']);
  });
});

describe('deleteHorizon', () => {
  it('deletes a default horizon keeping the relative order', async () => {
    const userId = await fixtures.createUser();
    const continuo = await horizonNamed(userId, 'Contínuo');

    expect(await deleteHorizon(userId, continuo.id)).toBe(true);

    expect(await names(userId)).toEqual(['Curto', 'Médio', 'Longo']);
  });
});

describe('isolation between users', () => {
  it('keeps default horizons independent per user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await listHorizons(userB);
    const curtoA = await horizonNamed(userA, 'Curto');

    await renameHorizon(userA, curtoA.id, 'Já');

    expect(await names(userB)).toEqual(['Curto', 'Médio', 'Longo', 'Contínuo']);
  });

  it('treats horizons of another user as not found', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await listHorizons(userA);
    const curtoB = await horizonNamed(userB, 'Curto');

    expect(await renameHorizon(userA, curtoB.id, 'Hack')).toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(await moveHorizon(userA, curtoB.id, 'down')).toBe(false);
    expect(await deleteHorizon(userA, curtoB.id)).toBe(false);

    expect(await names(userB)).toEqual(['Curto', 'Médio', 'Longo', 'Contínuo']);
  });
});
