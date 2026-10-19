export type TodayHabit = {
  id: string;
  name: string;
};

export type TodayHabitLog = {
  habitId: string;
};

export type TodayMedication = {
  medicationId: string;
  name: string;
  scheduledTime: string;
  status: 'done' | 'not_done' | 'pending';
  orphan: boolean;
};

export type PendingMedication = {
  key: string;
  medicationId: string;
  name: string;
  scheduledTime: string;
};

export type TodaySnapshot = {
  checkInDone: boolean;
  pendingHabits: TodayHabit[];
  pendingMedications: PendingMedication[];
  habitsDue: number;
  medicationsDue: number;
};

export function buildTodaySnapshot(input: {
  checkInExists: boolean;
  habits: TodayHabit[];
  habitLogs: TodayHabitLog[];
  medications: TodayMedication[];
}): TodaySnapshot {
  const logged = new Set(input.habitLogs.map((log) => log.habitId));
  const dueMedications = input.medications.filter((item) => !item.orphan);

  return {
    checkInDone: input.checkInExists,
    pendingHabits: input.habits.filter((habit) => !logged.has(habit.id)),
    pendingMedications: dueMedications
      .filter((item) => item.status === 'pending')
      .map((item) => ({
        key: `${item.medicationId}:${item.scheduledTime}`,
        medicationId: item.medicationId,
        name: item.name,
        scheduledTime: item.scheduledTime,
      })),
    habitsDue: input.habits.length,
    medicationsDue: dueMedications.length,
  };
}
