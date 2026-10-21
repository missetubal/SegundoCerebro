import { Check } from 'lucide-react';

export const IMPORT_STEPS = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapping', label: 'Mapeamento' },
  { id: 'review', label: 'Revisão' },
  { id: 'check', label: 'Conferência' },
  { id: 'done', label: 'Concluído' },
] as const;

export type ImportStepId = (typeof IMPORT_STEPS)[number]['id'];

export function ImportStepper({
  current,
  complete,
}: {
  current: ImportStepId;
  complete?: ImportStepId[];
}) {
  const currentIndex = IMPORT_STEPS.findIndex((step) => step.id === current);
  return (
    <ol className='flex flex-wrap items-center gap-1' aria-label='Etapas da importação'>
      {IMPORT_STEPS.map((step, index) => {
        const done = complete ? complete.includes(step.id) : index < currentIndex;
        const active = step.id === current;
        return (
          <li key={step.id}>
            <span
              aria-current={active ? 'step' : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm ${
                active ? 'bg-bg-card font-medium text-ink' : done ? 'text-ink' : 'text-muted'
              }`}
            >
              {done ? (
                <span className='inline-flex size-5 items-center justify-center rounded-full bg-ink text-bg-card'>
                  <Check className='size-3' aria-hidden />
                </span>
              ) : (
                <span className='text-xs tabular-nums'>{index + 1}</span>
              )}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
