import { describe, expect, it } from 'vitest';
import {
  buildPokemonRows,
  decoratePokemon,
  getGeneration,
  seededVoteCount,
} from './pokemon';

describe('pokemon data helpers', () => {
  it('decorates fetched pokemon with id, sprite, generation, type, and deterministic votes', () => {
    const rows = buildPokemonRows([
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        id: 1,
        name: 'Bulbasaur',
        generation: 'gen1',
        sprite: expect.stringContaining('/sprites/pokemon/1.png'),
        votes: seededVoteCount(1, 'favourite'),
      }),
      expect.objectContaining({
        id: 25,
        name: 'Pikachu',
        generation: 'gen1',
        artwork: expect.stringContaining('/official-artwork/25.png'),
      }),
    ]);
  });

  it('uses mode-specific deterministic counts without returning zero', () => {
    expect(seededVoteCount(25, 'favourite')).toBeGreaterThan(0);
    expect(seededVoteCount(25, 'not_favourite')).toBeGreaterThan(0);
    expect(seededVoteCount(25, 'favourite')).not.toBe(seededVoteCount(25, 'not_favourite'));
  });

  it('maps pokemon ids to generations and display metadata', () => {
    expect(getGeneration(1)).toBe('gen1');
    expect(getGeneration(906)).toBe('gen9');
    expect(decoratePokemon(6, 'charizard', 'favourite')).toEqual(
      expect.objectContaining({
        id: 6,
        name: 'Charizard',
        number: '#006',
        generationLabel: 'Gen I',
      }),
    );
  });
});
