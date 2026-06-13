import type { LocalDeclarationSummary, Mode } from '../types';

const declaredKey = 'favorite_pokemon_declared_modes_v1';
const declarationSummaryKey = 'favorite_pokemon_declaration_summary_v1';

export function markDeclaredOnDevice(mode: Mode, summary?: LocalDeclarationSummary): void {
  const declaredModes = readJson<Record<Mode, boolean>>(declaredKey, {
    favourite: false,
    not_favourite: false,
  });
  declaredModes[mode] = true;
  localStorage.setItem(declaredKey, JSON.stringify(declaredModes));
  if (summary) {
    const summaries = readJson<Partial<Record<Mode, LocalDeclarationSummary>>>(declarationSummaryKey, {});
    summaries[mode] = summary;
    localStorage.setItem(declarationSummaryKey, JSON.stringify(summaries));
  }
  window.dispatchEvent(new CustomEvent('favorite-pokemon:declarations-changed'));
}

export function hasDeclaredOnDevice(mode: Mode): boolean {
  return Boolean(
    readJson<Record<Mode, boolean>>(declaredKey, {
      favourite: false,
      not_favourite: false,
    })[mode],
  );
}

export function getLocalDeclarationSummary(mode: Mode): LocalDeclarationSummary | null {
  const summaries = readJson<Partial<Record<Mode, LocalDeclarationSummary>>>(declarationSummaryKey, {});
  return summaries[mode] ?? null;
}

export function clearDeclarations(): void {
  localStorage.removeItem(declaredKey);
  localStorage.removeItem(declarationSummaryKey);
  window.dispatchEvent(new CustomEvent('favorite-pokemon:declarations-changed'));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
