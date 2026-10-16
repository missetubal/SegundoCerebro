/** Client-safe public API. Server: `@/features/pillars/server` */
export {
  PillarForm,
  PillarTile,
  DEFAULT_PILLAR_ICON,
  pillarColorStyle,
  pillarIcon,
  renderPillarIcon,
} from './presentation';
export {
  isPillarColor,
  isPillarIcon,
  PILLAR_COLOR_LABELS,
  PILLAR_COLORS,
  PILLAR_ICON_LABELS,
  PILLAR_ICONS,
  PILLAR_DESCRIPTION_MAX,
  PILLAR_NAME_MAX,
  pillarInputSchema,
  type PillarColor,
  type PillarIcon,
  type PillarInput,
} from './domain';
