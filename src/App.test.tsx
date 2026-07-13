import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function pageViewParameters(gtag: ReturnType<typeof vi.fn>) {
  return gtag.mock.calls
    .filter(([command, eventName]) => command === 'event' && eventName === 'page_view')
    .map(([, , parameters]) => parameters as Record<string, unknown>);
}

describe('Favorite Pokemon clone', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    localStorage.clear();
    vi.restoreAllMocks();
    delete window.gtag;
  });

  afterEach(() => {
    cleanup();
    delete window.gtag;
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
    expect(screen.getByRole('heading', { name: /universal declaration/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Game' }));
    expect(await screen.findByRole('heading', { name: /Who's More Loved/i })).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: /universal declaration/i })).toBeInTheDocument();

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
  });

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
