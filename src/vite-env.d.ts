/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TALLY_FEEDBACK_FORM_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (
    command: 'event',
    eventName: string,
    parameters: Readonly<Record<string, string | number | boolean | undefined>>,
  ) => void;
  Tally?: {
    openPopup: (
      formId: string,
      options: {
        hiddenFields: Partial<Record<
          'page' | 'route_type' | 'pokemon_slug' | 'language' | 'mode' | 'referrer' | 'utm_source',
          string
        >>;
        onOpen?: () => void;
        onSubmit?: (payload?: unknown) => void;
      },
    ) => void;
  };
}
