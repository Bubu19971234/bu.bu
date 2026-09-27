import { CLIP_CATEGORY_LABELS_IT, type ClipCategory } from '@ftn/core';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { PlayerCard } from '@/components/PlayerCard';
import { isSupabaseConfigured } from '@/lib/env';
import { getAnonClient } from '@/lib/supabase/server';
import { ClipPlayer } from './ClipPlayer';
import { ReportBlock } from './ReportBlock';
import { signedPublicMediaUrl } from './media';

// Public pages are cached briefly at the edge; the read model already enforces
// privacy, guardian consent and moderation.
export const revalidate = 60;

const loadProfile = cache(async (slug: string) => {
  if (!isSupabaseConfigured() || !/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  const { data, error } = await getAnonClient().rpc('get_public_player_profile', { p_slug: slug });
  if (error) throw new Error(error.message);
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const profile = await loadProfile((await params).slug);
  if (!profile) return { title: 'Profilo non disponibile', robots: { index: false } };
  return {
    title: `${profile.display_name} (${profile.birth_year})`,
    // Minors' pages are shareable by link but not indexed by search engines.
    robots: { index: false, follow: false },
  };
}

export default async function PublicPlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await loadProfile(slug);
  if (!profile) notFound();
  const avatarUrl = profile.avatar_media_id ? await signedPublicMediaUrl(profile.avatar_media_id) : null;

  return (
    <div className="stack">
      <div className="row" style={{ alignItems: 'flex-start', gap: 32 }}>
        <PlayerCard profile={profile} avatarUrl={avatarUrl} />
        <div className="stack" style={{ flex: 1, minWidth: 260 }}>
          <h1 style={{ margin: 0 }}>{profile.display_name}</h1>
          <div className="row">
            {profile.verification_status === 'club_verified' ? (
              <span className="badge verified">Verificato dal club</span>
            ) : (
              <span className="badge">Dati dichiarati dal giocatore</span>
            )}
            {profile.rating ? <span className="badge ai">Valori card: stima AI da clip selezionati</span> : null}
          </div>
          {profile.bio ? <p>{profile.bio}</p> : null}
          <dl className="small">
            <dt className="muted">Ruoli secondari</dt>
            <dd>{profile.secondary_roles.length ? profile.secondary_roles.join(', ') : '—'}</dd>
            <dt className="muted">Altezza</dt>
            <dd>{profile.height_cm ? `${profile.height_cm} cm` : '—'}</dd>
          </dl>
          <p className="muted small">
            Le valutazioni della card sono indicatori di gioco generati da clip scelti dal giocatore, con livello di confidenza. Non sono
            misure certificate. “Dati insufficienti” non significa valore basso.
          </p>
          <ReportBlock playerProfileId={profile.id} />
        </div>
      </div>

      <section className="stack">
        <h2>Clip</h2>
        {profile.clips.length === 0 ? (
          <p className="muted">Nessun clip pubblicato.</p>
        ) : (
          <div className="clips">
            {profile.clips.map((clip) => (
              <div className="panel" key={clip.id}>
                <ClipPlayer mediaId={clip.media_id} />
                <div className="row small" style={{ marginTop: 8 }}>
                  <span className="badge">{CLIP_CATEGORY_LABELS_IT[clip.category as ClipCategory] ?? clip.category}</span>
                  {clip.duration_ms ? <span className="muted">{Math.round(clip.duration_ms / 1000)}s</span> : null}
                </div>
                {clip.title ? <div>{clip.title}</div> : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
