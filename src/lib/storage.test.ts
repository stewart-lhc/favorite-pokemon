import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeclarations,
  getLocalDeclarationSummary,
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

  it('persists the local success summary for the submitted mode', () => {
    markDeclaredOnDevice('favourite', {
      declaration: {
        id: 'local-summary',
        trainerName: 'Ari',
        pokemonId: 778,
        pokemonName: 'Mimikyu',
        reason: 'This is the stored local summary',
        mode: 'favourite',
        createdAt: '2026-06-13T10:00:00.000Z',
      },
      fanCount: 3,
      revealedCount: 99,
    });

    expect(getLocalDeclarationSummary('favourite')).toEqual(
      expect.objectContaining({
        fanCount: 3,
        revealedCount: 99,
        declaration: expect.objectContaining({ pokemonName: 'Mimikyu' }),
      }),
    );
    expect(getLocalDeclarationSummary('not_favourite')).toBeNull();
  });
});
