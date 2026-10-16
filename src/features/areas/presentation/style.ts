import {
  BookOpen,
  Brain,
  Briefcase,
  Code,
  Coffee,
  Compass,
  Dumbbell,
  GraduationCap,
  HandHeart,
  HeartPulse,
  House,
  Leaf,
  type LucideIcon,
  Music,
  Palette,
  PiggyBank,
  Plane,
  Rocket,
  Sparkles,
  Sun,
  Users,
  Wallet,
} from 'lucide-react';
import { createElement } from 'react';
import {
  isAreaColor,
  isAreaIcon,
  type AreaColor,
  type AreaIcon,
} from '../domain';

type ColorStyle = { tile: string; swatch: string };

const COLOR_STYLES: Record<AreaColor, ColorStyle> = {
  blue: {
    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
    swatch: 'bg-blue-500',
  },
  amber: {
    tile: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
    swatch: 'bg-amber-500',
  },
  emerald: {
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
    swatch: 'bg-emerald-500',
  },
  rose: {
    tile: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
    swatch: 'bg-rose-500',
  },
  sky: {
    tile: 'bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300',
    swatch: 'bg-sky-500',
  },
  violet: {
    tile: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
    swatch: 'bg-violet-500',
  },
  teal: {
    tile: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300',
    swatch: 'bg-teal-500',
  },
  orange: {
    tile: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300',
    swatch: 'bg-orange-500',
  },
  slate: {
    tile: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    swatch: 'bg-slate-500',
  },
};

const NEUTRAL_STYLE: ColorStyle = {
  tile: 'bg-bg-app text-muted',
  swatch: 'bg-border',
};

const ICONS: Record<AreaIcon, LucideIcon> = {
  briefcase: Briefcase,
  rocket: Rocket,
  'heart-pulse': HeartPulse,
  users: Users,
  wallet: Wallet,
  sparkles: Sparkles,
  'book-open': BookOpen,
  palette: Palette,
  house: House,
  dumbbell: Dumbbell,
  'graduation-cap': GraduationCap,
  leaf: Leaf,
  brain: Brain,
  music: Music,
  plane: Plane,
  sun: Sun,
  coffee: Coffee,
  code: Code,
  'hand-heart': HandHeart,
  'piggy-bank': PiggyBank,
};

export const DEFAULT_AREA_ICON: LucideIcon = Compass;

export function areaColorStyle(color: string | null): ColorStyle {
  return isAreaColor(color) ? COLOR_STYLES[color] : NEUTRAL_STYLE;
}

export function areaIcon(icon: string | null): LucideIcon {
  return isAreaIcon(icon) ? ICONS[icon] : DEFAULT_AREA_ICON;
}

export function renderAreaIcon(icon: string | null, className: string) {
  return createElement(areaIcon(icon), { className, 'aria-hidden': true });
}
