# خطة تطوير تطبيق طاقم للهاتف — النسخة V2

> **تاريخ الإعداد:** أبريل 2026  
> **النسخة الحالية:** v1.0.0 (بدائي — check-in/out فقط)  
> **النسخة المستهدفة:** v2.0.0 (احترافي كامل)

---

## 📊 تقييم الوضع الحالي (V1)

### ما هو موجود
| الشاشة | الحالة | ملاحظات |
|---------|--------|---------|
| تسجيل الدخول | ✅ يعمل | email/password فقط |
| الحضور (check-in/out) | ✅ يعمل | مع GPS + بصمة اختيارية |
| سجل الحضور | ✅ يعمل | فلتر 7/30/90 يوم + pagination |
| طلباتي (Leaves) | ❌ فارغ | الملف فاضي بالكامل |
| الملف الشخصي | ✅ أساسي | اسم + إيميل + دور + لغة |
| الإعدادات | ✅ أساسي | بصمة + لغة + تشخيص |
| Push Notifications | ⚠️ جزئي | التسجيل موجود لكن لا يوجد عرض |

### نقاط الضعف الرئيسية
1. **التصميم بدائي** — StyleSheet objects عادية بدون نظام تصميم موحد
2. **لا يوجد RTL حقيقي** — يُعالج يدوياً بـ `flexDirection: "row-reverse"` 
3. **لا يوجد dark mode** — الألوان مبنية hardcoded
4. **خدمة ذاتيه معدومة** — لا إجازات، لا طلبات، لا رواتب
5. **لا أنيميشن** — لا transitions أو micro-interactions
6. **أيقونات قديمة** — FontAwesome 4 (`@expo/vector-icons`)
7. **لا يوجد onboarding** — الموظف الجديد لا يرى شيء

---

## 🏗️ الهيكل المعماري V2

```
apps/mobile/
├── app/                        # Expo Router screens
│   ├── _layout.tsx             # Root + Auth guard
│   ├── (auth)/
│   │   ├── login.tsx           # تسجيل الدخول المحسّن
│   │   ├── forgot-password.tsx # 🆕 نسيت كلمة المرور
│   │   └── biometric-lock.tsx  # 🆕 شاشة قفل البصمة
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar احترافي
│   │   ├── index.tsx           # 🔄 الرئيسية (dashboard mini)
│   │   ├── requests.tsx        # 🆕 طلباتي (إجازات + عامة)
│   │   ├── attendance.tsx      # 🔄 الحضور المحسّن
│   │   └── more.tsx            # 🆕 المزيد (الإعدادات + الملف)
│   ├── leaves/
│   │   ├── request.tsx         # 🆕 طلب إجازة جديدة
│   │   ├── [id].tsx            # 🆕 تفاصيل الإجازة
│   │   └── balance.tsx         # 🆕 أرصدة الإجازات
│   ├── payslips/
│   │   ├── index.tsx           # 🆕 قائمة كشوف الراتب
│   │   └── [id].tsx            # 🆕 تفاصيل كشف الراتب
│   ├── profile/
│   │   ├── index.tsx           # 🔄 الملف الشخصي المحسّن
│   │   └── edit.tsx            # 🆕 تعديل البيانات
│   ├── notifications/
│   │   └── index.tsx           # 🆕 مركز الإشعارات
│   ├── approvals/
│   │   ├── index.tsx           # 🆕 الموافقات (للمديرين)
│   │   └── [id].tsx            # 🆕 تفاصيل الطلب
│   └── settings.tsx            # 🔄 الإعدادات المحسّنة
├── components/
│   ├── ui/                     # 🆕 نظام تصميم موحد
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── EmptyState.tsx
│   │   └── SkeletonLoader.tsx
│   ├── layout/
│   │   ├── Header.tsx          # 🆕 هيدر موحد
│   │   ├── SafeArea.tsx
│   │   └── TabBar.tsx          # 🆕 tab bar مخصص
│   └── shared/
│       ├── AttendanceCard.tsx   # 🆕 بطاقة الحضور
│       ├── LeaveCard.tsx        # 🆕 بطاقة الإجازة
│       ├── PayslipCard.tsx      # 🆕 بطاقة كشف الراتب
│       └── ApprovalCard.tsx     # 🆕 بطاقة الموافقة
├── theme/                       # 🆕 نظام ألوان موحد
│   ├── tokens.ts                # design tokens متوافقة مع الويب
│   ├── useTheme.ts              # hook للثيم  
│   └── spacing.ts               # مسافات موحدة
├── constants/
│   └── Colors.ts                # 🔄 محدّث مع dark mode
├── lib/
│   ├── i18n.ts                  # 🔄 موسّع مع ترجمات جديدة
│   ├── api.ts                   # 🔄 محسّن مع caching
│   ├── rtl.ts                   # 🆕 RTL utilities
│   └── notifications.ts         # 🆕 notification handlers
└── hooks/
    ├── use-attendance.ts        # 🆕
    ├── use-leaves.ts            # 🆕
    ├── use-payslips.ts          # 🆕
    ├── use-approvals.ts         # 🆕
    └── use-rtl.ts               # 🆕
```

