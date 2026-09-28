import { MockClipAnalyzer } from '@ftn/core';
import { runClipAnalysis, withIdempotency } from '@ftn/supabase/server';
import { uuidSchema } from '@ftn/validation';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { idempotencyKey, jsonError, unauthorized } from '@/lib/http';
import { getRequestContext, getServiceClient } from '@/lib/request-context';
import { serverEnv } from '@/lib/server-env';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ clipId: uuidSchema });

function analyzer() {
  switch (serverEnv().AI_PROVIDER) {
    case 'mock':
      return new MockClipAnalyzer();
  }
}

/**
 * Requests AI observations for one of the caller's clips. Ownership, media
 * readiness and guardian `ai_analysis` consent are enforced in ai_begin_run.
 */
export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext(request);
    if (!ctx.userId) return unauthorized();
    const userId = ctx.userId;
    const body = bodySchema.parse(await request.json());
    const service = getServiceClient();
    const result = await withIdempotency(
      service,
      { actorUserId: userId, action: 'ai.clip_analysis', key: idempotencyKey(request), requestBody: body },
      () => runClipAnalysis(service, analyzer(), { clipId: body.clipId, requestedBy: userId }),
    );
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
