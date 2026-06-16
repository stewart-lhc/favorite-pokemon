import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildPokemonRows,
  decoratePokemon,
  fetchPokemonList,
  getGeneration,
  mergePokemonStats,
  pokemonDataToRows,
} from './pokemon';

describe('pokemon data helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

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
        sprite: '/pokemon/sprites/1.png',
        votes: 0,
      }),
      expect.objectContaining({
        id: 25,
        name: 'Pikachu',
        generation: 'gen1',
        artwork: '/pokemon/artwork/25.webp',
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
        sprite: '/pokemon/sprites/778.png',
        artwork: '/pokemon/artwork/778.webp',
      },
    ]);

    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 778,
        name: 'Mimikyu-Disguised',
        types: ['ghost', 'fairy'],
        sprite: '/pokemon/sprites/778.png',
        artwork: '/pokemon/artwork/778.webp',
        votes: 0,
      }),
    );
  });

  it('falls back to starter rows when local and PokeAPI data are unavailable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const rows = await fetchPokemonList(2);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 1,
        name: 'Bulbasaur',
        types: ['grass', 'poison'],
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith('/data/pokemon.json');
    expect(fetchMock).toHaveBeenCalledWith('https://pokeapi.co/api/v2/pokemon?limit=2');
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
