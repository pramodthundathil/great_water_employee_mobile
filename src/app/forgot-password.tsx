import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, ErrorBanner, Field, Notice, Screen } from '@/components/ui';
import { api } from '@/lib/api';
import { colors } from '@/lib/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.includes('@')) {
      setError('Enter the e-mail address registered with your employee account.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ detail: string }>('/auth/forgot-password/', { method: 'POST', body: { email }, auth: false });
      setSent(res.detail);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
        We will e-mail you a secure link to set a new password. The link opens in your browser and is valid for 24 hours.
      </Text>
      {sent ? (
        <>
          <Notice message={sent} />
          <Button title="Back to sign in" onPress={() => router.back()} />
        </>
      ) : (
        <Card>
          {error ? <ErrorBanner message={error} /> : null}
          <Field
            label="Corporate e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="name@greatwaters.com"
          />
          <Button title="Send reset link" onPress={submit} loading={busy} />
        </Card>
      )}
    </Screen>
  );
}
