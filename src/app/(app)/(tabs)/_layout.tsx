import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { isApprover, useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: unknown; size: number }) {
    return <Ionicons name={name} size={size} color={typeof color === 'string' ? color : colors.muted} />;
  };
}

export default function TabsLayout() {
  const { user } = useAuth();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerTitleStyle: { color: colors.ink, fontWeight: '700' },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="claims" options={{ title: 'Expenses', tabBarIcon: icon('receipt-outline') }} />
      <Tabs.Screen name="leave" options={{ title: 'Leave', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Protected guard={isApprover(user)}>
        <Tabs.Screen name="approvals" options={{ title: 'Approvals', tabBarIcon: icon('checkmark-done-outline') }} />
      </Tabs.Protected>
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: icon('person-circle-outline') }} />
    </Tabs>
  );
}