---

## 📐 المراحل التنفيذية

### المرحلة 1: البنية التحتية والتصميم (الأساسات)

#### 1.1 نظام التصميم الموحد (Design System)
- **هدف:** بناء مكتبة مكونات UI احترافية مطابقة لهوية المنصة
- **المهام:**
  - [ ] إنشاء `theme/tokens.ts` — **ألوان + أحجام خطوط + مسافات + ظلال + أنصاف أقطار** متوافقة مع web `design-tokens.ts`
  - [ ] بناء `useTheme()` hook يدعم light/dark modes
  - [ ] بناء مكونات UI أساسية:
    - `Button` (primary/secondary/ghost/destructive variants)
    - `Card` (elevated/outlined variants)
    - `Input` + `TextArea` (مع RTL + validation states)
    - `Badge` + `StatusBadge`
    - `Avatar` (صورة + initials fallback)
    - `BottomSheet` (Reanimated-based)
    - `EmptyState` (illustration + CTA)
    - `SkeletonLoader` (shimmer animation)
  - [ ] ألوان الـ brand: `#2563eb` (light) / `#3b82f6` (dark) — **نفس المنصة بالظبط**

#### 1.2 RTL كامل
- **هدف:** الكتابة العربية من اليمين لليسار في كل الشاشات بدون أي تحايل
- **المهام:**
  - [ ] استخدام `I18nManager.forceRTL(true)` عند اللغة العربية
  - [ ] إنشاء `useRTL()` hook يوفر: `isRtl`, `startPadding`, `endPadding`, `textAlign`
  - [ ] تحويل كل `flexDirection: "row-reverse"` إلى `I18nManager.isRTL` auto  
  - [ ] تحويل كل `marginLeft` / `paddingRight` إلى `marginStart` / `paddingEnd`
  - [ ] اختبار كل شاشة بالعربية والإنجليزية

#### 1.3 Dark Mode
- **هدف:** وضع ليلي كامل يتبع إعدادات الجهاز أو يدوي
- **المهام:**
  - [ ] تحديث `Colors.ts` ليصبح dynamic theme
  - [ ] بناء `ThemeProvider` يدعم: system / light / dark
  - [ ] تحديث كل الشاشات لاستخدام `useTheme()` بدل ألوان مباشرة

#### 1.4 Tab Bar مخصص واحترافي
- **هدف:** tab bar بتصميم احترافي يطابق هوية المنصة
- **المهام:**
  - [ ] بناء `CustomTabBar` component مع Reanimated animations
  - [ ] أيقونات Lucide بدل FontAwesome القديم
  - [ ] Badge للإشعارات على tab الطلبات
  - [ ] التبويبات: **الرئيسية | الحضور | طلباتي | المزيد**

---

