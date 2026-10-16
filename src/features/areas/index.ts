/** Client-safe public API. Server: `@/features/areas/server` */
export {
  AreaForm,
  AreaTile,
  DEFAULT_AREA_ICON,
  areaColorStyle,
  areaIcon,
  renderAreaIcon,
} from './presentation';
export {
  isAreaColor,
  isAreaIcon,
  AREA_COLOR_LABELS,
  AREA_COLORS,
  AREA_ICON_LABELS,
  AREA_ICONS,
  AREA_DESCRIPTION_MAX,
  AREA_NAME_MAX,
  areaInputSchema,
  type AreaColor,
  type AreaIcon,
  type AreaInput,
} from './domain';
