import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { routeForLink } from '@/lib/push';
import { colors } from '@/lib/theme';

export default function AppLayout() {
  // Open the related claim / leave when the user taps a push notification.
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null | undefined) => {
      const link = response?.notification.request.content.data?.link_url as string | undefined;
      const route = routeForLink(link);
      if (route) router.push(route as any);
    };
    const last = Notifications.getLastNotificationResponse?.();
    if (last) open(last);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="expenses/form" options={{ title: 'Expense claim', presentation: 'modal' }} />
      <Stack.Screen name="expenses/[id]" options={{ title: 'Claim' }} />
      <Stack.Screen name="leaves/new" options={{ title: 'Apply for leave', presentation: 'modal' }} />
      <Stack.Screen name="leaves/[id]" options={{ title: 'Leave application' }} />
      <Stack.Screen name="leaves/ledger" options={{ title: 'Leave balance history' }} />
      <Stack.Screen name="holidays" options={{ title: 'Public holidays' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="profile" options={{ title: 'My profile' }} />
      <Stack.Screen name="change-password" options={{ title: 'Change password' }} />
    </Stack>
  );
}
