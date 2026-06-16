import { mkdir, stat, writeFile } from 'node:fs/promises';
import https from 'node:https';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const MAX_POKEMON = 1025;
const CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 45000;
const MAX_RETRIES = 5;
const startId = Math.max(1, Number(process.env.POKEMON_ASSET_START ?? 1));
const endId = Math.min(MAX_POKEMON, Number(process.env.POKEMON_ASSET_END ?? MAX_POKEMON));
const pokemonTypes = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requestBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      const statusCode = response.statusCode ?? 0;
      const location = response.headers.location;
      if (statusCode >= 300 && statusCode < 400 && location && redirects > 0) {
        response.resume();
        resolve(requestBuffer(new URL(location, url).toString(), redirects - 1));
        return;
      }
      if (statusCode < 200 || statusCode >= 300) {
        response.resume();
        reject(new Error(`${url} failed with ${statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error(`${url} timed out after ${FETCH_TIMEOUT_MS}ms`));
    });
    request.on('error', reject);
  });
}

async function requestBufferWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await requestBuffer(url);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * attempt);
      }
    }
  }
  throw lastError;
}

async function download(url, path, transform) {
  if (await exists(path)) return false;
  await mkdir(dirname(path), { recursive: true });
  const input = await requestBufferWithRetry(url);
  const output = transform ? await transform(input) : input;
  await writeFile(path, output);
  return true;
}

async function mapWithConcurrency(items, limit, mapper) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await mapper(items[index], index);
      }
    }),
  );
}

const idRange = Array.from({ length: endId - startId + 1 }, (_, index) => startId + index);

const spriteJobs = idRange.map((id) => ({
  url: `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/${id}.png`,
  path: join('public', 'pokemon', 'sprites', `${id}.png`),
}));

const artworkJobs = idRange.map((id) => ({
  url: `https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/other/official-artwork/${id}.png`,
  path: join('public', 'pokemon', 'artwork', `${id}.webp`),
  transform: (input) => sharp(input).resize({ width: 384, height: 384, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer(),
}));

const typeJobs = pokemonTypes.map((type) => ({
  url: `https://cdn.jsdelivr.net/gh/duiker101/pokemon-type-svg-icons@master/icons/${type}.svg`,
  path: join('public', 'pokemon', 'types', `${type}.svg`),
}));

const jobs = [...spriteJobs, ...artworkJobs, ...typeJobs];
let downloaded = 0;
const failed = [];

await mapWithConcurrency(jobs, CONCURRENCY, async (job) => {
  try {
    if (await download(job.url, job.path, job.transform)) downloaded += 1;
  } catch (error) {
    failed.push({ path: job.path, error: error instanceof Error ? error.message : String(error) });
  }
});

console.log(`Pokemon asset cache ready. Downloaded ${downloaded} new files, checked ${jobs.length} for IDs ${startId}-${endId}.`);
if (failed.length > 0) {
  console.error(`Failed ${failed.length} files:`);
  for (const item of failed.slice(0, 20)) {
    console.error(`- ${item.path}: ${item.error}`);
  }
  if (failed.length > 20) {
    console.error(`...and ${failed.length - 20} more`);
  }
  process.exitCode = 1;
}
