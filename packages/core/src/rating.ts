/**
 * Gamified card attributes (master spec §4.2, §6.2, §35).
 *
 * These numbers are *indicators*, not measurements. Rules encoded here:
 *  - an attribute without enough evidence is `insufficient_data`, never a low
 *    score ("not seen in clips" ≠ "bad at it");
 *  - confidence from player-selected highlights is capped;
 *  - `overall` is only computed when evidence coverage is adequate.
 */

export const CARD_ATTRIBUTES = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const;
export type CardAttribute = (typeof CARD_ATTRIBUTES)[number];

export const CARD_ATTRIBUTE_SHORT: Record<CardAttribute, string> = {
  pace: 'VEL',
  shooting: 'TIR',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DIF',
  physical: 'FIS',
};

export const CARD_ATTRIBUTE_LABELS_IT: Record<CardAttribute, string> = {
  pace: 'Velocità',
  shooting: 'Tiro',
  passing: 'Passaggio',
  dribbling: 'Dribbling',
  defending: 'Difesa',
  physical: 'Fisico',
};

export const OBSERVATION_SOURCE_TYPES = ['player_selected_clips', 'club_media', 'match_data', 'manual'] as const;
export type ObservationSourceType = (typeof OBSERVATION_SOURCE_TYPES)[number];

export interface AttributeObservation {
  attribute: CardAttribute;
  /** 1–99, or null when the input did not show this attribute. */
  score: number | null;
  /** 0–1 */
  confidence: number;
  evidenceCount: number;
  sourceType: ObservationSourceType;
  limitations: string[];
}

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type AttributeRating =
  | { status: 'rated'; value: number; confidence: number; level: ConfidenceLevel; evidenceCount: number; sources: ObservationSourceType[] }
  | { status: 'insufficient_data'; evidenceCount: number };

export interface RatingSnapshotDraft {
  attributes: Record<CardAttribute, AttributeRating>;
  overall: number | null;
  /** Mean confidence across rated attributes (0 when none rated). */
  confidence: number;
  ratedCount: number;
}

export const MIN_EVIDENCE_PER_ATTRIBUTE = 2;
export const MIN_RATED_ATTRIBUTES_FOR_OVERALL = 4;
export const MIN_CONFIDENCE_FOR_OVERALL = 0.35;
/** Selected highlights cannot yield "high" certainty on their own. */
export const CONFIDENCE_CAP: Record<ObservationSourceType, number> = {
  player_selected_clips: 0.7,
  club_media: 0.8,
  match_data: 0.9,
  manual: 0.8,
};

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence < 0.35) return 'low';
  if (confidence < 0.6) return 'medium';
  return 'high';
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function buildRatingSnapshot(observations: readonly AttributeObservation[]): RatingSnapshotDraft {
  const attributes = {} as Record<CardAttribute, AttributeRating>;
  for (const attribute of CARD_ATTRIBUTES) {
    const scored = observations.filter(
      (o) => o.attribute === attribute && o.score !== null && o.evidenceCount > 0 && o.confidence > 0,
    );
    const evidenceCount = scored.reduce((n, o) => n + o.evidenceCount, 0);
    if (evidenceCount < MIN_EVIDENCE_PER_ATTRIBUTE) {
      attributes[attribute] = { status: 'insufficient_data', evidenceCount };
      continue;
    }
    let weightSum = 0;
    let scoreSum = 0;
    let confSum = 0;
    for (const o of scored) {
      const w = clamp(o.confidence, 0, 1) * o.evidenceCount;
      weightSum += w;
      scoreSum += w * clamp(o.score as number, 1, 99);
      confSum += clamp(o.confidence, 0, 1) * o.evidenceCount;
    }
    const sources = [...new Set(scored.map((o) => o.sourceType))];
    const cap = Math.max(...sources.map((s) => CONFIDENCE_CAP[s]));
    const avgConfidence = confSum / evidenceCount;
    const coverage = Math.min(1, Math.sqrt(evidenceCount / 6));
    const confidence = Number(Math.min(cap, avgConfidence * coverage).toFixed(2));
    attributes[attribute] = {
      status: 'rated',
      value: Math.round(scoreSum / weightSum),
      confidence,
      level: confidenceLevel(confidence),
      evidenceCount,
      sources,
    };
  }
  const rated = CARD_ATTRIBUTES.map((a) => attributes[a]).filter(
    (r): r is Extract<AttributeRating, { status: 'rated' }> => r.status === 'rated',
  );
  const confidence = rated.length ? Number((rated.reduce((n, r) => n + r.confidence, 0) / rated.length).toFixed(2)) : 0;
  const overall =
    rated.length >= MIN_RATED_ATTRIBUTES_FOR_OVERALL && confidence >= MIN_CONFIDENCE_FOR_OVERALL
      ? Math.round(rated.reduce((n, r) => n + r.value, 0) / rated.length)
      : null;
  return { attributes, overall, confidence, ratedCount: rated.length };
}
