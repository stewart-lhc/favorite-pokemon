import type { Declaration, DeclarationInput, Mode } from '../types';

const declarationsKey = 'favorite_pokemon_declarations_v1';
const declaredKey = 'favorite_pokemon_declared_modes_v1';

export function getDeclarations(mode?: Mode): Declaration[] {
  const declarations = readJson<Declaration[]>(declarationsKey, []);
  return mode ? declarations.filter((item) => item.mode === mode) : declarations;
}

export function saveDeclaration(input: DeclarationInput): Declaration {
  const declaration: Declaration = {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
  const declarations = [declaration, ...getDeclarations()].slice(0, 200);
  localStorage.setItem(declarationsKey, JSON.stringify(declarations));

  const declaredModes = readJson<Record<Mode, boolean>>(declaredKey, {
    favourite: false,
    not_favourite: false,
  });
  declaredModes[input.mode] = true;
  localStorage.setItem(declaredKey, JSON.stringify(declaredModes));
  window.dispatchEvent(new CustomEvent('favorite-pokemon:declarations-changed'));
  return declaration;
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
  localStorage.removeItem(declarationsKey);
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

function createId(): string {
  if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
