import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { MedicationForm } from '@/features/medications';
import { createMedicationAction } from '@/features/medications/server';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import { eyebrow } from '@/shared/ui';

export default function NewMedicationPage() {
  return (
    <main className='mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-6'>
      <Link href='/app/medications' className='text-sm underline'>
        Voltar
      </Link>
      <header className='flex flex-col gap-1'>
        <span className={eyebrow}>Organização</span>
        <h1 className='text-3xl font-semibold'>Novo medicamento</h1>
      </header>
      <Suspense fallback={<p>Carregando…</p>}>
        <NewMedicationForm />
      </Suspense>
    </main>
  );
}

async function NewMedicationForm() {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);
  const today = calendarDateInTimeZone(preferences.timezone);

  return (
    <MedicationForm
      action={createMedicationAction}
      initial={{
        name: '',
        instructions: null,
        frequencyKind: 'daily',
        weekdays: null,
        times: ['08:00'],
        startsOn: today,
      }}
      submitLabel='Cadastrar'
      cancelHref='/app/medications'
    />
  );
}
