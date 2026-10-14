'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { updateTimezone } from '@/db/preferences';
import { requireUserId } from '@/lib/session';
import { normalizeTimeZone } from '@/lib/timezone';

export type UpdateTimezoneState =
  | { status: 'idle' }
  | { status: 'success'; timezone: string }
  | { status: 'error'; message: string };

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
  _prevState: UpdateTimezoneState,
  formData: FormData,
): Promise<UpdateTimezoneState> {
  const userId = await requireUserId();

  const parsed = timezoneSchema.safeParse(formData.get('timezone'));
  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Não reconhecemos esse fuso horário. Escolha um da lista.',
    };
  }

  await updateTimezone(userId, parsed.data);
  refresh();
  return { status: 'success', timezone: parsed.data };
}
