import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Chip, EmptyState, ErrorBanner, Loading, Screen } from '@/components/ui';
import { fmtDate, isoDate } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import { useApi } from '@/lib/useApi';

interface Holiday { id: number; date: string; name: string; is_optional: boolean }

export default function Holidays() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const { data, error, loading, refreshing, reload } = useApi<Holiday[]>(`/leaves/holidays/?year=${year}`);
  const today = isoDate(new Date());

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {[thisYear, thisYear + 1].map((y) => <Chip key={y} label={String(y)} active={year === y} onPress={() => setYear(y)} />)}
      </View>
      {error && <ErrorBanner message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : data?.length ? (
        <Card style={{ padding: 0, gap: 0 }}>
          {data.map((h) => (
            <View key={h.id} style={[s.row, h.date < today && { opacity: 0.5 }]}>
              <Text style={s.date}>{fmtDate(h.date)}</Text>
              <Text style={s.name}>{h.name}{h.is_optional ? ' (optional)' : ''}</Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card><EmptyState icon="sunny-outline" title={`No holidays published for ${year}`} message="HR publishes the holiday list for your branch." /></Card>
      )}
      <Text style={s.note}>Public holidays inside a leave period are not counted against your balance.</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  date: { width: 110, fontSize: 14, fontWeight: '700', color: colors.primaryDark },
  name: { flex: 1, fontSize: 15, color: colors.ink },
  note: { fontSize: 12, color: colors.muted },
});
