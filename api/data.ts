import { normalizeMode, publicReadCache, sendJson, sql, toDeclaration } from './_shared.js';

type RequestLike = {
  method?: string;
  query: Record<string, unknown>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method && request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Method not allowed' });
  }

  const mode = normalizeMode(request.query.mode);
  const statsRows = await sql`
    select
      pokemon_id,
      max(pokemon_name) as pokemon_name,
      count(*)::integer as fan_count
    from declarations
    where type = ${mode}
    group by pokemon_id
    order by fan_count desc, pokemon_id asc
  `;
  const latestRows = await sql`
    select id, trainer_name, pokemon_id, pokemon_name, reason, type, created_at
    from declarations
    where type = ${mode}
    order by created_at desc
    limit 20
  `;

  return sendJson(
    response,
    200,
    {
      stats: statsRows.map((row) => ({
        pokemonId: Number(row.pokemon_id),
        pokemonName: String(row.pokemon_name),
        fanCount: Number(row.fan_count),
      })),
      latest: latestRows.map(toDeclaration),
    },
    publicReadCache,
  );
}
