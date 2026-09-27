import './guard';
import { MediaProbeError, probeIsoBmffVideo, sniffImageMime } from '@ftn/core';
import type { DbClient } from '../client';
import type { MediaStatusDb } from '../database.types';
import { AppError, unwrap } from '../errors';
import type { MediaStorage } from './storage';

/**
 * Verifies an uploaded asset from the stored bytes (never trusting the
 * client): existence, size, real MIME by content sniffing, and container
 * duration for video. The database then decides the state transition.
 * Reads only headers/metadata boxes via range requests.
 */
export async function processUploadedMedia(service: DbClient, storage: MediaStorage, mediaId: string): Promise<MediaStatusDb> {
  const rows = unwrap(await service.rpc('media_begin_processing', { p_media_id: mediaId }));
  const media = rows[0];
  if (!media) throw new AppError('media_not_found');
  if (media.status !== 'processing') return media.status;

  const record = async (mime: string | null, size: number | null, durationMs: number | null, error: string | null) =>
    unwrap(
      await service.rpc('media_record_probe', {
        p_media_id: mediaId,
        p_verified_mime: mime,
        p_verified_size_bytes: size,
        p_verified_duration_ms: durationMs,
        p_error: error,
      }),
    );

  const size = await storage.size(media.bucket, media.storage_path);
  if (size === null) return record(null, null, null, 'object_missing');
  const read = storage.rangeReader(media.bucket, media.storage_path);

  try {
    if (media.kind === 'avatar') {
      const head = await read(0, Math.min(16, size));
      return record(sniffImageMime(head) ?? 'application/octet-stream', size, null, null);
    }
    const probe = await probeIsoBmffVideo(read, size);
    return record(probe.mimeType, size, probe.durationMs, null);
  } catch (error) {
    if (error instanceof MediaProbeError) {
      // Unparseable/unsupported container → rejected as not allowed, not "failed".
      return record('application/octet-stream', size, null, null);
    }
    return record(null, size, null, `probe_error:${(error as Error).message}`.slice(0, 200));
  }
}
