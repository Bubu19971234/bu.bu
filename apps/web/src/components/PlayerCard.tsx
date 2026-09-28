import {
  CARD_ATTRIBUTES,
  CARD_ATTRIBUTE_SHORT,
  DOMINANT_FOOT_LABELS_IT,
  FOOTBALL_ROLE_LABELS_IT,
  type FootballRole,
} from '@ftn/core';
import type { PublicPlayerProfile } from '@ftn/supabase';

type Detail = { status: 'rated'; level: 'low' | 'medium' | 'high' } | { status: 'insufficient_data' };

function ConfidenceDots({ level }: { level: 'low' | 'medium' | 'high' }) {
  const on = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <span className="conf" aria-label={`confidenza ${level === 'low' ? 'bassa' : level === 'medium' ? 'media' : 'alta'}`}>
      {[0, 1, 2].map((i) => (
        <i key={i} className={i < on ? 'on' : ''} />
      ))}
    </span>
  );
}

export function PlayerCard({ profile, avatarUrl }: { profile: PublicPlayerProfile; avatarUrl: string | null }) {
  const rating = profile.rating;
  const details = (rating?.attribute_details ?? {}) as Record<string, Detail>;
  const role = profile.preferred_role as FootballRole;
  return (
    <div className="card">
      <div className="card-top">
        <div className="card-ovr">
          {rating?.overall ?? '—'}
          <small>{rating?.overall ? 'STIMA' : 'DATI INSUFF.'}</small>
        </div>
        <div className="card-role">
          {role}
          <div className="small muted">{profile.shirt_number ? `#${profile.shirt_number}` : ''}</div>
        </div>
      </div>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img className="card-avatar" src={avatarUrl} alt="" />
      ) : (
        <div className="card-avatar" aria-hidden />
      )}
      <div className="card-name">{profile.display_name}</div>
      <div className="card-meta">
        {FOOTBALL_ROLE_LABELS_IT[role] ?? role} · {profile.birth_year} · piede {DOMINANT_FOOT_LABELS_IT[profile.dominant_foot].toLowerCase()}
      </div>
      <div className="card-meta">{profile.current_club_display ?? 'Nessun club indicato'}</div>
      <div className="attrs">
        {CARD_ATTRIBUTES.map((a) => {
          const value = rating?.[a] ?? null;
          const d = details[a];
          return (
            <div className="attr" key={a}>
              <span>{CARD_ATTRIBUTE_SHORT[a]}</span>
              {value !== null && d?.status === 'rated' ? (
                <span>
                  <b>{value}</b>
                  <ConfidenceDots level={d.level} />
                </span>
              ) : (
                <span className="na">dati insufficienti</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
