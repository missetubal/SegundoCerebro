import { describe, expect, it, vi } from 'vitest';
import { refresh } from 'next/cache';
import { updateTimezoneAction } from './actions';

vi.mock('@/features/auth/server', () => ({
  requireUserId: vi.fn().mockResolvedValue('user-a'),
}));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('../infra', () => ({
  updateTimezone: vi.fn().mockRejectedValue(new Error('connection lost')),
}));

describe('updateTimezoneAction on database failure', () => {
  it('returns an error state instead of throwing', async () => {
    const formData = new FormData();
    formData.set('timezone', 'Europe/Lisbon');

    const state = await updateTimezoneAction({ status: 'idle' }, formData);

    expect(state.status).toBe('error');
    expect(refresh).not.toHaveBeenCalled();
  });
});
