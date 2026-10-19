import { afterAll, describe, expect, it } from 'vitest';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { createUserFixtures } from '@/test/fixtures';
import { listMedications } from '../infra';
import { createMedicationForUser } from './service';

const fixtures = createUserFixtures();
afterAll(() => fixtures.cleanup());

describe('createMedicationForUser', () => {
  it('defaults startsOn to the current day in the user time zone', async () => {
    const userId = await fixtures.createUser();
    const created = await createMedicationForUser(userId, {
      name: 'Losartana',
      instructions: null,
      frequencyKind: 'daily',
      weekdays: null,
      times: ['08:00'],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.item.startsOn).toBe(
      calendarDateInTimeZone('America/Sao_Paulo'),
    );
  });

  it('does not create a row when the body includes a dose', async () => {
    const userId = await fixtures.createUser();
    const created = await createMedicationForUser(userId, {
      name: 'Losartana',
      frequencyKind: 'daily',
      weekdays: null,
      times: ['08:00'],
      doseAmount: 50,
    });
    expect(created.ok).toBe(false);
    if (created.ok) return;
    expect(created.message).toBe('Revise os campos.');
    expect(await listMedications(userId)).toEqual({ active: [], archived: [] });
  });
});
