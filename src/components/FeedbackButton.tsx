import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { trackEvent, type AnalyticsRouteType } from '../lib/analytics';
import { openTallyFeedback, type TallyHiddenFields } from '../lib/tally';
import type { Mode } from '../types';

export type FeedbackContext = {
  page: string;
  routeType: AnalyticsRouteType;
  pokemonSlug?: string;
  language: string;
  mode: Mode;
  referrer?: string;
  utmSource?: string;
};

export type FeedbackButtonProps = {
  formId?: string;
  label: string;
  failureMessage: string;
  context: FeedbackContext;
  variant?: 'floating' | 'contextual';
};

export function FeedbackButton({
  formId,
  label,
  failureMessage,
  context,
  variant = 'floating',
}: FeedbackButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!formId?.trim()) return null;

  const analyticsContext = {
    route_type: context.routeType,
    language: context.language,
    mode: context.mode,
    source_page: context.page,
    ...(context.pokemonSlug ? { pokemon_slug: context.pokemonSlug } : {}),
  };
  const hiddenFields: TallyHiddenFields = {
    page: context.page,
    route_type: context.routeType,
    language: context.language,
    mode: context.mode,
    ...(context.pokemonSlug ? { pokemon_slug: context.pokemonSlug } : {}),
    ...(context.referrer ? { referrer: context.referrer } : {}),
    ...(context.utmSource ? { utm_source: context.utmSource } : {}),
  };

  async function openFeedback() {
    setLoading(true);
    setError('');
    try {
      await openTallyFeedback({
        formId,
        hiddenFields,
        onOpen: () => trackEvent('feedback_open', analyticsContext),
        onSubmit: () => trackEvent('feedback_submit', analyticsContext),
      });
    } catch {
      setError(failureMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`feedback-entry feedback-entry--${variant}`}>
      <button
        type="button"
        className="feedback-button"
        disabled={loading}
        onClick={() => void openFeedback()}
      >
        <MessageCircle size={17} aria-hidden="true" />
        <span>{label}</span>
      </button>
      {error && <p className="feedback-status" role="status">{error}</p>}
    </div>
  );
}
