import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { post } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { Approval, ApprovalAction, Attachment } from '@/lib/types';
import { Button, Card, Field, SectionTitle } from './ui';

const STAGE_LABEL: Record<string, string> = {
  ADMIN_MANAGER: 'Admin Manager',
  DIRECTOR: 'Director',
  LEAD_MANAGER: 'Lead / Manager',
  HR_COORDINATOR: 'HR Coordinator',
};

/** Shows each approval step taken so far plus the next expected steps. */
export function ApprovalTimeline({ history, upcoming }: { history: Approval[]; upcoming: string[] }) {
  return (
    <Card>
      {history.map((h) => {
        const rejected = h.action === 'REJECTED';
        return (
          <View key={h.id} style={s.step}>
            <Ionicons name={rejected ? 'close-circle' : 'checkmark-circle'} size={22} color={rejected ? colors.danger : colors.success} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.stepTitle}>
                {STAGE_LABEL[h.stage] ?? h.stage} · {h.action.charAt(0) + h.action.slice(1).toLowerCase()}
              </Text>
              <Text style={s.stepMeta}>{h.approver_name} · {fmtDateTime(h.created_at)}</Text>
              {h.remarks ? <Text style={[s.remark, rejected && { color: colors.danger }]}>“{h.remarks}”</Text> : null}
            </View>
          </View>
        );
      })}
      {upcoming.map((label) => (
        <View key={label} style={s.step}>
          <Ionicons name="ellipse-outline" size={22} color={colors.faint} />
          <Text style={[s.stepTitle, { color: colors.muted, flex: 1 }]}>{label}</Text>
        </View>
      ))}
      {history.length === 0 && upcoming.length === 0 ? <Text style={s.stepMeta}>No approval activity yet.</Text> : null}
    </Card>
  );
}

export function AttachmentList({ items, onDelete }: { items: Attachment[]; onDelete?: (a: Attachment) => void }) {
  if (!items.length) return <Text style={s.stepMeta}>No proof attached.</Text>;
  return (
    <View style={{ gap: 8 }}>
      {items.map((a) => (
        <Pressable
          key={a.id}
          accessibilityRole="link"
          onPress={() => Linking.openURL(a.file_url)}
          style={({ pressed }) => [s.file, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name={a.file_type?.includes('pdf') ? 'document-text' : 'image'} size={20} color={colors.primary} />
          <Text style={{ flex: 1, color: colors.ink }} numberOfLines={1}>{a.original_filename}</Text>
          {onDelete ? (
            <Pressable hitSlop={12} accessibilityLabel={`Remove ${a.original_filename}`} onPress={() => onDelete(a)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          ) : (
            <Ionicons name="open-outline" size={18} color={colors.muted} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

/** Approve / recommend / verify / reject panel for the current approver. */
export function ApprovalPanel({
  endpoint, actions, stage, onDone,
}: { endpoint: string; actions: ApprovalAction[]; stage: string; onDone: (message: string) => void }) {
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const act = (a: ApprovalAction) => {
    if (a.requires_remarks && !remarks.trim()) {
      setError('Please enter a remark explaining the rejection. The employee will see it.');
      return;
    }
    Alert.alert(`${a.label}?`, a.tone === 'negative' ? 'The request will be returned to the employee with your remark.' : 'This moves the request to the next stage.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: a.label,
        style: a.tone === 'negative' ? 'destructive' : 'default',
        onPress: async () => {
          setBusy(a.value);
          setError(undefined);
          try {
            const res = await post<{ detail: string }>(endpoint, { action: a.value, remarks: remarks.trim() });
            onDone(res.detail);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <>
      <SectionTitle>Your decision · {stage}</SectionTitle>
      <Card>
        <Field
          label="Remarks"
          placeholder="Optional for approval, required for rejection"
          value={remarks}
          onChangeText={(t) => { setRemarks(t); setError(undefined); }}
          multiline
          error={error}
        />
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {actions.map((a) => (
            <Button
              key={a.value}
              title={a.label}
              variant={a.tone === 'negative' ? 'danger' : 'success'}
              icon={a.tone === 'negative' ? 'close' : 'checkmark'}
              loading={busy === a.value}
              disabled={!!busy && busy !== a.value}
              onPress={() => act(a)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  step: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', paddingVertical: 6 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  stepMeta: { fontSize: 13, color: colors.muted },
  remark: { fontSize: 14, color: colors.text, fontStyle: 'italic', marginTop: 2 },
  file: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
});
