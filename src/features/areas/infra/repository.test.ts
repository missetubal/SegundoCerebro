import { afterAll, describe, expect, it } from 'vitest';
import type { AreaInput } from '../domain';
import { createUserFixtures } from '@/test/fixtures';
import {
  archiveArea,
  createArea,
  deleteArea,
  getArea,
  listAreas,
  moveArea,
  type Area,
  unarchiveArea,
  updateArea,
} from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

function input(name: string, overrides: Partial<AreaInput> = {}): AreaInput {
  return { name, description: null, color: null, icon: null, ...overrides };
}

async function create(userId: string, name: string): Promise<Area> {
  const result = await createArea(userId, input(name));
  if (!result.ok) throw new Error(`Could not create area ${name}`);
  return result.item;
}

async function activeNames(userId: string): Promise<string[]> {
  return (await listAreas(userId)).active.map((area) => area.name);
}

describe('createArea and listAreas', () => {
  it('appends new areas to the end of the active list', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    await create(userId, 'Saúde');
    await create(userId, 'Lazer');

    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde', 'Lazer']);
  });

  it('stores optional fields', async () => {
    const userId = await fixtures.createUser();

    const result = await createArea(
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

    const result = await createArea(userId, input('saúde'));

    expect(result).toEqual({ ok: false, reason: 'duplicate_name' });
    expect(await activeNames(userId)).toEqual(['Saúde']);
  });

  it('rejects a name already used by an archived area', async () => {
    const userId = await fixtures.createUser();
    const lazer = await create(userId, 'Lazer');
    await archiveArea(userId, lazer.id);

    expect(await createArea(userId, input('Lazer'))).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
  });
});

describe('updateArea', () => {
  it('changes fields without moving or archiving the area', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    const saude = await create(userId, 'Saúde');
    await create(userId, 'Lazer');

    const result = await updateArea(
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
    const created = await createArea(
      userId,
      input('Casa', { color: 'slate', icon: 'house' }),
    );
    if (!created.ok) throw new Error('setup failed');

    await updateArea(userId, created.item.id, input('Casa'));

    expect(await getArea(userId, created.item.id)).toMatchObject({
      color: null,
      icon: null,
    });
  });

  it('reports duplicate names', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Saúde');
    const lazer = await create(userId, 'Lazer');

    expect(await updateArea(userId, lazer.id, input('SAÚDE'))).toEqual({
      ok: false,
      reason: 'duplicate_name',
    });
  });
});

describe('moveArea', () => {
  it('moves a area up and down', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    await create(userId, 'Saúde');
    const lazer = await create(userId, 'Lazer');

    await moveArea(userId, lazer.id, 'up');
    expect(await activeNames(userId)).toEqual(['Carreira', 'Lazer', 'Saúde']);

    await moveArea(userId, lazer.id, 'down');
    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde', 'Lazer']);
  });

  it('does nothing at the edges of the list', async () => {
    const userId = await fixtures.createUser();
    const carreira = await create(userId, 'Carreira');
    const saude = await create(userId, 'Saúde');

    expect(await moveArea(userId, carreira.id, 'up')).toBe(true);
    expect(await moveArea(userId, saude.id, 'down')).toBe(true);
    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde']);
  });

  it('applies concurrent moves without losing any', async () => {
    const userId = await fixtures.createUser();
    const carreira = await create(userId, 'Carreira');
    await create(userId, 'Saúde');
    await create(userId, 'Lazer');
    const familia = await create(userId, 'Família');

    await Promise.all([
      moveArea(userId, carreira.id, 'down'),
      moveArea(userId, familia.id, 'up'),
    ]);

    expect(await activeNames(userId)).toEqual(['Saúde', 'Carreira', 'Família', 'Lazer']);
  });
});

describe('archiveArea and unarchiveArea', () => {
  it('moves an archived area out of the active list', async () => {
    const userId = await fixtures.createUser();
    await create(userId, 'Carreira');
    const negocio = await create(userId, 'Negócio');

    expect(await archiveArea(userId, negocio.id)).toBe(true);

    const { active, archived } = await listAreas(userId);
    expect(active.map((area) => area.name)).toEqual(['Carreira']);
    expect(archived.map((area) => area.name)).toEqual(['Negócio']);
    expect(archived[0].archivedAt).toBeInstanceOf(Date);
  });

  it('brings an unarchived area back at the end of the active list', async () => {
    const userId = await fixtures.createUser();
    const negocio = await create(userId, 'Negócio');
    await create(userId, 'Carreira');
    await archiveArea(userId, negocio.id);
    await create(userId, 'Saúde');

    expect(await unarchiveArea(userId, negocio.id)).toBe(true);

    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde', 'Negócio']);
    expect((await listAreas(userId)).archived).toEqual([]);
  });

  it('keeps the position when unarchiving an active area', async () => {
    const userId = await fixtures.createUser();
    const carreira = await create(userId, 'Carreira');
    await create(userId, 'Saúde');

    await unarchiveArea(userId, carreira.id);

    expect(await activeNames(userId)).toEqual(['Carreira', 'Saúde']);
  });
});

describe('deleteArea', () => {
  it('removes active and archived areas', async () => {
    const userId = await fixtures.createUser();
    const lazer = await create(userId, 'Lazer');
    const casa = await create(userId, 'Casa');
    await archiveArea(userId, casa.id);

    expect(await deleteArea(userId, lazer.id)).toBe(true);
    expect(await deleteArea(userId, casa.id)).toBe(true);

    expect(await listAreas(userId)).toEqual({ active: [], archived: [] });
    expect(await getArea(userId, lazer.id)).toBeNull();
  });
});

describe('isolation between users', () => {
  it('lists only the areas of the given user', async () => {
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

    expect((await createArea(userB, input('Saúde'))).ok).toBe(true);
  });

  it('treats areas of another user as not found', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const areaB = await create(userB, 'Finanças');
    await create(userB, 'Casa');

    expect(await getArea(userA, areaB.id)).toBeNull();
    expect(await updateArea(userA, areaB.id, input('Hack'))).toEqual({
      ok: false,
      reason: 'not_found',
    });
    expect(await moveArea(userA, areaB.id, 'down')).toBe(false);
    expect(await archiveArea(userA, areaB.id)).toBe(false);
    expect(await unarchiveArea(userA, areaB.id)).toBe(false);
    expect(await deleteArea(userA, areaB.id)).toBe(false);

    expect(await getArea(userB, areaB.id)).toEqual(areaB);
    expect(await activeNames(userB)).toEqual(['Finanças', 'Casa']);
  });
});
