import type { BackendData, Declaration, DeclarationDetail, DeclarationInput, DeclarationResult, Mode } from '../types';

const emptyBackendData: BackendData = {
  stats: [],
  latest: [],
};

export async function loadBackendData(
  mode: Mode,
  options: { throwOnError?: boolean } = {},
): Promise<BackendData> {
  try {
    const response = await fetch(`/api/data?mode=${encodeURIComponent(mode)}`);
    if (!response.ok || !isJsonResponse(response)) {
      throw new Error(`Backend data request failed: ${response.status ?? 'unknown'}`);
    }
    const payload = (await response.json()) as Partial<BackendData>;
    return {
      stats: Array.isArray(payload.stats) ? payload.stats : [],
      latest: Array.isArray(payload.latest) ? payload.latest : [],
    };
  } catch (error) {
    if (options.throwOnError) throw error;
    return emptyBackendData;
  }
}

export async function loadPokemonDeclarations(
  pokemonId: number,
  mode: Mode,
): Promise<Declaration[]> {
  try {
    const params = new URLSearchParams({
      mode,
      pokemonId: String(pokemonId),
    });
    const response = await fetch(`/api/declarations?${params.toString()}`);
    if (!response.ok || !isJsonResponse(response)) {
      return [];
    }
    const payload = (await response.json()) as { declarations?: Declaration[] };
    return Array.isArray(payload.declarations) ? payload.declarations : [];
  } catch {
    return [];
  }
}

export async function loadDeclarationDetail(id: string): Promise<DeclarationDetail | null> {
  try {
    const params = new URLSearchParams({ id });
    const response = await fetch(`/api/declarations?${params.toString()}`);
    if (!response.ok || !isJsonResponse(response)) {
      return null;
    }
    const payload = (await response.json()) as Partial<DeclarationDetail>;
    if (!payload.declaration) {
      return null;
    }
    return {
      declaration: payload.declaration,
      fanCount: Number(payload.fanCount ?? 1),
      revealedCount: Number(payload.revealedCount ?? 1),
      rank: typeof payload.rank === 'number' ? payload.rank : null,
      totalDeclarations: Number(payload.totalDeclarations ?? 1),
    };
  } catch {
    return null;
  }
}

export async function createBackendDeclaration(input: DeclarationInput): Promise<DeclarationResult> {
  const response = await fetch('/api/declarations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!isJsonResponse(response)) {
    throw new Error('Database API is unavailable in this local dev server. Use Vercel dev with DATABASE_URL to save declarations.');
  }
  const payload = (await response.json().catch(() => ({}))) as {
    declaration?: Declaration;
    fanCount?: number;
    revealedCount?: number;
    error?: string;
  };
  if (!response.ok || !payload.declaration) {
    throw new Error(payload.error ?? `Declaration request failed: ${response.status}`);
  }
  return {
    declaration: payload.declaration,
    fanCount: Number(payload.fanCount ?? 1),
    revealedCount: Number(payload.revealedCount ?? 1),
  };
}

function isJsonResponse(response: Response): boolean {
  const contentType = response.headers?.get('content-type');
  return !contentType || contentType.includes('application/json');
}
