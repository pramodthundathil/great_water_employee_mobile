import { router, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EmptyState, ErrorBanner, Loading } from '@/components/ui';
import { post } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import { routeForLink } from '@/lib/push';
import { colors, space } from '@/lib/theme';
import type { NotificationItem } from '@/lib/types';
import { useApi } from '@/lib/useApi';

export default function Notifications() {
  const { data, error, loading, refreshing, reload, setData } = useApi<{ unread_count: number; notifications: NotificationItem[] }>('/notifications/');

  const open = async (n: NotificationItem) => {
    if (!n.is_read) {
      post(`/notifications/${n.id}/mark-read/`).catch(() => {});
      setData((d) => d && {
        unread_count: Math.max(0, d.unread_count - 1),
        notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
      });
    }
    const route = routeForLink(n.link_url);
    if (route && route !== '/notifications') router.push(route as any);
  };

  const markAll = async () => {
    await post('/notifications/mark-all-read/').catch(() => {});
    reload();
  };

  if (loading && !data) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          headerRight: () => data?.unread_count ? (
            <Pressable onPress={markAll} hitSlop={8} accessibilityRole="button">
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Mark all read</Text>
            </Pressable>
          ) : null,
        }}
      />
      {error && <View style={{ padding: space.lg }}><ErrorBanner message={error} onRetry={reload} /></View>}
      <FlatList
        data={data?.notifications ?? []}
        keyExtractor={(n) => String(n.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
        contentContainerStyle={!data?.notifications.length ? { flexGrow: 1 } : undefined}
        renderItem={({ item }) => (
          <Pressable onPress={() => open(item)} style={({ pressed }) => [s.row, !item.is_read && s.unread, pressed && { opacity: 0.8 }]} accessibilityRole="button">
            {!item.is_read && <View style={s.dot} />}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.title, !item.is_read && { fontWeight: '800' }]}>{item.title}</Text>
              <Text style={s.message}>{item.message}</Text>
              <Text style={s.time}>{fmtDateTime(item.created_at)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="notifications-off-outline" title="No notifications" message="Approval updates and payment alerts will appear here." />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  unread: { backgroundColor: colors.primarySoft },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 6 },
  title: { fontSize: 15, fontWeight: '600', color: colors.ink },
  message: { fontSize: 14, color: colors.text, lineHeight: 20 },
  time: { fontSize: 12, color: colors.muted },
});
