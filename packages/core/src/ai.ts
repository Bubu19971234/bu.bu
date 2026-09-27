/**
 * AI clip analysis contract (master spec §6). Providers are replaceable; the
 * pipeline stores provenance (provider/model/prompt/schema versions) with
 * every run. Phase 1 ships a deterministic mock provider only.
 */
import type { ClipCategory } from './football';
import type { AttributeObservation, CardAttribute } from './rating';

export const AI_OUTPUT_SCHEMA_VERSION = 'clip-observations/v1';

export interface ClipAnalysisInput {
  clipId: string;
  mediaId: string;
  category: ClipCategory;
  durationMs: number;
  playerRole: string;
  /** Player-provided hint about which person they are in the clip. */
  identificationNote: string | null;
}

export interface ClipAnalysisOutput {
  observations: AttributeObservation[];
  summary: string;
  missingEvidence: CardAttribute[];
  limitations: string[];
}

export interface ClipAnalyzer {
  readonly provider: string;
  readonly model: string;
  readonly modelVersion: string;
  readonly promptVersion: string;
  analyze(input: ClipAnalysisInput): Promise<ClipAnalysisOutput>;
}

/** Which card attributes a clip category can plausibly evidence. */
export const CATEGORY_ATTRIBUTE_RELEVANCE: Record<ClipCategory, CardAttribute[]> = {
  dribbling: ['dribbling', 'pace'],
  shooting: ['shooting'],
  passing: ['passing'],
  build_up: ['passing', 'dribbling'],
  defending: ['defending', 'physical'],
  athletic: ['pace', 'physical'],
  set_piece: ['shooting', 'passing'],
  goalkeeping: [],
  other: [],
};

const BASE_LIMITATIONS = ['selected_highlights', 'no_full_match_context'];

/** FNV-1a — stable across runtimes, good enough for deterministic mocks. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic, deliberately conservative mock. Scores stay in a narrow
 * band and confidence is low: it exercises the pipeline without pretending
 * to measure anything.
 */
export class MockClipAnalyzer implements ClipAnalyzer {
  readonly provider = 'mock';
  readonly model = 'mock-clip-analyzer';
  readonly modelVersion = '1';
  readonly promptVersion = 'mock-v1';

  async analyze(input: ClipAnalysisInput): Promise<ClipAnalysisOutput> {
    const relevant = CATEGORY_ATTRIBUTE_RELEVANCE[input.category];
    const limitations = [...BASE_LIMITATIONS, 'mock_provider'];
    if (!input.identificationNote) limitations.push('player_identification_unconfirmed');
    const observations: AttributeObservation[] = relevant.map((attribute, index) => {
      const h = hash32(`${input.mediaId}:${attribute}`);
      return {
        attribute,
        score: 55 + (h % 21),
        confidence: Number((0.3 + ((h >>> 8) % 20) / 100).toFixed(2)),
        evidenceCount: index === 0 ? 2 : 1,
        sourceType: 'player_selected_clips',
        limitations,
      };
    });
    const missingEvidence = (['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'] as const).filter(
      (a) => !relevant.includes(a),
    );
    const summary = relevant.length
      ? `Osservazioni preliminari (demo) su: ${relevant.join(', ')}. Basate su un singolo clip scelto dal giocatore.`
      : 'Nessun attributo valutabile da questo clip con il modello attuale.';
    return { observations, summary, missingEvidence, limitations };
  }
}
