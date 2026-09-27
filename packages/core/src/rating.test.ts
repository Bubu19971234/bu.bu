import { describe, expect, it } from 'vitest';
import { MockClipAnalyzer } from './ai';
import { buildRatingSnapshot, type AttributeObservation } from './rating';

const obs = (attribute: AttributeObservation['attribute'], score: number | null, evidenceCount = 2, confidence = 0.6): AttributeObservation => ({
  attribute,
  score,
  confidence,
  evidenceCount,
  sourceType: 'player_selected_clips',
  limitations: [],
});

describe('buildRatingSnapshot', () => {
  it('marks unseen attributes as insufficient data, not low scores', () => {
    const snap = buildRatingSnapshot([obs('dribbling', 73)]);
    expect(snap.attributes.dribbling.status).toBe('rated');
    expect(snap.attributes.defending).toEqual({ status: 'insufficient_data', evidenceCount: 0 });
    expect(snap.attributes.shooting.status).toBe('insufficient_data');
  });

  it('ignores null scores and requires minimum evidence', () => {
    const snap = buildRatingSnapshot([obs('pace', null, 5), obs('shooting', 80, 1)]);
    expect(snap.attributes.pace.status).toBe('insufficient_data');
    expect(snap.attributes.shooting.status).toBe('insufficient_data');
  });

  it('caps confidence from player-selected highlights', () => {
    const snap = buildRatingSnapshot([obs('passing', 70, 20, 1)]);
    const passing = snap.attributes.passing;
    expect(passing.status === 'rated' && passing.confidence).toBe(0.7);
  });

  it('does not compute overall with low coverage', () => {
    expect(buildRatingSnapshot([obs('pace', 70), obs('shooting', 70), obs('passing', 70)]).overall).toBeNull();
    const full = buildRatingSnapshot(
      (['pace', 'shooting', 'passing', 'dribbling'] as const).map((a) => obs(a, 70, 6, 0.6)),
    );
    expect(full.overall).toBe(70);
  });
});

describe('MockClipAnalyzer', () => {
  it('is deterministic and only scores relevant attributes', async () => {
    const analyzer = new MockClipAnalyzer();
    const input = { clipId: 'c', mediaId: 'm-1', category: 'shooting' as const, durationMs: 30_000, playerRole: 'ST', identificationNote: null };
    const a = await analyzer.analyze(input);
    const b = await analyzer.analyze(input);
    expect(a).toEqual(b);
    expect(a.observations.map((o) => o.attribute)).toEqual(['shooting']);
    expect(a.limitations).toContain('player_identification_unconfirmed');
    expect(a.observations.every((o) => o.confidence <= 0.5)).toBe(true);
  });
});