### المرحلة 2: الشاشة الرئيسية (Dashboard Mini)

#### 2.1 الشاشة الرئيسية المحسّنة
- **هدف:** صفحة رئيسية ذكية تعرض أهم المعلومات للموظف
- **المحتوى:**
  - [ ] **بطاقة ترحيب** — "صباح الخير، أحمد 👋" مع التاريخ
  - [ ] **بطاقة الحضور اليومي** — حالة اليوم (checked-in / checked-out / لم يسجل) مع زر check-in سريع
  - [ ] **أرصدة الإجازات** — دوائر بيانية (annual / sick / personal) مع الرصيد المتبقي
  - [ ] **الطلبات المعلقة** — آخر 3 طلبات مع حالتها
  - [ ] **إشعارات سريعة** — آخر 2 إشعار غير مقروء
  - [ ] **الموافقات المعلقة** (للمديرين فقط) — عدد الطلبات بانتظار الموافقة

- **API endpoints المطلوبة:**
  - `GET /api/mobile/dashboard` — يجمع كل البيانات في استدعاء واحد

---

### المرحلة 3: شاشة الحضور المحسّنة

#### 3.1 إعادة بناء الحضور
- **التحسينات:**
  - [ ] تصميم **بطاقة الحضور الضخمة** بـ gradient احترافي
  - [ ] **ساعة رقمية** حية (animated clock)
  - [ ] **خريطة مصغرة** تظهر موقعك داخل نطاق العمل (geofence)
  - [ ] **مؤقت ساعات العمل** — عداد الساعات المتبقية لاكتمال الدوام
  - [ ] **Haptic feedback** عند تسجيل الحضور/الانصراف
  - [ ] **Animation** نجاح عند التسجيل (Lottie/Reanimated)
  - [ ] الاحتفاظ بسجل الحضور اليومي في الأسفل

#### 3.2 تاريخ الحضور المحسّن
- **التحسينات:**
  - [ ] **Calendar view** — عرض الشهر مع نقاط ملونة (أخضر = حاضر، أحمر = غائب، أصفر = متأخر)
  - [ ] **ملخص شهري** — أيام الحضور + الغياب + التأخير + الخروج المبكر
  - [ ] فلاتر أكثر: أسبوع / شهر / مخصص
  - [ ] **Export** — إرسال تقرير الحضور بالبريد (PDF أو CSV)

---

### المرحلة 4: الإجازات والطلبات (الأهم)

#### 4.1 شاشة طلباتي (Requests)
- **المهام:**
  - [ ] **قائمة الطلبات** — كل الطلبات مع فلتر: الكل / معلق / مقبول / مرفوض
  - [ ] كل طلب يعرض: النوع + التاريخ + الحالة (badge ملون) + الموافق عليه
  - [ ] **Swipe actions**: سحب لليمين لإلغاء طلب معلق
  - [ ] Pull-to-refresh + infinite scroll

#### 4.2 شاشة طلب إجازة جديدة
- **المهام:**
  - [ ] اختيار **نوع الإجازة** (dropdown مع الأرصدة المتبقية)
  - [ ] **Date range picker** (من — إلى) مع حساب عدد الأيام تلقائياً
  - [ ] **حقل السبب** (textarea)
  - [ ] **رفع مرفق** (صورة أو ملف) — للإجازات المرضية مثلاً
  - [ ] **معاينة** قبل الإرسال
  - [ ] **تأكيد** مع animation نجاح

- **API endpoints المطلوبة:**
  - `GET /api/mobile/leaves/types` — أنواع الإجازات + الأرصدة
  - `POST /api/mobile/leaves` — إرسال طلب إجازة
  - `GET /api/mobile/leaves` — قائمة الإجازات
  - `DELETE /api/mobile/leaves/:id` — إلغاء طلب

