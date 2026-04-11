# خطة تطبيق الجوال (Ujoors Mobile)

> التاريخ: 2026-01-25

## 0) الهدف والنتيجة المتوقعة

بناء تطبيق جوال (iOS/Android) لتسجيل الحضور والانصراف بشكل **آمن ومضاد للتلاعب قدر الإمكان**، مع ربط “احترافي” بالمشروع الحالي:

- نفس المستخدمين/الشركات (Multi-tenant)
- نفس سياسات الحضور والموقع (Geofence)
- نفس نظام الصلاحيات
- نفس واجهات البيانات (Prisma)

**تعريف النجاح (MVP):** موظف يسجل دخول → يرى حالة اليوم → يعمل Check-in/Check-out → السيرفر يرفض خارج النطاق أو بدقة GPS سيئة → تُحفظ السجلات وتظهر له.

---

## 1) نطاق التطبيق (Scope)

### MVP (نسخة 1)

- تسجيل دخول بالبريد/كلمة المرور.
- شاشة حضور:
  - “حالة اليوم” + آخر بصمة.
  - زر Check-in وزر Check-out.
  - التقاط GPS (lat/lng/accuracy) + إرسال للسيرفر.
  - Gate بصمة/FaceID قبل الإرسال.
- شاشة السجل (My Attendance History).
- إعدادات بسيطة: اللغة (عربي/إنجليزي) + تسجيل خروج.

### خارج الـMVP (لاحقًا)

- Device Enrollment + Device binding.
- Signed challenges (anti-replay) + rotation.
- Attestation (Play Integrity / App Attest).
- Offline mode (متحكم فيه).
- إشعارات + تذكيرات.

---

## 2) مبادئ الأمان (Security Principles)

### 2.1 بصمة/FaceID

البصمة/FaceID **Gate محلي** فقط؛ لا يوجد “بيانات بصمة” تُرسل. الهدف منع ضغط زر البصمة بدون وجود المستخدم.

### 2.2 ربط احترافي بالسيرفر (Mobile Tokens)

الويب يعتمد NextAuth Cookies؛ في الجوال الأفضل استخدام **Authorization: Bearer Token**.

**MVP:** Access Token JWT (قصير العمر) + إعادة تسجيل عند انتهاء الجلسة.

**Phase 2:** Refresh token (مع تخزين/إبطال على السيرفر) + device binding.

### 2.3 منع التلاعب (خارطة الطريق)

لا يوجد حل كامل ضد التلاعب، لكن نرفع التكلفة:

- Signed challenges لمنع replay.
- Device enrollment لمنع مشاركة التوكن.
- Attestation لتقليل الأجهزة المعدلة.

---

## 3) Geofence (الشرط المطلوب من الشركة)

**المطلوب:** الشركة تحدد مكان/أماكن لا يسمح بالبصمة إلا من داخلها.

**الحالة الحالية (تم تنفيذها على السيرفر والداشبورد):**

- سياسة حضور لكل شركة (TenantAttendancePolicy):
  - `enforceGeofence` تفعيل/تعطيل
  - `maxAccuracyMeters` حد الدقة المقبول
  - `allowCheckInWithoutLocation` السماح بدون GPS (مفيد للويب)
- مواقع العمل (TenantWorkLocation): اسم + lat/lng + radiusMeters + isActive
- السيرفر يرفض:
  - بدون GPS عندما `allowCheckInWithoutLocation=false`
  - دقة سيئة (accuracy أكبر من الحد)
  - خارج أي موقع مفعل

**ملاحظة جوال:** في الجوال سنجعل GPS “مطلوب” عمليًا عند تفعيل geofence، وسنعرض سبب الرفض للمستخدم.

---

## 4) اختيار التقنية (Mobile Tech Stack)

### 4.1 React Native + Expo (الاختيار)

- Expo + TypeScript
- expo-router (تنظيم واحترافية في التوجيه)
- Location: `expo-location`
- Biometrics: `expo-local-authentication`
- Secure storage: `expo-secure-store`

### 4.2 هيكل المشروع داخل الـRepo

سيتم إضافة مجلد:

- `apps/mobile` (تطبيق Expo مستقل داخل نفس المستودع)

**ملاحظة:** لن نضيف pnpm workspace الآن لتجنب تعارض نسخ React بين Next (React 19) وReact Native.

---

## 5) API Design (مرتبط بالمشروع الحالي)

### 5.1 APIs موجودة بالفعل (Web)

- `/api/attendance` (تسجيل check-in/out) + geofence enforcement
- `/api/attendance/policy` (سياسة الحضور)
- `/api/attendance/locations` و`/api/attendance/locations/:id` (مواقع العمل)

### 5.2 APIs خاصة بالجوال (سننفذها الآن - MVP)

#### `POST /api/mobile/auth/login`

يدخل المستخدم email/password ويأخذ access token.

**Request:**

```json
{ "email": "user@x.com", "password": "..." }
```

**Response:**

```json
{ "accessToken": "...", "user": { "id": "...", "tenantId": "...", "employeeId": "..." } }
```

#### `GET /api/mobile/me`

يرجع بيانات المستخدم الحالية حسب التوكن.

#### `POST /api/mobile/attendance`

تنفيذ check-in/out باستخدام employeeId من التوكن (بدون تمريره من العميل).

**Request:**

```json
{ "type": "check-in", "latitude": 0, "longitude": 0, "accuracy": 15, "address": "..." }
```

---

