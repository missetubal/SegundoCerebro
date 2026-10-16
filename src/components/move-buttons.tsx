import { ChevronDown, ChevronUp } from 'lucide-react';
import { ItemActionButton } from '@/components/item-action-button';
import { iconButton } from '@/components/ui';
import type { ActionState } from '@/lib/action-state';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  name: string;
  isFirst: boolean;
  isLast: boolean;
};

export function MoveButtons({ action, id, name, isFirst, isLast }: Props) {
  return (
    <div className='flex flex-col'>
      <ItemActionButton
        action={action}
        id={id}
        fields={{ direction: 'up' }}
        label={`Mover ${name} para cima`}
        disabled={isFirst}
        className={iconButton}
      >
        <ChevronUp className='size-4' aria-hidden />
      </ItemActionButton>
      <ItemActionButton
        action={action}
        id={id}
        fields={{ direction: 'down' }}
        label={`Mover ${name} para baixo`}
        disabled={isLast}
        className={iconButton}
      >
        <ChevronDown className='size-4' aria-hidden />
      </ItemActionButton>
    </div>
  );
}
