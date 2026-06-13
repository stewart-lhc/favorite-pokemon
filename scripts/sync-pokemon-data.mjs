import { mkdir, writeFile } from 'node:fs/promises';

const MAX_POKEMON = 1025;
const CONCURRENCY = 24;

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} failed with ${response.status}`);
  }
  return response.json();
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await mapper(items[index], index);
      }
    }),
  );

  return results;
}

const list = await fetchJson(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`);
if (list.results.length !== MAX_POKEMON) {
  throw new Error(`Expected ${MAX_POKEMON} Pokemon, received ${list.results.length}`);
}

const pokemon = await mapWithConcurrency(list.results, CONCURRENCY, async (item) => {
  const id = Number(item.url.split('/').filter(Boolean).at(-1));
  const details = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
  return {
    id,
    slug: item.name,
    name: item.name,
    types: details.types.map((entry) => entry.type.name),
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
    artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
  };
});

await mkdir('public/data', { recursive: true });
await writeFile('public/data/pokemon.json', `${JSON.stringify(pokemon, null, 2)}\n`);

console.log(`Wrote ${pokemon.length} Pokemon to public/data/pokemon.json`);
