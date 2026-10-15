import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { type Horizon, listHorizons } from '@/db/horizons';
import { IDLE_STATE } from '@/lib/action-state';
import { createUserFixtures } from '@/test/fixtures';
import {
  createHorizonAction,
  deleteHorizonAction,
  moveHorizonAction,
  renameHorizonAction,
} from './actions';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockedAuth = vi.mocked(auth as () => Promise<unknown>);
const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

function signInAs(userId: string) {
  mockedAuth.mockResolvedValue({ user: { id: userId } });
}

function formWith(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

async function names(userId: string) {
  return (await listHorizons(userId)).map((horizon) => horizon.name);
}

async function first(userId: string): Promise<Horizon> {
  const [horizon] = await listHorizons(userId);
  return horizon;
}

beforeEach(() => mockedAuth.mockReset());

describe('horizon actions', () => {
  it('creates, renames, moves and deletes horizons of the session user', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);
    const curto = await first(userId);

    expect(
      await createHorizonAction(IDLE_STATE, formWith({ name: 'Este ano' })),
    ).toEqual({ status: 'success' });
    await renameHorizonAction(IDLE_STATE, formWith({ id: curto.id, name: 'Já' }));
    await moveHorizonAction(IDLE_STATE, formWith({ id: curto.id, direction: 'down' }));

    expect(await names(userId)).toEqual(['Médio', 'Já', 'Longo', 'Contínuo', 'Este ano']);

    await deleteHorizonAction(IDLE_STATE, formWith({ id: curto.id }));
    expect(await names(userId)).toEqual(['Médio', 'Longo', 'Contínuo', 'Este ano']);
  });

  it('returns neutral messages for invalid or duplicate names', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);
    await listHorizons(userId);

    expect(await createHorizonAction(IDLE_STATE, formWith({ name: '' }))).toEqual({
      status: 'error',
      message: 'Dê um nome ao horizonte.',
    });
    expect(await createHorizonAction(IDLE_STATE, formWith({ name: 'LONGO' }))).toEqual({
      status: 'error',
      message: 'Já existe um horizonte com esse nome.',
    });
  });

  it('redirects to sign in without a session', async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(
      createHorizonAction(IDLE_STATE, formWith({ name: 'Este ano' })),
    ).rejects.toThrow('NEXT_REDIRECT:/signin');
  });
});

describe('isolation between users', () => {
  it('never changes a horizon of another user', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const curtoB = await first(userB);
    signInAs(userA);
    const notFound = { status: 'error', message: 'Item não encontrado.' };

    expect(
      await renameHorizonAction(IDLE_STATE, formWith({ id: curtoB.id, name: 'Hack' })),
    ).toEqual(notFound);
    expect(
      await moveHorizonAction(IDLE_STATE, formWith({ id: curtoB.id, direction: 'down' })),
    ).toEqual(notFound);
    expect(await deleteHorizonAction(IDLE_STATE, formWith({ id: curtoB.id }))).toEqual(
      notFound,
    );

    expect(await names(userB)).toEqual(['Curto', 'Médio', 'Longo', 'Contínuo']);
  });

  it('ignores a userId sent by the client', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await listHorizons(userB);
    signInAs(userA);

    await createHorizonAction(IDLE_STATE, formWith({ name: 'Este ano', userId: userB }));

    expect(await names(userA)).toContain('Este ano');
    expect(await names(userB)).not.toContain('Este ano');
  });
});
