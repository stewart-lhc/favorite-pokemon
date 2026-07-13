const TALLY_WIDGET_URL = 'https://tally.so/widgets/embed.js';
const TALLY_LOAD_TIMEOUT_MS = 8_000;

const hiddenFieldKeys = [
  'page',
  'route_type',
  'pokemon_slug',
  'language',
  'mode',
  'referrer',
  'utm_source',
] as const;

export type TallyHiddenFieldKey = typeof hiddenFieldKeys[number];
export type TallyHiddenFields = Partial<Record<TallyHiddenFieldKey, string>>;

type TallyApi = NonNullable<Window['Tally']>;

export type OpenTallyFeedbackOptions = {
  formId?: string;
  hiddenFields?: TallyHiddenFields;
  onOpen?: () => void;
  onSubmit?: () => void;
};

let loadPromise: Promise<TallyApi> | null = null;

function loadTallyWidget(): Promise<TallyApi> {
  if (window.Tally) return Promise.resolve(window.Tally);
  if (loadPromise) return loadPromise;

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TALLY_WIDGET_URL}"]`);
  const script = existingScript ?? document.createElement('script');

  const pending = new Promise<TallyApi>((resolve, reject) => {
    const lifecycle: { timeoutId?: number } = {};
    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
      if (lifecycle.timeoutId !== undefined) window.clearTimeout(lifecycle.timeoutId);
    };
    const fail = (message: string) => {
      cleanup();
      script.remove();
      reject(new Error(message));
    };
    const handleLoad = () => {
      if (!window.Tally) {
        fail('Tally widget loaded without exposing its API.');
        return;
      }
      cleanup();
      resolve(window.Tally);
    };
    const handleError = () => fail('Tally widget failed to load.');

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    lifecycle.timeoutId = window.setTimeout(
      () => fail('Tally widget load timed out.'),
      TALLY_LOAD_TIMEOUT_MS,
    );

    if (!existingScript) {
      script.src = TALLY_WIDGET_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  loadPromise = pending.catch((error: unknown) => {
    loadPromise = null;
    throw error;
  });
  return loadPromise;
}

function sanitizeHiddenFields(fields: TallyHiddenFields | undefined): TallyHiddenFields {
  if (!fields) return {};

  return hiddenFieldKeys.reduce<TallyHiddenFields>((safeFields, key) => {
    const value = fields[key];
    if (typeof value === 'string' && value.trim()) safeFields[key] = value;
    return safeFields;
  }, {});
}

export async function openTallyFeedback({
  formId,
  hiddenFields,
  onOpen,
  onSubmit,
}: OpenTallyFeedbackOptions): Promise<boolean> {
  const publicFormId = formId?.trim();
  if (!publicFormId) return false;

  const tally = await loadTallyWidget();
  tally.openPopup(publicFormId, {
    hiddenFields: sanitizeHiddenFields(hiddenFields),
    onOpen,
    onSubmit: () => onSubmit?.(),
  });
  return true;
}
