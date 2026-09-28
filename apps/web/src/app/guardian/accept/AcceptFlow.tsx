'use client';
import { GUARDIAN_CONSENT_SCOPES } from '@ftn/validation';
import { APP_ERROR_MESSAGES_IT, createApiClient, createServices, toAppError } from '@ftn/supabase';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

type Preview = {
  relationship_id: string;
  player_display_name: string;
  player_birth_year: number;
  relationship_type: string;
  status: string;
  expired: boolean;
  email_matches: boolean;
  consent_version: string;
};

const SCOPE_TEXT: Record<(typeof GUARDIAN_CONSENT_SCOPES)[number], string> = {
  public_profile: 'Rendere pubblico il profilo calcistico (nome visualizzato, anno di nascita, ruolo, squadra). Obbligatorio per la pubblicazione.',
  public_clips: 'Pubblicare i clip approvati dalla moderazione.',
  ai_analysis: 'Analizzare i clip con strumenti automatici (AI) per generare stime di gioco sulla card, non certificate.',
};

function readInviteToken(): string | null {
  // Token lives in the URL fragment so it never reaches server logs.
  const t = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (t) sessionStorage.setItem('guardian_invite_token', t);
  return t ?? sessionStorage.getItem('guardian_invite_token');
}

/** Client-only (rendered with ssr:false): reads the invite token from the URL fragment. */
export default function AcceptFlow() {
  const [token] = useState<string | null>(readInviteToken);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [needsDob, setNeedsDob] = useState(false);
  const [dob, setDob] = useState('');
  const [scopes, setScopes] = useState<string[]>(['public_profile']);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const services = useMemo(
    () => createServices(getBrowserClient(), createApiClient({ baseUrl: window.location.origin, getAccessToken: async () => null })),
    [],
  );

  useEffect(() => {
    getBrowserClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  useEffect(() => {
    if (!token || !signedIn || !services) return;
    services.guardianService
      .previewInvitation(token)
      .then((p) => setPreview(p as Preview | null))
      .catch(() => setMessage('Invito non valido.'));
    getBrowserClient()
      .from('account_private_data')
      .select('user_id')
      .maybeSingle()
      .then(({ data }) => setNeedsDob(!data));
  }, [token, signedIn, services]);

  if (!token) return <div className="panel">Link di invito mancante o non valido.</div>;
  if (signedIn === false)
    return (
      <div className="panel stack">
        <h1>Approvazione genitore/tutore</h1>
        <p>Accedi o registrati con l’indirizzo email a cui hai ricevuto l’invito.</p>
        <Link className="button" href="/login?next=/guardian/accept">
          Accedi / Registrati
        </Link>
      </div>
    );
  if (done)
    return (
      <div className="panel stack">
        <h1>Approvazione registrata</h1>
        <p>Puoi modificare o revocare il consenso in qualsiasi momento dall’area genitori.</p>
        <Link className="button" href="/guardian">
          Vai all’area genitori
        </Link>
      </div>
    );
  if (!preview) return <div className="panel">{message ?? 'Caricamento…'}</div>;

  return (
    <form
      className="panel stack"
      style={{ maxWidth: 640 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!services) return;
        setMessage(null);
        try {
          if (needsDob) await services.authService.setDateOfBirth(dob);
          await services.guardianService.approveRelationship(token, preview.consent_version, scopes);
          sessionStorage.removeItem('guardian_invite_token');
          setDone(true);
        } catch (error) {
          const code = toAppError(error).code;
          setMessage(APP_ERROR_MESSAGES_IT[code] ?? 'Operazione non riuscita.');
        }
      }}
    >
      <h1 style={{ margin: 0 }}>Approvazione per {preview.player_display_name}</h1>
      <p className="muted">
        {preview.player_display_name} (nato/a nel {preview.player_birth_year}) ti ha indicato come genitore/tutore. Il profilo di un
        minore diventa pubblico solo con la tua approvazione.
      </p>
      {preview.expired ? <p className="error">Invito scaduto: chiedi al giocatore di inviarne uno nuovo.</p> : null}
      {!preview.email_matches ? <p className="error">Sei collegato con un’email diversa da quella invitata.</p> : null}
      {needsDob ? (
        <label>
          La tua data di nascita (serve a confermare che sei maggiorenne; non è pubblica)
          <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
      ) : null}
      <fieldset className="stack" style={{ border: 0, padding: 0 }}>
        <legend className="muted small">Autorizzazioni (versione {preview.consent_version})</legend>
        {GUARDIAN_CONSENT_SCOPES.map((s) => (
          <label key={s} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text)' }}>
            <input
              type="checkbox"
              style={{ width: 'auto', marginTop: 4 }}
              checked={scopes.includes(s)}
              disabled={s === 'public_profile'}
              onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))}
            />
            <span>{SCOPE_TEXT[s]}</span>
          </label>
        ))}
      </fieldset>
      <label style={{ display: 'flex', gap: 10, color: 'var(--text)' }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        Dichiaro di essere genitore o tutore legale di questo giocatore.
      </label>
      <button type="submit" disabled={!confirm || preview.expired || !preview.email_matches}>
        Approva
      </button>
      {message ? <p className="error">{message}</p> : null}
    </form>
  );
}
