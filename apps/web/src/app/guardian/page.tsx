'use client';
import { GUARDIAN_CONSENT_SCOPES } from '@ftn/validation';
import { createApiClient, createServices } from '@ftn/supabase';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

type Ward = Awaited<ReturnType<ReturnType<typeof createServices>['guardianService']['listMyWards']>>[number];

export default function GuardianDashboard() {
  const services = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : createServices(getBrowserClient(), createApiClient({ baseUrl: window.location.origin, getAccessToken: async () => null })),
    [],
  );
  const [wards, setWards] = useState<Ward[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [consentVersion, setConsentVersion] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!services) return;
    setWards(await services.guardianService.listMyWards());
  }, [services]);

  useEffect(() => {
    const db = getBrowserClient();
    db.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      if (data.session) void load();
    });
    db.from('app_config')
      .select('value')
      .eq('key', 'guardian.consent_version')
      .maybeSingle()
      .then(({ data }) => setConsentVersion((data?.value as string | undefined) ?? null));
  }, [load]);

  if (signedIn === false)
    return (
      <div className="panel stack">
        <h1>Area genitori</h1>
        <p>Accedi per gestire le autorizzazioni dei giocatori minorenni collegati a te.</p>
        <Link className="button" href="/login?next=/guardian">
          Accedi
        </Link>
      </div>
    );

  return (
    <div className="stack">
      <h1>Area genitori</h1>
      {!wards ? (
        <p className="muted">Caricamento…</p>
      ) : wards.length === 0 ? (
        <p className="muted">Nessun giocatore collegato. Riceverai un’email quando un giocatore ti invita.</p>
      ) : (
        wards.map((w) => {
          const active = w.consents.find((c) => !c.revoked_at);
          return (
            <div className="panel stack" key={w.id}>
              <div className="row">
                <strong>{w.player?.display_name ?? 'Giocatore collegato'}</strong>
                <span className="badge">{w.status}</span>
                <span className="badge">{w.verification_state === 'email_matched' ? 'email verificata' : w.verification_state}</span>
              </div>
              {active ? (
                <>
                  <p className="small">
                    Consenso attivo (v{active.consent_version}) dal {new Date(active.granted_at).toLocaleDateString('it-IT')}:{' '}
                    {active.scopes.join(', ')}
                  </p>
                  <button
                    className="danger"
                    onClick={async () => {
                      await services?.guardianService.revokeConsent(w.id);
                      await load();
                    }}
                  >
                    Revoca consenso (il profilo torna privato)
                  </button>
                </>
              ) : (
                <>
                  <p className="small">Nessun consenso attivo: il profilo non è pubblico.</p>
                  <button
                    disabled={!consentVersion}
                    onClick={async () => {
                      if (!consentVersion) return;
                      await services?.guardianService.grantConsent(w.id, consentVersion, [...GUARDIAN_CONSENT_SCOPES]);
                      await load();
                    }}
                  >
                    Concedi di nuovo il consenso completo
                  </button>
                </>
              )}
              <details className="small muted">
                <summary>Storico consensi ({w.consents.length})</summary>
                <ul>
                  {w.consents.map((c) => (
                    <li key={c.id}>
                      v{c.consent_version} · {c.scopes.join(', ')} · concesso {new Date(c.granted_at).toLocaleString('it-IT')}
                      {c.revoked_at ? ` · revocato ${new Date(c.revoked_at).toLocaleString('it-IT')}` : ''}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          );
        })
      )}
    </div>
  );
}
