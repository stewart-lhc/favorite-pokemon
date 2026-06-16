import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('Favorite Pokemon clone', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
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
    await user.click(screen.getByRole('link', { name: 'Pokédex' }));
    expect(await screen.findByRole('heading', { name: /Pokémon discovered/i })).toBeInTheDocument();
    expect(screen.getByText(/Showing 4 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Stats' }));
    expect(screen.getByRole('heading', { name: /universal declaration/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Game' }));
    expect(await screen.findByRole('heading', { name: /Who's More Loved/i })).toBeInTheDocument();
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
  });
});
