import { describe, expect, it } from 'vitest';
import { createUploadSchema, guardianRequestSchema, playerOnboardingSchema, reportContentSchema } from './index';

const base = {
  displayName: '  Mario Rossi ',
  dateOfBirth: '2010-05-04',
  heightCm: 172,
  dominantFoot: 'right' as const,
  preferredRole: 'CM' as const,
  secondaryRoles: ['AM' as const],
  currentClubDisplay: 'ASD Test\u0007',
  shirtNumber: 10,
};

describe('validation', () => {
  it('trims names and strips control characters', () => {
    const v = playerOnboardingSchema.parse(base);
    expect(v.displayName).toBe('Mario Rossi');
    expect(v.currentClubDisplay).toBe('ASD Test');
  });

  it('rejects preferred role repeated as secondary, duplicates and too many roles', () => {
    expect(() => playerOnboardingSchema.parse({ ...base, secondaryRoles: ['CM'] })).toThrow();
    expect(() => playerOnboardingSchema.parse({ ...base, secondaryRoles: ['AM', 'AM'] })).toThrow();
    expect(() => playerOnboardingSchema.parse({ ...base, secondaryRoles: ['AM', 'ST', 'LW', 'RW'] })).toThrow();
  });

  it('rejects impossible dates', () => {
    expect(() => playerOnboardingSchema.parse({ ...base, dateOfBirth: '2010-02-31' })).toThrow();
  });

  it('normalizes guardian email and requires a client operation id for writes', () => {
    expect(guardianRequestSchema.parse({ guardianEmail: 'Mum@Example.com', relationship: 'parent' }).guardianEmail).toBe('mum@example.com');
    expect(() => createUploadSchema.parse({ kind: 'player_clip', mimeType: 'video/mp4', sizeBytes: 10, durationMs: 1000 })).toThrow();
    expect(() =>
      reportContentSchema.parse({ targetType: 'clip', targetId: 'x', reason: 'spam', details: null, clientOperationId: crypto.randomUUID() }),
    ).toThrow();
  });
});
