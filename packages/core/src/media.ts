/**
 * Media rules (master spec §5). Client-side checks are for UX only; the
 * server re-validates MIME, size and duration from the stored bytes and the
 * database enforces the player-clip duration limit.
 */

export const MEDIA_KINDS = ['avatar', 'player_clip'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_STATUSES = [
  'uploading',
  'uploaded',
  'processing',
  'pending_moderation',
  'published',
  'rejected',
  'failed',
  'deleted',
] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

/** Hard product rule: a player clip is at most 60 seconds. */
export const PLAYER_CLIP_MAX_DURATION_MS = 60_000;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'] as const;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type VideoMimeType = (typeof VIDEO_MIME_TYPES)[number];
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export const MIME_EXTENSIONS: Record<VideoMimeType | ImageMimeType, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface MediaLimits {
  playerClipMaxDurationMs: number;
  playerClipMaxBytes: number;
  playerClipMaxActive: number;
  avatarMaxBytes: number;
}

/** Defaults; the database `app_config` table is authoritative at runtime. */
export const DEFAULT_MEDIA_LIMITS: MediaLimits = {
  playerClipMaxDurationMs: PLAYER_CLIP_MAX_DURATION_MS,
  playerClipMaxBytes: 150 * 1024 * 1024,
  playerClipMaxActive: 8,
  avatarMaxBytes: 5 * 1024 * 1024,
};

/** Recommended client-side compression target (720p). */
export const CLIP_COMPRESSION_TARGET = { maxHeight: 720, maxWidth: 1280 } as const;

export type MediaRuleViolation =
  | 'mime_not_allowed'
  | 'too_large'
  | 'empty_file'
  | 'duration_missing'
  | 'duration_exceeded';

export interface DeclaredMedia {
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  durationMs?: number | null;
}

export function allowedMimeTypes(kind: MediaKind): readonly string[] {
  return kind === 'avatar' ? IMAGE_MIME_TYPES : VIDEO_MIME_TYPES;
}

export function checkMediaRules(media: DeclaredMedia, limits: MediaLimits = DEFAULT_MEDIA_LIMITS): MediaRuleViolation[] {
  const violations: MediaRuleViolation[] = [];
  if (!allowedMimeTypes(media.kind).includes(media.mimeType)) violations.push('mime_not_allowed');
  if (media.sizeBytes <= 0) violations.push('empty_file');
  const maxBytes = media.kind === 'avatar' ? limits.avatarMaxBytes : limits.playerClipMaxBytes;
  if (media.sizeBytes > maxBytes) violations.push('too_large');
  if (media.kind === 'player_clip') {
    if (media.durationMs == null) violations.push('duration_missing');
    else if (media.durationMs > limits.playerClipMaxDurationMs) violations.push('duration_exceeded');
  }
  return violations;
}

// ---------------------------------------------------------------------------
// Server-side content sniffing. Works on byte ranges so large videos are never
// proxied or fully downloaded through application servers.
// ---------------------------------------------------------------------------

export type RangeReader = (offset: number, length: number) => Promise<Uint8Array>;

export function sniffImageMime(head: Uint8Array): ImageMimeType | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (head.length >= 8 && png.every((b, i) => head[i] === b)) return 'image/png';
  if (
    head.length >= 12 &&
    ascii(head, 0, 4) === 'RIFF' &&
    ascii(head, 8, 4) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

export interface VideoProbe {
  mimeType: VideoMimeType;
  durationMs: number;
}

export class MediaProbeError extends Error {
  constructor(
    message: string,
    readonly code: 'not_iso_bmff' | 'moov_missing' | 'mvhd_missing' | 'malformed' | 'moov_too_large',
  ) {
    super(message);
    this.name = 'MediaProbeError';
  }
}

const MAX_MOOV_BYTES = 16 * 1024 * 1024;
const MAX_TOP_LEVEL_BOXES = 4096;

/**
 * Reads container duration from an ISO-BMFF file (MP4 / QuickTime MOV) by
 * walking top-level boxes with range reads and parsing `moov/mvhd`.
 */
export async function probeIsoBmffVideo(read: RangeReader, fileSize: number): Promise<VideoProbe> {
  let offset = 0;
  let mimeType: VideoMimeType | null = null;
  for (let i = 0; i < MAX_TOP_LEVEL_BOXES && offset + 8 <= fileSize; i += 1) {
    const header = await read(offset, Math.min(16, fileSize - offset));
    const { size, type, headerSize } = readBoxHeader(header, fileSize - offset);
    if (i === 0) {
      if (type !== 'ftyp') throw new MediaProbeError('File is not an MP4/MOV container', 'not_iso_bmff');
      const brandBytes = await read(offset + headerSize, 4);
      mimeType = ascii(brandBytes, 0, 4) === 'qt  ' ? 'video/quicktime' : 'video/mp4';
    }
    if (type === 'moov') {
      const bodySize = size - headerSize;
      if (bodySize > MAX_MOOV_BYTES) throw new MediaProbeError('moov box too large', 'moov_too_large');
      const body = await read(offset + headerSize, bodySize);
      const durationMs = parseMvhdDurationMs(body);
      return { mimeType: mimeType ?? 'video/mp4', durationMs };
    }
    offset += size;
  }
  throw new MediaProbeError('moov box not found', 'moov_missing');
}

function readBoxHeader(bytes: Uint8Array, remaining: number): { size: number; type: string; headerSize: number } {
  if (bytes.length < 8) throw new MediaProbeError('Truncated box header', 'malformed');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let size = view.getUint32(0);
  const type = ascii(bytes, 4, 4);
  let headerSize = 8;
  if (size === 1) {
    if (bytes.length < 16) throw new MediaProbeError('Truncated largesize header', 'malformed');
    const big = view.getBigUint64(8);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) throw new MediaProbeError('Box too large', 'malformed');
    size = Number(big);
    headerSize = 16;
  } else if (size === 0) {
    size = remaining;
  }
  if (size < headerSize || size > remaining) throw new MediaProbeError(`Invalid size for box ${type}`, 'malformed');
  return { size, type, headerSize };
}

function parseMvhdDurationMs(moovBody: Uint8Array): number {
  let offset = 0;
  while (offset + 8 <= moovBody.length) {
    const { size, type, headerSize } = readBoxHeader(
      moovBody.subarray(offset, offset + 16),
      moovBody.length - offset,
    );
    if (type === 'mvhd') {
      const box = moovBody.subarray(offset + headerSize, offset + size);
      const view = new DataView(box.buffer, box.byteOffset, box.byteLength);
      const version = box[0];
      let timescale: number;
      let duration: number;
      if (version === 1) {
        if (box.length < 32) throw new MediaProbeError('Truncated mvhd', 'malformed');
        timescale = view.getUint32(20);
        duration = Number(view.getBigUint64(24));
      } else {
        if (box.length < 20) throw new MediaProbeError('Truncated mvhd', 'malformed');
        timescale = view.getUint32(12);
        duration = view.getUint32(16);
      }
      if (timescale === 0) throw new MediaProbeError('mvhd timescale is zero', 'malformed');
      return Math.round((duration / timescale) * 1000);
    }
    offset += size;
  }
  throw new MediaProbeError('mvhd box not found', 'mvhd_missing');
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = '';
  for (let i = start; i < start + length && i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]!);
  return out;
}

