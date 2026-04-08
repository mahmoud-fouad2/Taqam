import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useAppSettings } from '@/components/app-settings-provider';

const BRAND = '#3b82f6';

function TabIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={21} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { language } = useAppSettings();
  const isDark = colorScheme === 'dark';
  const isAr = language === 'ar';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: isDark ? '#475569' : '#94a3b8',
        tabBarStyle: {
          backgroundColor: isDark ? '#0a0f1e' : '#ffffff',
          borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0',
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -3 },
          height: Platform.OS === 'ios' ? 82 : 62,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 4,
        },
        headerStyle: {
          backgroundColor: isDark ? '#0a0f1e' : '#ffffff',
        },
        headerTintColor: isDark ? '#f1f5f9' : '#0f172a',
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
