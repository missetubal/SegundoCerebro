export default function FinanceLoading() {
  return (
    <div className='flex flex-col gap-4' aria-busy='true'>
      <div className='h-8 w-48 animate-pulse rounded-lg bg-border/60' />
      <div className='h-4 w-72 max-w-full animate-pulse rounded bg-border/50' />
      <div className='h-40 animate-pulse rounded-2xl bg-border/40' />
      <div className='h-40 animate-pulse rounded-2xl bg-border/40' />
      <span className='sr-only'>Carregando…</span>
    </div>
  );
}
