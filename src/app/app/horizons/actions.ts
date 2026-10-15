'use server';

import { refresh } from 'next/cache';
import {
  createHorizon,
  deleteHorizon,
  type HorizonWriteResult,
  moveHorizon,
  renameHorizon,
} from '@/db/horizons';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/lib/action-state';
import { runItemAction } from '@/lib/item-action';
import { requireUserId } from '@/lib/session';
import {
  firstIssueMessage,
  itemIdSchema,
  moveDirectionSchema,
} from '@/lib/validation/form';
import { horizonNameSchema } from '@/lib/validation/horizon';

const DUPLICATE_NAME_MESSAGE = 'Já existe um horizonte com esse nome.';

async function saveHorizon(
  write: () => Promise<HorizonWriteResult>,
): Promise<ActionState> {
  let result: HorizonWriteResult;
  try {
    result = await write();
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) {
    return errorState(
      result.reason === 'duplicate_name'
        ? DUPLICATE_NAME_MESSAGE
        : ACTION_MESSAGES.notFound,
    );
  }
  refresh();
  return SUCCESS_STATE;
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
  const direction = moveDirectionSchema.safeParse(formData.get('direction'));
  return runItemAction(formData, (userId, id) =>
    direction.success
      ? moveHorizon(userId, id, direction.data)
      : Promise.resolve(false),
  );
}

export async function deleteHorizonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return runItemAction(formData, deleteHorizon);
}
