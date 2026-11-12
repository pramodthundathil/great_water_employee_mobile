import { StyleSheet, Text, View } from 'react-native';
import { Card, EmptyState, ErrorBanner, Loading, Screen } from '@/components/ui';
import { fmtDateTime } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import { useApi } from '@/lib/useApi';

interface Entry {
  id: number;
  leave_type_code: string;
  leave_type_name: string;
  entry_type: string;
  transaction_days: string;
  balance_after: string;
  reference_note: string;
  created_at: string;
}

const LABEL: Record<string, string> = {
  OPENING_BALANCE: 'Opening balance',
  ACCRUAL_CREDIT: 'Earned / credited',
  LEAVE_DEDUCTION: 'Leave taken',
  MANUAL_ADJUSTMENT: 'HR adjustment',
  CARRY_FORWARD: 'Carried forward',
  LAPSED: 'Lapsed',
};

export default function Ledger() {
  const { data, error, loading, refreshing, reload } = useApi<Entry[]>('/leaves/ledger/');
  if (loading && !data) return <Loading />;
  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {error && <ErrorBanner message={error} onRetry={reload} />}
      <Text style={s.intro}>Every credit and deduction to your leave balance, newest first.</Text>
      {data?.length ? (
        <Card style={{ padding: 0, gap: 0 }}>
          {data.map((e) => {
            const v = Number(e.transaction_days);
            return (
              <View key={e.id} style={s.row}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.title}>{LABEL[e.entry_type] ?? e.entry_type} · {e.leave_type_code}</Text>
                  <Text style={s.note} numberOfLines={2}>{e.reference_note}</Text>
                  <Text style={s.note}>{fmtDateTime(e.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.delta, { color: v >= 0 ? colors.success : colors.danger }]}>{v > 0 ? '+' : ''}{v}</Text>
                  <Text style={s.note}>bal. {Number(e.balance_after)}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      ) : (
        <Card><EmptyState icon="time-outline" title="No balance movements yet" /></Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  intro: { color: colors.muted, fontSize: 14 },
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  note: { fontSize: 12, color: colors.muted },
  delta: { fontSize: 18, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
