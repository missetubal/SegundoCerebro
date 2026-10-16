'use server';

import { requireUserId } from '@/features/auth/server';
import { ACTION_MESSAGES, type ActionState, errorState } from '@/shared/lib';
import { runItemAction, runMoveAction, saveItem } from '@/shared/lib/item-action';
import { firstIssueMessage, itemIdSchema } from '@/shared/lib/validation';
import { horizonNameSchema } from '../domain';
import {
  createHorizon,
  deleteHorizon,
  type HorizonWriteResult,
  moveHorizon,
  renameHorizon,
} from '../infra';

const DUPLICATE_NAME_MESSAGE = 'Já existe um horizonte com esse nome.';

function saveHorizon(
  write: () => Promise<HorizonWriteResult>,
): Promise<ActionState> {
  return saveItem(write, DUPLICATE_NAME_MESSAGE);
}

export async function createHorizonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const name = horizonNameSchema.safeParse(formData.get('name'));
  if (!name.success) {
    return errorState(firstIssueMessage(name.error, 'Revise o nome.'));
  }
  return saveHorizon(() => createHorizon(userId, name.data));
}

export async function renameHorizonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);
  const name = horizonNameSchema.safeParse(formData.get('name'));
  if (!name.success) {
    return errorState(firstIssueMessage(name.error, 'Revise o nome.'));
  }
  return saveHorizon(() => renameHorizon(userId, id.data, name.data));
}

export async function moveHorizonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runMoveAction(userId, formData, moveHorizon);
}

export async function deleteHorizonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  return runItemAction(userId, formData, deleteHorizon);
}
