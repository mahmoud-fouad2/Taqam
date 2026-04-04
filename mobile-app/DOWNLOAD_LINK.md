# 📱 تطبيق البصمة - رابط تحميل APK

> تنبيه: هذا المستند يخص المسار legacy `mobile-app/` فقط. المسار الرسمي الحالي هو `apps/mobile`.

## 🎯 الخيار السريع: استخدام Expo

بدلاً من بناء APK يدوياً، يمكن للموظفين تحميل **Expo Go** واستخدام التطبيق مباشرة!

### الخطوات:

1. **حمّل Expo Go** من:
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **المطور:** شغل التطبيق
```bash
cd mobile-app
npm start
```

3. **الموظف:** امسح QR code من تطبيق Expo Go

✅ يعمل مباشرة بدون بناء APK!

---

## 🏗️ بناء APK للتوزيع (Production)

إذا كنت تريد APK مستقل للتوزيع:

### الطريقة الأسهل: EAS Build (Cloud)

```bash
# 1. تثبيت EAS CLI
npm install -g eas-cli

# 2. تسجيل دخول (حساب مجاني)
eas login

# 3. إعداد المشروع
cd mobile-app
eas build:configure

# 4. بناء APK
eas build --platform android --profile preview
```

**النتيجة:** رابط تحميل APK مباشر مثل:
```
https://expo.dev/artifacts/eas/abc123.apk
```

شارك هذا الرابط مع الموظفين! ✅

---

## 📦 بناء محلي (Local Build)

### المتطلبات:
- Android Studio + SDK
- Java JDK 17+

### الخطوات:

```bash
cd mobile-app

# 1. إعداد .env
echo 'EXPO_PUBLIC_API_BASE_URL=https://YOUR-RENDER-DOMAIN' > .env

# 2. Pre-build
npx expo prebuild --platform android

# 3. Build APK
cd android
./gradlew assembleRelease

# 4. النتيجة:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📲 رفع APK على Google Drive / Dropbox

بعد البناء:

```bash
# 1. ابحث عن الملف
ls -lh android/app/build/outputs/apk/release/

# 2. ارفعه على Google Drive / Dropbox

# 3. احصل على رابط مشاركة عام

# 4. اختصر الرابط مع bit.ly مثلاً
```

مثال رابط نهائي:
```
https://bit.ly/taqam-attendance-app
```

---

## 🎨 تخصيص التطبيق (Branding)

### 1. تغيير الاسم والأيقونة

عدّل `mobile-app/app.json`:

```json
{
  "expo": {
    "name": "Taqam Legacy - الحضور",
    "slug": "taqam-legacy-attendance",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "android": {
      "package": "com.yourcompany.taqamlegacy",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    }
  }
}
```

### 2. إنشاء الأيقونات

استخدم أداة مثل:
- https://www.appicon.co/
- https://icon.kitchen/

حجم الصور:
- `icon.png`: 1024x1024
- `splash.png`: 1284x2778
- `adaptive-icon.png`: 1024x1024

---

## 🚀 النشر على Google Play Store

### الخطوات الكاملة:

1. **إنشاء حساب Google Play Console** ($25 مرة واحدة)
   - https://play.google.com/console

2. **بناء AAB (Android App Bundle)**

```bash
cd mobile-app
eas build --platform android --profile production
```

3. **رفع AAB على Google Play**
   - Create app
   - Upload AAB
   - إكمال Store Listing
   - Submit for review

4. **بعد الموافقة:**
   - سيكون التطبيق متاح على Play Store
  - رابط: `https://play.google.com/store/apps/details?id=com.yourcompany.taqamlegacy`

---

## 📋 بيانات اختبار التطبيق

للاختبار أثناء التطوير:

```
Server: https://YOUR-RENDER-DOMAIN
Email: admin@admin.com
Password: 123456
```

**ملاحظة:** لا تنسى إنشاء موظفين جدد من Dashboard لاختبار البصمة!

---

## ✅ ميزات التطبيق الجاهزة

- ✅ تسجيل دخول آمن
- ✅ بصمة الوجه / الإصبع (Biometric)
- ✅ تسجيل حضور (Check-in) مع GPS
- ✅ تسجيل انصراف (Check-out)
- ✅ عرض سجل الحضور
- ✅ إشعارات (قريباً)
- ✅ دعم العربية (قريباً)

---

## 🔗 روابط سريعة

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Icon Generator](https://icon.kitchen/)

---

## 💡 نصيحة

للتوزيع السريع **بدون** Google Play:

1. استخدم **EAS Build** لإنشاء APK
2. شارك رابط APK مباشرة
3. الموظفون يحملون ويثبتون (يحتاج تفعيل "Unknown Sources")

هذا أسرع من انتظار موافقة Google Play (قد تأخذ أيام)!
