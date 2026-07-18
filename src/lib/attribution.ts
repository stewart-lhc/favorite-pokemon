const ATTRIBUTION_STORAGE_KEY = 'favmon_attribution_v1';
const REFERRAL_VISIT_STORAGE_KEY = 'favmon_referral_visit_v1';

const attributionQueryParameters = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'campaign',
  'creator',
] as const;

type AttributionQueryParameter = typeof attributionQueryParameters[number];

export type Attribution = Partial<Record<AttributionQueryParameter, string>> & {
  referrer_host?: string;
};

function readSessionValue(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Attribution must never block the user journey.
  }
}

function safeParameter(value: string | null): string | undefined {
  const normalized = value?.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 160);
  return normalized || undefined;
}

function externalReferrerHost(referrer: string, currentUrl: URL): string | undefined {
  if (!referrer) return undefined;
  try {
    const referrerUrl = new URL(referrer);
    return referrerUrl.origin === currentUrl.origin ? undefined : referrerUrl.hostname.slice(0, 160);
  } catch {
    return undefined;
  }
}

export function readAttribution(): Attribution | null {
  const stored = readSessionValue(ATTRIBUTION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Attribution;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function captureAttribution(pageUrl: string, referrer = ''): Attribution | null {
  let url: URL;
  try {
    url = new URL(pageUrl);
  } catch {
    return readAttribution();
  }

  const queryAttribution = Object.fromEntries(
    attributionQueryParameters.flatMap((parameter) => {
      const value = safeParameter(url.searchParams.get(parameter));
      return value ? [[parameter, value]] : [];
    }),
  ) as Partial<Record<AttributionQueryParameter, string>>;
  const referrerHost = externalReferrerHost(referrer, url);
  const hasNewAttribution = Object.keys(queryAttribution).length > 0 || Boolean(referrerHost);

  if (!hasNewAttribution) return readAttribution();

  const attribution: Attribution = {
    ...queryAttribution,
    ...(referrerHost ? { referrer_host: referrerHost } : {}),
  };
  writeSessionValue(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
}

export function attributionParameters(attribution = readAttribution()): Readonly<Record<string, string>> {
  if (!attribution) return {};
  return { ...attribution };
}

export function markReferralVisitTracked(attribution: Attribution): boolean {
  const signature = JSON.stringify(attribution);
  if (readSessionValue(REFERRAL_VISIT_STORAGE_KEY) === signature) return false;
  writeSessionValue(REFERRAL_VISIT_STORAGE_KEY, signature);
  return true;
}

export function buildAttributedShareUrl(url: string): string {
  const attributedUrl = new URL(url);
  attributedUrl.searchParams.set('ref', 'declaration_share');
  attributedUrl.searchParams.set('utm_source', 'favmon');
  attributedUrl.searchParams.set('utm_medium', 'share');
  attributedUrl.searchParams.set('utm_campaign', 'declaration_card');
  return attributedUrl.toString();
}

export function analyticsPageUrl(pageUrl: string): URL {
  const url = new URL(pageUrl);
  const allowedParameters = new Set<string>([...attributionQueryParameters, 'pokemon']);
  for (const parameter of [...url.searchParams.keys()]) {
    if (!allowedParameters.has(parameter)) url.searchParams.delete(parameter);
  }
  url.hash = '';
  return url;
}
