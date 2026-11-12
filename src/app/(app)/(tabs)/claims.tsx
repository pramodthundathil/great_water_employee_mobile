import { router, Tabs } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ClaimRow } from '@/components/rows';
import { Button, Chip, EmptyState, ErrorBanner, Loading } from '@/components/ui';
import { asList } from '@/lib/api';
import { colors, space } from '@/lib/theme';
import type { ClaimListItem } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const FILTERS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'draft', label: 'Drafts', match: (s) => s === 'DRAFT' },
  { key: 'review', label: 'In review', match: (s) => s.startsWith('UNDER_') },
  { key: 'approved', label: 'To be paid', match: (s) => s === 'APPROVED_BY_DIRECTOR' },
  { key: 'paid', label: 'Paid', match: (s) => s === 'PAID' },
  { key: 'rejected', label: 'Returned', match: (s) => s.includes('REJECTED') },
];

export default function Claims() {
  const { data, error, loading, refreshing, reload } = useApi<any>('/expenses/claims/?scope=mine');
  const [filter, setFilter] = useState('all');
  const claims = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return asList<ClaimListItem>(data).filter((c) => f.match(c.status));
  }, [data, filter]);

  if (loading && !data) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/expenses/form')} hitSlop={8} style={{ paddingHorizontal: 16 }} accessibilityRole="button">
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>New</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filters}>
        {FILTERS.map((f) => <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
      </ScrollView>
      {error && <View style={{ padding: space.lg }}><ErrorBanner message={error} onRetry={reload} /></View>}
      <FlatList
        data={claims}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => <ClaimRow item={item} />}
        style={{ backgroundColor: colors.card }}
        contentContainerStyle={claims.length ? undefined : { flexGrow: 1, backgroundColor: colors.bg }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={filter === 'all' ? 'No expense claims yet' : 'Nothing here'}
            message={filter === 'all' ? 'Photograph a bill and submit it for reimbursement.' : 'No claims match this filter.'}
            action={filter === 'all' ? <Button title="New expense claim" icon="add" onPress={() => router.push('/expenses/form')} /> : undefined}
          />
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  filterBar: { flexGrow: 0, backgroundColor: colors.bg },
  filters: { gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md },
});
