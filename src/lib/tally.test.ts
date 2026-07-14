import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type TallyModule = typeof import('./tally');

async function loadModule(): Promise<TallyModule> {
  vi.resetModules();
  return import('./tally');
}

function tallyScripts() {
  return [...document.querySelectorAll<HTMLScriptElement>('script[src="https://tally.so/widgets/embed.js"]')];
}

describe('Tally adapter', () => {
  beforeEach(() => {
    document.head.querySelectorAll('script[src="https://tally.so/widgets/embed.js"]').forEach((script) => script.remove());
    delete window.Tally;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not insert a script when the form ID is missing or blank', async () => {
    const { openTallyFeedback } = await loadModule();

    await expect(openTallyFeedback({ formId: undefined })).resolves.toBe(false);
    await expect(openTallyFeedback({ formId: '   ' })).resolves.toBe(false);

    expect(tallyScripts()).toHaveLength(0);
  });

  it('single-flights concurrent widget loads and reuses the loaded Tally API', async () => {
    const { openTallyFeedback } = await loadModule();
    const first = openTallyFeedback({ formId: 'Y5yydd' });
    const second = openTallyFeedback({ formId: 'Y5yydd' });

    expect(tallyScripts()).toHaveLength(1);
    const openPopup = vi.fn();
    window.Tally = { openPopup };
    tallyScripts()[0].dispatchEvent(new Event('load'));

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    await expect(openTallyFeedback({ formId: 'Y5yydd' })).resolves.toBe(true);
    expect(tallyScripts()).toHaveLength(1);
    expect(openPopup).toHaveBeenCalledTimes(3);
  });

  it('uses an existing Tally API without inserting the widget script', async () => {
    const openPopup = vi.fn();
    window.Tally = { openPopup };
    const { openTallyFeedback } = await loadModule();

    await expect(openTallyFeedback({ formId: 'Y5yydd' })).resolves.toBe(true);

    expect(tallyScripts()).toHaveLength(0);
    expect(openPopup).toHaveBeenCalledOnce();
  });

  it('rejects a failed load and permits a clean retry', async () => {
    const { openTallyFeedback } = await loadModule();
    const failed = openTallyFeedback({ formId: 'Y5yydd' });
    const firstScript = tallyScripts()[0];

    firstScript.dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('Tally');
    expect(firstScript.isConnected).toBe(false);

    const retried = openTallyFeedback({ formId: 'Y5yydd' });
    expect(tallyScripts()).toHaveLength(1);
    expect(tallyScripts()[0]).not.toBe(firstScript);
    window.Tally = { openPopup: vi.fn() };
    tallyScripts()[0].dispatchEvent(new Event('load'));
    await expect(retried).resolves.toBe(true);
  });

  it('passes only allowlisted hidden fields and ignores a Tally submit payload', async () => {
    const openPopup = vi.fn();
    window.Tally = { openPopup };
    const onSubmit = vi.fn();
    const { openTallyFeedback } = await loadModule();

    await openTallyFeedback({
      formId: 'Y5yydd',
      hiddenFields: {
        page: '/pokemon/pikachu',
        route_type: 'pokemon_detail',
        pokemon_slug: 'pikachu',
        language: 'en',
        mode: 'favourite',
        referrer: 'https://google.com',
        utm_source: 'newsletter',
        feedback: 'private answer',
        submission_id: 'secret-123',
      } as never,
      onSubmit,
    });

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
      onOpen: undefined,
      onSubmit: expect.any(Function),
    });

    const popupOptions = openPopup.mock.calls[0][1] as { onSubmit: (payload: unknown) => void };
    popupOptions.onSubmit({
      submissionId: 'secret-123',
      answers: [{ value: 'private answer' }],
    });
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith();
  });

  it('rejects when the script loads without exposing the Tally API and can retry', async () => {
    const { openTallyFeedback } = await loadModule();
    const missingApi = openTallyFeedback({ formId: 'Y5yydd' });
    const firstScript = tallyScripts()[0];

    firstScript.dispatchEvent(new Event('load'));
    await expect(missingApi).rejects.toThrow('Tally');
    expect(firstScript.isConnected).toBe(false);

    const retried = openTallyFeedback({ formId: 'Y5yydd' });
    window.Tally = { openPopup: vi.fn() };
    tallyScripts()[0].dispatchEvent(new Event('load'));
    await expect(retried).resolves.toBe(true);
  });

  it('times out a pre-existing stale script whose load event already ended and can retry', async () => {
    vi.useFakeTimers();
    const staleScript = document.createElement('script');
    staleScript.src = 'https://tally.so/widgets/embed.js';
    document.head.appendChild(staleScript);
    staleScript.dispatchEvent(new Event('load'));
    const { openTallyFeedback } = await loadModule();
    let settled = false;
    let loadError: unknown;

    const staleLoad = openTallyFeedback({ formId: 'Y5yydd' }).catch((error: unknown) => {
      settled = true;
      loadError = error;
      return false;
    });
    await vi.advanceTimersByTimeAsync(8_000);

    expect(settled).toBe(true);
    expect(loadError).toBeInstanceOf(Error);
    expect((loadError as Error).message).toContain('Tally');
    expect(staleScript.isConnected).toBe(false);

    const retried = openTallyFeedback({ formId: 'Y5yydd' });
    expect(tallyScripts()).toHaveLength(1);
    expect(tallyScripts()[0]).not.toBe(staleScript);
    window.Tally = { openPopup: vi.fn() };
    tallyScripts()[0].dispatchEvent(new Event('load'));
    await expect(retried).resolves.toBe(true);
    await expect(staleLoad).resolves.toBe(false);
  });
});
