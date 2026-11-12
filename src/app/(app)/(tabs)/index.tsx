import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ClaimRow, LeaveRow } from '@/components/rows';
import { Badge, Button, Card, EmptyState, ErrorBanner, Loading, Screen, SectionTitle } from '@/components/ui';
import { days, money } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { ClaimListItem, LeaveBalance, LeaveListItem } from '@/lib/types';
import { useApi } from '@/lib/useApi';

interface Summary {
  user: { first_name: string; full_name: string; role_display: string; branch: string | null; is_approver: boolean };
  leave_balances: LeaveBalance[];
  expenses: {
    drafts: number;
    pending_review_count: number;
    pending_review_amount: number;
    awaiting_payment_count: number;
    awaiting_payment_amount: number;
    paid_this_year_amount: number;
    rejected_count: number;
  };
  recent_claims: ClaimListItem[];
  recent_leaves: LeaveListItem[];
  approvals_pending_count: number;
  unread_notifications: number;
}

function BellButton({ count }: { count: number }) {
  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={`Notifications, ${count} unread`}
      hitSlop={8}
      style={{ paddingHorizontal: 8 }}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.primary} />
      {count > 0 && (
        <View style={s.dot}><Text style={s.dotText}>{count > 9 ? '9+' : count}</Text></View>
      )}
    </Pressable>
  );
}

export default function Home() {
  const { data, error, loading, refreshing, reload } = useApi<Summary>('/dashboard/summary/');

  if (loading && !data) return <Loading />;

  const paidBalances = data?.leave_balances.filter((b) => b.is_paid !== false) ?? [];

  return (
    <>
      <Screen refreshing={refreshing} onRefresh={reload}>
        <TabHeader unread={data?.unread_notifications ?? 0} />
        {error && <ErrorBanner message={error} onRetry={reload} />}
        {data && (
          <>
            <View>
              <Text style={s.hello}>Hello, {data.user.first_name || data.user.full_name}</Text>
              <Text style={s.sub}>{data.user.role_display}{data.user.branch ? ` · ${data.user.branch}` : ''}</Text>
            </View>

            {data.user.is_approver && data.approvals_pending_count > 0 && (
              <Card onPress={() => router.push('/approvals')} style={s.approvalCard}>
                <Ionicons name="checkmark-done-circle" size={32} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={s.approvalTitle}>{data.approvals_pending_count} awaiting your action</Text>
                  <Text style={{ color: '#D6EAF7' }}>Review expense claims and leave requests</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </Card>
            )}

            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button title="New expense" icon="add-circle-outline" onPress={() => router.push('/expenses/form')} style={{ flex: 1 }} />
              <Button title="Apply leave" icon="calendar-outline" variant="secondary" onPress={() => router.push('/leaves/new')} style={{ flex: 1 }} />
            </View>

            <SectionTitle action={<Text onPress={() => router.push('/leaves/ledger')} style={s.link}>History</Text>}>
              Leave balance
            </SectionTitle>
            {paidBalances.length === 0 ? (
              <Card><Text style={s.sub}>No leave entitlement has been set up for you yet.</Text></Card>
            ) : (
              <View style={s.grid}>
                {paidBalances.map((b) => (
                  <Card key={b.leave_type_id} style={s.balanceCard}>
                    <Text style={s.balanceName} numberOfLines={1}>{b.leave_type_name}</Text>
                    <Text style={s.balanceValue}>{Number(b.effective_remaining).toFixed(b.effective_remaining % 1 ? 1 : 0)}</Text>
                    <Text style={s.balanceUnit}>days remaining</Text>
                    <View style={s.balanceMeta}>
                      <Text style={s.metaText}>Earned {b.earned_days}</Text>
                      <Text style={s.metaText}>Taken {b.taken_days}</Text>
                    </View>
                    {b.pending_days > 0 && <Badge label={`${days(b.pending_days)} pending`} tone="pending" />}
                  </Card>
                ))}
              </View>
            )}

            <SectionTitle>My expenses</SectionTitle>
            <View style={s.grid}>
              <Stat label="In review" value={money(data.expenses.pending_review_amount)} hint={`${data.expenses.pending_review_count} claim(s)`} />
              <Stat label="Approved, to be paid" value={money(data.expenses.awaiting_payment_amount)} hint={`${data.expenses.awaiting_payment_count} claim(s)`} />
              <Stat label="Reimbursed this year" value={money(data.expenses.paid_this_year_amount)} />
              <Stat
                label="Need attention"
                value={String(data.expenses.drafts + data.expenses.rejected_count)}
                hint={`${data.expenses.drafts} draft · ${data.expenses.rejected_count} returned`}
                tone={data.expenses.rejected_count ? 'danger' : undefined}
              />
            </View>

            <SectionTitle action={<Text onPress={() => router.push('/claims')} style={s.link}>See all</Text>}>Recent claims</SectionTitle>
            {data.recent_claims.length ? (
              <Card style={{ padding: 0, gap: 0 }}>
                {data.recent_claims.map((c) => <ClaimRow key={c.id} item={c} />)}
              </Card>
            ) : (
              <Card><EmptyState icon="receipt-outline" title="No expense claims yet" message="Snap a bill to create your first claim." /></Card>
            )}

            <SectionTitle action={<Text onPress={() => router.push('/leave')} style={s.link}>See all</Text>}>Recent leave</SectionTitle>
            {data.recent_leaves.length ? (
              <Card style={{ padding: 0, gap: 0 }}>
                {data.recent_leaves.map((l) => <LeaveRow key={l.id} item={l} />)}
              </Card>
            ) : (
              <Card><Text style={s.sub}>No leave applications yet.</Text></Card>
            )}
          </>
        )}
      </Screen>
    </>
  );
}

function TabHeader({ unread }: { unread: number }) {
  return <Tabs.Screen options={{ headerRight: () => <BellButton count={unread} /> }} />;
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'danger' }) {
  return (
    <Card style={s.statCard}>
      <Text style={s.metaText}>{label}</Text>
      <Text style={[s.statValue, tone === 'danger' && { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {hint ? <Text style={s.metaText}>{hint}</Text> : null}
    </Card>
  );
}

const s = StyleSheet.create({
  hello: { fontSize: 24, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14, padding: 4 },
  approvalCard: { backgroundColor: colors.primary, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: space.md },
  approvalTitle: { color: '#fff', fontWeight: '800', fontSize: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  balanceCard: { flexBasis: '48%', flexGrow: 1, gap: 2 },
  balanceName: { fontSize: 13, fontWeight: '700', color: colors.muted },
  balanceValue: { fontSize: 32, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  balanceUnit: { fontSize: 12, color: colors.muted, marginTop: -4 },
  balanceMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 4 },
  metaText: { fontSize: 12, color: colors.muted },
  statCard: { flexBasis: '48%', flexGrow: 1, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  dot: {
    position: 'absolute', top: -4, right: 2, minWidth: 18, height: 18, borderRadius: radius.pill,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  dotText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
