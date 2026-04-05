import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Text as ThemedText, View as ThemedView } from '@/components/Themed';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <ThemedView style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>404</Text>
        </View>
        <ThemedText style={styles.title}>هذه الشاشة غير موجودة</ThemedText>
        <ThemedText style={styles.description}>يمكنك الرجوع إلى تسجيل الدخول أو البدء من الجذر وسيعيد التطبيق توجيهك للمسار الصحيح.</ThemedText>

        <View style={styles.actions}>
          <Link href="/" asChild>
            <Pressable style={[styles.button, styles.primaryButton]}>
              <Text style={[styles.buttonText, styles.primaryButtonText]}>ابدأ من جديد</Text>
            </Pressable>
          </Link>
          <Link href="/(auth)/login" asChild>
            <Pressable style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>تسجيل الدخول</Text>
            </Pressable>
          </Link>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  badge: {
    marginBottom: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.35)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 18,
    fontWeight: '900',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.75,
  },
  actions: {
    marginTop: 24,
    width: '100%',
    gap: 10,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  buttonText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
});
