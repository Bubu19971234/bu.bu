import { checkMediaRules, type MediaKind } from '@ftn/core';
import { createUploadSchema } from '@ftn/validation';
import type { ApiClient } from '../api';
import { newOperationId } from '../api';
import type { DbClient } from '../client';
import type { MediaAssetRow, MediaStatusDb } from '../database.types';
import { AppError, unwrap, unwrapMaybe } from '../errors';

export interface UploadTarget {
  mediaId: string;
  bucket: string;
  path: string;
  status: MediaStatusDb;
  clientOperationId: string;
}

export interface CreateUploadParams {
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
  /** Reuse the same id when retrying so the server returns the same upload. */
  clientOperationId?: string;
}

/**
 * Transport for the file bytes. Default uses Supabase Storage standard upload;
 * large files should use a resumable (TUS) uploader against the same
 * bucket/path (see docs/DATA_MODEL.md §Media).
 */
export type Uploader = (target: UploadTarget, body: Blob | ArrayBuffer, contentType: string) => Promise<void>;

export function createMediaService(db: DbClient, api: ApiClient) {
  const standardUpload: Uploader = async (target, body, contentType) => {
    const { error } = await db.storage.from(target.bucket).upload(target.path, body, { contentType, upsert: false });
    // Duplicate on retry means the bytes are already there.
    if (error && !/exists|duplicate/i.test(error.message)) throw new AppError('unknown', error.message, error);
  };

  return {
    async createUpload(params: CreateUploadParams): Promise<UploadTarget> {
      const clientOperationId = params.clientOperationId ?? newOperationId();
      const v = createUploadSchema.parse({ ...params, clientOperationId });
      const violations = checkMediaRules({ kind: v.kind, mimeType: v.mimeType, sizeBytes: v.sizeBytes, durationMs: v.durationMs });
      if (violations.length) throw new AppError(violations.includes('duration_exceeded') ? 'duration_exceeded' : violations[0] === 'too_large' ? 'file_too_large' : violations[0] === 'mime_not_allowed' ? 'mime_not_allowed' : 'validation_failed');
      const r = unwrap(
        await db.rpc('media_create_upload', {
          p_kind: v.kind,
          p_mime: v.mimeType,
          p_size_bytes: v.sizeBytes,
          p_duration_ms: v.durationMs,
          p_client_operation_id: clientOperationId,
        }),
      );
      return { mediaId: r.media_id, bucket: r.bucket, path: r.path, status: r.status, clientOperationId };
    },

    upload(target: UploadTarget, body: Blob | ArrayBuffer, contentType: string, uploader: Uploader = standardUpload) {
      return uploader(target, body, contentType);
    },

    /** Marks upload done and asks the server to verify the stored bytes. */
    async completeUpload(mediaId: string): Promise<{ status: MediaStatusDb }> {
      unwrap(await db.rpc('media_complete_upload', { p_media_id: mediaId }));
      return api.post(`/api/media/${mediaId}/process`, {});
    },

    async deleteMedia(mediaId: string) {
      unwrap(await db.rpc('media_delete', { p_media_id: mediaId }));
    },

    /** Short-lived signed URL, only if the caller may view the media. */
    async getPlayableUrl(mediaId: string): Promise<{ url: string; expiresIn: number }> {
      return api.get(`/api/media/${mediaId}/url`);
    },

    async getStatus(mediaId: string): Promise<Pick<MediaAssetRow, 'id' | 'status' | 'rejection_reason' | 'verified_duration_ms'> | null> {
      return unwrapMaybe(
        await db.from('media_assets').select('id, status, rejection_reason, verified_duration_ms').eq('id', mediaId).maybeSingle(),
      );
    },
  };
}
