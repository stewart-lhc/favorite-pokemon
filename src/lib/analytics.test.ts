import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackEvent, trackPageView } from './analytics';

describe('analytics', () => {
  afterEach(() => {
    delete window.gtag;
  });

  it('does not throw when gtag is unavailable', () => {
    delete window.gtag;

    expect(() => trackEvent('picker_export', { format: 'code' })).not.toThrow();
    expect(() => trackPageView({
      pageLocation: 'https://favmon.com/stats',
      pagePath: '/stats',
      pageTitle: 'Pokémon Fan Rankings and Stats | Favmon',
      language: 'en',
      routeType: 'stats',
    })).not.toThrow();
  });

  it('does not let a throwing gtag implementation break product behavior', () => {
    window.gtag = vi.fn(() => {
      throw new Error('Analytics script failed');
    });

    expect(() => trackEvent('share_link_click', { method: 'native' })).not.toThrow();
    expect(() => trackPageView({
      pageLocation: 'https://favmon.com/',
      pagePath: '/',
      pageTitle: 'Favmon',
      language: 'en',
      routeType: 'home',
    })).not.toThrow();
  });

  it('sends only the explicitly supplied event parameters', () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackEvent('picker_export', {
      format: 'code',
      filled_slots: 4,
      language: 'en',
    });

    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith('event', 'picker_export', {
      format: 'code',
      filled_slots: 4,
      language: 'en',
    });
  });

  it('sends a page view with the explicit page context', () => {
    const gtag = vi.fn();
    window.gtag = gtag;

    trackPageView({
      pageLocation: 'https://favmon.com/zh-cn/pokemon/pikachu',
      pagePath: '/zh-cn/pokemon/pikachu',
      pageTitle: 'Pikachu | Favmon',
      language: 'zh-CN',
      routeType: 'pokemon_detail',
    });

    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_location: 'https://favmon.com/zh-cn/pokemon/pikachu',
      page_path: '/zh-cn/pokemon/pikachu',
      page_title: 'Pikachu | Favmon',
      language: 'zh-CN',
      route_type: 'pokemon_detail',
    });
  });
});
