'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/shared/lib';
import { runItemAction } from '@/shared/lib/item-action';
import { firstIssueMessage, itemIdSchema } from '@/shared/lib/validation';
import { habitInputSchema } from '../domain';
import {
  archiveHabit,
  createHabit,
  type HabitWithAreas,
  type HabitWriteResult,
  unarchiveHabit,
  updateHabit,
} from '../infra';

function parseHabitInput(formData: FormData) {
  return habitInputSchema.safeParse({
    name: formData.get('name'),
    trackingType: formData.get('trackingType'),
    frequencyKind: formData.get('frequencyKind'),
    weekdays: formData.getAll('weekdays'),
    targetValue: formData.get('targetValue'),
    unit: formData.get('unit'),
    areaIds: formData.getAll('areaIds'),
  });
}

async function saveHabit(
  write: () => Promise<HabitWriteResult>,
  onSaved: (habit: HabitWithAreas) => void,
): Promise<ActionState> {
  let result: HabitWriteResult;
  try {
    result = await write();
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) {
    if (result.reason === 'invalid_area') {
      return errorState('Escolha ao menos uma área válida.');
    }
    return errorState(ACTION_MESSAGES.notFound);
  }
  onSaved(result.item);
  return SUCCESS_STATE;
}

export async function createHabitAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = parseHabitInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveHabit(
    () => createHabit(userId, input.data),
    () => redirect('/app/habits'),
  );
}

export async function updateHabitAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = parseHabitInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveHabit(
    () => updateHabit(userId, id.data, input.data),
    () => redirect('/app/habits'),
  );
}

export async function archiveHabitAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, archiveHabit);
}

export async function unarchiveHabitAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, unarchiveHabit);
}
