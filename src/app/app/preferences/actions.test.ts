import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from '@/auth';
import { getPreferences, updateTimezone } from '@/db/preferences';
import { createUserFixtures } from '@/test/fixtures';
import { updateTimezoneAction } from './actions';

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

describe('updateTimezoneAction', () => {
  beforeEach(() => mockedAuth.mockReset());

  it('saves a valid timezone for the session user', async () => {
    const userId = await fixtures.createUser();
    signInAs(userId);

    const state = await updateTimezoneAction(
      { status: 'idle' },
      formWith({ timezone: 'Europe/Lisbon' }),
    );

    expect(state).toEqual({ status: 'success' });
    expect((await getPreferences(userId)).timezone).toBe('Europe/Lisbon');
  });

  it('rejects an invalid timezone without touching the database', async () => {
    const userId = await fixtures.createUser();
    await updateTimezone(userId, 'Asia/Tokyo');
    signInAs(userId);

    const state = await updateTimezoneAction(
      { status: 'idle' },
      formWith({ timezone: 'Marte/Base' }),
    );

    expect(state.status).toBe('error');
    expect((await getPreferences(userId)).timezone).toBe('Asia/Tokyo');
  });

  it('redirects without a session and writes nothing', async () => {
    mockedAuth.mockResolvedValue(null);

    await expect(
      updateTimezoneAction(
        { status: 'idle' },
        formWith({ timezone: 'Europe/Lisbon' }),
      ),
    ).rejects.toThrow('NEXT_REDIRECT:/signin');
  });

  it('ignores a userId sent by the client', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    await updateTimezone(userB, 'Asia/Tokyo');
    signInAs(userA);

    await updateTimezoneAction(
      { status: 'idle' },
      formWith({ timezone: 'Europe/Lisbon', userId: userB }),
    );

    expect((await getPreferences(userA)).timezone).toBe('Europe/Lisbon');
    expect((await getPreferences(userB)).timezone).toBe('Asia/Tokyo');
  });
});
