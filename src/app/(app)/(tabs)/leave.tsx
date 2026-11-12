import { router, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LeaveRow } from '@/components/rows';
import { Button, Card, EmptyState, ErrorBanner, Loading, Screen, SectionTitle } from '@/components/ui';
import { asList } from '@/lib/api';
import { colors, space } from '@/lib/theme';
import type { LeaveBalance, LeaveListItem } from '@/lib/types';
import { useApi } from '@/lib/useApi';

export default function Leave() {
  const apps = useApi<any>('/leaves/applications/?scope=mine');
  const bal = useApi<{ balances: LeaveBalance[] }>('/leaves/balance/');
  const list = asList<LeaveListItem>(apps.data);
  const reload = () => { apps.reload(); bal.reload(); };

  if (apps.loading && !apps.data) return <Loading />;

  return (
    <Screen refreshing={apps.refreshing || bal.refreshing} onRefresh={reload}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/leaves/new')} hitSlop={8} style={{ paddingHorizontal: 16 }} accessibilityRole="button">
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>Apply</Text>
            </Pressable>
          ),
        }}
      />
      {(apps.error || bal.error) && <ErrorBanner message={(apps.error || bal.error)!} onRetry={reload} />}

      <SectionTitle action={<Text onPress={() => router.push('/leaves/ledger')} style={s.link}>History</Text>}>Balances</SectionTitle>
      <Card style={{ padding: 0, gap: 0 }}>
        <View style={[s.balRow, s.balHead]}>
          <Text style={[s.cellName, s.head]}>Type</Text>
          <Text style={[s.cell, s.head]}>Earned</Text>
          <Text style={[s.cell, s.head]}>Taken</Text>
          <Text style={[s.cell, s.head]}>Pending</Text>
          <Text style={[s.cell, s.head]}>Left</Text>
        </View>
        {(bal.data?.balances ?? []).filter((b) => b.earned_days || b.taken_days || b.available_balance || b.pending_days).map((b) => (
          <View key={b.leave_type_id} style={s.balRow}>
            <Text style={s.cellName} numberOfLines={1}>{b.leave_type_name}</Text>
            <Text style={s.cell}>{b.earned_days}</Text>
            <Text style={s.cell}>{b.taken_days}</Text>
            <Text style={[s.cell, b.pending_days > 0 && { color: colors.warning }]}>{b.pending_days}</Text>
            <Text style={[s.cell, s.left]}>{b.effective_remaining}</Text>
          </View>
        ))}
      </Card>
      <Text style={s.note}>“Left” already subtracts leave that is still pending approval. Balance is deducted only after the Director approves.</Text>

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Button title="Apply for leave" icon="add" onPress={() => router.push('/leaves/new')} style={{ flex: 1 }} />
        <Button title="Holidays" icon="sunny-outline" variant="secondary" onPress={() => router.push('/holidays')} style={{ flex: 1 }} />
      </View>

      <SectionTitle>My applications</SectionTitle>
      {list.length ? (
        <Card style={{ padding: 0, gap: 0 }}>{list.map((l) => <LeaveRow key={l.id} item={l} />)}</Card>
      ) : (
        <Card><EmptyState icon="calendar-outline" title="No leave applications" message="Your leave requests and their approval status will appear here." /></Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  link: { color: colors.primary, fontWeight: '700', fontSize: 14, padding: 4 },
  balRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  balHead: { backgroundColor: colors.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  head: { fontSize: 12, fontWeight: '700', color: colors.muted },
  cellName: { flex: 2, fontSize: 14, fontWeight: '600', color: colors.ink },
  cell: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  left: { fontWeight: '800', color: colors.primaryDark },
  note: { fontSize: 12, color: colors.muted, lineHeight: 17 },
});
