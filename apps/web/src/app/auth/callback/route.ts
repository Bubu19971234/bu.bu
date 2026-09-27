import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/** Exchanges the email-confirmation / magic-link code for a cookie session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next');
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/guardian';
  if (code) {
    const db = await getServerClient();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL('/login?error=callback', url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
