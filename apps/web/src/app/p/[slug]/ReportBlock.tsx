'use client';
import { REPORT_REASONS } from '@ftn/validation';
import { createServices, createApiClient, newOperationId } from '@ftn/supabase';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

const REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  inappropriate: 'Contenuto inappropriato',
  harassment: 'Molestie',
  impersonation: 'Furto d’identità',
  minor_safety: 'Sicurezza di un minore',
  spam: 'Spam',
  copyright: 'Copyright',
  other: 'Altro',
};

export function ReportBlock({ playerProfileId }: { playerProfileId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>('inappropriate');
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sent' | 'blocked' | 'login' | 'error'>('idle');
  const opId = useMemo(() => newOperationId(), []);

  const services = () => {
    const db = getBrowserClient();
    return createServices(db, createApiClient({ baseUrl: window.location.origin, getAccessToken: async () => null }));
  };
  const requireUser = async () => {
    const { data } = await getBrowserClient().auth.getSession();
    if (!data.session) {
      setState('login');
      return false;
    }
    return true;
  };

  if (state === 'login')
    return (
      <p className="small">
        <Link href="/login">Accedi</Link> per segnalare o bloccare.
      </p>
    );
  if (state === 'sent') return <p className="small">Segnalazione inviata. Grazie.</p>;
  if (state === 'blocked') return <p className="small">Utente bloccato. Non vedrai più i suoi contenuti.</p>;

  return (
    <div className="stack small">
      {!open ? (
        <div className="row">
          <button className="secondary" onClick={() => setOpen(true)}>
            Segnala
          </button>
          <button
            className="secondary"
            onClick={async () => {
              if (!(await requireUser())) return;
              try {
                await services().moderationService.blockUser(playerProfileId);
                setState('blocked');
              } catch {
                setState('error');
              }
            }}
          >
            Blocca
          </button>
        </div>
      ) : (
        <form
          className="stack panel"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!(await requireUser())) return;
            try {
              await services().moderationService.reportContent({
                targetType: 'player_profile',
                targetId: playerProfileId,
                reason,
                details: details || null,
                clientOperationId: opId,
              });
              setState('sent');
            } catch {
              setState('error');
            }
          }}
        >
          <label>
            Motivo
            <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dettagli (facoltativo)
            <textarea maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
          </label>
          <div className="row">
            <button type="submit">Invia segnalazione</button>
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annulla
            </button>
          </div>
        </form>
      )}
      {state === 'error' ? <p className="error">Operazione non riuscita. Riprova.</p> : null}
    </div>
  );
}
