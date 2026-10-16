import { bodyText, caption, card } from '@/shared/ui';

export type NextStepCardItem = {
  id: string;
  title: string;
  areaName: string;
};

type Props = {
  steps: NextStepCardItem[];
};

export function NextStepsCard({ steps }: Props) {
  return (
    <section className={`${card} flex flex-col gap-3 p-4`}>
      <h2 className='text-base font-semibold'>Próximos passos</h2>
      {steps.length === 0 ? (
        <p className={caption}>Nenhum próximo passo aberto.</p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {steps.map((step) => (
            <li
              key={step.id}
              className='flex items-center justify-between gap-2'
            >
              <span className={bodyText}>{step.title}</span>
              <span className='rounded-full bg-bg-app px-2 py-0.5 text-[11px] text-muted'>
                {step.areaName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
