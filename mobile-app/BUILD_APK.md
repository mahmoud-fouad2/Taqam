# 📱 بناء تطبيق البصمة (APK للأندرويد)

> تنبيه: هذا الدليل يخص المسار legacy `mobile-app/` فقط. التطبيق الرسمي الجاري تطويره والتحقق منه موجود في `apps/mobile`.

## الطريقة 1: باستخدام EAS Build (موصى بها)

### المتطلبات
- حساب Expo مجاني: https://expo.dev/signup

### الخطوات

```bash
# 1. تثبيت EAS CLI
npm install -g eas-cli

# 2. تسجيل الدخول
eas login

# 3. الانتقال لمجلد التطبيق
cd mobile-app

# 4. إعداد المتغيرات البيئية
# أنشئ ملف .env وأضف:
echo "EXPO_PUBLIC_API_BASE_URL=https://YOUR-RENDER-DOMAIN" > .env

# 5. إعداد EAS (أول مرة فقط)
eas build:configure

# 6. بناء APK
eas build --platform android --profile preview
```

بعد انتهاء البناء، ستحصل على رابط لتحميل APK مباشرة!

---

## الطريقة 2: بناء محلي (Local Build)

### المتطلبات
- Android Studio + SDK
- Java JDK 17+

### الخطوات

```bash
cd mobile-app

# 1. إعداد المتغيرات
echo "EXPO_PUBLIC_API_BASE_URL=https://YOUR-RENDER-DOMAIN" > .env

# 2. تثبيت التبعيات
npm install

# 3. Pre-build للأندرويد
npx expo prebuild --platform android

# 4. بناء APK
cd android
./gradlew assembleRelease

# 5. APK سيكون في:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## ✅ التطبيق جاهز للاستخدام

### المميزات:
- ✅ تسجيل الدخول بالبريد وكلمة المرور
- ✅ بصمة الوجه / بصمة الإصبع (Biometric)
- ✅ تسجيل الحضور (Check-in)
- ✅ تسجيل الانصراف (Check-out)
- ✅ تحديد الموقع الجغرافي (GPS)
- ✅ حفظ الجلسة بشكل آمن

### بيانات التجربة:
```
Email: admin@admin.com
Password: 123456
```

---

## 🎯 رابط سريع لتحميل APK

بعد بناء التطبيق بـ EAS، ستحصل على رابط مثل:
```
https://expo.dev/artifacts/eas/xxxxx.apk
```

يمكنك مشاركة هذا الرابط مباشرة مع الموظفين!

---

## 🔧 تخصيص التطبيق

### تغيير الاسم والأيقونة
عدّل ملف `app.json`:

```json
{
  "name": "Taqam Legacy - البصمة",
  "icon": "./assets/icon.png",
  "android": {
    "package": "com.yourcompany.taqamlegacy"
  }
}
```

### إضافة العربية
التطبيق جاهز لدعم العربية، فقط قم بإضافة ملفات الترجمة في `lib/i18n/`.
