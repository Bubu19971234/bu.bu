import { type ReportContentInput, reportContentSchema } from '@ftn/validation';
import type { DbClient } from '../client';
import { unwrap } from '../errors';

export function createModerationService(db: DbClient) {
  return {
    /** Idempotent via clientOperationId; duplicate open reports are merged. */
    async reportContent(input: ReportContentInput): Promise<string> {
      const v = reportContentSchema.parse(input);
      return unwrap(
        await db.rpc('report_content', {
          p_target_type: v.targetType,
          p_target_id: v.targetId,
          p_reason: v.reason,
          p_details: v.details,
          p_client_operation_id: v.clientOperationId,
        }),
      );
    },
    async blockUser(playerProfileId: string) {
      unwrap(await db.rpc('block_player', { p_player_profile_id: playerProfileId }));
    },
    async unblockUser(playerProfileId: string) {
      unwrap(await db.rpc('unblock_player', { p_player_profile_id: playerProfileId }));
    },
    async listBlocked() {
      return unwrap(await db.rpc('my_blocked_players'));
    },
  };
}
