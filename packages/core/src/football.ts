/**
 * Football domain vocabulary. Codes are stable identifiers stored in the
 * database; labels are presentation only and may be localized later.
 */

export const FOOTBALL_ROLES = [
  'GK',
  'RB',
  'CB',
  'LB',
  'RWB',
  'LWB',
  'DM',
  'CM',
  'AM',
  'RM',
  'LM',
  'RW',
  'LW',
  'SS',
  'ST',
] as const;
export type FootballRole = (typeof FOOTBALL_ROLES)[number];

export const FOOTBALL_ROLE_LABELS_IT: Record<FootballRole, string> = {
  GK: 'Portiere',
  RB: 'Terzino destro',
  CB: 'Difensore centrale',
  LB: 'Terzino sinistro',
  RWB: 'Quinto destro',
  LWB: 'Quinto sinistro',
  DM: 'Mediano',
  CM: 'Centrocampista centrale',
  AM: 'Trequartista',
  RM: 'Esterno destro',
  LM: 'Esterno sinistro',
  RW: 'Ala destra',
  LW: 'Ala sinistra',
  SS: 'Seconda punta',
  ST: 'Centravanti',
};

export const DOMINANT_FEET = ['left', 'right', 'both'] as const;
export type DominantFoot = (typeof DOMINANT_FEET)[number];

export const DOMINANT_FOOT_LABELS_IT: Record<DominantFoot, string> = {
  left: 'Sinistro',
  right: 'Destro',
  both: 'Ambidestro',
};

export const MAX_SECONDARY_ROLES = 3;

export const CLIP_CATEGORIES = [
  'dribbling',
  'shooting',
  'passing',
  'build_up',
  'defending',
  'athletic',
  'set_piece',
  'goalkeeping',
  'other',
] as const;
export type ClipCategory = (typeof CLIP_CATEGORIES)[number];

export const CLIP_CATEGORY_LABELS_IT: Record<ClipCategory, string> = {
  dribbling: 'Dribbling / 1v1',
  shooting: 'Tiro / finalizzazione',
  passing: 'Passaggio / visione',
  build_up: 'Costruzione',
  defending: 'Azione difensiva',
  athletic: 'Velocità / atletica',
  set_piece: 'Palla inattiva',
  goalkeeping: 'Portiere',
  other: 'Altro',
};

/**
 * Where a displayed datum comes from (master spec §43). The UI must not
 * silently merge these origins.
 */
export const DATA_ORIGINS = [
  'self_declared',
  'club_verified',
  'official_source',
  'derived',
  'ai_observed',
  'scout_private',
] as const;
export type DataOrigin = (typeof DATA_ORIGINS)[number];
