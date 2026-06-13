import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeclarations,
  getDeclarations,
  hasDeclaredOnDevice,
  saveDeclaration,
} from './storage';

describe('local declaration storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores declarations newest first and separates favourite modes', () => {
    saveDeclaration({
      trainerName: 'Mixel',
      pokemonId: 25,
      pokemonName: 'Pikachu',
      reason: 'Lightning buddy forever',
      mode: 'favourite',
    });
    saveDeclaration({
      trainerName: 'Rival',
      pokemonId: 129,
      pokemonName: 'Magikarp',
      reason: 'The splash is unforgivable',
      mode: 'not_favourite',
    });

    expect(getDeclarations('favourite')).toHaveLength(1);
    expect(getDeclarations('not_favourite')[0]).toEqual(
      expect.objectContaining({ trainerName: 'Rival', pokemonName: 'Magikarp' }),
    );
  });

  it('tracks one declaration per device for each mode and can clear them', () => {
    expect(hasDeclaredOnDevice('favourite')).toBe(false);
    saveDeclaration({
      trainerName: 'Trainer',
      pokemonId: 1,
      pokemonName: 'Bulbasaur',
      reason: 'A starter with heart',
      mode: 'favourite',
    });

    expect(hasDeclaredOnDevice('favourite')).toBe(true);
    clearDeclarations();
    expect(hasDeclaredOnDevice('favourite')).toBe(false);
  });
});
