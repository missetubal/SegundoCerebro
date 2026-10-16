import { Briefcase } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AREA_ICON,
  areaColorStyle,
  areaIcon,
} from './style';

describe('areaColorStyle', () => {
  it('returns the palette style for a known color', () => {
    expect(areaColorStyle('blue').tile).toContain('bg-blue-50');
  });

  it('falls back to the neutral style for null or unknown colors', () => {
    expect(areaColorStyle(null)).toEqual(areaColorStyle('magenta'));
    expect(areaColorStyle(null).tile).toContain('bg-bg-app');
  });
});

describe('areaIcon', () => {
  it('returns the icon for a known key', () => {
    expect(areaIcon('briefcase')).toBe(Briefcase);
  });

  it('falls back to the default icon for null or unknown keys', () => {
    expect(areaIcon(null)).toBe(DEFAULT_AREA_ICON);
    expect(areaIcon('unicorn')).toBe(DEFAULT_AREA_ICON);
  });
});
