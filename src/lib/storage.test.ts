import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeclarations,
  hasDeclaredOnDevice,
  markDeclaredOnDevice,
} from './storage';

describe('local declaration guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tracks one declaration per device for each mode and can clear them', () => {
    expect(hasDeclaredOnDevice('favourite')).toBe(false);
    markDeclaredOnDevice('favourite');

    expect(hasDeclaredOnDevice('favourite')).toBe(true);
    expect(hasDeclaredOnDevice('not_favourite')).toBe(false);
    clearDeclarations();
    expect(hasDeclaredOnDevice('favourite')).toBe(false);
  });
});
