import { AppError, toAppError } from './errors';

/**
 * Client for our own server routes (Next.js on Vercel), used for privileged
 * workflows: media processing, guardian invitations, AI, playback URLs.
 */
export interface ApiClient {
  post<T>(path: string, body: unknown, options?: { idempotencyKey?: string }): Promise<T>;
  get<T>(path: string): Promise<T>;
}

export interface ApiClientConfig {
  baseUrl: string;
  /** Returns the current user's access token, or null for anonymous calls. */
  getAccessToken: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const doFetch = config.fetchImpl ?? fetch;
  const request = async <T>(method: 'GET' | 'POST', path: string, body?: unknown, idempotencyKey?: string): Promise<T> => {
    const token = await config.getAccessToken();
    const headers: Record<string, string> = { accept: 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (idempotencyKey) headers['idempotency-key'] = idempotencyKey;
    let res: Response;
    try {
      res = await doFetch(new URL(path, config.baseUrl).toString(), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      throw new AppError('network_error', 'Network error', error);
    }
    const payload = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!res.ok) throw toAppError({ message: payload?.error ?? `http_${res.status}` });
    return payload as T;
  };
  return {
    post: (path, body, options) => request('POST', path, body, options?.idempotencyKey),
    get: (path) => request('GET', path),
  };
}

/** RFC 4122 v4 id for client_operation_id / Idempotency-Key. */
export function newOperationId(): string {
  const c: { randomUUID?: () => string; getRandomValues: (a: Uint8Array) => Uint8Array } =
    globalThis.crypto as unknown as { randomUUID?: () => string; getRandomValues: (a: Uint8Array) => Uint8Array };
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
