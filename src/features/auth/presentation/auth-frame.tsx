import type { InputHTMLAttributes, ReactNode } from 'react';

export const authLink = 'font-medium text-[#2f8fa4] hover:underline';

export const authCard =
  'flex w-full flex-col gap-3.5 rounded-2xl border border-[#e8eaee] bg-bg-card p-5 shadow-[0_1px_2px_rgba(26,29,38,0.04)]';

export function BrandMark() {
  return (
    <span className='flex size-10 items-center justify-center rounded-xl bg-ink text-[13px] font-semibold text-bg-card'>
      SC
    </span>
  );
}

export function AuthFrame({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className='flex min-h-dvh flex-col items-center justify-center bg-bg-app px-4 py-12'>
      <div className='flex w-full max-w-[420px] flex-col items-center'>
        <BrandMark />
        <p className='mt-2.5 text-[13px] font-semibold text-ink'>Segundo Cérebro</p>
        <h1 className='mt-4 text-center text-[26px] font-bold tracking-tight text-ink'>
          {title}
        </h1>
        <p className='mt-1 text-center text-[13px] text-muted'>{description}</p>
        <div className='mt-5 w-full'>{children}</div>
        {footer ? <div className='mt-4 text-center text-[13px] text-muted'>{footer}</div> : null}
      </div>
    </main>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role='alert'
      className='rounded-lg bg-[#fde8ee] px-3 py-2 text-center text-[13px] font-medium text-[#c45d72] dark:bg-pastel-rose dark:text-rose-300'
    >
      {children}
    </p>
  );
}

export function AuthDivider() {
  return (
    <div className='flex items-center gap-3 text-xs text-muted'>
      <span className='h-px flex-1 bg-border' />
      ou
      <span className='h-px flex-1 bg-border' />
    </div>
  );
}

export function AuthTextField({
  label,
  hint,
  ...input
}: {
  label: string;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-baseline justify-between gap-3'>
        <label htmlFor={input.id} className='text-[13px] font-semibold text-ink'>
          {label}
        </label>
        {hint}
      </div>
      <div className='flex items-center gap-2.5 rounded-lg border border-[#e6e8ee] bg-bg-card px-3 py-2 focus-within:border-[#3d94a6]'>
        <span className='size-1.5 shrink-0 rounded-full bg-[#8b939e]' aria-hidden />
        <input
          {...input}
          className='w-full bg-transparent text-sm text-ink outline-none placeholder:text-[#9aa3af]'
        />
      </div>
    </div>
  );
}
