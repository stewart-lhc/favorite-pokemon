import type {
  GenerationKey,
  Mode,
  PokeApiListItem,
  PokemonDataItem,
  PokemonRow,
  PokemonStat,
  PokemonType,
} from '../types';

export const MAX_POKEMON = 1025;

const generations: Array<{ key: GenerationKey; label: string; min: number; max: number }> = [
  { key: 'gen1', label: 'Gen I', min: 1, max: 151 },
  { key: 'gen2', label: 'Gen II', min: 152, max: 251 },
  { key: 'gen3', label: 'Gen III', min: 252, max: 386 },
  { key: 'gen4', label: 'Gen IV', min: 387, max: 493 },
  { key: 'gen5', label: 'Gen V', min: 494, max: 649 },
  { key: 'gen6', label: 'Gen VI', min: 650, max: 721 },
  { key: 'gen7', label: 'Gen VII', min: 722, max: 809 },
  { key: 'gen8', label: 'Gen VIII', min: 810, max: 905 },
  { key: 'gen9', label: 'Gen IX', min: 906, max: 1025 },
];

const knownTypes = new Map<number, PokemonType[]>([
  [1, ['grass', 'poison']],
  [2, ['grass', 'poison']],
  [3, ['grass', 'poison']],
  [4, ['fire']],
  [5, ['fire']],
  [6, ['fire', 'flying']],
  [7, ['water']],
  [8, ['water']],
  [9, ['water']],
  [25, ['electric']],
  [26, ['electric']],
  [129, ['water']],
  [130, ['water', 'flying']],
  [150, ['psychic']],
  [151, ['psychic']],
]);

const fallbackPokemonData: PokemonDataItem[] = [
  {
    id: 1,
    slug: 'bulbasaur',
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    sprite: '/pokemon/sprites/1.png',
    artwork: '/pokemon/artwork/1.webp',
  },
  {
    id: 4,
    slug: 'charmander',
    name: 'charmander',
    types: ['fire'],
    sprite: '/pokemon/sprites/4.png',
    artwork: '/pokemon/artwork/4.webp',
  },
  {
    id: 6,
    slug: 'charizard',
    name: 'charizard',
    types: ['fire', 'flying'],
    sprite: '/pokemon/sprites/6.png',
    artwork: '/pokemon/artwork/6.webp',
  },
  {
    id: 7,
    slug: 'squirtle',
    name: 'squirtle',
    types: ['water'],
    sprite: '/pokemon/sprites/7.png',
    artwork: '/pokemon/artwork/7.webp',
  },
  {
    id: 25,
    slug: 'pikachu',
    name: 'pikachu',
    types: ['electric'],
    sprite: '/pokemon/sprites/25.png',
    artwork: '/pokemon/artwork/25.webp',
  },
  {
    id: 150,
    slug: 'mewtwo',
    name: 'mewtwo',
    types: ['psychic'],
    sprite: '/pokemon/sprites/150.png',
    artwork: '/pokemon/artwork/150.webp',
  },
];

export async function fetchPokemonList(limit = MAX_POKEMON): Promise<PokemonRow[]> {
  const localRows = await fetchLocalPokemonRows(limit);
  if (localRows.length > 0) {
    return localRows;
  }

  const pokeApiRows = await fetchPokeApiRows(limit);
  if (pokeApiRows.length > 0) {
    return pokeApiRows;
  }

  return pokemonDataToRows(fallbackPokemonData.slice(0, limit));
}

export function pokemonDataToRows(items: PokemonDataItem[]): PokemonRow[] {
  return items.map((item) => {
    const generation = getGeneration(item.id);
    const generationLabel = generations.find((entry) => entry.key === generation)?.label ?? 'Gen IX';
    return {
      id: item.id,
      name: formatPokemonName(item.name),
      slug: item.slug,
      number: `#${String(item.id).padStart(3, '0')}`,
      sprite: pokemonSpriteUrl(item.id),
      artwork: pokemonOfficialArtworkUrl(item.id),
      generation,
      generationLabel,
      types: item.types,
      votes: 0,
    };
  });
}

export function buildPokemonRows(items: PokeApiListItem[], mode: Mode = 'favourite'): PokemonRow[] {
  return items.map((item, index) => {
    const id = idFromUrl(item.url) ?? index + 1;
    return decoratePokemon(id, item.name, mode);
  });
}

export function decoratePokemon(id: number, rawName: string, _mode: Mode): PokemonRow {
  const generation = getGeneration(id);
  const generationLabel = generations.find((item) => item.key === generation)?.label ?? 'Gen IX';
  return {
    id,
    name: formatPokemonName(rawName),
    slug: rawName,
    number: `#${String(id).padStart(3, '0')}`,
    sprite: pokemonSpriteUrl(id),
    artwork: pokemonOfficialArtworkUrl(id),
    generation,
    generationLabel,
    types: getTypes(id),
    votes: 0,
  };
}

export function mergePokemonStats(rows: PokemonRow[], stats: PokemonStat[]): PokemonRow[] {
  const counts = new Map(stats.map((item) => [item.pokemonId, item.fanCount]));
  return rows.map((row) => ({
    ...row,
    votes: counts.get(row.id) ?? 0,
  }));
}

export function getGeneration(id: number): GenerationKey {
  return generations.find((item) => id >= item.min && id <= item.max)?.key ?? 'gen9';
}

export function generationLabel(key: GenerationKey): string {
  return generations.find((item) => item.key === key)?.label ?? key;
}

export function allGenerations() {
  return generations;
}

export function formatPokemonName(rawName: string): string {
  return rawName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}

export function typeIconUrl(type: PokemonType): string {
  return `/pokemon/types/${type}.svg`;
}

export function pokemonSpriteUrl(id: number): string {
  return `/pokemon/sprites/${id}.png`;
}

export function pokemonOfficialArtworkUrl(id: number): string {
  return `/pokemon/artwork/${id}.webp`;
}

export function remotePokemonOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function idFromUrl(url: string): number | null {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function getTypes(id: number): PokemonType[] {
  const known = knownTypes.get(id);
  if (known) return known;
  return ['normal'];
}

async function fetchLocalPokemonRows(limit: number): Promise<PokemonRow[]> {
  try {
    const response = await fetch('/data/pokemon.json');
    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) return [];
    return pokemonDataToRows((payload as PokemonDataItem[]).slice(0, limit));
  } catch {
    return [];
  }
}

async function fetchPokeApiRows(limit: number): Promise<PokemonRow[]> {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
    if (!response.ok) return [];
    const payload = (await response.json()) as { results?: PokeApiListItem[] };
    return buildPokemonRows((payload.results ?? []).slice(0, limit));
  } catch {
    return [];
  }
}
