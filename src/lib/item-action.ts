import 'server-only';
import { refresh } from 'next/cache';
import type { MoveDirection } from '@/db/ordering';
import type { WriteResult } from '@/db/owned';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/lib/action-state';
import { requireUserId } from '@/lib/session';
import { itemIdSchema, moveDirectionSchema } from '@/lib/validation/form';

type ItemOperation = (userId: string, id: string) => Promise<boolean>;

type MoveOperation = (
  userId: string,
  id: string,
  direction: MoveDirection,
) => Promise<boolean>;

export async function runItemAction(
  formData: FormData,
  operation: ItemOperation,
): Promise<ActionState> {
  const userId = await requireUserId();
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
  formData: FormData,
  move: MoveOperation,
): Promise<ActionState> {
  const direction = moveDirectionSchema.safeParse(formData.get('direction'));
  return runItemAction(formData, (userId, id) =>
    direction.success ? move(userId, id, direction.data) : Promise.resolve(false),
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
