import type { Mode } from '../types';

const declaredKey = 'favorite_pokemon_declared_modes_v1';

export function markDeclaredOnDevice(mode: Mode): void {
  const declaredModes = readJson<Record<Mode, boolean>>(declaredKey, {
    favourite: false,
    not_favourite: false,
  });
  declaredModes[mode] = true;
  localStorage.setItem(declaredKey, JSON.stringify(declaredModes));
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

export function clearDeclarations(): void {
  localStorage.removeItem(declaredKey);
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