/** Test/helper: builds a minimal MP4 byte layout with the given duration. */
export function buildTestMp4(options: {
  durationMs: number;
  brand?: string;
  moovAtEnd?: boolean;
  mdatBytes?: number;
  mvhdVersion?: 0 | 1;
}): Uint8Array {
  const timescale = 1000;
  const brand = options.brand ?? 'isom';
  const version = options.mvhdVersion ?? 0;
  const box = (type: string, body: Uint8Array): Uint8Array => {
    const out = new Uint8Array(8 + body.length);
    new DataView(out.buffer).setUint32(0, out.length);
    for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
    out.set(body, 8);
    return out;
  };
  const ftypBody = new Uint8Array(8);
  for (let i = 0; i < 4; i += 1) ftypBody[i] = brand.charCodeAt(i);
  const mvhdBody = new Uint8Array(version === 1 ? 112 : 100);
  const mv = new DataView(mvhdBody.buffer);
  mvhdBody[0] = version;
  if (version === 1) {
    mv.setUint32(20, timescale);
    mv.setBigUint64(24, BigInt(options.durationMs));
  } else {
    mv.setUint32(12, timescale);
    mv.setUint32(16, options.durationMs);
  }
  const moov = box('moov', box('mvhd', mvhdBody));
  const mdat = box('mdat', new Uint8Array(options.mdatBytes ?? 64));
  const parts = options.moovAtEnd
    ? [box('ftyp', ftypBody), mdat, moov]
    : [box('ftyp', ftypBody), moov, mdat];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
