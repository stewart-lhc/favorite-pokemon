import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const pokemonData = [
  {
    id: 1,
    slug: 'bulbasaur',
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    sprite: '/pokemon/sprites/1.png',
    artwork: '/pokemon/artwork/1.webp',
  },
  {
    id: 4,
    slug: 'charmander',
    name: 'charmander',
    types: ['fire'],
    sprite: '/pokemon/sprites/4.png',
    artwork: '/pokemon/artwork/4.webp',
  },
  {
    id: 25,
    slug: 'pikachu',
    name: 'pikachu',
    types: ['electric'],
    sprite: '/pokemon/sprites/25.png',
    artwork: '/pokemon/artwork/25.webp',
  },
  {
    id: 129,
    slug: 'magikarp',
    name: 'magikarp',
    types: ['water'],
    sprite: '/pokemon/sprites/129.png',
    artwork: '/pokemon/artwork/129.webp',
  },
];

const backendData = {
  stats: [{ pokemonId: 25, pokemonName: 'Pikachu', fanCount: 12 }],
  latest: [
    {
      id: 'latest-1',
      trainerName: 'Mixel',
      pokemonId: 25,
      pokemonName: 'Pikachu',
      reason: 'This is a real database declaration',
      mode: 'favourite',
      createdAt: '2026-06-13T10:00:00.000Z',
    },
  ],
};

const statsGrowthBackendData = {
  stats: [
    { pokemonId: 1, pokemonName: 'Bulbasaur', fanCount: 3 },
    { pokemonId: 4, pokemonName: 'Charmander', fanCount: 7 },
    { pokemonId: 25, pokemonName: 'Pikachu', fanCount: 12 },
    { pokemonId: 129, pokemonName: 'Magikarp', fanCount: 0 },
  ],
  latest: backendData.latest,
};

function stubDefaultFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => backendData,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => pokemonData,
      });
    }),
  );
}

function stubStatsGrowthFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => statsGrowthBackendData,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => pokemonData,
      });
    }),
  );
}

function pageViewParameters(gtag: ReturnType<typeof vi.fn>) {
  return gtag.mock.calls
    .filter(([command, eventName]) => command === 'event' && eventName === 'page_view')
    .map(([, , parameters]) => parameters as Record<string, unknown>);
}

function eventParameters(gtag: ReturnType<typeof vi.fn>, eventName: string) {
  return gtag.mock.calls
    .filter(([command, name]) => command === 'event' && name === eventName)
    .map(([, , parameters]) => parameters as Record<string, unknown>);
}

function stubDeclarationFetch({ succeeds = true }: { succeeds?: boolean } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/declarations') {
        if (!succeeds) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Declaration was not saved' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            declaration: {
              id: 'posted-1',
              trainerName: 'Ari',
              pokemonId: 25,
              pokemonName: 'pikachu',
              reason: 'Pikachu has been my favourite forever',
              mode: 'favourite',
              createdAt: '2026-06-13T10:00:00.000Z',
            },
            fanCount: 13,
            revealedCount: 7,
          }),
        });
      }
      if (url.startsWith('/api/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: [], latest: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => pokemonData,
      });
    }),
  );
}

async function submitPikachuDeclaration(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('heading', { name: /Every Pokémon is/i });
  await user.type(screen.getByPlaceholderText('Trainer'), 'Ari');
  await user.type(screen.getByLabelText('Favourite Pokémon'), 'pika');
  await user.click(await screen.findByRole('button', { name: /Pikachu.*#025/i }));
  await user.type(screen.getByPlaceholderText('This is where hearts are won.'), 'Pikachu has been my favourite forever');
  await user.click(screen.getByRole('button', { name: 'Declare favourite' }));
}

function stubDeclarationDetailFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/declarations?id=posted-1') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            declaration: {
              id: 'posted-1',
              trainerName: 'Ari',
              pokemonId: 25,
              pokemonName: 'pikachu',
              reason: 'Pikachu has been my favourite forever',
              mode: 'favourite',
              createdAt: '2026-06-13T10:00:00.000Z',
            },
            fanCount: 13,
            revealedCount: 7,
            rank: 2,
            totalDeclarations: 22,
          }),
        });
      }
      if (url.startsWith('/api/data')) {
        return Promise.resolve({
          ok: true,
          json: async () => backendData,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => pokemonData,
      });
    }),
  );
}

function installCardCanvasMocks() {
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy<Record<string, unknown>>({
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    measureText: vi.fn(() => ({ width: 100 })),
  }, {
    get(target, property) {
      if (property in target) return target[property as string];
      const method = vi.fn();
      target[property as string] = method;
      return method;
    },
    set(target, property, value) {
      target[property as string] = value;
      return true;
    },
  });

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,favmon');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
    callback(new Blob(['favmon'], { type: 'image/png' }));
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  class LoadedImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = '';

    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }

  vi.stubGlobal('Image', LoadedImage);
}

async function renderDeclarationSharePage(gtag: ReturnType<typeof vi.fn>) {
  window.history.replaceState({}, '', '/declaration/posted-1');
  stubDeclarationDetailFetch();
  installCardCanvasMocks();
  window.gtag = gtag as NonNullable<typeof window.gtag>;
  render(<App />);
  await screen.findByRole('heading', { name: /Ari chose Pikachu/i });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Share card' })).toBeEnabled());
}

