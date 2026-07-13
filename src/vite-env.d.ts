/// <reference types="vite/client" />

interface Window {
  dataLayer?: unknown[];
  gtag?: (
    command: 'event',
    eventName: string,
    parameters: Readonly<Record<string, string | number | boolean | undefined>>,
  ) => void;
}
