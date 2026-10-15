import 'server-only';
import { refresh } from 'next/cache';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/lib/action-state';
import { requireUserId } from '@/lib/session';
import { itemIdSchema } from '@/lib/validation/form';

type ItemOperation = (userId: string, id: string) => Promise<boolean>;

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
