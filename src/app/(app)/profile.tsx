import { useState } from 'react';
import { Alert } from 'react-native';
import { Button, Card, ErrorBanner, Field, InfoRow, Screen, SectionTitle } from '@/components/ui';
import { patch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { fmtDate, ROLE_LABEL } from '@/lib/format';

export default function Profile() {
  const { user, reloadUser } = useAuth();
  const p = user?.profile;
  const [form, setForm] = useState({
    phone: user?.phone ?? '',
    emergency_contact: p?.emergency_contact ?? '',
    address: p?.address ?? '',
    bank_name: p?.bank_name ?? '',
    bank_account_no: p?.bank_account_no ?? '',
    bank_ifsc_or_swift: p?.bank_ifsc_or_swift ?? '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  if (!user) return null;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await patch('/auth/profile/', form);
      await reloadUser();
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <InfoRow label="Name" value={`${user.first_name} ${user.last_name}`} />
        <InfoRow label="Employee ID" value={user.employee_id} />
        <InfoRow label="E-mail" value={user.email} />
        <InfoRow label="Role" value={ROLE_LABEL[user.role]} />
        <InfoRow label="Branch" value={user.primary_branch?.name} />
        <InfoRow label="Department" value={p?.department?.name} />
        <InfoRow label="Designation" value={p?.designation} />
        <InfoRow label="Reports to" value={p?.reporting_lead_name} />
        <InfoRow label="Date of joining" value={fmtDate(p?.date_of_joining)} />
      </Card>

      {error && <ErrorBanner message={error} />}
      <SectionTitle>Contact</SectionTitle>
      <Card>
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoComplete="tel" />
        <Field label="Emergency contact" value={form.emergency_contact} onChangeText={set('emergency_contact')} placeholder="Name and phone" />
        <Field label="Address" value={form.address} onChangeText={set('address')} multiline />
      </Card>

      <SectionTitle>Bank account for reimbursements</SectionTitle>
      <Card>
        <Field label="Bank name" value={form.bank_name} onChangeText={set('bank_name')} />
        <Field label="Account / IBAN" value={form.bank_account_no} onChangeText={set('bank_account_no')} autoCapitalize="characters" />
        <Field label="IFSC / SWIFT" value={form.bank_ifsc_or_swift} onChangeText={set('bank_ifsc_or_swift')} autoCapitalize="characters" />
      </Card>
      <Button title="Save changes" onPress={save} loading={busy} />
    </Screen>
  );
}
