import { describe, expect, it } from 'vitest';
import { buildTestMp4, checkMediaRules, MediaProbeError, probeIsoBmffVideo, sniffImageMime } from './media';

const readerFor = (bytes: Uint8Array) => {
  const calls: Array<[number, number]> = [];
  const read = async (offset: number, length: number) => {
    calls.push([offset, length]);
    return bytes.slice(offset, offset + length);
  };
  return { read, calls };
};

describe('checkMediaRules', () => {
  it('rejects clips over 60 seconds', () => {
    expect(checkMediaRules({ kind: 'player_clip', mimeType: 'video/mp4', sizeBytes: 1000, durationMs: 60_001 })).toEqual([
      'duration_exceeded',
    ]);
    expect(checkMediaRules({ kind: 'player_clip', mimeType: 'video/mp4', sizeBytes: 1000, durationMs: 60_000 })).toEqual([]);
  });

  it('rejects disallowed MIME types and missing duration', () => {
    expect(checkMediaRules({ kind: 'player_clip', mimeType: 'video/x-msvideo', sizeBytes: 1, durationMs: null })).toEqual([
      'mime_not_allowed',
      'duration_missing',
    ]);
    expect(checkMediaRules({ kind: 'avatar', mimeType: 'image/gif', sizeBytes: 10 })).toEqual(['mime_not_allowed']);
  });
});

describe('probeIsoBmffVideo', () => {
  it('reads duration from moov at start', async () => {
    const bytes = buildTestMp4({ durationMs: 42_500 });
    const { read } = readerFor(bytes);
    await expect(probeIsoBmffVideo(read, bytes.length)).resolves.toEqual({ mimeType: 'video/mp4', durationMs: 42_500 });
  });

  it('skips mdat without reading it when moov is at the end', async () => {
    const bytes = buildTestMp4({ durationMs: 61_000, moovAtEnd: true, mdatBytes: 50_000, mvhdVersion: 1 });
    const { read, calls } = readerFor(bytes);
    const probe = await probeIsoBmffVideo(read, bytes.length);
    expect(probe.durationMs).toBe(61_000);
    expect(Math.max(...calls.map(([, len]) => len))).toBeLessThan(1_000);
  });

  it('detects QuickTime brand', async () => {
    const bytes = buildTestMp4({ durationMs: 1000, brand: 'qt  ' });
    const { read } = readerFor(bytes);
    expect((await probeIsoBmffVideo(read, bytes.length)).mimeType).toBe('video/quicktime');
  });

  it('rejects non-MP4 content', async () => {
    const bytes = new TextEncoder().encode('<html>not a video</html>');
    const { read } = readerFor(bytes);
    await expect(probeIsoBmffVideo(read, bytes.length)).rejects.toBeInstanceOf(MediaProbeError);
  });
});

describe('sniffImageMime', () => {
  it('detects by magic bytes, not by name', () => {
    expect(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('image/png');
    expect(sniffImageMime(new TextEncoder().encode('GIF89a'))).toBeNull();
  });
});
