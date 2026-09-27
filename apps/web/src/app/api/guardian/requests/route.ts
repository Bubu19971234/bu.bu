import { unwrap } from '@ftn/supabase';
import { createDevLogMailer, withIdempotency } from '@ftn/supabase/server';
import { guardianRequestSchema } from '@ftn/validation';
import { NextResponse } from 'next/server';
import { idempotencyKey, jsonError, unauthorized } from '@/lib/http';
import { getRequestContext, getServiceClient } from '@/lib/request-context';
import { serverEnv } from '@/lib/server-env';

export const dynamic = 'force-dynamic';

/**
 * A minor player invites a guardian. The relationship row is created as the
 * player (RLS/DB checks apply); the one-time token is issued with the service
 * role and only emailed — it is never returned to the player's device.
 */
export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    if (!ctx.userId) return unauthorized();
    const body = guardianRequestSchema.parse(await request.json());
    const env = serverEnv();
    const service = getServiceClient();
    const result = await withIdempotency(
      service,
      { actorUserId: ctx.userId, action: 'guardian.request', key: idempotencyKey(request), requestBody: body },
      async () => {
        const relationshipId = unwrap(
          await ctx.db.rpc('guardian_request_create', { p_guardian_email: body.guardianEmail, p_relationship_type: body.relationship }),
        );
        const [invite] = unwrap(await service.rpc('guardian_issue_invite_token', { p_relationship_id: relationshipId }));
        if (invite) {
          const mailer = createDevLogMailer();
          await mailer.sendGuardianInvite({
            to: invite.invited_email,
            playerDisplayName: invite.player_display_name,
            // Token in the fragment: not sent to servers or logged by proxies.
            acceptUrl: `${env.APP_BASE_URL}/guardian/accept#token=${encodeURIComponent(invite.token)}`,
            expiresAt: invite.expires_at,
          });
        }
        return { relationshipId };
      },
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
