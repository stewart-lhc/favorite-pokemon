import { neon } from '@neondatabase/serverless';

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export type Mode = 'favourite' | 'not_favourite';

export const sql = neon(requiredEnv('DATABASE_URL'));
export const publicReadCache = 'public, s-maxage=30, stale-while-revalidate=300';

export function sendJson(
  response: ResponseLike,
  status: number,
  body: unknown,
  cacheControl = 'no-store',
) {
  response.setHeader('Cache-Control', cacheControl);
  response.status(status).json(body);
}

export function normalizeMode(value: unknown): Mode {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'not_favourite' ? 'not_favourite' : 'favourite';
}

export function sanitizeText(value: unknown, maxLength: number): string {
  return String(value ?? '').trim().slice(0, maxLength);
}

export function toDeclaration(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    trainerName: String(row.trainer_name),
    pokemonId: Number(row.pokemon_id),
    pokemonName: String(row.pokemon_name),
    reason: String(row.reason ?? ''),
    mode: normalizeMode(row.type),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}
