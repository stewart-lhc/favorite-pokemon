import { normalizeMode, sanitizeText, sendJson, sql, toDeclaration } from './_shared.js';

type RequestLike = {
  method?: string;
  query: Record<string, unknown>;
  body?: unknown;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method === 'GET' || !request.method) {
    return readDeclarations(request, response);
  }
  if (request.method === 'POST') {
    return createDeclaration(request, response);
  }
  return sendJson(response, 405, { error: 'Method not allowed' });
}

async function readDeclarations(request: RequestLike, response: ResponseLike) {
  const mode = normalizeMode(request.query.mode);
  const pokemonId = Number(Array.isArray(request.query.pokemonId) ? request.query.pokemonId[0] : request.query.pokemonId);

  if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025) {
    return sendJson(response, 400, { error: 'Valid pokemonId is required' });
  }

  const rows = await sql`
    select id, trainer_name, pokemon_id, pokemon_name, reason, type, created_at
    from declarations
    where type = ${mode} and pokemon_id = ${pokemonId}
    order by created_at desc
    limit 100
  `;

  return sendJson(response, 200, { declarations: rows.map(toDeclaration) });
}

async function createDeclaration(request: RequestLike, response: ResponseLike) {
  const body = typeof request.body === 'object' && request.body ? request.body as Record<string, unknown> : {};
  const mode = normalizeMode(body.mode);
  const trainerName = sanitizeText(body.trainerName, 80);
  const pokemonName = sanitizeText(body.pokemonName, 120);
  const reason = sanitizeText(body.reason, 300);
  const pokemonId = Number(body.pokemonId);

  if (trainerName.length < 2) {
    return sendJson(response, 400, { error: 'Trainer name must be at least 2 characters.' });
  }
  if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025) {
    return sendJson(response, 400, { error: 'Valid Pokemon id is required.' });
  }
  if (!pokemonName) {
    return sendJson(response, 400, { error: 'Pokemon name is required.' });
  }
  if (reason.length < 10) {
    return sendJson(response, 400, { error: 'Reason must be at least 10 characters.' });
  }

  const rows = await sql`
    insert into declarations (trainer_name, pokemon_id, pokemon_name, reason, type)
    values (${trainerName}, ${pokemonId}, ${pokemonName}, ${reason}, ${mode})
    returning id, trainer_name, pokemon_id, pokemon_name, reason, type, created_at
  `;
  const countRows = await sql`
    select
      count(*) filter (where pokemon_id = ${pokemonId})::integer as fan_count,
      count(distinct pokemon_id)::integer as revealed_count
    from declarations
    where type = ${mode}
  `;
  const counts = countRows[0] ?? {};

  return sendJson(response, 201, {
    declaration: toDeclaration(rows[0]),
    fanCount: Number(counts.fan_count ?? 1),
    revealedCount: Number(counts.revealed_count ?? 1),
  });
}
