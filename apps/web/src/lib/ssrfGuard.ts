/**
 * SSRF Protection Guard
 * Blocks requests to private/loopback IP ranges and non-HTTPS URLs.
 */

const PRIVATE_IP_PATTERNS = [
  // Loopback
  /^127\./,
  /^::1$/,
  /^localhost$/i,
  // Link-local
  /^169\.254\./,
  /^fe80:/i,
  // Private class A
  /^10\./,
  // Private class B: 172.16.0.0 – 172.31.255.255
  /^172\.(1[6-9]|2\d|3[01])\./,
  // Private class C
  /^192\.168\./,
  // IPv4-mapped IPv6
  /^::ffff:10\./,
  /^::ffff:127\./,
  /^::ffff:192\.168\./,
  /^::ffff:172\.(1[6-9]|2\d|3[01])\./,
  // Multicast / reserved
  /^224\./,
  /^240\./,
  // AWS metadata
  /^169\.254\.169\.254$/,
];

export interface SsrfCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validate a URL for SSRF safety.
 * Returns { allowed: true } when safe, or { allowed: false, reason } when blocked.
 */
export function checkSsrf(rawUrl: string): SsrfCheckResult {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { allowed: false, reason: 'Invalid URL format.' };
  }

  // Only allow HTTPS
  if (parsed.protocol !== 'https:') {
    return { allowed: false, reason: 'Only HTTPS URLs are allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Strip surrounding brackets for IPv6 literals
  const bare = hostname.replace(/^\[/, '').replace(/\]$/, '');

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(bare)) {
      return { allowed: false, reason: 'URL resolves to a private or reserved address.' };
    }
  }

  // Block plain "localhost" or hostnames that end with .local
  if (bare === 'localhost' || bare.endsWith('.local')) {
    return { allowed: false, reason: 'URL resolves to a private or reserved address.' };
  }

  return { allowed: true };
}
