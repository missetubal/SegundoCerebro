'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { updateTimezone } from '@/db/preferences';
import {
  ACTION_MESSAGES,
  type ActionState,
  errorState,
  SUCCESS_STATE,
} from '@/lib/action-state';
import { requireUserId } from '@/lib/session';
import { normalizeTimeZone } from '@/lib/timezone';

const timezoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const timezone = normalizeTimeZone(value);
    if (!timezone) {
      ctx.addIssue({ code: 'custom' });
      return z.NEVER;
    }
    return timezone;
  });

export async function updateTimezoneAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();

  const parsed = timezoneSchema.safeParse(formData.get('timezone'));
  if (!parsed.success) {
    return errorState('Não reconhecemos esse fuso horário. Escolha um da lista.');
  }

  try {
    await updateTimezone(userId, parsed.data);
  } catch {
    return errorState(ACTION_MESSAGES.unavailable);
  }
  refresh();
  return SUCCESS_STATE;
}
