import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, Text } from 'react-native';
import { Badge, Button, Card, ErrorBanner, InfoRow, Loading, Screen, SectionTitle } from '@/components/ui';
import { ApprovalPanel, ApprovalTimeline } from '@/components/workflow';
import { post } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { days, fmtDate, fmtDateTime } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { ApprovalAction, LeaveDetail } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const PENDING = ['PENDING_LEAD_RECOMMENDATION', 'PENDING_HR_VERIFICATION', 'PENDING_DIRECTOR_APPROVAL'];

function upcomingSteps(status: string): string[] {
  switch (status) {
    case 'PENDING_LEAD_RECOMMENDATION': return ['Lead / Manager recommendation (current)', 'HR verification', 'Director approval'];
    case 'PENDING_HR_VERIFICATION': return ['HR verification (current)', 'Director approval'];
    case 'PENDING_DIRECTOR_APPROVAL': return ['Director approval (current)'];
    default: return [];
  }
}

export default function LeaveDetailScreen() {
  const params = useLocalSearchParams<{ id: string; endpoint?: string; stage?: string; actions?: string }>();
  const { user } = useAuth();
  const { data: app, error, loading, refreshing, reload } = useApi<LeaveDetail>(`/leaves/applications/${params.id}/`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewDone, setReviewDone] = useState(false);

  if (loading && !app) return <Loading />;
  if (!app) return <Screen><ErrorBanner message={error ?? 'Leave application not found.'} onRetry={reload} /></Screen>;

  const isOwner = app.employee.id === user?.id;
  const actions: ApprovalAction[] = params.actions ? JSON.parse(params.actions) : [];
  const canReview = !!params.endpoint && !reviewDone && PENDING.includes(app.status);
  const rejection = [...app.approval_history].reverse().find((h) => h.action === 'REJECTED');
  const range = app.start_date === app.end_date ? fmtDate(app.start_date) : `${fmtDate(app.start_date)} – ${fmtDate(app.end_date)}`;

  const withdraw = () =>
    Alert.alert('Withdraw application?', 'Your approvers will no longer see it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            await post(`/leaves/applications/${app.id}/withdraw/`);
            reload();
          } catch (e: any) {
            setActionError(e.message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Stack.Screen options={{ title: app.application_number }} />
      {actionError && <ErrorBanner message={actionError} />}
      <Card>
        <Text style={s.title}>{app.leave_type.name}</Text>
        <Text style={s.range}>{range}{app.is_half_day ? ` · ${app.half_day_period === 'FIRST_HALF' ? 'morning' : 'afternoon'}` : ''}</Text>
        <Badge status={app.status} label={app.status_display} />
        <InfoRow label="Days charged" value={days(app.number_of_days)} />
        {!isOwner && <InfoRow label="Employee" value={`${app.employee.full_name} (${app.employee.employee_id})`} />}
        <InfoRow label="Applied" value={fmtDateTime(app.submitted_at)} />
        <Text style={s.reason} selectable>{app.reason}</Text>
        {app.attachment_url && (
          <Button title="View attachment" icon="document-attach-outline" variant="ghost" onPress={() => Linking.openURL(app.attachment_url!)} />
        )}
      </Card>

      {isOwner && rejection && app.status.includes('REJECTED') && (
        <Card style={{ backgroundColor: colors.dangerSoft, borderColor: '#F5C2C2' }}>
          <Text style={{ fontWeight: '700', color: colors.danger }}>Not approved by {rejection.approver_name}</Text>
          <Text style={{ color: colors.text }}>{rejection.remarks}</Text>
        </Card>
      )}

      <SectionTitle>Approval progress</SectionTitle>
      <ApprovalTimeline history={app.approval_history} upcoming={upcomingSteps(app.status)} />

      {canReview && (
        <ApprovalPanel
          endpoint={params.endpoint!}
          actions={actions}
          stage={params.stage ?? 'Review'}
          onDone={(msg) => { setReviewDone(true); Alert.alert('Done', msg); router.back(); }}
        />
      )}

      {isOwner && PENDING.includes(app.status) && (
        <Button title="Withdraw application" variant="danger" icon="close-circle-outline" onPress={withdraw} loading={busy} />
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  range: { fontSize: 16, color: colors.text },
  reason: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 4 },
});
