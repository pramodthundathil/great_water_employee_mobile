import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field, Notice, styles as ui } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { colors, radius, space } from '@/lib/theme';

export default function SignIn() {
  const { signIn, signOutReason } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!username.trim() || !password) {
      setError('Enter your Employee ID (or e-mail) and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.brand}>
            <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" accessibilityLabel="Great Waters logo" />
            <Text style={s.brandName}>GREAT<Text style={{ color: colors.accent }}>WATERS</Text></Text>
            <Text style={s.tagline}>Expenses &amp; Leave</Text>
          </View>

          <Text style={s.title}>Sign in</Text>
          {signOutReason ? <Notice message={signOutReason} tone="warning" /> : null}
          {error ? <ErrorBanner message={error} /> : null}

          <Field
            label="Employee ID or e-mail"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            placeholder="e.g. GW-EMP-001"
            returnKeyType="next"
          />

          <View style={{ gap: 6 }}>
            <Text style={ui.label}>Password</Text>
            <View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                placeholder="Your password"
                placeholderTextColor={colors.faint}
                onSubmitEditing={submit}
                returnKeyType="go"
                style={[ui.input, { paddingRight: 52 }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((v) => !v)}
                style={s.eye}
                hitSlop={8}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
              </Pressable>
            </View>
          </View>

          <Button title="Sign in" onPress={submit} loading={busy} />

          <Link href="/forgot-password" asChild>
            <Pressable accessibilityRole="link" style={{ alignSelf: 'center', padding: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 15 }}>Forgot password?</Text>
            </Pressable>
          </Link>

          {__DEV__ ? <Text style={s.server}>Server: {API_URL}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { padding: space.xl, gap: space.lg, flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: 6, marginBottom: space.lg },
  logo: { width: 84, height: 84, borderRadius: radius.lg },
  brandName: { fontSize: 24, fontWeight: '800', color: colors.primaryDark, letterSpacing: 1 },
  tagline: { fontSize: 14, color: colors.muted },
  title: { fontSize: 26, fontWeight: '800', color: colors.ink },
  eye: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
  server: { textAlign: 'center', fontSize: 12, color: colors.faint },
});
