import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export const DECLARATION_CLIENT_RATE_LIMIT_MAX_ATTEMPTS = 5;
export const DECLARATION_NETWORK_RATE_LIMIT_MAX_ATTEMPTS = 50;
export const DECLARATION_RATE_LIMIT_WINDOW_MINUTES = 10;

type HeaderValue = string | string[] | undefined;
export type RequestHeaders = Record<string, HeaderValue>;

export function createSubmissionFingerprints(headers: RequestHeaders = {}) {
  const clientAddress = firstHeaderValue(headers, 'cf-connecting-ip')
    ?? firstHeaderValue(headers, 'x-vercel-forwarded-for')
    ?? firstHeaderValue(headers, 'x-forwarded-for')
    ?? firstHeaderValue(headers, 'x-real-ip');
  const userAgent = firstHeaderValue(headers, 'user-agent') ?? 'unknown-agent';
  const rawAddress = clientAddress?.split(',')[0]?.trim();
  const networkIdentifier = rawAddress
    ? normalizeNetworkIdentifier(rawAddress)
    : 'unknown-network';
  const secret = process.env.RATE_LIMIT_SALT
    ?? process.env.DATABASE_URL
    ?? 'favmon-local-rate-limit';

  return {
    clientKey: hashIdentifier(secret, `${networkIdentifier}|agent:${userAgent}`),
    networkKey: hashIdentifier(secret, `${networkIdentifier}|network`),
  };
}

function normalizeNetworkIdentifier(rawAddress: string): string {
  const bracketedAddress = rawAddress.match(/^\[([^\]]+)](?::\d+)?$/)?.[1];
  const address = (bracketedAddress ?? rawAddress).split('%')[0].toLowerCase();
  const mappedIpv4 = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];

  if (mappedIpv4 && isIP(mappedIpv4) === 4) return `ipv4:${mappedIpv4}`;
  if (isIP(address) === 4) return `ipv4:${address}`;
  if (isIP(address) === 6) {
    const parts = expandIpv6(address);
    if (parts.slice(0, 5).every((part) => part === '0000') && parts[5] === 'ffff') {
      return `ipv4:${ipv4FromHexPairs(parts[6], parts[7])}`;
    }
    const prefix = parts.slice(0, 4).join(':');
    return `ipv6:${prefix}::/64`;
  }

  return `unparsed-address:${rawAddress}`;
}

function expandIpv6(address: string): string[] {
  const ipv4Tail = address.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  let hexadecimalAddress = address;

  if (ipv4Tail && isIP(ipv4Tail) === 4) {
    const octets = ipv4Tail.split('.').map(Number);
    const firstPair = ((octets[0] << 8) | octets[1]).toString(16);
    const secondPair = ((octets[2] << 8) | octets[3]).toString(16);
    hexadecimalAddress = `${address.slice(0, -ipv4Tail.length)}${firstPair}:${secondPair}`;
  }

  const [left = '', right = ''] = hexadecimalAddress.split('::');
  const leftParts = left ? left.split(':') : [];
  const rightParts = right ? right.split(':') : [];
  const zeroCount = 8 - leftParts.length - rightParts.length;
  const parts = hexadecimalAddress.includes('::')
    ? [...leftParts, ...Array(zeroCount).fill('0'), ...rightParts]
    : leftParts;

  return parts.map((part) => part.padStart(4, '0'));
}

function ipv4FromHexPairs(firstPair: string, secondPair: string): string {
  const first = Number.parseInt(firstPair, 16);
  const second = Number.parseInt(secondPair, 16);
  return `${first >> 8}.${first & 255}.${second >> 8}.${second & 255}`;
}

function hashIdentifier(secret: string, identifier: string): string {
  return createHmac('sha256', secret).update(identifier).digest('hex');
}

function firstHeaderValue(headers: RequestHeaders, targetName: string): string | undefined {
  const entry = Object.entries(headers).find(([name]) => name.toLowerCase() === targetName);
  const value = entry?.[1];
  if (Array.isArray(value)) return value[0];
  return value;
}
