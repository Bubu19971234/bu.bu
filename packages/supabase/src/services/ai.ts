import type { ApiClient } from '../api';
import { newOperationId } from '../api';
import type { DbClient } from '../client';
import type { AiAnalysisRunRow, AiObservationRow, PlayerRatingSnapshotRow } from '../database.types';
import { unwrap } from '../errors';

export function createAiService(db: DbClient, api: ApiClient) {
  return {
    /** Server-side, idempotent per clip + model + prompt version. */
    async requestClipAnalysis(clipId: string): Promise<{ runId: string; status: string; snapshotVersion: number | null }> {
      return api.post('/api/ai/clip-analysis', { clipId }, { idempotencyKey: newOperationId() });
    },

    async getLatestPlayerAnalysis(playerProfileId: string): Promise<{
      snapshot: PlayerRatingSnapshotRow | null;
      previous: PlayerRatingSnapshotRow | null;
      runs: Array<AiAnalysisRunRow & { observations: AiObservationRow[] }>;
    }> {
      const snaps = unwrap(
        await db
          .from('player_rating_snapshots')
          .select('*')
          .eq('player_profile_id', playerProfileId)
          .order('version', { ascending: false })
          .limit(2),
      ) as PlayerRatingSnapshotRow[];
      const runs = unwrap(
        await db
          .from('ai_analysis_runs')
          .select('*, observations:ai_observations(*)')
          .eq('player_profile_id', playerProfileId)
          .order('created_at', { ascending: false })
          .limit(10),
      ) as unknown as Array<AiAnalysisRunRow & { observations: AiObservationRow[] }>;
      return { snapshot: snaps[0] ?? null, previous: snaps[1] ?? null, runs };
    },
  };
}
