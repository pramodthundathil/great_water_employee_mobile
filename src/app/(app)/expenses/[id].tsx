import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { DateField } from '@/components/forms';
import { Badge, Button, Card, Chip, ErrorBanner, Field, InfoRow, Loading, Screen, SectionTitle } from '@/components/ui';
import { ApprovalPanel, ApprovalTimeline, AttachmentList } from '@/components/workflow';
import { post } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDate, fmtDateTime, isoDate, money } from '@/lib/format';
import { colors, space } from '@/lib/theme';
import type { ApprovalAction, ClaimDetail } from '@/lib/types';
import { useApi } from '@/lib/useApi';

const EDITABLE = ['DRAFT', 'UNDER_ADMIN_REVIEW', 'REJECTED_BY_ADMIN', 'REJECTED_BY_DIRECTOR'];
const PAYMENT_MODES = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CORPORATE_CARD', label: 'Card' },
];

function upcomingSteps(status: string): string[] {
  switch (status) {
    case 'DRAFT': return ['Admin Manager review', 'Director approval', 'Payment'];
    case 'UNDER_ADMIN_REVIEW': return ['Admin Manager review (current)', 'Director approval', 'Payment'];
    case 'UNDER_DIRECTOR_REVIEW': return ['Director approval (current)', 'Payment'];
    case 'APPROVED_BY_DIRECTOR': return ['Payment by Admin Manager (current)'];
    default: return [];
  }
}

export default function ClaimDetailScreen() {
  const params = useLocalSearchParams<{ id: string; endpoint?: string; stage?: string; actions?: string }>();
  const { user } = useAuth();
  const { data: claim, error, loading, refreshing, reload } = useApi<ClaimDetail>(`/expenses/claims/${params.id}/`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewDone, setReviewDone] = useState(false);

  if (loading && !claim) return <Loading />;
  if (!claim) return <Screen><ErrorBanner message={error ?? 'Claim not found.'} onRetry={reload} /></Screen>;

  const isOwner = claim.employee.id === user?.id;
  const actions: ApprovalAction[] = params.actions ? JSON.parse(params.actions) : [];
  const canReview = !!params.endpoint && !reviewDone && ['UNDER_ADMIN_REVIEW', 'UNDER_DIRECTOR_REVIEW'].includes(claim.status);
  const canPay = user?.role === 'ADMIN_MANAGER' && claim.status === 'APPROVED_BY_DIRECTOR' && !isOwner;
  const rejection = [...claim.approval_history].reverse().find((h) => h.action === 'REJECTED');

  const run = (title: string, message: string, path: string, confirmLabel: string, destructive = false) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: async () => {
          setBusy(true);
          setActionError(null);
          try {
            await post(path);
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
      <Stack.Screen options={{ title: claim.claim_number }} />
      {actionError && <ErrorBanner message={actionError} />}

      <Card>
        <Text style={s.amount}>{money(claim.amount)}</Text>
        <Badge status={claim.status} label={claim.status_display} />
        <InfoRow label="Category" value={claim.category.name} />
        <InfoRow label="Expense date" value={fmtDate(claim.expense_date)} />
        {!isOwner && <InfoRow label="Employee" value={`${claim.employee.full_name} (${claim.employee.employee_id})`} />}
        <InfoRow label="Branch" value={claim.branch.name} />
        {claim.project_reference ? <InfoRow label="Project ref." value={claim.project_reference} /> : null}
        <InfoRow label="Submitted" value={claim.submitted_at ? fmtDateTime(claim.submitted_at) : 'Not yet'} />
        <Text style={s.desc} selectable>{claim.description}</Text>
      </Card>

      {isOwner && rejection && claim.status.includes('REJECTED') && (
        <Card style={{ backgroundColor: colors.dangerSoft, borderColor: '#F5C2C2' }}>
          <Text style={{ fontWeight: '700', color: colors.danger }}>Returned by {rejection.approver_name}</Text>
          <Text style={{ color: colors.text }}>{rejection.remarks}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Edit the claim and submit it again.</Text>
        </Card>
      )}

      {claim.payment_record && (
        <>
          <SectionTitle>Payment</SectionTitle>
          <Card>
            <InfoRow label="Paid on" value={fmtDate(claim.payment_record.payment_date)} />
            <InfoRow label="Mode" value={claim.payment_record.payment_mode.replace(/_/g, ' ').toLowerCase()} />
            <InfoRow label="Reference" value={claim.payment_record.payment_reference} />
            <InfoRow label="Recorded by" value={claim.payment_record.recorded_by_name} />
          </Card>
        </>
      )}

      <SectionTitle>Proof ({claim.attachments.length})</SectionTitle>
      <Card><AttachmentList items={claim.attachments} /></Card>

      <SectionTitle>Approval progress</SectionTitle>
      <ApprovalTimeline history={claim.approval_history} upcoming={upcomingSteps(claim.status)} />

      {canReview && (
        <ApprovalPanel
          endpoint={params.endpoint!}
          actions={actions}
          stage={params.stage ?? 'Review'}
          onDone={(msg) => { setReviewDone(true); reload(); Alert.alert('Done', msg); router.back(); }}
        />
      )}

      {canPay && <PaymentPanel claimId={claim.id} onDone={reload} />}

      {isOwner && (
        <View style={{ gap: space.sm, marginTop: space.sm }}>
          {EDITABLE.includes(claim.status) && (
            <Button title="Edit claim" icon="create-outline" variant="secondary" onPress={() => router.push({ pathname: '/expenses/form', params: { id: String(claim.id) } })} disabled={busy} />
          )}
          {['DRAFT', 'REJECTED_BY_ADMIN', 'REJECTED_BY_DIRECTOR'].includes(claim.status) && (
            <Button
              title="Submit for approval"
              icon="send"
              loading={busy}
              onPress={() => run('Submit claim?', 'It will go to the Admin Manager for review.', `/expenses/claims/${claim.id}/submit/`, 'Submit')}
            />
          )}
          {['DRAFT', 'UNDER_ADMIN_REVIEW'].includes(claim.status) && (
            <Button
              title="Withdraw claim"
              variant="danger"
              icon="close-circle-outline"
              disabled={busy}
              onPress={() => run('Withdraw claim?', 'This cannot be undone. You can create a new claim later.', `/expenses/claims/${claim.id}/withdraw/`, 'Withdraw', true)}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

function PaymentPanel({ claimId, onDone }: { claimId: number; onDone: () => void }) {
  const [mode, setMode] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(isoDate(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    if (!reference.trim()) {
      setError('Enter the transaction / cheque reference.');
      return;
    }
    setBusy(true);
    try {
      await post(`/expenses/claims/${claimId}/record-payment/`, {
        payment_mode: mode, payment_reference: reference.trim(), payment_date: date,
      });
      Alert.alert('Payment recorded', 'The employee has been notified.');
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SectionTitle>Record reimbursement</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {PAYMENT_MODES.map((m) => <Chip key={m.value} label={m.label} active={mode === m.value} onPress={() => setMode(m.value)} />)}
        </View>
        <DateField label="Payment date" value={date} onChange={setDate} maximumDate={new Date()} />
        <Field label="Transaction reference" required value={reference} onChangeText={(t) => { setReference(t); setError(undefined); }} error={error} autoCapitalize="characters" />
        <Button title="Mark as paid" icon="cash-outline" variant="success" onPress={submit} loading={busy} />
      </Card>
    </>
  );
}

const s = StyleSheet.create({
  amount: { fontSize: 30, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  desc: { fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 4 },
});
