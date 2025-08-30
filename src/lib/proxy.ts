// frontend/lib/proxy.ts

// Pick a base once, normalize (no trailing slash)
const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.API_BASE ||
  'http://localhost:8000'; // dev fallback (change to 8080 if your local API runs there)

const BASE = RAW_BASE.replace(/\/+$/, '');

type ProxyInit = RequestInit & { timeoutMs?: number; retries?: number };

function joinUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${p}`;
}

const TRANSIENT_STATUSES = new Set([429, 502, 503, 504]);

export async function proxyBackend(path: string, init: ProxyInit = {}) {
  const { timeoutMs = 10_000, retries = 1, ...fetchInit } = init;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const url = joinUrl(path);

  // default headers (don’t clobber caller’s)
  const headers = new Headers(fetchInit.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  // small retry loop for flaky upstreams
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, {
        ...fetchInit,
        headers,
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
        // Node runtime benefits from keepalive on some hosts
        keepalive: true,
      });

      if (attempt < retries && TRANSIENT_STATUSES.has(res.status)) {
        attempt++;
        // simple backoff: 200ms * 2^attempt
        await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
        continue;
      }

      clearTimeout(timeout);
      return res;
    } catch (err: any) {
      lastErr = err;
      // Only retry AbortError / fetch network errors
      const isAbort = err?.name === 'AbortError';
      if (attempt < retries && (isAbort || String(err).includes('fetch failed'))) {
        attempt++;
        await new Promise((r) => setTimeout(r, 200 * 2 ** attempt));
        continue;
      }
      clearTimeout(timeout);
      throw new Error(`proxyBackend failed: ${String(err)} (to ${url})`);
    }
  }

  clearTimeout(timeout);
  throw new Error(`proxyBackend exhausted retries (to ${url}): ${String(lastErr)}`);
}
