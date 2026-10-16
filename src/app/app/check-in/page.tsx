import Link from 'next/link';
import { Suspense } from 'react';
import { requireUserId } from '@/features/auth/server';
import { listHabitsForDate } from '@/features/habits/server';
import { getPreferences } from '@/features/preferences/server';
import { calendarDateInTimeZone } from '@/shared/lib/calendar';
import {
  bodyText,
  caption,
  card,
  eyebrow,
  primaryButton,
  secondaryButton,
} from '@/shared/ui';

export default function CheckInPage() {
  return (
    <main className='mx-auto flex w-full max-w-3xl flex-col gap-6 p-6'>
      <Suspense fallback={<p className='text-muted'>Carregando…</p>}>
        <CheckInContent />
      </Suspense>
    </main>
  );
}

async function CheckInContent() {
  const userId = await requireUserId();
  const preferences = await getPreferences(userId);
  const today = calendarDateInTimeZone(preferences.timezone);
  const habits = await listHabitsForDate(
    userId,
    today,
    preferences.timezone,
  );

  return (
    <>
      <header className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex flex-col gap-1'>
          <span className={eyebrow}>Saúde · Check-in</span>
          <h1 className='text-3xl font-semibold'>Como foi este dia?</h1>
          <p className={caption}>
            Um registro por dia · em branco permanece neutro (não é falha)
          </p>
        </div>
        <div className='flex rounded-full border border-border bg-bg-card p-1 text-sm'>
          <span className='rounded-full bg-ink px-3 py-1 text-white'>
            Minimalista
          </span>
          <span className='px-3 py-1 text-muted'>Detalhado</span>
        </div>
      </header>

      <p className={`${card} bg-pastel-sky p-3 text-sm text-sky-800`}>
        Check-in completo (salvar registros) chega na Fatia 4. Aqui você já vê
        os hábitos ativos do dia — base pronta.
      </p>

      <section className='flex flex-col gap-3'>
        {habits.length === 0 ? (
          <div className={`${card} p-5`}>
            <p className={bodyText}>Nenhum hábito para hoje.</p>
            <Link href='/app/habits/new' className='mt-2 inline-block text-sm underline'>
              Criar hábito
            </Link>
          </div>
        ) : (
          habits.map((habit) => (
            <article key={habit.id} className={`${card} flex flex-col gap-3 p-4`}>
              <h2 className='text-base font-semibold'>{habit.name}</h2>
              {habit.trackingType === 'completion' ? (
                <div className='flex flex-wrap gap-2'>
                  <span className={`${secondaryButton} opacity-60`}>Feito</span>
                  <span className={`${secondaryButton} opacity-60`}>
                    Não realizado
                  </span>
                  <span className={primaryButton}>Sem registro</span>
                </div>
              ) : (
                <>
                  <div className='flex flex-wrap gap-2'>
                    <span className={`${secondaryButton} opacity-60`}>
                      +{Math.min(250, habit.targetValue ?? 250)} {habit.unit}
                    </span>
                    <span className={`${secondaryButton} opacity-60`}>Outro</span>
                  </div>
                  <div className='flex flex-col gap-1'>
                    <div className='h-2 overflow-hidden rounded-full bg-bg-app'>
                      <div className='h-full w-0 rounded-full bg-teal-500' />
                    </div>
                    <span className={caption}>
                      0 {habit.unit} de {habit.targetValue} {habit.unit}
                    </span>
                  </div>
                </>
              )}
            </article>
          ))
        )}

        <article className={`${card} flex flex-col gap-2 p-4`}>
          <h2 className='text-base font-semibold'>
            Nota do dia{' '}
            <span className='text-sm font-normal text-muted'>(opcional)</span>
          </h2>
          <textarea
            disabled
            rows={3}
            placeholder='Como foi o dia…'
            className='w-full rounded-lg border border-border bg-bg-app px-3 py-2 text-sm text-muted'
          />
        </article>

        <article className={`${card} flex flex-col gap-2 p-4`}>
          <h2 className='text-base font-semibold'>
            Humor{' '}
            <span className='text-sm font-normal text-muted'>
              (opcional) · 1 a 5
            </span>
          </h2>
          <div className='flex gap-2'>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className='flex size-9 items-center justify-center rounded-full border border-border text-sm text-muted'
              >
                {n}
              </span>
            ))}
          </div>
        </article>
      </section>

      <footer className='flex flex-wrap items-center justify-between gap-3'>
        <p className={caption}>Sem registro permanece neutro</p>
        <div className='flex gap-2'>
          <button type='button' disabled className={secondaryButton}>
            Salvar parcial
          </button>
          <button type='button' disabled className={primaryButton}>
            Salvar check-in
          </button>
        </div>
      </footer>
    </>
  );
}