#### 4.3 أرصدة الإجازات
- **المهام:**
  - [ ] **بطاقات بصرية** لكل نوع إجازة (سنوي / مرضي / شخصي / أمومة...)
  - [ ] **دائرة بيانية** لكل رصيد
  - [ ] **تفاصيل** — المستخدم + المتبقي + ينتهي في
  - [ ] **ألوان مميزة** لكل نوع إجازة

---

### المرحلة 5: كشوف الرواتب

#### 5.1 شاشة كشوف الرواتب
- **المهام:**
  - [ ] **قائمة كشوف الرواتب** — شهرياً مع العام
  - [ ] **كل كشف يعرض**: الراتب الإجمالي + الصافي + الحالة
  - [ ] **تفاصيل الكشف**:
    - الراتب الأساسي
    - بدل السكن
    - بدل المواصلات
    - البدلات الأخرى
    - الخصومات (GOSI + ضريبة + ...)
    - **الصافي** (كبير وواضح)
  - [ ] **تحميل/مشاركة** كشف الراتب كـ PDF

- **API endpoints:**
  - `GET /api/mobile/payslips` — قائمة كشوف الرواتب
  - `GET /api/mobile/payslips/:id` — تفاصيل كشف
  - `GET /api/mobile/payslips/:id/pdf` — تحميل PDF

---

### المرحلة 6: الموافقات (للمديرين)

#### 6.1 شاشة الموافقات
- **المهام:**
  - [ ] **قائمة الطلبات المعلقة** — الإجازات + الطلبات العامة
  - [ ] **كل طلب يعرض**: اسم الموظف + النوع + التواريخ + السبب
  - [ ] **أزرار القرار**: ✅ موافقة / ❌ رفض (مع سبب اختياري)
  - [ ] **Swipe actions**: سحب يمين = موافقة، سحب يسار = رفض
  - [ ] **Badge** عدد الطلبات المعلقة على أيقونة التطبيق

- **API endpoints:**
  - `GET /api/mobile/approvals/pending`
  - `POST /api/mobile/approvals/:id/approve`
  - `POST /api/mobile/approvals/:id/reject`

---

### المرحلة 7: الإشعارات والملف الشخصي

#### 7.1 مركز الإشعارات
- **المهام:**
  - [ ] **قائمة كاملة** بكل الإشعارات
  - [ ] **فلتر**: الكل / غير مقروء
  - [ ] **Swipe** لحذف/تحديد كمقروء
  - [ ] **تحديد الكل كمقروء** — زر أعلى الشاشة
  - [ ] **Deep linking** — الضغط على إشعار يفتح الشاشة المناسبة

#### 7.2 الملف الشخصي المحسّن
- **المهام:**
  - [ ] **صورة شخصية** مع إمكانية التغيير (camera/gallery)
  - [ ] **بيانات شاملة**: الاسم + الإيميل + الهاتف + القسم + الوظيفة + تاريخ التعيين
  - [ ] **تعديل البيانات المسموحة** (الهاتف مثلاً)
  - [ ] **تغيير كلمة المرور**
  - [ ] **معلومات البنك** (للاطلاع فقط)
  - [ ] **المستندات** (عقد العمل + هوية + ...)

#### 7.3 شاشة الإعدادات المحسّنة
- **المهام:**
  - [ ] **Dark mode toggle** مع live preview
  - [ ] **اختيار اللغة** مع RTL فوري
  - [ ] **إعدادات الإشعارات** — تفعيل/تعطيل لكل نوع
  - [ ] **الأمان**: بصمة + PIN + تغيير كلمة المرور
  - [ ] **عن التطبيق**: الإصدار + الشروط + الخصوصية + الدعم
  - [ ] **تسجيل الخروج** مع تأكيد

---

### المرحلة 8: تجربة المستخدم المتقدمة (UX Polish)

#### 8.1 Animations & Micro-interactions
- [ ] **Shared element transitions** بين الشاشات
- [ ] **Skeleton loaders** أثناء التحميل
- [ ] **Pull-to-refresh** مع animation مخصص
- [ ] **Success/Error** animations (Lottie أو Reanimated)
- [ ] **Haptic feedback** عند الأزرار المهمة
- [ ] **Tab bar** animation عند التنقل

