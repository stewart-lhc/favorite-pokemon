import type { GenerationKey, Mode, PokeApiListItem, PokemonRow, PokemonType } from '../types';

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

const typeCycle: PokemonType[] = [
  'grass',
  'fire',
  'water',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
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

export async function fetchPokemonList(limit = MAX_POKEMON): Promise<PokemonRow[]> {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`PokeAPI request failed: ${response.status}`);
  }
  const payload = (await response.json()) as { results: PokeApiListItem[] };
  return buildPokemonRows(payload.results.slice(0, limit));
}

export function buildPokemonRows(items: PokeApiListItem[], mode: Mode = 'favourite'): PokemonRow[] {
  return items.map((item, index) => {
    const id = idFromUrl(item.url) ?? index + 1;
    return decoratePokemon(id, item.name, mode);
  });
}

export function decoratePokemon(id: number, rawName: string, mode: Mode): PokemonRow {
  const generation = getGeneration(id);
  const generationLabel = generations.find((item) => item.key === generation)?.label ?? 'Gen IX';
  return {
    id,
    name: formatPokemonName(rawName),
    slug: rawName,
    number: `#${String(id).padStart(3, '0')}`,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    generation,
    generationLabel,
    types: getTypes(id),
    votes: seededVoteCount(id, mode),
  };
}

export function seededVoteCount(id: number, mode: Mode): number {
  const modeSeed = mode === 'favourite' ? 37 : 911;
  const mixed = Math.abs(Math.sin(id * 12.9898 + modeSeed) * 10000);
  const baseline = mode === 'favourite' ? 28 : 11;
  const spread = mode === 'favourite' ? 3050 : 1320;
  return baseline + Math.floor(mixed % spread);
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
  return `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${type}.svg`;
}

function idFromUrl(url: string): number | null {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function getTypes(id: number): PokemonType[] {
  const known = knownTypes.get(id);
  if (known) return known;
  const primary = typeCycle[id % typeCycle.length];
  const secondary = id % 7 === 0 ? typeCycle[(id + 5) % typeCycle.length] : undefined;
  return secondary && secondary !== primary ? [primary, secondary] : [primary];
}
