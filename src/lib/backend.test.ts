import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBackendDeclaration, loadBackendData, loadDeclarationDetail, loadPokemonDeclarations } from './backend';

describe('backend API client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads real stats and latest declarations from our API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        stats: [{ pokemonId: 25, pokemonName: 'Pikachu', fanCount: 7 }],
        latest: [
          {
            id: 'declaration-1',
            trainerName: 'Mixel',
            pokemonId: 25,
            pokemonName: 'Pikachu',
            reason: 'Real declaration from the database',
            mode: 'favourite',
            createdAt: '2026-06-13T10:00:00.000Z',
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadBackendData('favourite')).resolves.toEqual({
      stats: [{ pokemonId: 25, pokemonName: 'Pikachu', fanCount: 7 }],
      latest: [
        expect.objectContaining({
          id: 'declaration-1',
          trainerName: 'Mixel',
          pokemonId: 25,
        }),
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/data?mode=favourite');
  });

  it('uses empty data when the local dev server returns a non-json API response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/javascript' }),
      json: async () => {
        throw new SyntaxError('Unexpected token import');
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadBackendData('favourite')).resolves.toEqual({
      stats: [],
      latest: [],
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/data?mode=favourite');
  });

  it('posts declarations to our API before marking them local', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        declaration: {
          id: 'server-id',
          trainerName: 'Ari',
          pokemonId: 778,
          pokemonName: 'Mimikyu',
          reason: 'This came from Neon',
          mode: 'favourite',
          createdAt: '2026-06-13T10:00:00.000Z',
        },
        fanCount: 1,
        revealedCount: 42,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createBackendDeclaration({
      trainerName: 'Ari',
      pokemonId: 778,
      pokemonName: 'Mimikyu',
      reason: 'This came from Neon',
      mode: 'favourite',
      website: '',
    });

    expect(result.declaration.id).toBe('server-id');
    expect(result.fanCount).toBe(1);
    expect(result.revealedCount).toBe(42);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/declarations',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody).toMatchObject({ website: '' });
  });

  it('loads modal declarations by pokemon and mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ declarations: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadPokemonDeclarations(778, 'not_favourite')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith('/api/declarations?mode=not_favourite&pokemonId=778');
  });

  it('loads a shareable declaration detail by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        declaration: {
          id: 'declaration-1',
          trainerName: 'Mixel',
          pokemonId: 25,
          pokemonName: 'Pikachu',
          reason: 'Real declaration from the database',
          mode: 'favourite',
          createdAt: '2026-06-13T10:00:00.000Z',
        },
        fanCount: 7,
        revealedCount: 42,
        rank: 3,
        totalDeclarations: 120,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadDeclarationDetail('declaration-1')).resolves.toEqual({
      declaration: expect.objectContaining({
        id: 'declaration-1',
        trainerName: 'Mixel',
        pokemonId: 25,
      }),
      fanCount: 7,
      revealedCount: 42,
      rank: 3,
      totalDeclarations: 120,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/declarations?id=declaration-1');
  });
});
