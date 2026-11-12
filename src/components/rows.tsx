import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { days, fmtDate, money } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import type { ClaimListItem, LeaveListItem, PendingItem } from '@/lib/types';
import { Badge } from './ui';

export function ClaimRow({ item, showEmployee }: { item: ClaimListItem; showEmployee?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/expenses/[id]', params: { id: String(item.id) } })}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.bg }]}
      accessibilityRole="button"
      accessibilityLabel={`${item.category_name}, ${money(item.amount)}, ${item.status_display}`}
    >
      <View style={s.icon}><Ionicons name="receipt-outline" size={20} color={colors.primary} /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.line}>
          <Text style={s.title} numberOfLines={1}>{showEmployee ? item.employee_name : item.category_name}</Text>
          <Text style={s.amount}>{money(item.amount)}</Text>
        </View>
        <Text style={s.meta} numberOfLines={1}>
          {showEmployee ? `${item.category_name} · ` : ''}{fmtDate(item.expense_date)} · {item.claim_number}
        </Text>
        <Badge status={item.status} label={item.status_display} />
      </View>
    </Pressable>
  );
}

export function LeaveRow({ item, showEmployee }: { item: LeaveListItem; showEmployee?: boolean }) {
  const range = item.start_date === item.end_date ? fmtDate(item.start_date) : `${fmtDate(item.start_date)} – ${fmtDate(item.end_date)}`;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/leaves/[id]', params: { id: String(item.id) } })}
      style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.bg }]}
      accessibilityRole="button"
      accessibilityLabel={`${item.leave_type_name}, ${range}, ${item.status_display}`}
    >
      <View style={[s.icon, { backgroundColor: colors.successSoft }]}><Ionicons name="calendar-outline" size={20} color={colors.success} /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.line}>
          <Text style={s.title} numberOfLines={1}>{showEmployee ? item.employee_name : item.leave_type_name}</Text>
          <Text style={s.amount}>{days(item.number_of_days)}</Text>
        </View>
        <Text style={s.meta} numberOfLines={1}>
          {showEmployee ? `${item.leave_type_name} · ` : ''}{range}{item.is_half_day ? ' (half day)' : ''}
        </Text>
        <Badge status={item.status} label={item.status_display} />
      </View>
    </Pressable>
  );
}

export function PendingRow({ item }: { item: PendingItem }) {
  const open = () =>
    router.push({
      pathname: item.kind === 'expense' ? '/expenses/[id]' : '/leaves/[id]',
      params: { id: String(item.id), endpoint: item.endpoint, stage: item.stage, actions: JSON.stringify(item.actions) },
    });
  const detail = item.kind === 'expense'
    ? `${item.title} · ${fmtDate(item.date)}`
    : `${item.title} · ${item.start_date === item.end_date ? fmtDate(item.start_date) : `${fmtDate(item.start_date)} – ${fmtDate(item.end_date)}`}`;
  return (
    <Pressable onPress={open} style={({ pressed }) => [s.row, pressed && { backgroundColor: colors.bg }]} accessibilityRole="button">
      <View style={[s.icon, item.kind === 'leave' && { backgroundColor: colors.successSoft }]}>
        <Ionicons
          name={item.kind === 'expense' ? 'receipt-outline' : 'calendar-outline'}
          size={20}
          color={item.kind === 'expense' ? colors.primary : colors.success}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={s.line}>
          <Text style={s.title} numberOfLines={1}>{item.employee_name}</Text>
          <Text style={s.amount}>{item.kind === 'expense' ? money(item.amount) : days(item.days ?? 0)}</Text>
        </View>
        <Text style={s.meta} numberOfLines={1}>{detail}</Text>
        <Text style={s.meta} numberOfLines={1}>{item.reference} · {item.branch_code}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.faint} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: space.md, padding: space.lg, alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  title: { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] },
  meta: { fontSize: 13, color: colors.muted },
});
