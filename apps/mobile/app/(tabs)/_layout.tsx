import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSettings } from '@/components/app-settings-provider';

const BRAND = '#3b82f6';

function TabIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={21} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const { language } = useAppSettings();
  const insets = useSafeAreaInsets();
  const isAr = language === 'ar';

  // Ensure tab bar sits above the system navigation bar
  const bottomPad = Platform.OS === 'ios' ? 22 : Math.max(insets.bottom, 10);
  const barHeight = Platform.OS === 'ios' ? 82 : 60 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          height: barHeight,
          paddingBottom: bottomPad,
          paddingTop: 4,
        },
        headerStyle: {
          backgroundColor: '#f8fafc',
        },
        headerTintColor: '#0f172a',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAr ? 'الحضور' : 'Attendance',
          tabBarIcon: ({ color }) => <TabIcon name="check-square-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: isAr ? 'السجل' : 'History',
          tabBarIcon: ({ color }) => <TabIcon name="clock-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaves"
        options={{
          title: isAr ? 'طلباتي' : 'Requests',
          tabBarIcon: ({ color }) => <TabIcon name="file-text-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isAr ? 'أنا' : 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="user-circle-o" color={color} />,
        }}
      />
      {/* Settings accessible from profile, hidden from tab bar */}
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
