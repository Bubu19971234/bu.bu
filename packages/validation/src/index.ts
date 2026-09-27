/**
 * Shared request/payload schemas. Used by mobile/web forms and re-applied on
 * the server; the database enforces the same invariants with constraints.
 */
import {
  CLIP_CATEGORIES,
  DOMINANT_FEET,
  FOOTBALL_ROLES,
  MAX_SECONDARY_ROLES,
  MEDIA_KINDS,
  parseIsoDate,
} from '@ftn/core';
import { z } from 'zod';

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
/** Strips control characters from user text before storing it. */
const safeText = (max: number) =>
  z
    .string()
    .max(max)
    // eslint-disable-next-line no-control-regex -- intentionally stripping control characters
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim());

export const uuidSchema = z.uuid();
export const clientOperationIdSchema = z.uuid();

export const isoDateSchema = z.string().refine((v) => parseIsoDate(v) !== null, 'Data non valida (AAAA-MM-GG)');

export const footballRoleSchema = z.enum(FOOTBALL_ROLES);
export const dominantFootSchema = z.enum(DOMINANT_FEET);
export const clipCategorySchema = z.enum(CLIP_CATEGORIES);
export const visibilitySchema = z.enum(['private', 'public']);

const secondaryRoles = z
  .array(footballRoleSchema)
  .max(MAX_SECONDARY_ROLES)
  .refine((roles) => new Set(roles).size === roles.length, 'Ruoli duplicati');

export const playerOnboardingSchema = z
  .object({
    displayName: trimmed(2, 40),
    dateOfBirth: isoDateSchema,
    heightCm: z.number().int().min(120).max(230).nullable(),
    dominantFoot: dominantFootSchema,
    preferredRole: footballRoleSchema,
    secondaryRoles,
    currentClubDisplay: safeText(80).nullable(),
    shirtNumber: z.number().int().min(1).max(99).nullable(),
  })
  .refine((v) => !v.secondaryRoles.includes(v.preferredRole), {
    message: 'Il ruolo principale non può essere anche secondario',
    path: ['secondaryRoles'],
  });
export type PlayerOnboardingInput = z.infer<typeof playerOnboardingSchema>;

export const playerProfileUpdateSchema = z
  .object({
    displayName: trimmed(2, 40),
    heightCm: z.number().int().min(120).max(230).nullable(),
    dominantFoot: dominantFootSchema,
    preferredRole: footballRoleSchema,
    secondaryRoles,
    currentClubDisplay: safeText(80).nullable(),
    shirtNumber: z.number().int().min(1).max(99).nullable(),
    bio: safeText(280).nullable(),
  })
  .partial();
export type PlayerProfileUpdateInput = z.infer<typeof playerProfileUpdateSchema>;

export const createUploadSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
  mimeType: z.string().min(3).max(100),
  sizeBytes: z.number().int().positive(),
  durationMs: z.number().int().positive().nullable(),
  clientOperationId: clientOperationIdSchema,
});
export type CreateUploadInput = z.infer<typeof createUploadSchema>;

export const createClipSchema = z.object({
  mediaId: uuidSchema,
  category: clipCategorySchema,
  title: safeText(80).nullable(),
  identificationNote: safeText(200).nullable(),
});
export type CreateClipInput = z.infer<typeof createClipSchema>;

export const guardianRequestSchema = z.object({
  guardianEmail: z.email().max(254).transform((e) => e.toLowerCase()),
  relationship: z.enum(['parent', 'legal_guardian']),
});
export type GuardianRequestInput = z.infer<typeof guardianRequestSchema>;

export const GUARDIAN_CONSENT_SCOPES = ['public_profile', 'public_clips', 'ai_analysis'] as const;
export const guardianAcceptSchema = z.object({
  token: z.string().min(32).max(128),
  consentVersion: z.string().min(1).max(32),
  scopes: z.array(z.enum(GUARDIAN_CONSENT_SCOPES)).min(1),
});
export type GuardianAcceptInput = z.infer<typeof guardianAcceptSchema>;

export const REPORT_REASONS = [
  'inappropriate',
  'harassment',
  'impersonation',
  'minor_safety',
  'spam',
  'copyright',
  'other',
] as const;
export const REPORT_TARGET_TYPES = ['player_profile', 'clip', 'user'] as const;

export const reportContentSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: uuidSchema,
  reason: z.enum(REPORT_REASONS),
  details: safeText(1000).nullable(),
  clientOperationId: clientOperationIdSchema,
});
export type ReportContentInput = z.infer<typeof reportContentSchema>;

export const deletionRequestSchema = z.object({
  reason: safeText(500).nullable(),
});

export const idempotencyKeySchema = z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/);
