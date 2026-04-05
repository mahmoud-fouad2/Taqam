import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>404</Text>
        </View>
        <Text style={styles.title}>هذه الشاشة غير موجودة</Text>
        <Text style={styles.description}>ارجع للحضور أو إلى الصفحة الرئيسية للتطبيق، أو افتح ملفك الشخصي لإدارة الجلسة الحالية.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>روابط سريعة</Text>
          <Text style={styles.cardText}>الحضور والانصراف، الطلبات، والملف الشخصي ما زالت متاحة من التبويبات الرئيسية.</Text>
        </View>

        <View style={styles.actions}>
          <Link href="/" asChild>
            <Pressable style={[styles.button, styles.primaryButton]}>
              <Text style={[styles.buttonText, styles.primaryButtonText]}>الواجهة الرئيسية</Text>
            </Pressable>
          </Link>
          <Link href="/(tabs)" asChild>
            <Pressable style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>الحضور</Text>
            </Pressable>
          </Link>
          <Link href="/(tabs)/profile" asChild>
            <Pressable style={[styles.button, styles.secondaryButton]}>
              <Text style={styles.buttonText}>الملف الشخصي</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0f1e',
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
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  card: {
    marginTop: 24,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#111827',
    padding: 16,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    marginTop: 22,
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
