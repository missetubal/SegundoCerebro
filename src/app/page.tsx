import Link from 'next/link';
import { BrandMark } from '@/features/auth';
import { primaryButton, secondaryButton } from '@/shared/ui';

const areas = [
  ['Finanças', 'bg-pastel-peach text-amber-800 dark:text-amber-200'],
  ['Planejamento', 'bg-pastel-lilac text-violet-800 dark:text-violet-200'],
  ['Aprendizado', 'bg-pastel-mint text-emerald-800 dark:text-emerald-200'],
  ['Saúde', 'bg-pastel-sky text-sky-800 dark:text-sky-200'],
] as const;

export default function Home() {
  return (
    <main className='flex min-h-dvh flex-col items-center justify-center bg-bg-app px-4 py-16'>
      <BrandMark />
      <p className='mt-2.5 text-[13px] font-semibold text-ink'>Segundo Cérebro</p>
      <h1 className='mt-4 max-w-xl text-center text-[32px] font-bold tracking-tight text-ink'>
        Organize sua vida no seu ritmo
      </h1>
      <p className='mt-2 max-w-md text-center text-[13px] text-muted'>
        Áreas, hábitos e check-ins — sem culpa, privado por padrão.
      </p>
      <div className='mt-5 flex items-center gap-2.5'>
        <Link href='/signin' className={`${primaryButton} px-4 py-2`}>
          Entrar
        </Link>
        <Link href='/signup' className={`${secondaryButton} px-4 py-2`}>
          Criar conta
        </Link>
      </div>
      <ul className='mt-5 flex flex-wrap items-center justify-center gap-1.5'>
        {areas.map(([name, tone]) => (
          <li
            key={name}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${tone}`}
          >
            {name}
          </li>
        ))}
      </ul>
    </main>
  );
}
