'use server';

import {
  createHorizon,
  deleteHorizon,
  type HorizonWriteResult,
  moveHorizon,
  renameHorizon,
} from '@/db/horizons';
import { ACTION_MESSAGES, type ActionState, errorState } from '@/lib/action-state';
import { runItemAction, runMoveAction, saveItem } from '@/lib/item-action';
import { requireUserId } from '@/lib/session';
import { firstIssueMessage, itemIdSchema } from '@/lib/validation/form';
import { horizonNameSchema } from '@/lib/validation/horizon';

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
  return runMoveAction(formData, moveHorizon);
}

export async function deleteHorizonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runItemAction(formData, deleteHorizon);
}
