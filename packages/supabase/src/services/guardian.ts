import { type GuardianRequestInput, guardianRequestSchema } from '@ftn/validation';
import type { ApiClient } from '../api';
import { newOperationId } from '../api';
import type { DbClient } from '../client';
import type { GuardianConsentRow, GuardianRelationshipRow } from '../database.types';
import { unwrap, unwrapMaybe } from '../errors';

export const TERMS_VERSION = '2026-09-draft';
export const PRIVACY_VERSION = '2026-09-draft';

export function createGuardianService(db: DbClient, api: ApiClient) {
  return {
    /**
     * Player (13–17) invites a guardian. Goes through the server so the
     * invitation token is emailed to the guardian and never returned to the
     * minor's device.
     */
    async createRequest(input: GuardianRequestInput): Promise<{ relationshipId: string }> {
      const v = guardianRequestSchema.parse(input);
      return api.post('/api/guardian/requests', v, { idempotencyKey: newOperationId() });
    },

    async listForPlayer(): Promise<Array<Pick<GuardianRelationshipRow, 'id' | 'invited_email' | 'status' | 'relationship_type' | 'created_at'>>> {
      return unwrap(
        await db
          .from('guardian_relationships')
          .select('id, invited_email, status, relationship_type, created_at')
          .order('created_at', { ascending: false })
          .limit(20),
      );
    },

    async previewInvitation(token: string) {
      return unwrapMaybe(await db.rpc('guardian_invitation_preview', { p_token: token }));
    },

    /** Guardian accepts and records versioned consent. Safe to retry. */
    async approveRelationship(token: string, consentVersion: string, scopes: string[]) {
      return unwrap(
        await db.rpc('guardian_accept', {
          p_token: token,
          p_consent_version: consentVersion,
          p_terms_version: TERMS_VERSION,
          p_privacy_version: PRIVACY_VERSION,
          p_scopes: scopes,
        }),
      );
    },

    async grantConsent(relationshipId: string, consentVersion: string, scopes: string[]) {
      return unwrap(
        await db.rpc('guardian_grant_consent', {
          p_relationship_id: relationshipId,
          p_consent_version: consentVersion,
          p_terms_version: TERMS_VERSION,
          p_privacy_version: PRIVACY_VERSION,
          p_scopes: scopes,
        }),
      );
    },

    async revokeConsent(relationshipId: string) {
      unwrap(await db.rpc('guardian_revoke_consent', { p_relationship_id: relationshipId }));
    },

    async listMyWards(): Promise<
      Array<GuardianRelationshipRow & { consents: GuardianConsentRow[]; player: { display_name: string; slug: string } | null }>
    > {
      const uid = (await db.auth.getSession()).data.session?.user.id;
      if (!uid) return [];
      const rels = unwrap(
        await db
          .from('guardian_relationships')
          .select('id, player_profile_id, guardian_user_id, invited_email, relationship_type, status, verification_state, invite_expires_at, accepted_at, revoked_at, created_at, updated_at')
          .eq('guardian_user_id', uid),
      ) as GuardianRelationshipRow[];
      if (!rels.length) return [];
      const consents = unwrap(
        await db.from('guardian_consents').select('*').in('relationship_id', rels.map((r) => r.id)).order('granted_at', { ascending: false }),
      ) as GuardianConsentRow[];
      const players = unwrap(
        await db.from('player_profiles').select('id, display_name, slug').in('id', rels.map((r) => r.player_profile_id)),
      ) as Array<{ id: string; display_name: string; slug: string }>;
      return rels.map((r) => {
        const player = players.find((p) => p.id === r.player_profile_id);
        return {
          ...r,
          consents: consents.filter((c) => c.relationship_id === r.id),
          player: player ? { display_name: player.display_name, slug: player.slug } : null,
        };
      });
    },
  };
}
