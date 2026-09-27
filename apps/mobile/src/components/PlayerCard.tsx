import {
  CARD_ATTRIBUTES,
  CARD_ATTRIBUTE_SHORT,
  type ConfidenceLevel,
  DOMINANT_FOOT_LABELS_IT,
  FOOTBALL_ROLE_LABELS_IT,
  type FootballRole,
} from '@ftn/core';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/lib/theme';

export interface CardRating {
  overall: number | null;
  values: Partial<Record<(typeof CARD_ATTRIBUTES)[number], number | null>>;
  levels: Partial<Record<(typeof CARD_ATTRIBUTES)[number], ConfidenceLevel | null>>;
}

export interface CardPlayer {
  displayName: string;
  birthYear: number;
  preferredRole: string;
  dominantFoot: 'left' | 'right' | 'both';
  clubDisplay: string | null;
  shirtNumber: number | null;
  verified: boolean;
}

/** Parses the per-attribute JSON stored on rating snapshots. */
export function ratingFromSnapshot(
  snapshot: { overall: number | null; attribute_details: unknown } & Partial<Record<(typeof CARD_ATTRIBUTES)[number], number | null>>,
): CardRating {
  const details = (snapshot.attribute_details ?? {}) as Record<string, { status: string; level?: ConfidenceLevel }>;
  const values: CardRating['values'] = {};
  const levels: CardRating['levels'] = {};
  for (const a of CARD_ATTRIBUTES) {
    values[a] = snapshot[a] ?? null;
    levels[a] = details[a]?.status === 'rated' ? (details[a]?.level ?? null) : null;
  }
  return { overall: snapshot.overall, values, levels };
}

function Dots({ level }: { level: ConfidenceLevel }) {
  const on = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <View style={{ flexDirection: 'row', gap: 2, marginLeft: 4 }} accessibilityLabel={`confidenza ${level}`}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i < on && { backgroundColor: colors.gold }]} />
      ))}
    </View>
  );
}

export function PlayerCard({ player, rating, avatarUrl }: { player: CardPlayer; rating: CardRating | null; avatarUrl?: string | null }) {
  const role = player.preferredRole as FootballRole;
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View>
          <Text style={styles.ovr}>{rating?.overall ?? '—'}</Text>
          <Text style={styles.ovrLabel}>{rating?.overall ? 'STIMA' : 'DATI INSUFF.'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.role}>{role}</Text>
          {player.shirtNumber ? <Text style={styles.meta}>#{player.shirtNumber}</Text> : null}
        </View>
      </View>
      {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatar} />}
      <Text style={styles.name} numberOfLines={1}>
        {player.displayName}
      </Text>
      <Text style={styles.meta}>
        {FOOTBALL_ROLE_LABELS_IT[role] ?? role} · {player.birthYear} · {DOMINANT_FOOT_LABELS_IT[player.dominantFoot]}
      </Text>
      <Text style={styles.meta}>{player.clubDisplay ?? 'Nessun club indicato'}</Text>
      <Text style={[styles.meta, { color: player.verified ? colors.accent : colors.muted }]}>
        {player.verified ? '✓ Verificato dal club' : 'Dati dichiarati dal giocatore'}
      </Text>
      <View style={styles.attrs}>
        {CARD_ATTRIBUTES.map((a) => {
          const v = rating?.values[a] ?? null;
          const level = rating?.levels[a] ?? null;
          return (
            <View key={a} style={styles.attr}>
              <Text style={styles.attrKey}>{CARD_ATTRIBUTE_SHORT[a]}</Text>
              {v !== null && level ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.attrVal}>{v}</Text>
                  <Dots level={level} />
                </View>
              ) : (
                <Text style={styles.na}>dati insuff.</Text>
              )}
            </View>
          );
        })}
      </View>
      {rating ? <Text style={[styles.meta, { color: colors.gold, marginTop: 8 }]}>Valori: stima AI da clip selezionati</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#13261F',
    borderColor: '#2D5A47',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 20,
    shadowColor: colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  ovr: { color: colors.text, fontSize: 44, fontWeight: '900', lineHeight: 46 },
  ovrLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  role: { color: colors.accent, fontSize: 20, fontWeight: '900' },
  avatar: { width: 112, height: 112, borderRadius: 56, alignSelf: 'center', marginVertical: 12, backgroundColor: colors.surface2, borderWidth: 2, borderColor: '#2D5A47' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  meta: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  attrs: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, rowGap: 6 },
  attr: { width: '50%', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  attrKey: { color: colors.text, fontSize: 14 },
  attrVal: { color: colors.text, fontSize: 17, fontWeight: '800' },
  na: { color: colors.muted, fontSize: 12 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#34465C' },
});
