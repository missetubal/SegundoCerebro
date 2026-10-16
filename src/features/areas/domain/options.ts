export const AREA_COLORS = [
  'blue',
  'amber',
  'emerald',
  'rose',
  'sky',
  'violet',
  'teal',
  'orange',
  'slate',
] as const;

export type AreaColor = (typeof AREA_COLORS)[number];

export const AREA_COLOR_LABELS: Record<AreaColor, string> = {
  blue: 'Azul',
  amber: 'Âmbar',
  emerald: 'Verde',
  rose: 'Rosa',
  sky: 'Céu',
  violet: 'Violeta',
  teal: 'Turquesa',
  orange: 'Laranja',
  slate: 'Cinza',
};

export const AREA_ICONS = [
  'briefcase',
  'rocket',
  'heart-pulse',
  'users',
  'wallet',
  'sparkles',
  'book-open',
  'palette',
  'house',
  'dumbbell',
  'graduation-cap',
  'leaf',
  'brain',
  'music',
  'plane',
  'sun',
  'coffee',
  'code',
  'hand-heart',
  'piggy-bank',
] as const;

export type AreaIcon = (typeof AREA_ICONS)[number];

export const AREA_ICON_LABELS: Record<AreaIcon, string> = {
  briefcase: 'Maleta',
  rocket: 'Foguete',
  'heart-pulse': 'Coração',
  users: 'Pessoas',
  wallet: 'Carteira',
  sparkles: 'Brilho',
  'book-open': 'Livro',
  palette: 'Paleta',
  house: 'Casa',
  dumbbell: 'Haltere',
  'graduation-cap': 'Formatura',
  leaf: 'Folha',
  brain: 'Mente',
  music: 'Música',
  plane: 'Viagem',
  sun: 'Sol',
  coffee: 'Café',
  code: 'Código',
  'hand-heart': 'Cuidado',
  'piggy-bank': 'Cofrinho',
};

export function isAreaColor(value: unknown): value is AreaColor {
  return AREA_COLORS.includes(value as AreaColor);
}

export function isAreaIcon(value: unknown): value is AreaIcon {
  return AREA_ICONS.includes(value as AreaIcon);
}