#### 8.2 Offline Support
- [ ] **Cache** آخر بيانات محلياً
- [ ] **Offline banner** مع زر إعادة المحاولة
- [ ] **Queue** الطلبات المحلية وإرسالها عند الاتصال

#### 8.3 Onboarding
- [ ] **شاشات ترحيبية** (3 شاشات) عند أول تشغيل:
  1. "سجّل حضورك بلمسة واحدة"
  2. "تابع طلباتك ورصيد إجازاتك"
  3. "استلم كشف راتبك فوراً"

---

### المرحلة 9: API Endpoints الجديدة (Backend)

كل الـ endpoints تحت `/api/mobile/`:

```
POST   /api/mobile/auth/login
POST   /api/mobile/auth/forgot-password       🆕
POST   /api/mobile/auth/logout
POST   /api/mobile/auth/logout-all

GET    /api/mobile/dashboard                   🆕 (aggregated)

GET    /api/mobile/attendance/today
POST   /api/mobile/attendance/check-in
POST   /api/mobile/attendance/check-out
GET    /api/mobile/attendance/history
GET    /api/mobile/attendance/monthly-summary  🆕

GET    /api/mobile/leaves                      🆕
POST   /api/mobile/leaves                      🆕
DELETE /api/mobile/leaves/:id                  🆕
GET    /api/mobile/leaves/types                🆕
GET    /api/mobile/leaves/balance              🆕

GET    /api/mobile/payslips                    🆕
GET    /api/mobile/payslips/:id                🆕
GET    /api/mobile/payslips/:id/pdf            🆕

GET    /api/mobile/approvals/pending           🆕
POST   /api/mobile/approvals/:id/approve       🆕
POST   /api/mobile/approvals/:id/reject        🆕

GET    /api/mobile/notifications               🆕
POST   /api/mobile/notifications/read-all      🆕
PUT    /api/mobile/notifications/:id/read      🆕

GET    /api/mobile/profile                     🔄 (enriched)
PUT    /api/mobile/profile                     🆕
POST   /api/mobile/profile/avatar              🆕
PUT    /api/mobile/profile/change-password     🆕
```

---

## 🎨 دليل التصميم البصري V2

### الألوان
| Token | Light | Dark | الاستخدام |
|-------|-------|------|-----------|
| primary | `#2563eb` | `#3b82f6` | الأزرار + الروابط + الأيقونات النشطة |
| primary-light | `#dbeafe` | `#1e3a8a` | خلفيات البطاقات المميزة |
| success | `#16a34a` | `#22c55e` | الحضور + الموافقة |
| warning | `#d97706` | `#f59e0b` | التأخر + قيد المراجعة |
| error | `#dc2626` | `#ef4444` | الغياب + الرفض |
| surface | `#ffffff` | `#0f172a` | خلفية البطاقات |
| background | `#f8fafc` | `#020617` | خلفية الشاشة |
| text | `#0f172a` | `#f1f5f9` | النص الأساسي |
| muted | `#64748b` | `#94a3b8` | النص الثانوي |
| border | `#e2e8f0` | `rgba(255,255,255,0.08)` | الحدود |

### الخطوط
- العربية: **Cairo** أو **IBM Plex Arabic** (نفس المستخدم على المنصة)
- الإنجليزية: **Inter** أو system default
- أحجام: `xs: 11, sm: 13, base: 15, lg: 17, xl: 20, 2xl: 24, 3xl: 30`

### المساحات (Spacing)
- `xs: 4, sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24, 3xl: 32, 4xl: 40`

### أنصاف الأقطار (Border Radius)
- `sm: 8, md: 12, lg: 16, xl: 20, full: 9999`

### الظلال
```ts
const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  md: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  lg: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 } },
};
```

---

## 🔄 خطة التنفيذ الزمنية

### Sprint 1 — البنية التحتية
- Design system + theme + RTL
- مكونات UI الأساسية (8 مكونات)
- Dark mode

