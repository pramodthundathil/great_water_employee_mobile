import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import { statusTone, Tone, toneColors } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';

export function Screen({
  children, refreshing, onRefresh, padded = true,
}: { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; padded?: boolean }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={padded ? { padding: space.lg, paddingBottom: 48, gap: space.md } : undefined}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }: ButtonProps) {
  const palette = {
    primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
    success: { bg: colors.success, fg: '#fff', border: colors.success },
    danger: { bg: colors.card, fg: colors.danger, border: colors.danger },
    secondary: { bg: colors.card, fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={palette.fg} />}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label, required, hint, error, ...input
}: TextInputProps & { label: string; required?: boolean; hint?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={colors.faint}
        {...input}
        style={[styles.input, input.multiline && { minHeight: 88, textAlignVertical: 'top' }, error && { borderColor: colors.danger }, input.style]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Badge({ status, label, tone }: { status?: string; label: string; tone?: Tone }) {
  const t = toneColors[tone ?? statusTone(status ?? '')];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBanner} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={20} color={colors.danger} />
      <Text style={{ flex: 1, color: colors.danger }}>{message}</Text>
      {onRetry && <Text onPress={onRetry} style={{ color: colors.primary, fontWeight: '700' }}>Retry</Text>}
    </View>
  );
}

export function Notice({ message, tone = 'info' }: { message: string; tone?: 'info' | 'warning' }) {
  const c = tone === 'warning' ? { bg: colors.warningSoft, fg: colors.warning } : { bg: colors.primarySoft, fg: colors.primaryDark };
  return (
    <View style={[styles.errorBanner, { backgroundColor: c.bg, borderColor: 'transparent' }]}>
      <Ionicons name={tone === 'warning' ? 'warning' : 'information-circle'} size={20} color={c.fg} />
      <Text style={{ flex: 1, color: c.fg }}>{message}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: {
  icon: keyof typeof Ionicons.glyphMap; title: string; message?: string; action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Ionicons name={icon} size={28} color={colors.primary} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyText}>{message}</Text> : null}
      {action}
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' || value == null ? (
        <Text style={styles.infoValue} selectable>{value ?? '—'}</Text>
      ) : value}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: space.sm,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  button: {
    minHeight: 48, borderRadius: radius.md, borderWidth: 1.5, paddingHorizontal: space.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm,
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: space.md, paddingVertical: 12, fontSize: 16, color: colors.ink, backgroundColor: '#fff',
  },
  hint: { fontSize: 12, color: colors.muted },
  errorText: { fontSize: 12, color: colors.danger },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', maxWidth: 220 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md,
    backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: '#F5C2C2',
  },
  empty: { alignItems: 'center', padding: 32, gap: space.sm },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: colors.muted },
  infoValue: { fontSize: 14, color: colors.ink, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  chip: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff', borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8, minHeight: 36, justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
});
