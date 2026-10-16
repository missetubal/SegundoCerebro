'use server';

import { redirect } from 'next/navigation';
import { requireUserId } from '@/features/auth/server';
import { ACTION_MESSAGES, type ActionState, errorState } from '@/shared/lib';
import { runItemAction, runMoveAction, saveItem } from '@/shared/lib/item-action';
import { firstIssueMessage, itemIdSchema } from '@/shared/lib/validation';
import { areaInputSchema } from '../domain';
import {
  archiveArea,
  createArea,
  deleteArea,
  moveArea,
  type Area,
  type AreaWriteResult,
  unarchiveArea,
  updateArea,
} from '../infra';

const DUPLICATE_NAME_MESSAGE =
  'Já existe uma área com esse nome. Se ela estiver arquivada, você pode desarquivá-la.';

function parseAreaInput(formData: FormData) {
  return areaInputSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    color: formData.get('color'),
    icon: formData.get('icon'),
  });
}

function saveArea(
  write: () => Promise<AreaWriteResult>,
): Promise<ActionState> {
  return saveItem(write, DUPLICATE_NAME_MESSAGE, (area: Area) =>
    redirect(`/app/areas/${area.id}`),
  );
}

export async function createAreaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const input = parseAreaInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveArea(() => createArea(userId, input.data));
}

export async function updateAreaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const input = parseAreaInput(formData);
  if (!input.success) {
    return errorState(firstIssueMessage(input.error, 'Revise os campos.'));
  }
  return saveArea(() => updateArea(userId, id.data, input.data));
}

export async function moveAreaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runMoveAction(userId, formData, moveArea);
}

export async function archiveAreaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, archiveArea);
}

export async function unarchiveAreaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, unarchiveArea);
}

export async function deleteAreaAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const state = await runItemAction(userId, formData, deleteArea);
  if (state.status === 'error') return state;
  redirect('/app/areas');
}
