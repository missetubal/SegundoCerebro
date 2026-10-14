import Link from 'next/link';
import { Suspense } from 'react';
import { getPreferences } from '@/db/preferences';
import { requireUserId } from '@/lib/session';
import { PreferencesForm } from './preferences-form';

export default function PreferencesPage() {
  return (
    <main className='mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6'>
      <Link href='/app' className='text-sm underline'>
        Voltar
      </Link>
      <h1 className='text-2xl font-semibold'>Preferências</h1>
      <Suspense fallback={<p>Carregando…</p>}>
        <PreferencesContent />
      </Suspense>
    </main>
  );
}

async function PreferencesContent() {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);

  const timeZones = Intl.supportedValuesOf('timeZone');
  if (!timeZones.includes(preferences.timezone)) {
    timeZones.unshift(preferences.timezone);
  }

  return (
    <PreferencesForm
      timezone={preferences.timezone}
      journalTemplate={preferences.journalTemplate}
      timeZones={timeZones}
    />
  );
}