describe('Favorite Pokemon clone', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    localStorage.clear();
    vi.restoreAllMocks();
    delete window.gtag;
    delete window.Tally;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    delete window.gtag;
    delete window.Tally;
    Reflect.deleteProperty(document, 'referrer');
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('renders the declaration landing page and navigates to core sections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Every Pokémon is/i })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Picker' }));
    expect(await screen.findByRole('heading', { name: /Build your favorite Pokémon board/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Pokédex' }));
    expect(await screen.findByRole('heading', { name: /Pokémon discovered/i })).toBeInTheDocument();
    expect(screen.getByText(/Showing 4 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Stats' }));
    expect(screen.getByRole('heading', { name: /community favorite Pokémon ranking/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Game' }));
    expect(await screen.findByRole('heading', { name: /Who's More Loved/i })).toBeInTheDocument();
  });

  it('renders transparent community Stats rankings with positive-vote canonical links only', async () => {
    window.history.replaceState({}, '', '/stats');
    stubStatsGrowthFetch();

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Favmon community favorite Pokémon ranking', level: 1 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Favorite mode counts declarations for the Pokémon trainers chose as favorites.')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'About this community sample' })).toBeInTheDocument();
    expect(await screen.findByText(/22 declarations across 3 Pokémon with at least one declaration/i)).toBeInTheDocument();
    expect(await screen.findByText(/rankings use community submissions made on Favmon/i)).toBeInTheDocument();
    expect(screen.queryByText(/Neon|Postgres/i)).not.toBeInTheDocument();
    expect(screen.getByText(/PokéAPI provides the National Pokédex base data/i)).toBeInTheDocument();
    expect(await screen.findByText(/Use Refresh to reload the latest community totals and ranking/i)).toBeInTheDocument();

    const topTenSection = screen.getByRole('heading', { name: 'Top 10 most chosen' }).closest('section');
    expect(topTenSection).not.toBeNull();
    expect(within(topTenSection!).getByRole('link', { name: 'Pikachu' })).toHaveAttribute('href', '/pokemon/pikachu');
    expect(within(topTenSection!).getByRole('link', { name: 'Charmander' })).toHaveAttribute('href', '/pokemon/charmander');
    expect(within(topTenSection!).getByRole('link', { name: 'Bulbasaur' })).toHaveAttribute('href', '/pokemon/bulbasaur');
    expect(topTenSection!).not.toHaveTextContent('Magikarp');
    expect(screen.getAllByRole('link', { name: 'Pikachu' }).every((link) => link.getAttribute('href') === '/pokemon/pikachu')).toBe(true);

    const rankingSection = screen.getByRole('heading', { name: 'Full ranking' }).closest('section');
    expect(rankingSection).not.toBeNull();
    expect(rankingSection!).not.toHaveTextContent('Magikarp');
    expect(within(rankingSection!).getByRole('link', { name: 'Bulbasaur' })).toHaveAttribute('href', '/pokemon/bulbasaur');

    const latestSection = screen.getByRole('heading', { name: 'Latest 10 declarations' }).closest('section');
    expect(latestSection).not.toBeNull();
    expect(within(latestSection!).getByRole('link', { name: 'Pikachu' })).toHaveAttribute('href', '/pokemon/pikachu');
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://favmon.com/stats');
  });

  it('labels the Stats community sample for least-favorite mode', async () => {
    window.history.replaceState({}, '', '/stats');
    localStorage.setItem('favorite_pokemon_mode', 'not_favourite');
    stubStatsGrowthFetch();

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Favmon community least-favorite Pokémon ranking', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Least-favorite mode counts declarations for the Pokémon trainers chose as least favorites.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/global|worldwide/i)).not.toBeInTheDocument();
  });

  it('reloads the current Stats mode, keeps existing data while pending, and applies the refreshed response', async () => {
    window.history.replaceState({}, '', '/stats');
    let backendRequestCount = 0;
    let resolveRefresh!: (response: { ok: boolean; json: () => Promise<typeof statsGrowthBackendData> }) => void;
    const pendingRefresh = new Promise<{ ok: boolean; json: () => Promise<typeof statsGrowthBackendData> }>((resolve) => {
      resolveRefresh = resolve;
    });
    const refreshedBackendData = {
      stats: [
        { pokemonId: 1, pokemonName: 'Bulbasaur', fanCount: 3 },
        { pokemonId: 4, pokemonName: 'Charmander', fanCount: 7 },
        { pokemonId: 25, pokemonName: 'Pikachu', fanCount: 15 },
      ],
      latest: [{ ...backendData.latest[0], pokemonId: 4, pokemonName: 'Charmander', reason: 'Refreshed declaration' }],
    };
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/data?mode=favourite') {
        backendRequestCount += 1;
        if (backendRequestCount === 1) {
          return Promise.resolve({ ok: true, json: async () => statsGrowthBackendData });
        }
        return pendingRefresh;
      }
      return Promise.resolve({ ok: true, json: async () => pokemonData });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText(/22 declarations across 3 Pokémon/i)).toBeInTheDocument();
    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    await waitFor(() => expect(refreshButton).toBeEnabled());
    await user.click(refreshButton);
    expect(fetchMock).toHaveBeenCalledWith('/api/data?mode=favourite');
    expect(fetchMock.mock.calls.filter(([input]) => String(input) === '/api/data?mode=favourite')).toHaveLength(2);
    expect(screen.getByText(/22 declarations across 3 Pokémon/i)).toBeInTheDocument();
    expect(refreshButton).toBeDisabled();

    resolveRefresh({ ok: true, json: async () => refreshedBackendData });

    expect(await screen.findByText(/25 declarations across 3 Pokémon/i)).toBeInTheDocument();
    expect(await screen.findByText('Refreshed declaration')).toBeInTheDocument();
    await waitFor(() => expect(refreshButton).toBeEnabled());
  });

  it('preserves the visible Stats data and releases Refresh after a reload failure', async () => {
    window.history.replaceState({}, '', '/stats');
    let backendRequestCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/data?mode=favourite') {
          backendRequestCount += 1;
          return Promise.resolve(backendRequestCount === 1
            ? { ok: true, json: async () => statsGrowthBackendData }
            : { ok: false, status: 503, json: async () => ({}) });
        }
        return Promise.resolve({ ok: true, json: async () => pokemonData });
      }),
    );
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText(/22 declarations across 3 Pokémon/i)).toBeInTheDocument();
    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    await waitFor(() => expect(refreshButton).toBeEnabled());
    await user.click(refreshButton);

    await waitFor(() => expect(backendRequestCount).toBe(2));
    await waitFor(() => expect(refreshButton).toBeEnabled());
    expect(screen.getByText(/22 declarations across 3 Pokémon/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Pikachu' }).length).toBeGreaterThan(0);
  });

  it('ignores a stale favorite Refresh response after least-favorite mode data wins', async () => {
    window.history.replaceState({}, '', '/stats');
    let favoriteRequestCount = 0;
    let resolveFavoriteRefresh!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    let resolveLeastLoad!: (response: { ok: boolean; json: () => Promise<unknown> }) => void;
    const favoriteRefresh = new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve) => {
      resolveFavoriteRefresh = resolve;
    });
    const leastLoad = new Promise<{ ok: boolean; json: () => Promise<unknown> }>((resolve) => {
      resolveLeastLoad = resolve;
    });
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/data?mode=favourite') {
        favoriteRequestCount += 1;
        return favoriteRequestCount === 1
          ? Promise.resolve({ ok: true, json: async () => statsGrowthBackendData })
          : favoriteRefresh;
      }
      if (url === '/api/data?mode=not_favourite') return leastLoad;
      return Promise.resolve({ ok: true, json: async () => pokemonData });
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText(/22 declarations across 3 Pokémon/i)).toBeInTheDocument();
    const refreshButton = screen.getByRole('button', { name: 'Refresh' });
    await waitFor(() => expect(refreshButton).toBeEnabled());
    await user.click(refreshButton);
    await waitFor(() => expect(favoriteRequestCount).toBe(2));
    await user.click(screen.getByRole('button', { name: 'Favourite' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/data?mode=not_favourite'));

    await act(async () => {
      resolveLeastLoad({
        ok: true,
        json: async () => ({
          stats: [{ pokemonId: 129, pokemonName: 'Magikarp', fanCount: 9 }],
          latest: [{ ...backendData.latest[0], pokemonId: 129, pokemonName: 'Magikarp', reason: 'Least-mode winner' }],
        }),
      });
    });
    expect(await screen.findByText(/9 declarations across 1 Pokémon/i)).toBeInTheDocument();
    expect(await screen.findByText('Least-mode winner')).toBeInTheDocument();

    await act(async () => {
      resolveFavoriteRefresh({
        ok: true,
        json: async () => ({
          stats: [{ pokemonId: 25, pokemonName: 'Pikachu', fanCount: 99 }],
          latest: [{ ...backendData.latest[0], reason: 'Stale favorite response' }],
        }),
      });
    });

    await waitFor(() => expect(screen.getByText(/9 declarations across 1 Pokémon/i)).toBeInTheDocument());
    expect(screen.queryByText(/99 declarations across/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Stale favorite response')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Favmon community least-favorite Pokémon ranking' })).toBeInTheDocument();
  });

  it('clears favorite rankings when the next least-favorite mode load fails', async () => {
    window.history.replaceState({}, '', '/stats');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/data?mode=favourite') {
          return Promise.resolve({ ok: true, json: async () => statsGrowthBackendData });
        }
        if (url === '/api/data?mode=not_favourite') {
          return Promise.resolve({ ok: false, status: 503, json: async () => ({}) });
        }
        return Promise.resolve({ ok: true, json: async () => pokemonData });
      }),
    );
    const user = userEvent.setup();

    render(<App />);

    expect(await screen.findByText(/22 declarations across 3 Pokémon/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Pikachu' }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Favourite' }));

    expect(await screen.findByRole('heading', { name: 'Favmon community least-favorite Pokémon ranking' })).toBeInTheDocument();
    expect(await screen.findByText(/0 declarations across 0 Pokémon/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
    expect(screen.queryByRole('link', { name: 'Pikachu' })).not.toBeInTheDocument();
    expect(screen.queryByText('This is a real database declaration')).not.toBeInTheDocument();
    expect(screen.getAllByText('No Pokémon has a declaration in this mode yet.').length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    ['favourite'],
    ['not_favourite'],
  ])('shows a localized empty state instead of an empty Full Ranking table in %s mode', async (mode) => {
    window.history.replaceState({}, '', '/stats');
    localStorage.setItem('favorite_pokemon_mode', mode);
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => Promise.resolve({
        ok: true,
        json: async () => String(input).startsWith('/api/data')
          ? {
              stats: pokemonData.map((row) => ({ pokemonId: row.id, pokemonName: row.name, fanCount: 0 })),
              latest: [],
            }
          : pokemonData,
      })),
    );

    render(<App />);

    await screen.findByText(/0 declarations across 0 Pokémon/i);
    const rankingSection = await screen.findByRole('heading', { name: 'Full ranking' }).then((heading) => heading.closest('section'));
    expect(rankingSection).not.toBeNull();
    expect(within(rankingSection!).getByText('No Pokémon has a declaration in this mode yet.')).toBeInTheDocument();
    expect(within(rankingSection!).queryByRole('table')).not.toBeInTheDocument();
  });

  it('links the home latest declaration Pokémon to its canonical detail route', async () => {
    stubDefaultFetch();

    render(<App />);

    await screen.findByRole('heading', { name: /Every Pokémon is/i });
    const latestDeclarations = screen.getByRole('region', { name: 'Latest 10 declarations' });
    expect(await within(latestDeclarations).findByRole('link', { name: 'Pikachu' })).toHaveAttribute(
      'href',
      '/pokemon/pikachu',
    );
  });

  it('links Explore declaration Pokémon to its localized canonical detail route', async () => {
    window.history.replaceState({}, '', '/zh-cn/explore');
    stubDefaultFetch();

    render(<App />);

    const exploreFeed = await screen.findByLabelText('浏览宣言');
    expect(await within(exploreFeed).findByRole('link', { name: 'Pikachu' })).toHaveAttribute(
      'href',
      '/zh-cn/pokemon/pikachu',
    );
  });

  it('keeps a global feedback entry after main content on Game and Explore with sanitized route context', async () => {
    vi.stubEnv('VITE_TALLY_FEEDBACK_FORM_ID', 'Y5yydd');
    window.history.replaceState({}, '', '/game?utm_source=reddit&utm_source=ignored#round');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://www.google.com/search?q=favmon&utm_source=private',
    });
    stubDefaultFetch();
    const openPopup = vi.fn();
    window.Tally = { openPopup };
    const user = userEvent.setup();

    render(<App />);

    const gameFeedback = await screen.findByRole('button', { name: 'Feedback' });
    const main = screen.getByRole('main');
    expect(main.compareDocumentPosition(gameFeedback) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(gameFeedback);
    expect(openPopup).toHaveBeenCalledWith('Y5yydd', expect.objectContaining({
      hiddenFields: {
        page: '/game',
        route_type: 'game',
        language: 'en',
        mode: 'favourite',
        referrer: 'https://www.google.com',
        utm_source: 'reddit',
      },
    }));

    await user.click(screen.getByRole('link', { name: 'Explore' }));
    await waitFor(() => expect(window.location.pathname).toBe('/explore'));
    expect(screen.getByRole('button', { name: 'Feedback' })).toBeInTheDocument();
  });

  it('adds a contextual feedback CTA after declaration success with the canonical Pokemon slug', async () => {
    vi.stubEnv('VITE_TALLY_FEEDBACK_FORM_ID', 'Y5yydd');
    stubDeclarationFetch();
    const openPopup = vi.fn();
    window.Tally = { openPopup };
    const user = userEvent.setup();
    render(<App />);

    await submitPikachuDeclaration(user);
    await screen.findByRole('heading', { name: 'Declaration saved. That Pokémon has someone now.' });
    await user.click(screen.getByRole('button', { name: 'Share feedback' }));

    expect(openPopup).toHaveBeenCalledWith('Y5yydd', expect.objectContaining({
      hiddenFields: {
        page: '/',
        route_type: 'home',
        pokemon_slug: 'pikachu',
        language: 'en',
        mode: 'favourite',
      },
    }));
  });

  it('tracks one initial page view and one page view for a canonical SPA navigation', async () => {
    stubDefaultFetch();
    const gtag = vi.fn();
    window.gtag = gtag;

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Every Pokémon is/i })).toBeInTheDocument();
    await waitFor(() => expect(pageViewParameters(gtag)).toHaveLength(1));
    expect(pageViewParameters(gtag)[0]).toEqual({
      page_location: `${window.location.origin}/`,
      page_path: '/',
      page_title: document.title,
      language: 'en',
      route_type: 'home',
    });

    await user.click(screen.getByRole('link', { name: 'Stats' }));
    expect(screen.getByRole('heading', { name: /community favorite Pokémon ranking/i })).toBeInTheDocument();

    await waitFor(() => expect(pageViewParameters(gtag)).toHaveLength(2));
    expect(pageViewParameters(gtag)[1]).toEqual({
      page_location: `${window.location.origin}/stats`,
      page_path: '/stats',
      page_title: document.title,
      language: 'en',
      route_type: 'stats',
    });
  });

  it('deduplicates the StrictMode initial effect replay without suppressing a later return navigation', async () => {
    stubDefaultFetch();
    const gtag = vi.fn();
    window.gtag = gtag;

    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(await screen.findByRole('heading', { name: /Every Pokémon is/i })).toBeInTheDocument();
    expect(pageViewParameters(gtag)).toHaveLength(1);

    await user.click(screen.getByRole('link', { name: 'Stats' }));
    await waitFor(() => expect(pageViewParameters(gtag)).toHaveLength(2));

    await user.click(screen.getByRole('link', { name: 'Declare' }));
    await waitFor(() => expect(pageViewParameters(gtag)).toHaveLength(3));
    expect(pageViewParameters(gtag).map(({ page_path: pagePath }) => pagePath)).toEqual([
      '/',
      '/stats',
      '/',
    ]);
  });

  it.each([
    ['/zh-cn/pokemon/pikachu', 'zh-CN', 'pokemon_detail'],
    ['/declaration/latest-1', 'en', 'declaration_detail'],
  ])('uses a stable route type for the detail route %s', async (path, expectedLanguage, expectedRouteType) => {
    window.history.replaceState({}, '', path);
    stubDefaultFetch();
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);

    await waitFor(() => expect(pageViewParameters(gtag)).toHaveLength(1));
    expect(pageViewParameters(gtag)[0]).toEqual({
      page_location: `${window.location.origin}${path}`,
      page_path: path,
      page_title: document.title,
      language: expectedLanguage,
      route_type: expectedRouteType,
    });
    expect(pageViewParameters(gtag)[0]).not.toHaveProperty('pokemon_id');
    expect(pageViewParameters(gtag)[0]).not.toHaveProperty('pokemon_slug');
    expect(pageViewParameters(gtag)[0]).not.toHaveProperty('declaration_id');
  });

  it('removes a Picker board and hash from page-view URLs while preserving safe query parameters', async () => {
    window.history.replaceState(
      {},
      '',
      '/picker?board=%7B%22generation-gen1%22%3A25%7D&utm_source=reddit#shared-board',
    );
    stubDefaultFetch();
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);

    await waitFor(() => expect(pageViewParameters(gtag)).toHaveLength(1));
    expect(pageViewParameters(gtag)[0]).toMatchObject({
      page_location: `${window.location.origin}/picker?utm_source=reddit`,
      page_path: '/picker?utm_source=reddit',
      route_type: 'picker',
    });
  });

  it('keeps the home showcase unselected until the trainer chooses a Pokemon', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Every Pokémon is/i })).toBeInTheDocument();
    expect(screen.getByText('#???')).toBeInTheDocument();
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Declare favourite' })).toBeDisabled();
    expect(screen.queryByLabelText('Charizard')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Favourite Pokémon'), 'pika');
    await user.click(await screen.findByRole('button', { name: /Pikachu/i }));

    expect(screen.getByRole('button', { name: /Pikachu.*#025/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Pikachu')).toBeInTheDocument();
  });

  it('preselects a Pokemon on the declaration form from the URL query', async () => {
    window.history.replaceState({}, '', '/?pokemon=pikachu');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Every Pokémon is/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Pikachu.*#025/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Pikachu')).toBeInTheDocument();
  });

  it('renders a Pokemon detail route with stats and declarations', async () => {
    window.history.replaceState({}, '', '/pokemon/pikachu');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/declarations?mode=favourite&pokemonId=25') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              declarations: backendData.latest,
            }),
          });
        }
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Pikachu', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('#025')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(await screen.findByText('This is a real database declaration')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Declare' }).some((link) =>
        link.getAttribute('href') === '/?pokemon=pikachu#trainer-terminal',
      ),
    ).toBe(true);
  });

  it('canonicalizes numeric Pokemon detail aliases to the slug URL', async () => {
    window.history.replaceState({}, '', '/pokemon/25');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/declarations?mode=favourite&pokemonId=25') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              declarations: backendData.latest,
            }),
          });
        }
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Pikachu', level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
        'https://favmon.com/pokemon/pikachu',
      );
    });
    expect(document.querySelectorAll('link[rel="alternate"][hreflang]').length).toBe(0);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://favmon.com/pokemon/artwork/25.webp',
    );
  });

  it('links from a Pokedex modal to the Pokemon detail page', async () => {
    window.history.replaceState({}, '', '/pokedex');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Pokémon discovered/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Pikachu/i }));

    expect(screen.getByRole('link', { name: /View Pikachu/i })).toHaveAttribute('href', '/pokemon/pikachu');
  });

  it('renders localized copy from a zh-cn URL prefix', async () => {
    window.history.replaceState({}, '', '/zh-cn/pokedex');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    render(<App />);

    expect(await screen.findByRole('heading', { name: /大家选出的最喜欢宝可梦/i })).toBeInTheDocument();
    expect(screen.getByLabelText('搜索图鉴')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '人气优先' })).toBeInTheDocument();
  });

  it('closes the language menu after selecting a locale', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: /Every Pokémon is/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Language' }));
    expect(screen.getByRole('listbox', { name: 'Language' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /Français/i }));

    expect(window.location.pathname).toBe('/fr');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Langue' })).toHaveTextContent('FR');
  });

  it('builds a picker board and restores it from an exported code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });

    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /Every Pokémon is/i });
    await user.click(screen.getByRole('link', { name: 'Picker' }));

    expect(await screen.findByRole('heading', { name: 'How to use it' })).toBeInTheDocument();
    expect(screen.getByText('Click a slot')).toBeInTheDocument();
    expect(screen.getByText(/Use search and filters in the popup/i)).toBeInTheDocument();
    expect(screen.getByText('Share or copy')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Share board' })).toHaveLength(2);
    screen.getAllByRole('button', { name: 'Share board' }).forEach((button) => expect(button).toBeDisabled());

    const genOneSlot = await screen.findByRole('button', { name: 'Choose Gen I' });
    await user.click(genOneSlot);
    await user.click(await screen.findByRole('button', { name: /Pikachu.*#025/i }));

    expect(screen.getByRole('button', { name: 'Choose Gen I' })).toHaveTextContent('Pikachu');
    screen.getAllByRole('button', { name: 'Share board' }).forEach((button) => expect(button).toBeEnabled());

    await user.click(screen.getAllByRole('button', { name: 'Copy code' })[0]);
    const codeBox = screen.getByPlaceholderText('Paste a Favmon picker code here') as HTMLTextAreaElement;
    await waitFor(() => expect(codeBox.value).toContain('"generation-gen1": 25'));
    const exportedCode = codeBox.value;

    await user.click(screen.getByRole('button', { name: 'Reset board' }));
    expect(screen.getByRole('button', { name: 'Choose Gen I' })).not.toHaveTextContent('Pikachu');
    screen.getAllByRole('button', { name: 'Share board' }).forEach((button) => expect(button).toBeDisabled());

    fireEvent.change(codeBox, { target: { value: exportedCode } });
    await user.click(screen.getByRole('button', { name: 'Import code' }));

    expect(screen.getByRole('button', { name: 'Choose Gen I' })).toHaveTextContent('Pikachu');
    screen.getAllByRole('button', { name: 'Share board' }).forEach((button) => expect(button).toBeEnabled());

    await user.click(screen.getAllByRole('button', { name: 'Share board' })[0]);
    await waitFor(() => expect(codeBox.value).toContain('/picker?board='));
    const sharedUrl = codeBox.value;
    expect(sharedUrl).toContain('/picker?board=');

    cleanup();
    localStorage.clear();
    const openedUrl = new URL(sharedUrl);
    window.history.replaceState({}, '', `${openedUrl.pathname}${openedUrl.search}`);
    render(<App />);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose Gen I' })).toHaveTextContent('Pikachu'));
  }, 30_000);

  it('tracks successful Picker code and link clipboard exports without leaking the board', async () => {
    window.history.replaceState({}, '', '/picker');
    localStorage.setItem('favmon_picker_board_v1', JSON.stringify({
      version: 1,
      picks: { 'generation-gen1': 25, 'team-1': 4 },
      shiny: true,
    }));
    stubDefaultFetch();
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);
    expect(await screen.findByRole('heading', { name: /Build your favorite Pokémon board/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose Gen I' })).toHaveTextContent('Pikachu'));

    await user.click(screen.getAllByRole('button', { name: 'Copy code' })[0]);
    await waitFor(() => expect(eventParameters(gtag, 'picker_export')).toHaveLength(1));
    expect(eventParameters(gtag, 'picker_export')[0]).toEqual({
      language: 'en',
      export_method: 'clipboard_code',
      filled_slots: 2,
      team_filled: 1,
      shiny: true,
    });

    await user.click(screen.getAllByRole('button', { name: 'Share board' })[0]);
    await waitFor(() => expect(eventParameters(gtag, 'picker_export')).toHaveLength(2));
    expect(eventParameters(gtag, 'picker_export')[1]).toEqual({
      language: 'en',
      export_method: 'clipboard_link',
      filled_slots: 2,
      team_filled: 1,
      shiny: true,
    });

    const serializedEvents = JSON.stringify(eventParameters(gtag, 'picker_export'));
    expect(serializedEvents).not.toContain('generation-gen1');
    expect(serializedEvents).not.toContain('team-1');
    expect(serializedEvents).not.toContain('Pikachu');
    expect(serializedEvents).not.toContain('Charmander');
    expect(serializedEvents).not.toContain('/picker?board=');
    expect(serializedEvents).not.toContain('"picks"');
  }, 30_000);

  it('tracks the actual successful Picker export method and ignores failed or aborted exports', async () => {
    window.history.replaceState({}, '', '/picker');
    localStorage.setItem('favmon_picker_board_v1', JSON.stringify({
      version: 1,
      picks: { 'generation-gen1': 25 },
      shiny: false,
    }));
    stubDefaultFetch();
    const user = userEvent.setup();
    const nativeShare = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'))
      .mockRejectedValueOnce(new Error('Native failed'))
      .mockRejectedValueOnce(new Error('Native failed'));
    const writeText = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);
    expect(await screen.findByRole('heading', { name: /Build your favorite Pokémon board/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Choose Gen I' })).toHaveTextContent('Pikachu'));
    const shareButton = screen.getAllByRole('button', { name: 'Share board' })[0];

    await user.click(shareButton);
    await waitFor(() => expect(eventParameters(gtag, 'picker_export')).toHaveLength(1));
    expect(eventParameters(gtag, 'picker_export')[0]).toEqual({
      language: 'en',
      export_method: 'native',
      filled_slots: 1,
      team_filled: 0,
      shiny: false,
    });

    await user.click(shareButton);
    await waitFor(() => expect(nativeShare).toHaveBeenCalledTimes(2));
    expect(eventParameters(gtag, 'picker_export')).toHaveLength(1);

    await user.click(shareButton);
    await waitFor(() => expect(eventParameters(gtag, 'picker_export')).toHaveLength(2));
    expect(eventParameters(gtag, 'picker_export')[1]?.export_method).toBe('clipboard_link');
    expect(screen.getByRole('status')).toHaveTextContent('Copied.');

    await user.click(shareButton);
    await waitFor(() => expect(nativeShare).toHaveBeenCalledTimes(4));
    expect(eventParameters(gtag, 'picker_export')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Copy failed. The code or link is in the field above—copy it manually.',
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('Copied.');
    expect((screen.getByPlaceholderText('Paste a Favmon picker code here') as HTMLTextAreaElement).value)
      .toContain('/picker?board=');
  }, 30_000);

  it('does not track a rejected Picker code export', async () => {
    window.history.replaceState({}, '', '/picker');
    localStorage.setItem('favmon_picker_board_v1', JSON.stringify({
      version: 1,
      picks: { 'generation-gen1': 25 },
      shiny: false,
    }));
    stubDefaultFetch();
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);
    expect(await screen.findByRole('heading', { name: /Build your favorite Pokémon board/i })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Copy code' })[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(eventParameters(gtag, 'picker_export')).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Copy failed. The code or link is in the field above—copy it manually.',
    );
    expect(screen.getByRole('status')).not.toHaveTextContent('Copied.');
    expect((screen.getByPlaceholderText('Paste a Favmon picker code here') as HTMLTextAreaElement).value)
      .toContain('"generation-gen1": 25');
  }, 30_000);

  it('tracks one completed correct Game round with the incremented streak', async () => {
    window.history.replaceState({}, '', '/game');
    stubDefaultFetch();
    let randomCall = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (randomCall++ % 2 === 0 ? 0.6 : 0.1));
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);
    expect(await screen.findByRole('heading', { name: /Who's More Loved/i })).toBeInTheDocument();
    await screen.findByRole('button', { name: /Pikachu/i });
    await screen.findByRole('button', { name: /Bulbasaur/i });

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: /Pikachu/i }));

    expect(eventParameters(gtag, 'game_round_complete')).toEqual([{
      mode: 'favourite',
      language: 'en',
      correct: true,
      streak_before: 0,
      streak_after: 1,
      selected_pokemon_id: 25,
      opponent_pokemon_id: 1,
    }]);

    act(() => {
      vi.advanceTimersByTime(850);
    });
    expect(eventParameters(gtag, 'game_round_complete')).toHaveLength(1);
  }, 30_000);

  it('tracks one completed incorrect Game round and does not duplicate it after restart', async () => {
    window.history.replaceState({}, '', '/game');
    stubDefaultFetch();
    let randomCall = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (randomCall++ % 2 === 0 ? 0.6 : 0.1));
    const gtag = vi.fn();
    window.gtag = gtag;

    render(<App />);
    expect(await screen.findByRole('heading', { name: /Who's More Loved/i })).toBeInTheDocument();
    await screen.findByRole('button', { name: /Pikachu/i });
    await screen.findByRole('button', { name: /Bulbasaur/i });

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: /Bulbasaur/i }));

    expect(eventParameters(gtag, 'game_round_complete')).toEqual([{
      mode: 'favourite',
      language: 'en',
      correct: false,
      streak_before: 0,
      streak_after: 0,
      selected_pokemon_id: 1,
      opponent_pokemon_id: 25,
    }]);

    act(() => {
      vi.advanceTimersByTime(850);
    });
    fireEvent.click(screen.getByRole('button', { name: /Play Again/i }));
    expect(eventParameters(gtag, 'game_round_complete')).toHaveLength(1);

    const serializedEvent = JSON.stringify(eventParameters(gtag, 'game_round_complete'));
    expect(serializedEvent).not.toContain('Pikachu');
    expect(serializedEvent).not.toContain('Bulbasaur');
  }, 30_000);

  it('shows the source-style success panel after a declaration is saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/declarations') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              declaration: {
                id: 'posted-1',
                trainerName: 'Ari',
                pokemonId: 25,
                pokemonName: 'pikachu',
                reason: 'Pikachu has been my favourite forever',
                mode: 'favourite',
                createdAt: '2026-06-13T10:00:00.000Z',
              },
              fanCount: 13,
              revealedCount: 7,
            }),
          });
        }
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ stats: [], latest: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /Every Pokémon is/i });
    await user.type(screen.getByPlaceholderText('Trainer'), 'Ari');
    await user.type(screen.getByLabelText('Favourite Pokémon'), 'pika');
    await user.click(await screen.findByText(/pikachu/i));
    await user.type(screen.getByPlaceholderText('This is where hearts are won.'), 'Pikachu has been my favourite forever');
    await user.click(screen.getByRole('button', { name: 'Declare favourite' }));

    expect(await screen.findByRole('heading', { name: 'Declaration saved. That Pokémon has someone now.' })).toBeInTheDocument();
    expect(screen.getByText('There are already 13 fans of pikachu like you!')).toBeInTheDocument();
    expect(screen.getByText('7 / 1025 Pokémon revealed - the journey continues...')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Download your Pokémon card!' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Official Art' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pixel Art' })).toBeInTheDocument();
    expect(screen.getByLabelText('Shiny')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Square \(Instagram\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Story \(TikTok\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Banner \(X\/Twitter\)/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Share your declaration' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Share your declaration' })).toHaveAttribute('href', '/declaration/posted-1');
    expect(screen.getByRole('button', { name: 'Share card' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy caption' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /X/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reddit/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bluesky/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Threads/ })).toBeInTheDocument();
  });

  it('tracks exactly one declaration success after the backend save resolves without leaking declaration content', async () => {
    stubDeclarationFetch();
    const gtag = vi.fn();
    window.gtag = gtag;

    const user = userEvent.setup();
    render(<App />);
    await submitPikachuDeclaration(user);

    await screen.findByRole('heading', { name: 'Declaration saved. That Pokémon has someone now.' });
    expect(eventParameters(gtag, 'declaration_submit_success')).toEqual([{
      pokemon_id: 25,
      pokemon_slug: 'pikachu',
      mode: 'favourite',
      language: 'en',
      source_page: 'home',
      fan_count: 13,
      revealed_count: 7,
    }]);
    const serializedEvent = JSON.stringify(eventParameters(gtag, 'declaration_submit_success'));
    expect(serializedEvent).not.toContain('Ari');
    expect(serializedEvent).not.toContain('forever');
    expect(serializedEvent).not.toContain('posted-1');
  });

  it('does not track declaration success when the backend rejects the declaration', async () => {
    stubDeclarationFetch({ succeeds: false });
    const gtag = vi.fn();
    window.gtag = gtag;

    const user = userEvent.setup();
    render(<App />);
    await submitPikachuDeclaration(user);

    expect(await screen.findByText('Declaration was not saved')).toBeInTheDocument();
    expect(eventParameters(gtag, 'declaration_submit_success')).toEqual([]);
  });

  it('tracks a card download initiation and a platform share intent with safe context only', async () => {
    const gtag = vi.fn();
    await renderDeclarationSharePage(gtag);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Square \(Instagram\)/ }));
    expect(eventParameters(gtag, 'share_card_download')).toEqual([{
      pokemon_id: 25,
      pokemon_slug: 'pikachu',
      mode: 'favourite',
      language: 'en',
      source_page: 'declaration_detail',
      card_format: 'square',
      art_style: 'official',
      shiny: false,
    }]);

    await user.click(screen.getByRole('link', { name: 'XX' }));
    expect(eventParameters(gtag, 'share_link_click')).toEqual([{
      pokemon_id: 25,
      pokemon_slug: 'pikachu',
      mode: 'favourite',
      language: 'en',
      source_page: 'declaration_detail',
      method: 'platform_intent',
      platform: 'x',
    }]);
    const serializedEvents = JSON.stringify([
      ...eventParameters(gtag, 'share_card_download'),
      ...eventParameters(gtag, 'share_link_click'),
    ]);
    expect(serializedEvents).not.toContain('Ari');
    expect(serializedEvents).not.toContain('forever');
    expect(serializedEvents).not.toContain('posted-1');
  });

  it('tracks native sharing only after it resolves and ignores an aborted share', async () => {
    const nativeShare = vi.fn().mockResolvedValueOnce(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    const gtag = vi.fn();
    await renderDeclarationSharePage(gtag);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Share card' }));
    await waitFor(() => expect(eventParameters(gtag, 'share_link_click')).toHaveLength(1));
    expect(eventParameters(gtag, 'share_link_click')[0]).toEqual({
      pokemon_id: 25,
      pokemon_slug: 'pikachu',
      mode: 'favourite',
      language: 'en',
      source_page: 'declaration_detail',
      method: 'native',
    });

    nativeShare.mockRejectedValueOnce(new DOMException('Cancelled', 'AbortError'));
    await user.click(screen.getByRole('button', { name: 'Share card' }));
    await waitFor(() => expect(nativeShare).toHaveBeenCalledTimes(2));
    expect(eventParameters(gtag, 'share_link_click')).toHaveLength(1);
  });

  it('tracks successful clipboard shares only after the write resolves', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    await renderDeclarationSharePage(gtag);

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(eventParameters(gtag, 'share_link_click')).toHaveLength(1));
    expect(eventParameters(gtag, 'share_link_click')[0]).toEqual({
      pokemon_id: 25,
      pokemon_slug: 'pikachu',
      mode: 'favourite',
      language: 'en',
      source_page: 'declaration_detail',
      method: 'copy_link',
    });
  });

  it('shows a localized failure when native share and its clipboard fallback both reject', async () => {
    const nativeShare = vi.fn().mockRejectedValue(new Error('Native share failed'));
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    await renderDeclarationSharePage(gtag);

    await user.click(screen.getByRole('button', { name: 'Share card' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toHaveTextContent('Sharing failed. Please try again.');
    expect(screen.queryByText('Share sheet opened.')).not.toBeInTheDocument();
    expect(screen.queryByText('Sharing is not available here. Link copied.')).not.toBeInTheDocument();
    expect(eventParameters(gtag, 'share_link_click')).toEqual([]);
  });

  it('shows a localized failure for rejected Copy link and Copy caption writes', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const gtag = vi.fn();
    await renderDeclarationSharePage(gtag);

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toHaveTextContent('Sharing failed. Please try again.');

    await user.click(screen.getByRole('button', { name: 'Copy caption' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('status')).toHaveTextContent('Sharing failed. Please try again.');
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    expect(eventParameters(gtag, 'share_link_click')).toEqual([]);
  });

  it('keeps an aborted native share silent and does not report success', async () => {
    const nativeShare = vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError'));
    Object.defineProperty(navigator, 'share', { configurable: true, value: nativeShare });
    const gtag = vi.fn();
    await renderDeclarationSharePage(gtag);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Share card' }));

    await waitFor(() => expect(nativeShare).toHaveBeenCalledOnce());
    expect(screen.queryByText('Sharing failed. Please try again.')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(eventParameters(gtag, 'share_link_click')).toEqual([]);
  });

  it('renders a shareable declaration detail route', async () => {
    window.history.replaceState({}, '', '/declaration/posted-1');
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === '/api/declarations?id=posted-1') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              declaration: {
                id: 'posted-1',
                trainerName: 'Ari',
                pokemonId: 25,
                pokemonName: 'pikachu',
                reason: 'Pikachu has been my favourite forever',
                mode: 'favourite',
                createdAt: '2026-06-13T10:00:00.000Z',
              },
              fanCount: 13,
              revealedCount: 7,
              rank: 2,
              totalDeclarations: 22,
            }),
          });
        }
        if (url.startsWith('/api/data')) {
          return Promise.resolve({
            ok: true,
            json: async () => backendData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => pokemonData,
        });
      }),
    );

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Ari chose Pikachu/i })).toBeInTheDocument();
    expect(screen.getByText('"Pikachu has been my favourite forever"')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Download your Pokémon card!' })).toBeInTheDocument();
  });
});
