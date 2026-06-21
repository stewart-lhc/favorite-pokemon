export type Mode = 'favourite' | 'not_favourite';

export type PokeApiListItem = {
  name: string;
  url: string;
};

export type PokemonDataItem = {
  id: number;
  slug: string;
  name: string;
  types: PokemonType[];
  sprite: string;
  artwork: string;
};

export type GenerationKey =
  | 'gen1'
  | 'gen2'
  | 'gen3'
  | 'gen4'
  | 'gen5'
  | 'gen6'
  | 'gen7'
  | 'gen8'
  | 'gen9';

export type PokemonType =
  | 'normal'
  | 'fighting'
  | 'flying'
  | 'poison'
  | 'ground'
  | 'rock'
  | 'bug'
  | 'ghost'
  | 'steel'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'psychic'
  | 'ice'
  | 'dragon'
  | 'dark'
  | 'fairy';

export type PokemonRow = {
  id: number;
  name: string;
  slug: string;
  number: string;
  sprite: string;
  artwork: string;
  generation: GenerationKey;
  generationLabel: string;
  types: PokemonType[];
  votes: number;
};

export type PokemonStat = {
  pokemonId: number;
  pokemonName: string;
  fanCount: number;
};

export type DeclarationInput = {
  trainerName: string;
  pokemonId: number;
  pokemonName: string;
  reason: string;
  mode: Mode;
};

export type Declaration = DeclarationInput & {
  id: string;
  createdAt: string;
};

export type DeclarationResult = {
  declaration: Declaration;
  fanCount: number;
  revealedCount: number;
};

export type DeclarationDetail = DeclarationResult & {
  rank: number | null;
  totalDeclarations: number;
};

export type LocalDeclarationSummary = {
  declaration: Declaration;
  fanCount: number;
  revealedCount: number;
};

export type BackendData = {
  stats: PokemonStat[];
  latest: Declaration[];
};
