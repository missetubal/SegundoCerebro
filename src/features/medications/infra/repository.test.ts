import { and, eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, medicationLogs } from '@/shared/db';
import { createUserFixtures } from '@/test/fixtures';
import {
  archiveMedication,
  createMedication,
  deleteMedication,
  getMedication,
  listMedicationLogs,
  listMedications,
  listOccurrencesForDate,
  saveMedicationDay,
  updateMedication,
} from './repository';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

const today = '2026-10-19';
const monday = '2026-10-19';
const tuesday = '2026-10-20';
const dayBefore = '2026-10-18';

async function ownedMedication(
  userId: string,
  overrides: Partial<Parameters<typeof createMedication>[1]> = {},
) {
  return createMedication(userId, {
    name: 'Losartana',
    instructions: null,
    frequencyKind: 'daily',
    weekdays: null,
    times: ['08:00', '20:00'],
    startsOn: today,
    ...overrides,
  });
}

describe('medication repository', () => {
  it('keeps createdAt, stores two times, and deletes pending without a not_done row', async () => {
    const userId = await fixtures.createUser();
    const medication = await ownedMedication(userId);

    const first = await saveMedicationDay(
      userId,
      today,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '08:00', status: 'done' },
          { medicationId: medication.id, scheduledTime: '20:00', status: 'not_done' },
        ],
      },
      today,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const morning = first.occurrences.find((item) => item.scheduledTime === '08:00');
    const night = first.occurrences.find((item) => item.scheduledTime === '20:00');
    expect(morning).toMatchObject({ status: 'done', orphan: false });
    expect(morning?.takenAt).toBeInstanceOf(Date);
    expect(night).toMatchObject({ status: 'not_done', takenAt: null });

    const stored = await listMedicationLogs(userId, today, today);
    const morningRow = stored.find((item) => item.scheduledTime === '08:00');
    expect(morningRow).toBeTruthy();
    const [morningStored] = await db
      .select({ createdAt: medicationLogs.createdAt })
      .from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          eq(medicationLogs.medicationId, medication.id),
          eq(medicationLogs.scheduledTime, '08:00'),
        ),
      );

    const second = await saveMedicationDay(
      userId,
      today,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '08:00', status: 'done' },
        ],
      },
      today,
    );
    expect(second.ok).toBe(true);
    const again = await listMedicationLogs(userId, today, today);
    expect(
      again.find((item) => item.scheduledTime === '08:00')?.id,
    ).toBe(morningRow?.id);
    const [morningAgain] = await db
      .select({ createdAt: medicationLogs.createdAt })
      .from(medicationLogs)
      .where(
        and(
          eq(medicationLogs.userId, userId),
          eq(medicationLogs.medicationId, medication.id),
          eq(medicationLogs.scheduledTime, '08:00'),
        ),
      );
    expect(morningAgain?.createdAt.toISOString()).toBe(
      morningStored?.createdAt.toISOString(),
    );

    const cleared = await saveMedicationDay(
      userId,
      today,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '20:00', status: 'pending' },
        ],
      },
      today,
    );
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(
      cleared.occurrences.find((item) => item.scheduledTime === '20:00'),
    ).toMatchObject({ status: 'pending' });
    expect(
      (await listMedicationLogs(userId, today, today)).some(
        (item) => item.status === 'not_done',
      ),
    ).toBe(false);
  });

  it('rejects future dates, foreign ids, archived meds, dates before startsOn, and off-schedule days without writing', async () => {
    const userId = await fixtures.createUser();
    const otherId = await fixtures.createUser();
    const medication = await ownedMedication(userId, {
      frequencyKind: 'weekdays',
      weekdays: [1],
      times: ['08:00'],
      startsOn: monday,
    });
    const other = await ownedMedication(otherId);

    const future = await saveMedicationDay(
      userId,
      '2026-10-20',
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '08:00', status: 'done' },
        ],
      },
      monday,
    );
    expect(future).toEqual({ ok: false, reason: 'future' });

    const foreign = await saveMedicationDay(
      userId,
      monday,
      {
        logs: [
          { medicationId: other.id, scheduledTime: '08:00', status: 'done' },
        ],
      },
      monday,
    );
    expect(foreign).toEqual({ ok: false, reason: 'not_found' });

    const beforeStart = await saveMedicationDay(
      userId,
      dayBefore,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '08:00', status: 'done' },
        ],
      },
      monday,
    );
    expect(beforeStart).toEqual({ ok: false, reason: 'not_applicable' });

    const tuesdayMark = await saveMedicationDay(
      userId,
      tuesday,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '08:00', status: 'done' },
        ],
      },
      tuesday,
    );
    expect(tuesdayMark).toEqual({ ok: false, reason: 'not_applicable' });

    await archiveMedication(userId, medication.id);
    const archived = await saveMedicationDay(
      userId,
      monday,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '08:00', status: 'done' },
        ],
      },
      monday,
    );
    expect(archived).toEqual({ ok: false, reason: 'not_applicable' });
    expect(await listMedicationLogs(userId, dayBefore, tuesday)).toEqual([]);
    expect(await listMedicationLogs(otherId, monday, monday)).toEqual([]);
  });

  it('keeps an orphan log visible and only lets it return to pending', async () => {
    const userId = await fixtures.createUser();
    const medication = await ownedMedication(userId, { times: ['08:00', '20:00'] });
    const saved = await saveMedicationDay(
      userId,
      today,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '20:00', status: 'done' },
        ],
      },
      today,
    );
    expect(saved.ok).toBe(true);

    const updated = await updateMedication(userId, medication.id, {
      name: medication.name,
      instructions: null,
      frequencyKind: 'daily',
      weekdays: null,
      times: ['08:00'],
      startsOn: medication.startsOn,
    });
    expect(updated.ok).toBe(true);

    const day = await listOccurrencesForDate(userId, today);
    expect(day.find((item) => item.scheduledTime === '20:00')).toMatchObject({
      status: 'done',
      orphan: true,
    });
    expect(day.find((item) => item.scheduledTime === '08:00')?.status).toBe(
      'pending',
    );

    const switched = await saveMedicationDay(
      userId,
      today,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '20:00', status: 'not_done' },
        ],
      },
      today,
    );
    expect(switched).toEqual({ ok: false, reason: 'not_applicable' });
    expect(
      (await listMedicationLogs(userId, today, today)).find(
        (item) => item.scheduledTime === '20:00',
      )?.status,
    ).toBe('done');

    const cleared = await saveMedicationDay(
      userId,
      today,
      {
        logs: [
          { medicationId: medication.id, scheduledTime: '20:00', status: 'pending' },
        ],
      },
      today,
    );
    expect(cleared.ok).toBe(true);
    expect(await listMedicationLogs(userId, today, today)).toEqual([]);
  });

  it('keeps users A and B apart on the same date and time', async () => {
    const userA = await fixtures.createUser();
    const userB = await fixtures.createUser();
    const medA = await ownedMedication(userA, { name: 'A' });
    const medB = await ownedMedication(userB, { name: 'B' });

    await saveMedicationDay(
      userA,
      today,
      { logs: [{ medicationId: medA.id, scheduledTime: '08:00', status: 'done' }] },
      today,
    );
    await saveMedicationDay(
      userB,
      today,
      {
        logs: [
          { medicationId: medB.id, scheduledTime: '08:00', status: 'not_done' },
        ],
      },
      today,
    );

    expect(
      (await listOccurrencesForDate(userA, today)).map((item) => item.name),
    ).toEqual(['A', 'A']);
    expect(await getMedication(userA, medB.id)).toBeNull();

    const crossed = await saveMedicationDay(
      userA,
      today,
      { logs: [{ medicationId: medB.id, scheduledTime: '08:00', status: 'done' }] },
      today,
    );
    expect(crossed).toEqual({ ok: false, reason: 'not_found' });
    expect(
      (await listMedicationLogs(userB, today, today))[0]?.status,
    ).toBe('not_done');

    expect(await deleteMedication(userA, medB.id)).toBe(false);
    expect(await deleteMedication(userA, medA.id)).toBe(true);
    expect(await listMedications(userA)).toEqual({ active: [], archived: [] });
    expect((await listMedications(userB)).active).toHaveLength(1);
    expect(await listMedicationLogs(userB, today, today)).toHaveLength(1);
  });
});
