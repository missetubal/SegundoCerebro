import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auth } from './next-auth';
import { requireUserId } from './session';

vi.mock('./next-auth', () => ({ auth: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockedAuth = vi.mocked(auth as () => Promise<unknown>);

describe('requireUserId', () => {
  beforeEach(() => mockedAuth.mockReset());

  it('returns the session user id', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user-a' } });
    await expect(requireUserId()).resolves.toBe('user-a');
  });

  it('redirects to /signin without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    await expect(requireUserId()).rejects.toThrow('NEXT_REDIRECT:/signin');
  });
});
