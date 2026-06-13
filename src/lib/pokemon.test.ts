import { describe, expect, it } from 'vitest';
import {
  buildPokemonRows,
  decoratePokemon,
  getGeneration,
  mergePokemonStats,
  pokemonDataToRows,
} from './pokemon';

describe('pokemon data helpers', () => {
  it('decorates fetched pokemon with id, sprite, generation, type, and zero votes by default', () => {
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
        votes: 0,
      }),
      expect.objectContaining({
        id: 25,
        name: 'Pikachu',
        generation: 'gen1',
        artwork: expect.stringContaining('/official-artwork/25.png'),
      }),
    ]);
  });

  it('applies vote counts only from backend stats', () => {
    const rows = buildPokemonRows([
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
      { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
    ]);

    const merged = mergePokemonStats(rows, [
      { pokemonId: 25, pokemonName: 'pikachu', fanCount: 42 },
    ]);

    expect(merged.find((row) => row.id === 1)?.votes).toBe(0);
    expect(merged.find((row) => row.id === 25)?.votes).toBe(42);
  });

  it('uses real types and image urls from synced PokeAPI data', () => {
    const rows = pokemonDataToRows([
      {
        id: 778,
        slug: 'mimikyu-disguised',
        name: 'mimikyu-disguised',
        types: ['ghost', 'fairy'],
        sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/778.png',
        artwork:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png',
      },
    ]);

    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 778,
        name: 'Mimikyu-Disguised',
        types: ['ghost', 'fairy'],
        sprite: expect.stringContaining('/778.png'),
        artwork: expect.stringContaining('/official-artwork/778.png'),
        votes: 0,
      }),
    );
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
        votes: 0,
      }),
    );
  });
});
