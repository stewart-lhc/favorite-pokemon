import { beforeEach, describe, expect, it } from 'vitest';
import {
  analyticsPageUrl,
  attributionParameters,
  buildAttributedShareUrl,
  captureAttribution,
  markReferralVisitTracked,
  readAttribution,
} from './attribution';

describe('attribution', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('captures supported campaign parameters without storing arbitrary query data', () => {
    const attribution = captureAttribution(
      'https://favmon.com/zh-cn?utm_source=reddit&utm_medium=social&utm_campaign=community-cup&creator=oak&trainer=Ari&reason=secret',
    );

    expect(attribution).toEqual({
      utm_source: 'reddit',
      utm_medium: 'social',
      utm_campaign: 'community-cup',
      creator: 'oak',
    });
    expect(JSON.stringify(readAttribution())).not.toContain('Ari');
    expect(JSON.stringify(readAttribution())).not.toContain('secret');
  });

  it('stores only the host for an external referrer and ignores same-origin referrers', () => {
    expect(captureAttribution('https://favmon.com/', 'https://www.reddit.com/r/pokemon/comments/private')).toEqual({
      referrer_host: 'www.reddit.com',
    });

    sessionStorage.clear();
    expect(captureAttribution('https://favmon.com/stats', 'https://favmon.com/picker?private=value')).toBeNull();
  });

  it('persists the latest non-direct attribution for the session', () => {
    captureAttribution('https://favmon.com/?ref=discord&campaign=ghost-week');

    expect(captureAttribution('https://favmon.com/stats')).toEqual({
      ref: 'discord',
      campaign: 'ghost-week',
    });
    expect(attributionParameters()).toMatchObject({ ref: 'discord', campaign: 'ghost-week' });
  });

  it('marks a referral visit only once per captured attribution', () => {
    const attribution = captureAttribution('https://favmon.com/?utm_source=reddit')!;

    expect(markReferralVisitTracked(attribution)).toBe(true);
    expect(markReferralVisitTracked(attribution)).toBe(false);
  });

  it('adds durable referral markers to declaration share links', () => {
    const url = new URL(buildAttributedShareUrl('https://favmon.com/declaration/posted-1'));

    expect(url.pathname).toBe('/declaration/posted-1');
    expect(url.searchParams.get('ref')).toBe('declaration_share');
    expect(url.searchParams.get('utm_source')).toBe('favmon');
    expect(url.searchParams.get('utm_medium')).toBe('share');
    expect(url.searchParams.get('utm_campaign')).toBe('declaration_card');
  });

  it('removes arbitrary and potentially personal query data from analytics page URLs', () => {
    const url = analyticsPageUrl(
      'https://favmon.com/?utm_source=reddit&pokemon=pikachu&trainer=Ari&reason=secret#private',
    );

    expect(url.href).toBe('https://favmon.com/?utm_source=reddit&pokemon=pikachu');
  });
});
