import { publicationBlockers } from '@ftn/core';
import type { PublicPlayerProfile } from '@ftn/supabase';
import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { PlayerCard, ratingFromSnapshot } from '@/components/PlayerCard';
import { Body, Button, Card, Screen, Title } from '@/components/ui';
import { config } from '@/lib/config';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';

const BLOCKER_IT = {
  visibility_private: 'Il profilo è impostato come privato (Privacy → Visibilità).',
  guardian_consent_required: 'Serve l’approvazione del genitore/tutore.',
  account_inactive: 'L’account non è attivo.',
  moderation_hidden: 'Il profilo è stato nascosto dalla moderazione.',
} as const;

/** Shows exactly what anonymous visitors see (same read model as the web). */
export default function PublicPreview() {
  const { profile, status } = useSession();
  const [pub, setPub] = useState<PublicPlayerProfile | null | undefined>(undefined);

  useEffect(() => {
    if (profile) services.playerService.getPublicProfile(profile.slug).then(setPub).catch(() => setPub(null));
  }, [profile]);

  if (!profile || !status) return null;
  const blockers = publicationBlockers({
    visibility: status.visibility,
    accountStatus: 'active',
    ageBand: status.is_minor ? 'minor' : 'adult',
    hasActiveGuardianConsent: status.guardian_consent_scopes.includes('public_profile'),
    moderationHidden: status.moderation_status === 'hidden',
  });
  const url = `${config.apiBaseUrl}/p/${profile.slug}`;

  return (
    <Screen>
      <Title>Come ti vedono gli altri</Title>
      {pub ? (
        <>
          <PlayerCard
            rating={pub.rating ? ratingFromSnapshot(pub.rating) : null}
            player={{
              displayName: pub.display_name,
              birthYear: pub.birth_year,
              preferredRole: pub.preferred_role,
              dominantFoot: pub.dominant_foot,
              clubDisplay: pub.current_club_display,
              shirtNumber: pub.shirt_number,
              verified: pub.verification_status === 'club_verified',
            }}
          />
          <Body muted small>Clip pubblici: {pub.clips.length}. Nessun dato di contatto, email, data di nascita completa o dato del genitore è visibile.</Body>
          <Button label="Condividi link" onPress={() => void Share.share({ message: url })} />
        </>
      ) : pub === null ? (
        <Card>
          <Body>Il tuo profilo non è ancora pubblico.</Body>
          {blockers.map((b) => (
            <Body key={b} muted>
              • {BLOCKER_IT[b]}
            </Body>
          ))}
        </Card>
      ) : (
        <Body muted>Caricamento…</Body>
      )}
    </Screen>
  );
}
