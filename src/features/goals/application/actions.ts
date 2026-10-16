'use server';

import { redirect } from 'next/navigation';
import { refresh } from 'next/cache';
import { requireUserId } from '@/features/auth/server';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/shared/lib';
import { runItemAction, saveItem } from '@/shared/lib/item-action';
import { firstIssueMessage, itemIdSchema } from '@/shared/lib/validation';
import { goalInputSchema, nextStepInputSchema, type GoalStatus } from '../domain';
import {
  completeNextStep,
  createGoal,
  createNextStep,
  deleteGoal,
  deleteNextStep,
  setGoalStatus,
  type Goal,
  type GoalWriteResult,
  updateGoal,
} from '../infra';

const LINK_MESSAGES = {
  invalid_area: 'Escolha uma área válida.',
  invalid_horizon: 'Escolha um horizonte válido.',
} as const;

function parseGoalInput(formData: FormData) {
  return goalInputSchema.safeParse({
    title: formData.get('title'),
    primaryAreaId: formData.get('primaryAreaId'),
    horizonId: formData.get('horizonId'),
    status: formData.get('status') ?? 'active',
    startDate: formData.get('startDate'),
    targetDate: formData.get('targetDate'),
  });
}

async function saveGoal(
  write: () => Promise<GoalWriteResult>,
  onSaved: (goal: Goal) => void,
): Promise<ActionState> {
  let result: GoalWriteResult;
  try {
    result = await write();
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) {
    if (result.reason === 'invalid_area' || result.reason === 'invalid_horizon') {
      return errorState(LINK_MESSAGES[result.reason]);
    }
    return errorState(ACTION_MESSAGES.notFound);
  }
  onSaved(result.item);
  return SUCCESS_STATE;
}

export async function createGoalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = parseGoalInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveGoal(
    () => createGoal(userId, input.data),
    (goal) => redirect(`/app/goals/${goal.id}`),
  );
}

export async function updateGoalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = parseGoalInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveGoal(
    () => updateGoal(userId, id.data, input.data),
    (goal) => redirect(`/app/goals/${goal.id}`),
  );
}

export async function setGoalStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  const status = formData.get('status');
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  if (
    status !== 'active' &&
    status !== 'completed' &&
    status !== 'archived'
  ) {
    return errorState('Escolha um status válido.');
  }
  const found = await setGoalStatus(userId, id.data, status as GoalStatus);
  if (!found) return errorState(ACTION_MESSAGES.notFound);
  refresh();
  return SUCCESS_STATE;
}

export async function deleteGoalAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const state = await runItemAction(userId, formData, deleteGoal);
  if (state.status === 'error') return state;
  redirect('/app/goals');
}

export async function createNextStepAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const goalId = itemIdSchema.safeParse(formData.get('goalId'));
  if (!goalId.success) return errorState(ACTION_MESSAGES.notFound);
  const input = nextStepInputSchema.safeParse({ title: formData.get('title') });
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveItem(
    () => createNextStep(userId, goalId.data, input.data),
    ACTION_MESSAGES.notFound,
  );
}

export async function completeNextStepAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, completeNextStep);
}

export async function deleteNextStepAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, deleteNextStep);
}