## 6) UX/RTL/I18n

- اللغة الافتراضية: العربية.
- دعم الإنجليزية.
- تفعيل RTL تلقائيًا عند العربية.

---

## 7) التنفيذ على مراحل (Milestones)

### Milestone A — Backend Mobile Foundation (أسبوع 0)

- Mobile login token
- Mobile attendance endpoint
- توحيد منطق الحضور في helper مشترك

### Milestone B — Mobile App Skeleton (أسبوع 0)

- Expo scaffold
- Navigation (Login / Tabs)
- Secure token storage

### Milestone C — Attendance MVP (أسبوع 1)

- Location permission + getCurrentPosition
- Biometrics gate
- API integration + error messages
- My attendance list

### Milestone D — Hardening (أسبوع 2+)

- Device binding
- Signed challenges
- Attestation

---

## 8) Checklist تنفيذ احترافي (مع معايير قبول)

### 8.1 MVP — Backend

- [x] Geofence models + policy + dashboard management.
- [x] إنشاء `POST /api/mobile/auth/login`.
  - **قبول:** يرجع JWT صالح ويُرفض الإيميل/الباسورد الخطأ برسالة واضحة.
- [x] إنشاء `GET /api/mobile/me`.
  - **قبول:** يتطلب Bearer token ويرجع بيانات المستخدم.
- [x] إنشاء `POST /api/mobile/attendance`.
  - **قبول:** لا يقبل employeeId من العميل؛ يأخذه من التوكن، ويطبق geofence.
- [x] توحيد منطق Attendance POST في helper مشترك بين web/mobile.

### 8.2 MVP — Mobile App

- [x] إنشاء مشروع Expo داخل `apps/mobile`.
  - **قبول:** `npx expo start` يفتح التطبيق.
- [x] شاشة Login.
  - **قبول:** تسجل دخول وتخزن التوكن بـ SecureStore.
- [x] شاشة Attendance.
  - **قبول:** طلب صلاحية الموقع + قراءة lat/lng/accuracy.
- [x] Biometrics Gate قبل check-in/out.
  - **قبول:** لا يرسل الطلب إن فشل التحقق الحيوي.
- [x] شاشة My Attendance.
  - **قبول:** تعرض سجلات المستخدم (على الأقل آخر 30 يوم).
- [x] Logout.

### 8.2.1 تحسينات UX مطلوبة (Next)

- [x] شاشة الحضور تعرض "حالة اليوم" (هل تم check-in؟ هل تم check-out؟) + آخر بصمة.
- [x] تعطيل زر check-in/check-out حسب الحالة لتجنب رسائل "Already" من السيرفر.
- [x] عرض سبب الرفض بشكل أوضح (Outside / Accuracy / Permission) مع إرشادات + زر فتح الإعدادات.
- [x] دعم RTL/EN فعليًا (زر تبديل لغة + reload لتطبيق RTL).

### 8.2.2 براندنج (Brand)

- [x] استخدام أيقونات/لوجو المشروع داخل Expo (icon/splash/adaptive).
- [x] إضافة اللوجو في شاشة الدخول.
- [ ] توحيد هيدر بسيط للواجهات (اختياري) + ألوان متسقة.

### 8.2.3 سجل الحضور (History)

- [x] فلتر آخر 7/30/90 يوم.
- [x] Pagination (Load more) + منع التحميل الزائد.

### 8.3 مراقبة وتشخيص (Observability)

- [x] إضافة logging واضح لأخطاء mobile auth/attendance في السيرفر.
- [x] رسائل خطأ مقروءة للمستخدم في الجوال.

---

## 11) الحالة الحالية (Status)

**تم إنجازه:** Backend APIs للجوال + JWT + Refresh Tokens + Device binding + One-time challenge (anti-replay) + helper موحد + تطبيق Expo مع Login/Attendance/History/Settings(Logout) + ربط الأيقونات واللوجو.

**المتبقي الآن (أولوية):**

1. Attestation (Play Integrity / App Attest) – اختياري حسب متطلبات الإنتاج.
2. توحيد هيدر/تصميم مشترك عبر الشاشات (اختياري لكن احترافي).
3. تحسينات سجل الحضور: اختيار تاريخ مخصص + تصدير (اختياري).

**لاحقًا (Hardening إضافي):** Attestation + سياسات أكثر (مثل إلزام جهاز واحد/حد أقصى لأجهزة المستخدم).

---

## 9) متطلبات التشغيل (Environment)

### Backend

- `NEXTAUTH_SECRET` موجود.
- إضافة متغيرات جديدة:
  - `MOBILE_JWT_SECRET` (سر توقيع JWT للجوال).
  - `MOBILE_REFRESH_TOKEN_SECRET` (سر hashing لرفرش توكن – لا يتم تخزين التوكن raw في DB).
  - `MOBILE_REFRESH_TOKEN_TTL_DAYS` (اختياري – افتراضي 30 يوم).
  - `MOBILE_CHALLENGE_TTL_SECONDS` (اختياري – افتراضي 120 ثانية).

### Mobile

- ضبط `EXPO_PUBLIC_API_BASE_URL` (مثلاً `http://<LAN-IP>:3000` أثناء التطوير).

---

## 10) ملاحظات مهمة

- أي تغييرات Prisma تحتاج `prisma migrate` على بيئة Postgres شغالة.
- التنفيذ الحالي للويب يدعم العربية افتراضيًا والإنجليزية عبر `/en`.
