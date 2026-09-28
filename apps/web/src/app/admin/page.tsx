import { unwrap } from '@ftn/supabase';
import { notFound, redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { decideMedia, processDeletion, resolveReport } from './actions';
import { ModerationPreview } from './ModerationPreview';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Moderazione', robots: { index: false } };

/**
 * Minimal internal moderation screen for Phase 1 testing. Authorization is
 * enforced by the database (is_platform_staff + RLS); this page only renders.
 */
export default async function AdminPage() {
  const db = await getServerClient();
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) redirect('/login?next=/admin');
  const isStaff = unwrap(await db.rpc('is_platform_staff'));
  if (!isStaff) notFound();

  const [media, reports, deletions] = await Promise.all([
    db
      .from('media_assets')
      .select('id, kind, verified_mime, verified_duration_ms, verified_size_bytes, created_at')
      .eq('status', 'pending_moderation')
      .order('created_at', { ascending: true })
      .limit(50),
    db.from('content_reports').select('id, target_type, target_id, reason, details, status, created_at').in('status', ['open', 'reviewing']).order('created_at').limit(50),
    db.from('account_deletion_requests').select('id, status, requested_at').eq('status', 'requested').order('requested_at').limit(50),
  ]);

  return (
    <div className="stack">
      <h1>Moderazione</h1>

      <section className="panel stack">
        <h2 style={{ margin: 0 }}>Media in attesa ({media.data?.length ?? 0})</h2>
        {(media.data ?? []).map((m) => (
          <div key={m.id} className="row" style={{ alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <div style={{ width: 280 }}>
              <ModerationPreview mediaId={m.id} kind={m.kind} />
            </div>
            <div className="stack small" style={{ flex: 1 }}>
              <div>
                {m.kind} · {m.verified_mime} · {m.verified_duration_ms ? `${(m.verified_duration_ms / 1000).toFixed(1)}s` : '—'} ·{' '}
                {m.verified_size_bytes ? `${Math.round(m.verified_size_bytes / 1024)} KiB` : ''}
              </div>
              <form action={decideMedia} className="row">
                <input type="hidden" name="mediaId" value={m.id} />
                <input name="reason" placeholder="Motivo (facoltativo)" style={{ maxWidth: 240 }} />
                <button name="decision" value="published">
                  Approva
                </button>
                <button name="decision" value="rejected" className="danger">
                  Rifiuta
                </button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="panel stack">
        <h2 style={{ margin: 0 }}>Segnalazioni aperte ({reports.data?.length ?? 0})</h2>
        <table>
          <thead>
            <tr>
              <th>Target</th>
              <th>Motivo</th>
              <th>Dettagli</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(reports.data ?? []).map((r) => (
              <tr key={r.id}>
                <td>
                  {r.target_type}
                  <div className="muted small">{r.target_id}</div>
                </td>
                <td>{r.reason}</td>
                <td>{r.details}</td>
                <td>
                  <form action={resolveReport} className="row">
                    <input type="hidden" name="reportId" value={r.id} />
                    <button name="status" value="actioned">
                      Gestita
                    </button>
                    <button name="status" value="dismissed" className="secondary">
                      Archivia
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel stack">
        <h2 style={{ margin: 0 }}>Richieste di cancellazione ({deletions.data?.length ?? 0})</h2>
        {(deletions.data ?? []).map((d) => (
          <form key={d.id} action={processDeletion} className="row small">
            <input type="hidden" name="requestId" value={d.id} />
            <span>Richiesta del {new Date(d.requested_at).toLocaleString('it-IT')}</span>
            <button className="danger">Esegui cancellazione</button>
          </form>
        ))}
      </section>
    </div>
  );
}
