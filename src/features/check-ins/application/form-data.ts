export function formDataToCheckInInput(formData: FormData): unknown {
  const habitLogs: unknown[] = [];
  for (const [key, raw] of formData.entries()) {
    if (typeof raw !== 'string') continue;
    if (key.startsWith('completion:')) {
      const habitId = key.slice('completion:'.length);
      if (raw === 'done' || raw === 'not_done') {
        habitLogs.push({ habitId, completionStatus: raw });
      } else {
        habitLogs.push({ habitId, clear: true });
      }
    } else if (key.startsWith('value:')) {
      const habitId = key.slice('value:'.length);
      if (raw.trim() === '') habitLogs.push({ habitId, clear: true });
      else habitLogs.push({ habitId, value: Number(raw) });
    } else if (key.startsWith('clear:') && raw === 'true') {
      habitLogs.push({ habitId: key.slice('clear:'.length), clear: true });
    }
  }

  const moodRaw = formData.get('mood');
  const mood = typeof moodRaw === 'string' ? moodRaw : '';
  const note = formData.get('generalNote');
  return {
    generalNote: typeof note === 'string' ? note : '',
    mood: mood === '' ? null : Number(mood),
    habitLogs,
  };
}

export function formText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}
