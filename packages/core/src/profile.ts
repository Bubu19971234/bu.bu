/**
 * Player profile rules shared by UI and server. Publication is decided by the
 * database (`public.player_is_public`); this mirror only drives UI state.
 */
import type { AgeBand } from './age';
import type { ClipCategory } from './football';

export type ProfileVisibility = 'private' | 'public';
export type AccountStatus = 'active' | 'suspended' | 'deletion_requested' | 'deleted';

export interface PublicationInputs {
  visibility: ProfileVisibility;
  accountStatus: AccountStatus;
  ageBand: AgeBand;
  hasActiveGuardianConsent: boolean;
  moderationHidden: boolean;
}

export type PublicationBlocker =
  | 'visibility_private'
  | 'guardian_consent_required'
  | 'account_inactive'
  | 'moderation_hidden';

export function publicationBlockers(input: PublicationInputs): PublicationBlocker[] {
  const blockers: PublicationBlocker[] = [];
  if (input.visibility !== 'public') blockers.push('visibility_private');
  if (input.ageBand === 'minor' && !input.hasActiveGuardianConsent) blockers.push('guardian_consent_required');
  if (input.accountStatus !== 'active') blockers.push('account_inactive');
  if (input.moderationHidden) blockers.push('moderation_hidden');
  return blockers;
}

/** Lowercase ASCII slug base from a display name. */
export function slugify(input: string): string {
  const base = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'giocatore';
}

// --- Missions (safe, non-manipulative profile-completion tasks, spec §4.3) ---

export type MissionId =
  | 'add_photo'
  | 'complete_roles'
  | 'connect_club'
  | 'guardian_approval'
  | 'first_clip'
  | 'defensive_clip'
  | 'passing_clip'
  | 'make_public';

export interface MissionInputs {
  hasPublishedAvatar: boolean;
  hasSecondaryRoles: boolean;
  hasClubDisplay: boolean;
  ageBand: AgeBand;
  hasActiveGuardianConsent: boolean;
  clipCategories: ClipCategory[];
  visibility: ProfileVisibility;
}

export interface Mission {
  id: MissionId;
  done: boolean;
}

export function profileMissions(input: MissionInputs): Mission[] {
  const missions: Mission[] = [
    { id: 'add_photo', done: input.hasPublishedAvatar },
    { id: 'complete_roles', done: input.hasSecondaryRoles },
    { id: 'connect_club', done: input.hasClubDisplay },
    { id: 'first_clip', done: input.clipCategories.length > 0 },
    { id: 'defensive_clip', done: input.clipCategories.includes('defending') },
    { id: 'passing_clip', done: input.clipCategories.some((c) => c === 'passing' || c === 'build_up') },
    { id: 'make_public', done: input.visibility === 'public' },
  ];
  if (input.ageBand === 'minor') {
    missions.splice(0, 0, { id: 'guardian_approval', done: input.hasActiveGuardianConsent });
  }
  return missions;
}

export const MISSION_LABELS_IT: Record<MissionId, string> = {
  add_photo: 'Aggiungi una foto profilo',
  complete_roles: 'Indica i ruoli secondari',
  connect_club: 'Indica la tua squadra attuale',
  guardian_approval: 'Ottieni l’approvazione del genitore/tutore',
  first_clip: 'Carica il tuo primo clip',
  defensive_clip: 'Aggiungi un clip difensivo',
  passing_clip: 'Aggiungi un clip di passaggio',
  make_public: 'Rendi pubblico il profilo',
};
