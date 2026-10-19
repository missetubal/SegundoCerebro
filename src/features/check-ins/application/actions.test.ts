import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireUserId } from '@/features/auth/server';
import { getCheckIn } from '@/features/check-ins/server';
import {
  createMedication,
  listOccurrencesForDate,
} from '@/features/medications/server';
import { IDLE_STATE } from '@/shared/lib';
import { createUserFixtures } from '@/test/fixtures';
import { saveCheckInAction } from './actions';

vi.mock('@/features/auth/server', () => ({ requireUserId: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockedRequireUserId = vi.mocked(requireUserId);
const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

beforeEach(() => {
  mockedRequireUserId.mockReset();
});

describe('saveCheckInAction', () => {
  it('persists mood alone and ignores a client userId', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    mockedRequireUserId.mockResolvedValue(userA);

    const formData = new FormData();
    formData.set('entryDate', '2020-06-01');
    formData.set('generalNote', '');
    formData.set('mood', '3');
    formData.set('userId', userB);

    expect(await saveCheckInAction(IDLE_STATE, formData)).toEqual({
      status: 'success',
    });

    expect(await getCheckIn(userA, '2020-06-01')).toMatchObject({
      mood: 3,
      generalNote: null,
      habitLogs: [],
    });
    expect((await getCheckIn(userB, '2020-06-01')).createdAt).toBeNull();
  });

  it('rejects a future date without writing', async () => {
    const userId = await fixtures.createUser();
    mockedRequireUserId.mockResolvedValue(userId);

    const formData = new FormData();
    formData.set('entryDate', '2099-01-01');
    formData.set('mood', '5');
    formData.set('generalNote', 'amanhã');

    const result = await saveCheckInAction(IDLE_STATE, formData);
    expect(result).toEqual({
      status: 'error',
      message: 'Essa data ainda não está disponível.',
    });
    expect((await getCheckIn(userId, '2099-01-01')).createdAt).toBeNull();
  });

  it('persists a medication mark with the check-in save', async () => {
    const userId = await fixtures.createUser();
    mockedRequireUserId.mockResolvedValue(userId);
    const medication = await createMedication(userId, {
      name: 'Losartana',
      instructions: null,
      frequencyKind: 'daily',
      weekdays: null,
      times: ['08:00'],
      startsOn: '2020-06-01',
    });

    const formData = new FormData();
    formData.set('entryDate', '2020-06-01');
    formData.set('generalNote', 'Só a nota');
    formData.set('mood', '');
    formData.set(`med:${medication.id}:08:00`, 'done');

    expect(await saveCheckInAction(IDLE_STATE, formData)).toEqual({
      status: 'success',
    });
    expect(await listOccurrencesForDate(userId, '2020-06-01')).toEqual([
      expect.objectContaining({
        medicationId: medication.id,
        scheduledTime: '08:00',
        status: 'done',
      }),
    ]);

    formData.set(`med:${medication.id}:08:00`, 'pending');
    expect(await saveCheckInAction(IDLE_STATE, formData)).toEqual({
      status: 'success',
    });
    expect(
      (await listOccurrencesForDate(userId, '2020-06-01'))[0]?.status,
    ).toBe('pending');
    expect(await getCheckIn(userId, '2020-06-01')).toMatchObject({
      generalNote: 'Só a nota',
    });
  });
});
