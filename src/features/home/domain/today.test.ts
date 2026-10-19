import { describe, expect, it } from 'vitest';
import { buildTodaySnapshot } from './today';

const habit = { id: 'habit-1', name: 'Caminhar' };
const otherHabit = { id: 'habit-2', name: 'Ler' };

describe('buildTodaySnapshot', () => {
  it('treats a missing check-in as not done', () => {
    const snapshot = buildTodaySnapshot({
      checkInExists: false,
      habits: [],
      habitLogs: [],
      medications: [],
    });

    expect(snapshot.checkInDone).toBe(false);
    expect(snapshot.pendingHabits).toEqual([]);
    expect(snapshot.pendingMedications).toEqual([]);
  });

  it('keeps a habit pending until it has a log', () => {
    const snapshot = buildTodaySnapshot({
      checkInExists: true,
      habits: [habit, otherHabit],
      habitLogs: [{ habitId: habit.id }],
      medications: [],
    });

    expect(snapshot.checkInDone).toBe(true);
    expect(snapshot.pendingHabits).toEqual([otherHabit]);
    expect(snapshot.habitsDue).toBe(2);
  });

  it('lists only pending scheduled medications by name and time', () => {
    const snapshot = buildTodaySnapshot({
      checkInExists: false,
      habits: [],
      habitLogs: [],
      medications: [
        {
          medicationId: 'med-1',
          name: 'Losartana',
          scheduledTime: '08:00',
          status: 'pending',
          orphan: false,
        },
        {
          medicationId: 'med-1',
          name: 'Losartana',
          scheduledTime: '20:00',
          status: 'done',
          orphan: false,
        },
        {
          medicationId: 'med-2',
          name: 'Vitamina',
          scheduledTime: '09:00',
          status: 'not_done',
          orphan: false,
        },
        {
          medicationId: 'med-3',
          name: 'Antigo',
          scheduledTime: '07:00',
          status: 'pending',
          orphan: true,
        },
      ],
    });

    expect(snapshot.pendingMedications).toEqual([
      {
        key: 'med-1:08:00',
        medicationId: 'med-1',
        name: 'Losartana',
        scheduledTime: '08:00',
      },
    ]);
    expect(snapshot.medicationsDue).toBe(3);
  });
});
