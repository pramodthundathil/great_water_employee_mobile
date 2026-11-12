import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { AttachmentPicker, DateField, Select } from '@/components/forms';
import { Button, Card, ErrorBanner, Field, Loading, Notice, Screen, SectionTitle } from '@/components/ui';
import { AttachmentList } from '@/components/workflow';
import { del, get, patch, post, upload } from '@/lib/api';
import { appendFiles, PickedFile } from '@/lib/files';
import { isoDate } from '@/lib/format';
import { space } from '@/lib/theme';
import type { Attachment, ClaimDetail, Option } from '@/lib/types';

export default function ExpenseForm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;

  const [categories, setCategories] = useState<Option[]>([]);
  const [category, setCategory] = useState<number | null>(null);
  const [expenseDate, setExpenseDate] = useState(isoDate(new Date()));
  const [amount, setAmount] = useState('');
  const [projectRef, setProjectRef] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [existing, setExisting] = useState<Attachment[]>([]);
  const [status, setStatus] = useState<string>('DRAFT');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        setCategories(await get<Option[]>('/expenses/categories/'));
        if (editing) {
          const c = await get<ClaimDetail>(`/expenses/claims/${id}/`);
          setCategory(c.category.id);
          setExpenseDate(c.expense_date);
          setAmount(String(c.amount));
          setProjectRef(c.project_reference);
          setDescription(c.description);
          setExisting(c.attachments);
          setStatus(c.status);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id]);

  const validate = (submitting: boolean) => {
    const errs: Record<string, string> = {};
    if (!category) errs.category = 'Choose a category.';
    const amt = Number(amount.replace(/,/g, ''));
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter an amount greater than zero.';
    if (!description.trim()) errs.description = 'Describe the business purpose.';
    if (submitting && files.length + existing.length === 0) errs.files = 'Attach at least one bill or receipt to submit.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const save = async (submit: boolean) => {
    if (!validate(submit)) return;
    setBusy(submit ? 'submit' : 'draft');
    setError(null);
    const amountValue = amount.replace(/,/g, '');
    try {
      let claimId = id;
      if (editing) {
        await patch(`/expenses/claims/${id}/`, {
          category, amount: amountValue, expense_date: expenseDate, description, project_reference: projectRef,
        });
        if (files.length) {
          const form = new FormData();
          appendFiles(form, 'receipts', files);
          await upload(`/expenses/claims/${id}/attachments/`, form);
        }
        if (submit && status !== 'UNDER_ADMIN_REVIEW') await post(`/expenses/claims/${id}/submit/`);
      } else {
        const form = new FormData();
        form.append('category', String(category));
        form.append('amount', amountValue);
        form.append('expense_date', expenseDate);
        form.append('description', description);
        form.append('project_reference', projectRef);
        form.append('submit_now', submit ? 'true' : 'false');
        appendFiles(form, 'receipts', files);
        const created = await upload<ClaimDetail>('/expenses/claims/', form);
        claimId = String(created.id);
      }
      router.dismiss();
      router.push({ pathname: '/expenses/[id]', params: { id: String(claimId) } });
      Alert.alert(submit ? 'Submitted' : 'Saved', submit ? 'Your claim was sent to the Admin Manager for review.' : 'Your claim was saved as a draft.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const removeExisting = (a: Attachment) =>
    Alert.alert('Remove file?', a.original_filename, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            const c = await del<ClaimDetail>(`/expenses/claims/${id}/attachments/${a.id}/`);
            setExisting(c.attachments);
          } catch (e: any) {
            setError(e.message);
          }
        },
      },
    ]);

  if (loading) return <Loading />;

  return (
    <Screen>
      <Stack.Screen options={{ title: editing ? 'Edit claim' : 'New expense claim' }} />
      {error && <ErrorBanner message={error} />}
      <Notice message="Every claim needs a bill or receipt. You can save a draft and add the proof later." />
      <Card>
        <Select label="Category" required options={categories} value={category} onChange={(c) => setCategory(c.id)} />
        {fieldErrors.category && <ErrorBanner message={fieldErrors.category} />}
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <DateField label="Expense date" required value={expenseDate} onChange={setExpenseDate} maximumDate={new Date()} />
          <View style={{ flex: 1 }}>
            <Field
              label="Amount (USD)"
              required
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={fieldErrors.amount}
            />
          </View>
        </View>
        <Field
          label="Business purpose"
          required
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="e.g. Taxi from Kochi port to client site for inspection"
          error={fieldErrors.description}
        />
        <Field label="Project / department reference" value={projectRef} onChangeText={setProjectRef} placeholder="Optional" />
      </Card>

      <SectionTitle>Proof</SectionTitle>
      <Card>
        {existing.length > 0 && <AttachmentList items={existing} onDelete={removeExisting} />}
        <AttachmentPicker files={files} onChange={setFiles} label={existing.length ? 'Add more' : 'Bills / receipts'} required />
        {fieldErrors.files && <ErrorBanner message={fieldErrors.files} />}
      </Card>

      <View style={{ gap: space.sm }}>
        {status !== 'UNDER_ADMIN_REVIEW' && (
          <Button title="Submit for approval" icon="send" onPress={() => save(true)} loading={busy === 'submit'} disabled={!!busy} />
        )}
        <Button
          title={status === 'UNDER_ADMIN_REVIEW' ? 'Save changes' : 'Save as draft'}
          variant="secondary"
          onPress={() => save(false)}
          loading={busy === 'draft'}
          disabled={!!busy}
        />
      </View>
    </Screen>
  );
}
