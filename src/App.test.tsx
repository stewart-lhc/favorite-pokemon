import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

const pokeApiResponse = {
  results: [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
    { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
    { name: 'magikarp', url: 'https://pokeapi.co/api/v2/pokemon/129/' },
  ],
};

describe('Favorite Pokemon clone', () => {
  it('renders the declaration landing page and navigates to core sections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => pokeApiResponse,
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
});
