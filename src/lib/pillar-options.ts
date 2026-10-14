export const PILLAR_COLORS = [
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

export type PillarColor = (typeof PILLAR_COLORS)[number];

export const PILLAR_COLOR_LABELS: Record<PillarColor, string> = {
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

export const PILLAR_ICONS = [
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

export type PillarIcon = (typeof PILLAR_ICONS)[number];

export const PILLAR_ICON_LABELS: Record<PillarIcon, string> = {
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

export function isPillarColor(value: unknown): value is PillarColor {
  return PILLAR_COLORS.includes(value as PillarColor);
}

export function isPillarIcon(value: unknown): value is PillarIcon {
  return PILLAR_ICONS.includes(value as PillarIcon);
}
