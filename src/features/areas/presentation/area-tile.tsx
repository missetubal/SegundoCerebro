import { areaColorStyle, renderAreaIcon } from './style';

type Props = {
  color: string | null;
  icon: string | null;
  size?: 'md' | 'lg';
};

const SIZES = {
  md: { tile: 'size-9 rounded-xl', icon: 'size-4' },
  lg: { tile: 'size-12 rounded-2xl', icon: 'size-6' },
};

export function AreaTile({ color, icon, size = 'md' }: Props) {
  const sizes = SIZES[size];

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center ${sizes.tile} ${areaColorStyle(color).tile}`}
    >
      {renderAreaIcon(icon, sizes.icon)}
    </span>
  );
}
