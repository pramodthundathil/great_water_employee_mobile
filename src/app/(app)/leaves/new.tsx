import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AttachmentPicker, DateField, Select } from '@/components/forms';
import { Button, Card, Chip, ErrorBanner, Field, Loading, Notice, Screen } from '@/components/ui';
import { get, post, upload } from '@/lib/api';
import { appendFiles, PickedFile } from '@/lib/files';
import { days, isoDate, parseIsoDate } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { LeaveBalance, Option } from '@/lib/types';

interface Preview {
  ok: boolean;
  number_of_days: number;
  detail: string;
  code?: string;
  insufficient_balance?: boolean;
}

export default function ApplyLeave() {
  const today = isoDate(new Date());
  const [types, setTypes] = useState<Option[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [halfDay, setHalfDay] = useState(false);
  const [period, setPeriod] = useState<'FIRST_HALF' | 'SECOND_HALF'>('FIRST_HALF');
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [acknowledge, setAcknowledge] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, b] = await Promise.all([
          get<Option[]>('/leaves/types/'),
          get<{ balances: LeaveBalance[] }>('/leaves/balance/'),
        ]);
        setTypes(t);
        setBalances(b.balances);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live preview: chargeable days (holidays excluded), overlaps and balance.
  useEffect(() => {
    if (!typeId) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const p = await post<Preview>('/leaves/preview/', {
          leave_type: typeId, start_date: start, end_date: halfDay ? start : end, is_half_day: halfDay,
        });
        if (!cancelled) {
          setPreview(p);
          if (!p.insufficient_balance) setAcknowledge(false);
        }
      } catch {
        if (!cancelled) setPreview(null);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [typeId, start, end, halfDay]);

  const type = types.find((t) => t.id === typeId);
  const balance = balances.find((b) => b.leave_type_id === typeId);
  const blocked = preview && !preview.ok && !(preview.insufficient_balance && acknowledge);

  const submit = async () => {
    if (!typeId) return setError('Choose a leave type.');
    if (!reason.trim()) return setError('Enter a reason for your leave.');
    if (type?.requires_attachment && !files.length) return setError(`${type.name} requires a supporting document such as a medical certificate.`);
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('leave_type', String(typeId));
      form.append('start_date', start);
      form.append('end_date', halfDay ? start : end);
      form.append('is_half_day', halfDay ? 'true' : 'false');
      form.append('half_day_period', halfDay ? period : 'NONE');
      form.append('reason', reason.trim());
      form.append('acknowledge_insufficient_balance', acknowledge ? 'true' : 'false');
      appendFiles(form, 'attachment', files.slice(0, 1));
      const res = await upload<{ id: number; application_number: string }>('/leaves/applications/', form);
      router.dismiss();
      router.push({ pathname: '/leaves/[id]', params: { id: String(res.id) } });
      Alert.alert('Leave applied', `${res.application_number} was sent for your Lead / Manager's recommendation.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Screen>
      {error && <ErrorBanner message={error} />}
      <Card>
        <Select label="Leave type" required options={types} value={typeId} onChange={(t) => setTypeId(t.id)} />
        {balance && type?.is_paid !== false && (
          <Text style={s.balance}>
            Available: <Text style={{ fontWeight: '800', color: colors.primaryDark }}>{days(balance.effective_remaining)}</Text>
            {balance.pending_days > 0 ? `  (${days(balance.pending_days)} pending)` : ''}
          </Text>
        )}

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Half day</Text>
          <Switch value={halfDay} onValueChange={setHalfDay} trackColor={{ true: colors.primary }} accessibilityLabel="Half day" />
        </View>
        {halfDay && (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Chip label="Morning" active={period === 'FIRST_HALF'} onPress={() => setPeriod('FIRST_HALF')} />
            <Chip label="Afternoon" active={period === 'SECOND_HALF'} onPress={() => setPeriod('SECOND_HALF')} />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <DateField label={halfDay ? 'Date' : 'From'} required value={start} onChange={(v) => { setStart(v); if (end < v) setEnd(v); }} />
          {!halfDay && <DateField label="To" required value={end} onChange={setEnd} minimumDate={parseIsoDate(start)} />}
        </View>

        {preview && (
          <View style={[s.preview, !preview.ok && { backgroundColor: preview.insufficient_balance ? colors.warningSoft : colors.dangerSoft }]}>
            <Text style={s.previewDays}>{days(preview.number_of_days)}</Text>
            <Text style={s.previewText}>{preview.ok ? 'will be charged (public holidays are not counted)' : preview.detail}</Text>
          </View>
        )}
        {preview?.insufficient_balance && (
          <Pressable style={s.ack} onPress={() => setAcknowledge((v) => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: acknowledge }}>
            <Ionicons name={acknowledge ? 'checkbox' : 'square-outline'} size={24} color={colors.primary} />
            <Text style={{ flex: 1, color: colors.text }}>Apply anyway — HR will review my balance</Text>
          </Pressable>
        )}

        <Field label="Reason" required value={reason} onChangeText={setReason} multiline placeholder="e.g. Family function in Thrissur" />
      </Card>

      <Card>
        <AttachmentPicker
          files={files}
          onChange={setFiles}
          label={type?.requires_attachment ? 'Supporting document' : 'Supporting document (optional)'}
          required={type?.requires_attachment}
          allowMultiple={false}
        />
      </Card>

      <Notice message="Approval route: Lead / Manager → HR Coordinator → Director. Your balance is deducted only after the Director approves." />
      <Button title="Submit application" icon="send" onPress={submit} loading={busy} disabled={!!blocked} />
    </Screen>
  );
}

const s = StyleSheet.create({
  balance: { fontSize: 14, color: colors.muted },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  preview: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  previewDays: { fontSize: 18, fontWeight: '800', color: colors.ink },
  previewText: { flex: 1, fontSize: 13, color: colors.text },
  ack: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 },
});
