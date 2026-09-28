import type { ApiClient } from './api';
import type { DbClient } from './client';
import { createAiService } from './services/ai';
import { createAuthService } from './services/auth';
import { createClipService } from './services/clip';
import { createGuardianService } from './services/guardian';
import { createMediaService } from './services/media';
import { createModerationService } from './services/moderation';
import { createPlayerService } from './services/player';

export * from './api';
export * from './client';
export type * from './database.types';
export * from './errors';
export type { MyClip } from './services/clip';
export { PRIVACY_VERSION, TERMS_VERSION } from './services/guardian';
export type { CreateUploadParams, Uploader, UploadTarget } from './services/media';
export type { MyPlayerProfile } from './services/player';

/**
 * Domain-facing services (master spec §23/§33). UI code calls these, never
 * raw table queries, so the backing implementation can change.
 */
export function createServices(db: DbClient, api: ApiClient) {
  return {
    authService: createAuthService(db),
    playerService: createPlayerService(db),
    guardianService: createGuardianService(db, api),
    mediaService: createMediaService(db, api),
    clipService: createClipService(db),
    aiService: createAiService(db, api),
    moderationService: createModerationService(db),
  };
}
export type Services = ReturnType<typeof createServices>;
