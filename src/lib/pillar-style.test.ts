import { Briefcase } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PILLAR_ICON,
  pillarColorStyle,
  pillarIcon,
} from './pillar-style';

describe('pillarColorStyle', () => {
  it('returns the palette style for a known color', () => {
    expect(pillarColorStyle('blue').tile).toContain('bg-blue-50');
  });

  it('falls back to the neutral style for null or unknown colors', () => {
    expect(pillarColorStyle(null)).toEqual(pillarColorStyle('magenta'));
    expect(pillarColorStyle(null).tile).toContain('bg-zinc-100');
  });
});

describe('pillarIcon', () => {
  it('returns the icon for a known key', () => {
    expect(pillarIcon('briefcase')).toBe(Briefcase);
  });

  it('falls back to the default icon for null or unknown keys', () => {
    expect(pillarIcon(null)).toBe(DEFAULT_PILLAR_ICON);
    expect(pillarIcon('unicorn')).toBe(DEFAULT_PILLAR_ICON);
  });
});
