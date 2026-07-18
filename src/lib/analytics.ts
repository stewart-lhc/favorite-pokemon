export type AnalyticsEventName =
  | 'declaration_start'
  | 'pokemon_selected'
  | 'declaration_submit_success'
  | 'card_generated'
  | 'referral_visit'
  | 'referral_submit'
  | 'share_card_download'
  | 'share_link_click'
  | 'picker_export'
  | 'game_round_complete'
  | 'feedback_open'
  | 'feedback_submit';

export type AnalyticsRouteType =
  | 'home'
  | 'picker'
  | 'game'
  | 'explore'
  | 'pokedex'
  | 'stats'
  | 'pokemon_detail'
  | 'declaration_detail';

export type AnalyticsParameterValue = string | number | boolean | undefined;
export type AnalyticsParameters = Readonly<Record<string, AnalyticsParameterValue>>;

export type PageViewParameters = {
  pageLocation: string;
  pagePath: string;
  pageTitle: string;
  language: string;
  routeType: AnalyticsRouteType;
};

function sendEvent(eventName: string, parameters: AnalyticsParameters) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', eventName, parameters);
  } catch {
    // Analytics must never block the product action being measured.
  }
}

export function trackEvent(eventName: AnalyticsEventName, parameters: AnalyticsParameters = {}) {
  sendEvent(eventName, parameters);
}

export function trackPageView({
  pageLocation,
  pagePath,
  pageTitle,
  language,
  routeType,
}: PageViewParameters) {
  sendEvent('page_view', {
    page_location: pageLocation,
    page_path: pagePath,
    page_title: pageTitle,
    language,
    route_type: routeType,
  });
}
