import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sharedMocks = vi.hoisted(() => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL ??= 'postgresql://favmon:test@localhost/favmon_test';

  return {
    originalDatabaseUrl,
    sql: vi.fn(),
  };
});

vi.mock('../../api/_shared.js', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../api/_shared.js')>(),
  sql: sharedMocks.sql,
}));

import handler from '../../api/declarations';

const validBody = {
  trainerName: 'Ari',
  pokemonId: 778,
  pokemonName: 'Mimikyu',
  reason: 'This disguise deserves every bit of love.',
  mode: 'favourite',
  website: '',
};

function createResponse() {
  const headers = new Map<string, string>();
  const response = {
    status: vi.fn(() => response),
    json: vi.fn(),
    setHeader: vi.fn((name: string, value: string) => headers.set(name, value)),
  };
  return { response, headers };
}

function createPostRequest(body: Record<string, unknown>) {
  return {
    method: 'POST',
    query: {},
    body,
    headers: {
      'x-vercel-forwarded-for': '203.0.113.42',
      'user-agent': 'Favmon test browser',
    },
  };
}

function rateLimitResult(clientAttempts: number, networkAttempts = clientAttempts) {
  return (_strings: TemplateStringsArray, clientKey: string, networkKey: string) => Promise.resolve([
    { key_hash: clientKey, attempt_count: clientAttempts, retry_after_seconds: 600 },
    { key_hash: networkKey, attempt_count: networkAttempts, retry_after_seconds: 600 },
  ]);
}

describe('declaration submission safety', () => {
  afterAll(() => {
    if (sharedMocks.originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
      return;
    }

    process.env.DATABASE_URL = sharedMocks.originalDatabaseUrl;
  });

  beforeEach(() => {
    sharedMocks.sql.mockReset();
  });

  it('rejects a filled honeypot before writing a declaration', async () => {
    sharedMocks.sql.mockImplementationOnce(rateLimitResult(1));
    const { response } = createResponse();

    await handler(createPostRequest({ ...validBody, website: 'https://spam.example' }), response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({ error: 'Unable to submit declaration.' });
    expect(sharedMocks.sql).toHaveBeenCalledTimes(1);
  });

  it('returns 429 and Retry-After after five attempts in ten minutes', async () => {
    sharedMocks.sql.mockImplementationOnce(rateLimitResult(6));
    const { response, headers } = createResponse();

    await handler(createPostRequest(validBody), response);

    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Too many declaration attempts. Please try again later.',
    });
    expect(headers.get('Retry-After')).toBe('600');
    expect(sharedMocks.sql).toHaveBeenCalledTimes(1);
  });

  it('returns 429 when the wider network bucket exceeds fifty attempts', async () => {
    sharedMocks.sql.mockImplementationOnce(rateLimitResult(1, 51));
    const { response } = createResponse();

    await handler(createPostRequest(validBody), response);

    expect(response.status).toHaveBeenCalledWith(429);
    expect(sharedMocks.sql).toHaveBeenCalledTimes(1);
  });

  it('rate-limits with a hashed client key and preserves the normal insert path', async () => {
    sharedMocks.sql
      .mockImplementationOnce(rateLimitResult(5, 50))
      .mockResolvedValueOnce([{
        id: 'declaration-1',
        trainer_name: 'Ari',
        pokemon_id: 778,
        pokemon_name: 'Mimikyu',
        reason: 'This disguise deserves every bit of love.',
        type: 'favourite',
        created_at: '2026-07-15T01:00:00.000Z',
      }])
      .mockResolvedValueOnce([{ fan_count: 3, revealed_count: 42 }]);
    const { response } = createResponse();

    await handler(createPostRequest(validBody), response);

    const rateLimitKey = sharedMocks.sql.mock.calls[0][1];
    const networkRateLimitKey = sharedMocks.sql.mock.calls[0][2];
    expect(rateLimitKey).toMatch(/^[a-f0-9]{64}$/);
    expect(networkRateLimitKey).toMatch(/^[a-f0-9]{64}$/);
    expect(rateLimitKey).not.toBe(networkRateLimitKey);
    expect(rateLimitKey).not.toContain('203.0.113.42');
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      declaration: expect.objectContaining({ id: 'declaration-1', pokemonId: 778 }),
      fanCount: 3,
      revealedCount: 42,
    }));
    expect(response.json.mock.calls[0][0].declaration).not.toHaveProperty('website');
    expect(sharedMocks.sql).toHaveBeenCalledTimes(3);
  });
});
