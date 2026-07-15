import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSubmissionFingerprints } from '../../api/declaration-safety';

describe('declaration submission fingerprint', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('isolates IPv4 clients and prefers the Cloudflare client header', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt');
    const first = createSubmissionFingerprints({
      'cf-connecting-ip': '203.0.113.42',
      'x-vercel-forwarded-for': '198.51.100.9',
      'user-agent': 'Browser A',
    });
    const sameTrustedClient = createSubmissionFingerprints({
      'cf-connecting-ip': '203.0.113.42',
      'x-vercel-forwarded-for': '192.0.2.10',
      'user-agent': 'Browser A',
    });
    const otherClient = createSubmissionFingerprints({
      'cf-connecting-ip': '203.0.113.43',
      'x-vercel-forwarded-for': '198.51.100.9',
      'user-agent': 'Browser A',
    });

    expect(first).toEqual(sameTrustedClient);
    expect(first.clientKey).not.toBe(otherClient.clientKey);
    expect(first.networkKey).not.toBe(otherClient.networkKey);
  });

  it('falls back to the Vercel forwarding header without Cloudflare', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt');
    const first = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '203.0.113.42',
      'x-forwarded-for': '198.51.100.9',
    });
    const sameTrustedClient = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '203.0.113.42',
      'x-forwarded-for': '192.0.2.10',
    });

    expect(first).toEqual(sameTrustedClient);
  });

  it('separates clients behind one shared network while retaining a network-wide bucket', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt');
    const first = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '203.0.113.42',
      'user-agent': 'Browser A',
    });
    const second = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '203.0.113.42',
      'user-agent': 'Browser B',
    });

    expect(first.clientKey).not.toBe(second.clientKey);
    expect(first.networkKey).toBe(second.networkKey);
  });

  it('groups rotating IPv6 interface addresses by /64 prefix', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt');
    const first = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '2001:db8:abcd:12::1',
    });
    const samePrefix = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '2001:0db8:abcd:0012:ffff::2',
    });
    const otherPrefix = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '2001:db8:abcd:13::1',
    });

    expect(first).toEqual(samePrefix);
    expect(first.networkKey).not.toBe(otherPrefix.networkKey);
  });

  it('normalizes expanded IPv4-mapped IPv6 addresses to the IPv4 bucket', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt');
    const ipv4 = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '192.0.2.128',
    });
    const mapped = createSubmissionFingerprints({
      'x-vercel-forwarded-for': '0:0:0:0:0:ffff:c000:0280',
    });

    expect(mapped).toEqual(ipv4);
  });

  it('uses the user agent only when no client address is available', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'test-rate-limit-salt');

    const first = createSubmissionFingerprints({ 'user-agent': 'Browser A' });
    const second = createSubmissionFingerprints({ 'user-agent': 'Browser B' });

    expect(first.clientKey).not.toBe(second.clientKey);
    expect(first.networkKey).toBe(second.networkKey);
  });
});
