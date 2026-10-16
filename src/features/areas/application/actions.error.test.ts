import { describe, expect, it, vi } from 'vitest';
import { refresh } from 'next/cache';
import { IDLE_STATE } from '@/shared/lib';
import { archiveAreaAction, createAreaAction } from './actions';

vi.mock('@/features/auth/server', () => ({
  requireUserId: vi.fn().mockResolvedValue('user-a'),
}));
vi.mock('next/cache', () => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('../infra', () => ({
  createArea: vi.fn().mockRejectedValue(new Error('connection lost')),
  archiveArea: vi.fn().mockRejectedValue(new Error('connection lost')),
}));

const unavailable = {
  status: 'error',
  message: 'Não foi possível salvar agora. Tente de novo em instantes.',
};

describe('area actions on database failure', () => {
  it('returns an error state instead of throwing', async () => {
    const create = new FormData();
    create.set('name', 'Carreira');
    const archive = new FormData();
    archive.set('id', 'area-1');

    expect(await createAreaAction(IDLE_STATE, create)).toEqual(unavailable);
    expect(await archiveAreaAction(IDLE_STATE, archive)).toEqual(unavailable);
    expect(refresh).not.toHaveBeenCalled();
  });
});
