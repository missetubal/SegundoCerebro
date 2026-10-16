import 'server-only';
import { refresh } from 'next/cache';
import type { MoveDirection } from '@/shared/db';
import type { WriteResult } from '@/shared/db';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/shared/lib';
import { itemIdSchema, moveDirectionSchema } from '@/shared/lib/validation';

type ItemOperation = (userId: string, id: string) => Promise<boolean>;

type MoveOperation = (
  userId: string,
  id: string,
  direction: MoveDirection,
) => Promise<boolean>;

export async function runItemAction(
  userId: string,
  formData: FormData,
  operation: ItemOperation,
): Promise<ActionState> {
  const id = itemIdSchema.safeParse(formData.get('id'));
  if (!id.success) return errorState(ACTION_MESSAGES.notFound);

  let found: boolean;
  try {
    found = await operation(userId, id.data);
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!found) return errorState(ACTION_MESSAGES.notFound);

  refresh();
  return SUCCESS_STATE;
}

export function runMoveAction(
  userId: string,
  formData: FormData,
  move: MoveOperation,
): Promise<ActionState> {
  const direction = moveDirectionSchema.safeParse(formData.get('direction'));
  return runItemAction(userId, formData, (uid, id) =>
    direction.success ? move(uid, id, direction.data) : Promise.resolve(false),
  );
}

/**
 * Runs a write and maps its result to an ActionState. `onSaved` runs outside the
 * try block so it may call `redirect()`; by default it refreshes the page.
 */
export async function saveItem<T>(
  write: () => Promise<WriteResult<T>>,
  duplicateNameMessage: string,
  onSaved: (item: T) => void = () => refresh(),
): Promise<ActionState> {
  let result: WriteResult<T>;
  try {
    result = await write();
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  if (!result.ok) {
    return errorState(
      result.reason === 'duplicate_name'
        ? duplicateNameMessage
        : ACTION_MESSAGES.notFound,
    );
  }
  onSaved(result.item);
  return SUCCESS_STATE;
}
