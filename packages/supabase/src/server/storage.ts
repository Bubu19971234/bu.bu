import './guard';
import type { RangeReader } from '@ftn/core';
import type { DbClient } from '../client';

/**
 * Storage provider abstraction (master spec §5.3). Supabase Storage today;
 * Cloudflare R2/Stream, Mux or S3 can implement the same interface later.
 */
export interface MediaStorage {
  /** Total object size in bytes, or null if the object does not exist. */
  size(bucket: string, path: string): Promise<number | null>;
  rangeReader(bucket: string, path: string): RangeReader;
  signedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
  remove(bucket: string, paths: string[]): Promise<void>;
}

export function createSupabaseMediaStorage(service: DbClient, fetchImpl: typeof fetch = fetch): MediaStorage {
  const signed = async (bucket: string, path: string, ttl: number) => {
    const { data, error } = await service.storage.from(bucket).createSignedUrl(path, ttl);
    if (error || !data) throw new Error(`signed url failed: ${error?.message ?? 'unknown'}`);
    return data.signedUrl;
  };
  const urlCache = new Map<string, Promise<string>>();
  const cachedUrl = (bucket: string, path: string) => {
    const key = `${bucket}/${path}`;
    let url = urlCache.get(key);
    if (!url) {
      url = signed(bucket, path, 300);
      urlCache.set(key, url);
    }
    return url;
  };

  return {
    async size(bucket, path) {
      let url: string;
      try {
        url = await cachedUrl(bucket, path);
      } catch {
        return null;
      }
      const res = await fetchImpl(url, { headers: { range: 'bytes=0-0' } });
      if (res.status === 404 || res.status === 400) return null;
      const range = res.headers.get('content-range');
      await res.body?.cancel();
      const total = range?.split('/')[1];
      if (total && total !== '*') return Number(total);
      const len = res.headers.get('content-length');
      return len ? Number(len) : null;
    },
    rangeReader(bucket, path) {
      return async (offset, length) => {
        if (length <= 0) return new Uint8Array();
        const url = await cachedUrl(bucket, path);
        const res = await fetchImpl(url, { headers: { range: `bytes=${offset}-${offset + length - 1}` } });
        if (!res.ok) throw new Error(`range read failed: ${res.status}`);
        const buf = new Uint8Array(await res.arrayBuffer());
        // A server that ignores Range returns the full body: slice defensively.
        return res.status === 206 ? buf : buf.subarray(offset, offset + length);
      };
    },
    signedUrl: signed,
    async remove(bucket, paths) {
      if (!paths.length) return;
      const { error } = await service.storage.from(bucket).remove(paths);
      if (error) throw new Error(`remove failed: ${error.message}`);
    },
  };
}
