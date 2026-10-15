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
  isPillarColor,
  isPillarIcon,
  type PillarColor,
  type PillarIcon,
} from '@/lib/pillar-options';

type ColorStyle = { tile: string; swatch: string };

const COLOR_STYLES: Record<PillarColor, ColorStyle> = {
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
  tile: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  swatch: 'bg-zinc-300 dark:bg-zinc-600',
};

const ICONS: Record<PillarIcon, LucideIcon> = {
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

export const DEFAULT_PILLAR_ICON: LucideIcon = Compass;

export function pillarColorStyle(color: string | null): ColorStyle {
  return isPillarColor(color) ? COLOR_STYLES[color] : NEUTRAL_STYLE;
}

export function pillarIcon(icon: string | null): LucideIcon {
  return isPillarIcon(icon) ? ICONS[icon] : DEFAULT_PILLAR_ICON;
}

export function renderPillarIcon(icon: string | null, className: string) {
  return createElement(pillarIcon(icon), { className, 'aria-hidden': true });
}
