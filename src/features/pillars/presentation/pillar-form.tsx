'use client';

import Link from 'next/link';
import { type ReactNode, useActionState, useState } from 'react';
import { primaryButton, secondaryButton, textInput } from '@/shared/ui';
import { type ActionState, IDLE_STATE } from '@/shared/lib';
import {
  PILLAR_COLOR_LABELS,
  PILLAR_COLORS,
  PILLAR_ICON_LABELS,
  PILLAR_ICONS,
  PILLAR_DESCRIPTION_MAX,
  PILLAR_NAME_MAX,
} from '../domain';
import { PillarTile } from './pillar-tile';
import { pillarColorStyle, renderPillarIcon } from './style';

type PillarValues = {
  id?: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: PillarValues;
  submitLabel: string;
  cancelHref: string;
};

const EMPTY: PillarValues = { name: '', description: null, color: null, icon: null };

const optionClass =
  'flex size-10 cursor-pointer items-center justify-center rounded-xl ring-ink ring-offset-2 ring-offset-bg-card peer-checked:ring-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4';

export function PillarForm({
  action,
  initial = EMPTY,
  submitLabel,
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? '');
  const [color, setColor] = useState(initial.color ?? '');
  const [icon, setIcon] = useState(initial.icon ?? '');

  return (
    <form action={formAction} className='flex flex-col gap-6'>
      {initial.id && <input type='hidden' name='id' value={initial.id} />}

      <div className='flex items-center gap-3'>
        <PillarTile color={color || null} icon={icon || null} size='lg' />
        <span className='text-lg font-medium'>{name.trim() || 'Nova área'}</span>
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='name' className='font-medium'>
          Nome
        </label>
        <input
          id='name'
          name='name'
          required
          maxLength={PILLAR_NAME_MAX}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={textInput}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <label htmlFor='description' className='font-medium'>
          Descrição <span className='text-sm font-normal text-muted'>(opcional)</span>
        </label>
        <textarea
          id='description'
          name='description'
          rows={3}
          maxLength={PILLAR_DESCRIPTION_MAX}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={textInput}
        />
      </div>

      <fieldset className='flex flex-col gap-2'>
        <legend className='mb-2 font-medium'>Cor</legend>
        <div className='flex flex-wrap gap-3'>
          <ChoiceOption
            name='color'
            value=''
            label='Sem cor'
            checked={color === ''}
            onSelect={setColor}
          >
            <span className={`size-6 rounded-full ${pillarColorStyle(null).swatch}`} />
          </ChoiceOption>
          {PILLAR_COLORS.map((key) => (
            <ChoiceOption
              key={key}
              name='color'
              value={key}
              label={PILLAR_COLOR_LABELS[key]}
              checked={color === key}
              onSelect={setColor}
            >
              <span className={`size-6 rounded-full ${pillarColorStyle(key).swatch}`} />
            </ChoiceOption>
          ))}
        </div>
      </fieldset>

      <fieldset className='flex flex-col gap-2'>
        <legend className='mb-2 font-medium'>Ícone</legend>
        <div className='flex flex-wrap gap-3'>
          <ChoiceOption
            name='icon'
            value=''
            label='Sem ícone'
            checked={icon === ''}
            onSelect={setIcon}
          >
            {renderPillarIcon(null, 'size-5')}
          </ChoiceOption>
          {PILLAR_ICONS.map((key) => (
            <ChoiceOption
              key={key}
              name='icon'
              value={key}
              label={PILLAR_ICON_LABELS[key]}
              checked={icon === key}
              onSelect={setIcon}
            >
              {renderPillarIcon(key, 'size-5')}
            </ChoiceOption>
          ))}
        </div>
      </fieldset>

      <p aria-live='polite' className='text-sm text-rose-700 dark:text-rose-300'>
        {state.status === 'error' && state.message}
      </p>

      <div className='flex gap-2'>
        <button type='submit' disabled={pending} className={primaryButton}>
          {pending ? 'Salvando…' : submitLabel}
        </button>
        <Link href={cancelHref} className={secondaryButton}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function ChoiceOption({
  name,
  value,
  label,
  checked,
  onSelect,
  children,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onSelect: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label title={label}>
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className='peer sr-only'
      />
      <span className='sr-only'>{label}</span>
      <span
        className={`${optionClass} bg-bg-app hover:bg-border`}
      >
        {children}
      </span>
    </label>
  );
}
