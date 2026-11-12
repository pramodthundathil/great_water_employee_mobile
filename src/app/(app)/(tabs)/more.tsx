import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { ROLE_LABEL } from '@/lib/format';
import { colors, space } from '@/lib/theme';

type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; href: string };

const ITEMS: Item[] = [
  { icon: 'person-outline', label: 'My profile & bank details', href: '/profile' },
  { icon: 'notifications-outline', label: 'Notifications', href: '/notifications' },
  { icon: 'time-outline', label: 'Leave balance history', href: '/leaves/ledger' },
  { icon: 'sunny-outline', label: 'Public holidays', href: '/holidays' },
  { icon: 'key-outline', label: 'Change password', href: '/change-password' },
];

export default function More() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.employee_id[0];

  return (
    <Screen>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{user.first_name} {user.last_name}</Text>
          <Text style={s.meta}>{user.employee_id} · {ROLE_LABEL[user.role]}</Text>
          {user.primary_branch && <Text style={s.meta}>{user.primary_branch.name}</Text>}
        </View>
      </Card>

      <Card style={{ padding: 0, gap: 0 }}>
        {ITEMS.map((it, i) => (
          <Pressable
            key={it.href}
            onPress={() => router.push(it.href as any)}
            accessibilityRole="button"
            style={({ pressed }) => [s.item, i < ITEMS.length - 1 && s.divider, pressed && { backgroundColor: colors.bg }]}
          >
            <Ionicons name={it.icon} size={22} color={colors.primary} />
            <Text style={s.itemText}>{it.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Pressable>
        ))}
      </Card>

      <Card style={{ padding: 0 }}>
        <Pressable
          onPress={() => Alert.alert('Sign out?', 'You will need your password to sign in again.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
          ])}
          accessibilityRole="button"
          style={s.item}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          <Text style={[s.itemText, { color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </Card>

      <Text style={s.footer}>
        Great Waters v{Constants.expoConfig?.version}{__DEV__ ? `\n${API_URL}` : ''}
      </Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, minHeight: 56 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemText: { flex: 1, fontSize: 16, color: colors.ink, fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 12, color: colors.faint, marginTop: space.md },
});
