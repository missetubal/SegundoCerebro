import { describe, expect, it } from 'vitest';
import { moveInOrder } from './ordering';

describe('moveInOrder', () => {
  const ids = ['a', 'b', 'c'];

  it('swaps an item with its previous neighbor when moving up', () => {
    expect(moveInOrder(ids, 'c', 'up')).toEqual(['a', 'c', 'b']);
  });

  it('swaps an item with its next neighbor when moving down', () => {
    expect(moveInOrder(ids, 'a', 'down')).toEqual(['b', 'a', 'c']);
  });

  it('returns null at the edges of the list', () => {
    expect(moveInOrder(ids, 'a', 'up')).toBeNull();
    expect(moveInOrder(ids, 'c', 'down')).toBeNull();
  });

  it('returns null for an unknown id', () => {
    expect(moveInOrder(ids, 'z', 'up')).toBeNull();
  });

  it('does not mutate the input', () => {
    moveInOrder(ids, 'b', 'up');
    expect(ids).toEqual(['a', 'b', 'c']);
  });
});
