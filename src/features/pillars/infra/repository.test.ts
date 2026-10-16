import { afterAll, describe, expect, it } from 'vitest';
import type { PillarInput } from '../domain';
import { createUserFixtures } from '@/test/fixtures';
import {
  archivePillar,
  createPillar,
  deletePillar,
  getPillar,
  listPillars,
  movePillar,
  type Pillar,
  unarchivePillar,
  updatePillar,
} from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

function input(name: string, overrides: Partial<PillarInput> = {}): PillarInput {
  return { name, description: null, color: null, icon: null, ...overrides };
}

async function create(userId: string, name: string): Promise<Pillar> {
  const result = await createPillar(userId, input(name));
  if (!result.ok) throw new Error(`Could not create pillar ${name}`);
  return result.item;
}

async function activeNames(userId: string): Promise<string[]> {
  return (await listPillars(userId)).active.map((pillar) => pillar.name);
}

describe('createPillar and listPillars', () => {
  it('appends new pillars to the end of the active list', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    await create(userId, 'Saúde');
    await create(userId, 'Lazer');

    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde', 'Lazer']);
  });

  it('stores optional fields', async () => {
    const userId = await fixtures.createUser();

    const result = await createPillar(
      userId,
      input('Carreira', { description: 'Trabalho', color: 'blue', icon: 'briefcase' }),
    );

    expect(result.ok && result.item).toMatchObject({
      name: 'Carreira',
      description: 'Trabalho',
      color: 'blue',
      icon: 'briefcase',
      archivedAt: null,
    });
  });

  it('rejects a duplicate name ignoring case', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Saúde');

    const result = await createPillar(userId, input('saúde'));

    expect(result).toEqual({ ok: false, reason: 'duplicate_name' });
    expect(await activeNames(userId)).toEqual(['Saúde']);
  });

  it('rejects a name already used by an archived pillar', async () => {
    const userId = await fixtures.createUser();
    const lazer = await create(userId, 'Lazer');
    await archivePillar(userId, lazer.id);

    expect(await createPillar(userId, input('Lazer'))).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
  });
});

describe('updatePillar', () => {
  it('changes fields without moving or archiving the pillar', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    const saude = await create(userId, 'Saúde');
    await create(userId, 'Lazer');

    const result = await updatePillar(
      userId,
      saude.id,
      input('Saúde e corpo', { color: 'emerald' }),
    );

    expect(result.ok && result.item.color).toBe('emerald');
    expect(result.ok && result.item.updatedAt.getTime()).toBeGreaterThanOrEqual(
      saude.updatedAt.getTime(),
    );
    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde e corpo', 'Lazer']);
  });

  it('clears color and icon', async () => {
    const userId = await fixtures.createUser();
    const created = await createPillar(
      userId,
      input('Casa', { color: 'slate', icon: 'house' }),
    );
    if (!created.ok) throw new Error('setup failed');

    await updatePillar(userId, created.item.id, input('Casa'));

    expect(await getPillar(userId, created.item.id)).toMatchObject({
      color: null,
      icon: null,
    });
  });

  it('reports duplicate names', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Saúde');
    const lazer = await create(userId, 'Lazer');

    expect(await updatePillar(userId, lazer.id, input('SAÚDE'))).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
  });
});

describe('movePillar', () => {
  it('moves a pillar up and down', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    await create(userId, 'Saúde');
    const lazer = await create(userId, 'Lazer');

    await movePillar(userId, lazer.id, 'up');
    expect(await activeNames(userId)).toEqual(['Carreira', 'Lazer', 'Saúde']);

    await movePillar(userId, lazer.id, 'down');
    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde', 'Lazer']);
  });

  it('does nothing at the edges of the list', async () => {
    const userId = await fixtures.createUser();
    const carreira = await create(userId, 'Carreira');
    const saude = await create(userId, 'Saúde');

    expect(await movePillar(userId, carreira.id, 'up')).toBe(true);
    expect(await movePillar(userId, saude.id, 'down')).toBe(true);
    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde']);
  });

  it('applies concurrent moves without losing any', async () => {
    const userId = await fixtures.createUser();
    const carreira = await create(userId, 'Carreira');
    await create(userId, 'Saúde');
    await create(userId, 'Lazer');
    const familia = await create(userId, 'Família');

    await Promise.all([
      movePillar(userId, carreira.id, 'down'),
      movePillar(userId, familia.id, 'up'),
    ]);

    expect(await activeNames(userId)).toEqual(['Saúde', 'Carreira', 'Família', 'Lazer']);
  });
});

describe('archivePillar and unarchivePillar', () => {
  it('moves an archived pillar out of the active list', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    const negocio = await create(userId, 'Negócio');

    expect(await archivePillar(userId, negocio.id)).toBe(true);

    const { active, archived } = await listPillars(userId);
    expect(active.map((pillar) => pillar.name)).toEqual(['Carreira']);
    expect(archived.map((pillar) => pillar.name)).toEqual(['Negócio']);
    expect(archived[0].archivedAt).toBeInstanceOf(Date);
  });

  it('brings an unarchived pillar back at the end of the active list', async () => {
    const userId = await fixtures.createUser();
    const negocio = await create(userId, 'Negócio');
    await create(userId, 'Carreira');
    await archivePillar(userId, negocio.id);
    await create(userId, 'Saúde');

    expect(await unarchivePillar(userId, negocio.id)).toBe(true);

    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde', 'Negócio']);
    expect((await listPillars(userId)).archived).toEqual([]);
  });

  it('keeps the position when unarchiving an active pillar', async () => {
    const userId = await fixtures.createUser();
    const carreira = await create(userId, 'Carreira');
    await create(userId, 'Saúde');

    await unarchivePillar(userId, carreira.id);

    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde']);
  });
});

describe('deletePillar', () => {
  it('removes active and archived pillars', async () => {
    const userId = await fixtures.createUser();
    const lazer = await create(userId, 'Lazer');
    const casa = await create(userId, 'Casa');
    await archivePillar(userId, casa.id);

    expect(await deletePillar(userId, lazer.id)).toBe(true);
    expect(await deletePillar(userId, casa.id)).toBe(true);

    expect(await listPillars(userId)).toEqual({ active: [], archived: [] });
    expect(await getPillar(userId, lazer.id)).toBeNull();
  });
});

describe('isolation between users', () => {
  it('lists only the pillars of the given user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await create(userA, 'Carreira');
    await create(userB, 'Finanças');

    expect(await activeNames(userA)).toEqual(['Carreira']);
  });

  it('allows the same name for different users', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await create(userA, 'Saúde');

    expect((await createPillar(userB, input('Saúde'))).ok).toBe(true);
  });

  it('treats pillars of another user as not found', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const pillarB = await create(userB, 'Finanças');
    await create(userB, 'Casa');

    expect(await getPillar(userA, pillarB.id)).toBeNull();
    expect(await updatePillar(userA, pillarB.id, input('Hack'))).toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(await movePillar(userA, pillarB.id, 'down')).toBe(false);
    expect(await archivePillar(userA, pillarB.id)).toBe(false);
    expect(await unarchivePillar(userA, pillarB.id)).toBe(false);
    expect(await deletePillar(userA, pillarB.id)).toBe(false);

    expect(await getPillar(userB, pillarB.id)).toEqual(pillarB);
    expect(await activeNames(userB)).toEqual(['Finanças', 'Casa']);
  });
});