### Sprint 2 — الرئيسية + الحضور
- شاشة Dashboard الجديدة
- إعادة بناء شاشة الحضور
- تاريخ الحضور المحسّن (calendar view)
- API: `/api/mobile/dashboard` + `/attendance/monthly-summary`

### Sprint 3 — الإجازات
- طلب إجازة + أرصدة + قائمة الطلبات
- Date picker component
- File upload component
- APIs: كل endpoints الإجازات

### Sprint 4 — كشوف الرواتب
- قائمة الرواتب + تفاصيل الكشف
- PDF generation/download
- APIs: كل endpoints الرواتب

### Sprint 5 — الموافقات + الإشعارات
- شاشة الموافقات (للمديرين)
- مركز الإشعارات
- Deep linking
- APIs: كل endpoints الموافقات + الإشعارات

### Sprint 6 — الملف الشخصي + الإعدادات
- الملف الشخصي الشامل
- تعديل البيانات + صورة
- الإعدادات المتقدمة
- Onboarding screens

### Sprint 7 — UX Polish + Testing
- Animations + haptics + transitions
- Skeleton loaders
- Offline support
- اختبار شامل: RTL + dark mode + كل الحالات
- Performance optimization

### Sprint 8 — Build + Release
- Build APK/AAB release
- نسخ APK إلى `public/downloads/taqam-android.apk`
- تحديث رابط التحميل في الفوتر
- Play Store submission (إن أمكن)
- الإعلان عن V2

---

## ✅ معايير الجودة

- [ ] **كل شاشة** تعمل بالعربية (RTL) والإنجليزية (LTR) بدون أي خلل
- [ ] **Dark mode** يعمل في كل شاشة
- [ ] **لا يوجد hardcoded colors** — كل الألوان من الثيم
- [ ] **لا يوجد hardcoded strings** — كل النصوص من i18n
- [ ] **Skeleton loaders** في كل قائمة/بيانات
- [ ] **Error states** واضحة مع زر إعادة المحاولة
- [ ] **Empty states** بتصميم جميل مع CTA
- [ ] **Pull-to-refresh** في كل القوائم
- [ ] **Accessibility** — كل الأزرار لها `accessibilityLabel`
- [ ] **TypeScript strict** — صفر أخطاء

---

## 📱 ملخص الشاشات الجديدة

| # | الشاشة | الأولوية | الحالة |
|---|--------|----------|--------|
| 1 | الرئيسية (Dashboard) | 🔴 عالية | 🆕 |
| 2 | الحضور المحسّن | 🔴 عالية | 🔄 |
| 3 | سجل الحضور (Calendar) | 🟡 متوسطة | 🔄 |
| 4 | طلب إجازة | 🔴 عالية | 🆕 |
| 5 | قائمة الطلبات | 🔴 عالية | 🆕 |
| 6 | أرصدة الإجازات | 🟡 متوسطة | 🆕 |
| 7 | كشوف الرواتب | 🔴 عالية | 🆕 |
| 8 | تفاصيل كشف الراتب | 🟡 متوسطة | 🆕 |
| 9 | الموافقات (مديرين) | 🟡 متوسطة | 🆕 |
| 10 | مركز الإشعارات | 🟡 متوسطة | 🆕 |
| 11 | الملف الشخصي | 🟡 متوسطة | 🔄 |
| 12 | تعديل الملف | 🟢 منخفضة | 🆕 |
| 13 | نسيت كلمة المرور | 🟢 منخفضة | 🆕 |
| 14 | الإعدادات | 🟢 منخفضة | 🔄 |
| 15 | Onboarding | 🟢 منخفضة | 🆕 |

---

> **النتيجة المتوقعة:** تطبيق احترافي بمستوى عالمي يشبه تطبيقات Jisr / Bayzat / BambooHR مع دعم كامل للعربية من اليمين لليسار ووضع ليلي وكل الخدمات الذاتية للموظف.
