import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedbackButton } from './FeedbackButton';

const context = {
  page: '/pokemon/pikachu',
  routeType: 'pokemon_detail' as const,
  pokemonSlug: 'pikachu',
  language: 'en',
  mode: 'favourite',
  referrer: 'https://google.com',
  utmSource: 'newsletter',
} as const;

describe('FeedbackButton', () => {
  beforeEach(() => {
    delete window.Tally;
    delete window.gtag;
    document.head.querySelectorAll('script[src="https://tally.so/widgets/embed.js"]').forEach((script) => script.remove());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete window.Tally;
    delete window.gtag;
    vi.useRealTimers();
  });

  it('does not render when the public form ID is missing or blank', () => {
    const { rerender } = render(
      <FeedbackButton
        formId={undefined}
        label="Send feedback"
        failureMessage="Feedback could not open. Please try again."
        context={context}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Send feedback' })).not.toBeInTheDocument();

    rerender(
      <FeedbackButton
        formId="   "
        label="Send feedback"
        failureMessage="Feedback could not open. Please try again."
        context={context}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Send feedback' })).not.toBeInTheDocument();
    expect(document.querySelector('script[src="https://tally.so/widgets/embed.js"]')).toBeNull();
  });

  it('opens with allowlisted context and tracks only Tally open and submit callbacks', async () => {
    const user = userEvent.setup();
    const gtag = vi.fn();
    const openPopup = vi.fn();
    window.gtag = gtag as NonNullable<typeof window.gtag>;
    window.Tally = { openPopup };
    render(
      <FeedbackButton
        formId="Y5yydd"
        label="Send feedback"
        failureMessage="Feedback could not open. Please try again."
        context={context}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Send feedback' }));

    expect(gtag).not.toHaveBeenCalled();
    expect(openPopup).toHaveBeenCalledWith('Y5yydd', {
      hiddenFields: {
        page: '/pokemon/pikachu',
        route_type: 'pokemon_detail',
        pokemon_slug: 'pikachu',
        language: 'en',
        mode: 'favourite',
        referrer: 'https://google.com',
        utm_source: 'newsletter',
      },
      onOpen: expect.any(Function),
      onSubmit: expect.any(Function),
    });

    const callbacks = openPopup.mock.calls[0][1] as {
      onOpen: () => void;
      onSubmit: (payload: unknown) => void;
    };
    callbacks.onOpen();
    callbacks.onSubmit({
      submissionId: 'private-submission',
      answers: [{ value: 'private feedback text' }],
    });

    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'feedback_open', {
      route_type: 'pokemon_detail',
      language: 'en',
      mode: 'favourite',
      source_page: '/pokemon/pikachu',
      pokemon_slug: 'pikachu',
    });
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'feedback_submit', {
      route_type: 'pokemon_detail',
      language: 'en',
      mode: 'favourite',
      source_page: '/pokemon/pikachu',
      pokemon_slug: 'pikachu',
    });
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('private-submission');
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('private feedback text');
    expect(JSON.stringify(gtag.mock.calls)).not.toContain('Y5yydd');
  });

  it('shows an accessible localized failure while leaving other product controls usable', async () => {
    const user = userEvent.setup();
    const productAction = vi.fn();
    render(
      <>
        <button type="button" onClick={productAction}>Keep playing</button>
        <FeedbackButton
          formId="Y5yydd"
          label="Send feedback"
          failureMessage="Feedback could not open. Please try again."
          context={context}
        />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Send feedback' }));
    const script = document.querySelector<HTMLScriptElement>('script[src="https://tally.so/widgets/embed.js"]');
    expect(script).not.toBeNull();
    script?.dispatchEvent(new Event('error'));

    expect(await screen.findByRole('status')).toHaveTextContent('Feedback could not open. Please try again.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send feedback' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Keep playing' }));
    expect(productAction).toHaveBeenCalledOnce();
  });

  it('shows the localized failure after a stale script times out and allows a retry', async () => {
    vi.useFakeTimers();
    const staleScript = document.createElement('script');
    staleScript.src = 'https://tally.so/widgets/embed.js';
    document.head.appendChild(staleScript);
    staleScript.dispatchEvent(new Event('load'));
    render(
      <FeedbackButton
        formId="Y5yydd"
        label="Send feedback"
        failureMessage="Feedback could not open. Please try again."
        context={context}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8_000);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Feedback could not open. Please try again.');
    expect(screen.getByRole('button', { name: 'Send feedback' })).toBeEnabled();
    expect(staleScript.isConnected).toBe(false);

    const openPopup = vi.fn();
    window.Tally = { openPopup };
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    });
    expect(openPopup).toHaveBeenCalledOnce();
  });
});
