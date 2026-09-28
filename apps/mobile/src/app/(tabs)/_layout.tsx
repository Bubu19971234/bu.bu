import { Redirect, Tabs } from 'expo-router';
import { type ColorValue, Text } from 'react-native';
import { Loading } from '@/components/ui';
import { useSession } from '@/lib/session';
import { colors } from '@/lib/theme';

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
  };

export default function TabsLayout() {
  const { loading, session, profile } = useSession();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/" />;
  if (!profile) return <Redirect href="/onboarding/age" />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Card', tabBarIcon: icon('◆') }} />
      <Tabs.Screen name="clips" options={{ title: 'Clip', tabBarIcon: icon('▶') }} />
      <Tabs.Screen name="profile" options={{ title: 'Carriera', tabBarIcon: icon('☰') }} />
      <Tabs.Screen name="settings" options={{ title: 'Privacy', tabBarIcon: icon('⚙') }} />
    </Tabs>
  );
}
