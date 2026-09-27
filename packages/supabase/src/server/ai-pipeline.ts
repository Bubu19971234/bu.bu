import './guard';
import {
  AI_OUTPUT_SCHEMA_VERSION,
  type AttributeObservation,
  buildRatingSnapshot,
  CARD_ATTRIBUTES,
  type ClipAnalyzer,
  type ClipCategory,
} from '@ftn/core';
import type { DbClient } from '../client';
import type { Json } from '../database.types';
import { AppError, unwrap } from '../errors';

/**
 * Runs clip analysis with a replaceable provider and stores provenance,
 * observations and a new rating snapshot. Idempotent per
 * (clip, provider, model version, prompt version).
 */
export async function runClipAnalysis(
  service: DbClient,
  analyzer: ClipAnalyzer,
  params: { clipId: string; requestedBy: string },
): Promise<{ runId: string; status: string; snapshotVersion: number | null }> {
  const [run] = unwrap(
    await service.rpc('ai_begin_run', {
      p_clip_id: params.clipId,
      p_provider: analyzer.provider,
      p_model: analyzer.model,
      p_model_version: analyzer.modelVersion,
      p_prompt_version: analyzer.promptVersion,
      p_schema_version: AI_OUTPUT_SCHEMA_VERSION,
      p_requested_by: params.requestedBy,
    }),
  );
  if (!run) throw new AppError('unknown', 'ai_begin_run returned no row');
  if (!run.created) return { runId: run.run_id, status: run.run_status, snapshotVersion: null };

  try {
    const clip = unwrap(
      await service
        .from('player_clips')
        .select('id, media_id, category, identification_note, player_profile_id, media:media_assets(verified_duration_ms), player:player_profiles(preferred_role)')
        .eq('id', params.clipId)
        .single(),
    ) as unknown as {
      id: string;
      media_id: string;
      category: ClipCategory;
      identification_note: string | null;
      player_profile_id: string;
      media: { verified_duration_ms: number | null } | null;
      player: { preferred_role: string } | null;
    };

    const output = await analyzer.analyze({
      clipId: clip.id,
      mediaId: clip.media_id,
      category: clip.category,
      durationMs: clip.media?.verified_duration_ms ?? 0,
      playerRole: clip.player?.preferred_role ?? 'unknown',
      identificationNote: clip.identification_note,
    });

    // Aggregate across all of the player's stored observations + this run.
    const previous = unwrap(
      await service
        .from('ai_observations')
        .select('attribute, score, confidence, evidence_count, source_type, limitations')
        .eq('player_profile_id', clip.player_profile_id)
        .neq('run_id', run.run_id),
    ) as Array<{ attribute: string; score: number | null; confidence: number; evidence_count: number; source_type: string; limitations: string[] }>;
    const all: AttributeObservation[] = [
      ...previous.map((o) => ({
        attribute: o.attribute as AttributeObservation['attribute'],
        score: o.score,
        confidence: Number(o.confidence),
        evidenceCount: o.evidence_count,
        sourceType: o.source_type as AttributeObservation['sourceType'],
        limitations: o.limitations,
      })),
      ...output.observations,
    ];
    const draft = buildRatingSnapshot(all);
    const snapshot: Record<string, Json> = {
      overall: draft.overall,
      confidence: draft.confidence,
      attribute_details: draft.attributes as unknown as Json,
      evidence_coverage: { rated: draft.ratedCount, total: CARD_ATTRIBUTES.length },
    };
    for (const a of CARD_ATTRIBUTES) {
      const r = draft.attributes[a];
      snapshot[a] = r.status === 'rated' ? r.value : null;
    }

    const version = unwrap(
      await service.rpc('ai_complete_run', {
        p_run_id: run.run_id,
        p_observations: output.observations as unknown as Json,
        p_summary: output.summary,
        p_limitations: output.limitations,
        p_missing_evidence: output.missingEvidence,
        p_snapshot: snapshot,
      }),
    );
    return { runId: run.run_id, status: 'succeeded', snapshotVersion: version };
  } catch (error) {
    await service.rpc('ai_fail_run', { p_run_id: run.run_id, p_error: (error as Error).message ?? 'error' });
    throw error;
  }
}
