export function formDataToMedicationDay(formData: FormData): { logs: unknown[] } {
  const logs: unknown[] = [];
  for (const [key, raw] of formData.entries()) {
    if (typeof raw !== 'string' || !key.startsWith('med:')) continue;
    const rest = key.slice('med:'.length);
    const splitAt = rest.indexOf(':');
    if (splitAt <= 0) continue;
    logs.push({
      medicationId: rest.slice(0, splitAt),
      scheduledTime: rest.slice(splitAt + 1),
      status: raw,
    });
  }
  return { logs };
}

export function formDataToMedicationWrite(formData: FormData): unknown {
  const times = formData
    .getAll('times')
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '');
  const frequencyKind = formData.get('frequencyKind');
  const startsOn = formData.get('startsOn');
  const instructions = formData.get('instructions');
  return {
    name: formData.get('name'),
    instructions: typeof instructions === 'string' ? instructions : null,
    frequencyKind,
    weekdays:
      frequencyKind === 'daily'
        ? null
        : formData
            .getAll('weekdays')
            .map((value) => Number.parseInt(String(value), 10))
            .filter((value) => Number.isInteger(value)),
    times,
    ...(typeof startsOn === 'string' && startsOn.trim() !== ''
      ? { startsOn: startsOn.trim() }
      : {}),
  };
}
