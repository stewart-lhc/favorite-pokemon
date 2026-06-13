import type { BackendData, Declaration, DeclarationInput, DeclarationResult, Mode } from '../types';

export async function loadBackendData(mode: Mode): Promise<BackendData> {
  const response = await fetch(`/api/data?mode=${encodeURIComponent(mode)}`);
  if (!response.ok) {
    throw new Error(`Database request failed: ${response.status}`);
  }
  return (await response.json()) as BackendData;
}

export async function loadPokemonDeclarations(
  pokemonId: number,
  mode: Mode,
): Promise<Declaration[]> {
  const params = new URLSearchParams({
    mode,
    pokemonId: String(pokemonId),
  });
  const response = await fetch(`/api/declarations?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Declaration request failed: ${response.status}`);
  }
  const payload = (await response.json()) as { declarations: Declaration[] };
  return payload.declarations;
}

export async function createBackendDeclaration(input: DeclarationInput): Promise<DeclarationResult> {
  const response = await fetch('/api/declarations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
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
