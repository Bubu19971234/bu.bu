import { CLIP_CATEGORY_LABELS_IT, type ClipCategory } from '@ftn/core';
import type { MyClip } from '@ftn/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { Badge, Body, Button } from '@/components/ui';
import { MEDIA_STATUS_IT } from '@/lib/labels';
import { useSession } from '@/lib/session';
import { services } from '@/lib/supabase';
import { colors } from '@/lib/theme';


export default function Clips() {
  const { profile } = useSession();
  const [clips, setClips] = useState<MyClip[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setClips(await services.clipService.listPlayerClips(profile.id).catch(() => []));
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={clips}
      keyExtractor={(c) => c.id}
      refreshing={loading}
      onRefresh={load}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 4 }}>
          <Button label="＋ Carica un clip (max 60 s)" onPress={() => router.push('/clips/upload')} />
          <Body muted small>
            Scegli azioni in cui sei ben riconoscibile. Ogni clip viene verificato e moderato prima di essere pubblico.
          </Body>
        </View>
      }
      ListEmptyComponent={loading ? null : <Body muted>Nessun clip ancora. Inizia dal tuo gesto migliore!</Body>}
      renderItem={({ item }) => {
        const st = MEDIA_STATUS_IT[item.media?.status ?? 'uploading'] ?? { label: '—', tone: 'muted' as const };
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/clips/[id]', params: { id: item.id } })}
            style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 }}
          >
            <Body>{item.title ?? CLIP_CATEGORY_LABELS_IT[item.category as ClipCategory]}</Body>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Badge label={CLIP_CATEGORY_LABELS_IT[item.category as ClipCategory] ?? item.category} />
              <Badge label={st.label} tone={st.tone} />
              <Badge label={item.visibility === 'public' ? 'Visibile sul profilo' : 'Solo per te'} />
              {item.media?.verified_duration_ms ? <Badge label={`${Math.round(item.media.verified_duration_ms / 1000)} s`} /> : null}
            </View>
          </Pressable>
        );
      }}
    />
  );
}
