import { describe, expect, it, vi } from 'vitest';
import { refresh } from 'next/cache';
import { IDLE_STATE } from '@/lib/action-state';
import { archivePillarAction, createPillarAction } from './actions';

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-a' } }),
}));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/db/pillars', () => ({
  createPillar: vi.fn().mockRejectedValue(new Error('connection lost')),
  archivePillar: vi.fn().mockRejectedValue(new Error('connection lost')),
}));

const unavailable = {
  status: 'error',
  message: 'Não foi possível salvar agora. Tente de novo em instantes.',
};

describe('pillar actions on database failure', () => {
  it('returns an error state instead of throwing', async () => {
    const create = new FormData();
    create.set('name', 'Carreira');
    const archive = new FormData();
    archive.set('id', 'pillar-1');

    expect(await createPillarAction(IDLE_STATE, create)).toEqual(unavailable);
    expect(await archivePillarAction(IDLE_STATE, archive)).toEqual(unavailable);
    expect(refresh).not.toHaveBeenCalled();
  });
});
