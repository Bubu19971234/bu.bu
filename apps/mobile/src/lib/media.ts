import type { MediaKind } from '@ftn/core';
import type { UploadTarget } from '@ftn/supabase';
import { services } from './supabase';

export type UploadStage = 'preparing' | 'uploading' | 'verifying' | 'done';

export interface LocalAsset {
  uri: string;
  mimeType: string;
  sizeBytes: number;
  durationMs: number | null;
}

async function readBytes(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  return res.arrayBuffer();
}

/**
 * Full upload flow: reserve (idempotent) → direct upload to Storage → mark
 * complete → server-side verification. Passing the same `operationId` on
 * retry reuses the same logical upload.
 */
export async function uploadMedia(
  kind: MediaKind,
  asset: LocalAsset,
  operationId: string,
  onStage: (stage: UploadStage) => void,
): Promise<{ target: UploadTarget; status: string }> {
  onStage('preparing');
  const target = await services.mediaService.createUpload({
    kind,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
    durationMs: asset.durationMs,
    clientOperationId: operationId,
  });
  if (target.status === 'uploading') {
    onStage('uploading');
    const bytes = await readBytes(asset.uri);
    // Phase 1 uses the standard upload. For files > ~6 MB on poor networks,
    // swap in a TUS uploader (resumable) via the `uploader` parameter.
    await services.mediaService.upload(target, bytes, asset.mimeType);
  }
  onStage('verifying');
  const { status } = await services.mediaService.completeUpload(target.mediaId);
  onStage('done');
  return { target, status };
}

export const STAGE_LABELS_IT: Record<UploadStage, string> = {
  preparing: 'Preparazione…',
  uploading: 'Caricamento in corso…',
  verifying: 'Verifica del file sul server…',
  done: 'Completato',
};
