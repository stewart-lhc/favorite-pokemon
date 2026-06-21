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
  const declarationId = sanitizeText(request.query.id, 80);
  if (declarationId) {
    return readDeclarationById(declarationId, response);
  }

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

async function readDeclarationById(declarationId: string, response: ResponseLike) {
  if (!isUuid(declarationId)) {
    return sendJson(response, 400, { error: 'Valid declaration id is required' });
  }

  const rows = await sql`
    select id, trainer_name, pokemon_id, pokemon_name, reason, type, created_at
    from declarations
    where id = ${declarationId}::uuid
    limit 1
  `;

  if (!rows[0]) {
    return sendJson(response, 404, { error: 'Declaration not found' });
  }

  const declaration = toDeclaration(rows[0]);
  const mode = normalizeMode(rows[0].type);
  const pokemonId = Number(rows[0].pokemon_id);
  const countRows = await sql`
    select
      count(*)::integer as total_declarations,
      count(*) filter (where pokemon_id = ${pokemonId})::integer as fan_count,
      count(distinct pokemon_id)::integer as revealed_count
    from declarations
    where type = ${mode}
  `;
  const rankRows = await sql`
    select rank::integer
    from (
      select
        pokemon_id,
        dense_rank() over (order by count(*) desc, pokemon_id asc) as rank
      from declarations
      where type = ${mode}
      group by pokemon_id
    ) ranked
    where pokemon_id = ${pokemonId}
    limit 1
  `;
  const counts = countRows[0] ?? {};

  return sendJson(response, 200, {
    declaration,
    fanCount: Number(counts.fan_count ?? 1),
    revealedCount: Number(counts.revealed_count ?? 1),
    rank: rankRows[0] ? Number(rankRows[0].rank) : null,
    totalDeclarations: Number(counts.total_declarations ?? 1),
  });
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
