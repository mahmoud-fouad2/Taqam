# Final Development Guide

Last updated: 2026-04-07

## Purpose

هذا الملف هو المرجع التشغيلي والتقني النهائي للمشروع في وضعه الحالي.
استخدمه كنقطة البداية لأي تطوير لاحق بدل الاعتماد على التقارير القديمة أو الملفات التاريخية المتفرقة.

## Verified Current State

- الويب يبني بنجاح عبر `pnpm build`.
- فحص الأنواع ناجح عبر `pnpm typecheck`.
- الفحص الصارم لـ ESLint ناجح عبر `pnpm lint:strict`.
- اختبارات Vitest الحالية ناجحة عبر `pnpm test`.
- تطبيق الهاتف الرسمي في `apps/mobile` ينجح في `pnpm --dir apps/mobile typecheck`.
- `https://taqam.net/api/health` يستجيب بشكل صحيح في الإنتاج.
- صفحات `privacy` و `terms` وواجهات اللودينج والأخطاء و404 والوضع الداكن في الأسطح العامة تم تحديثها إلى الوضع الحالي.

## Active Workspaces

### Web App

- المسار الرئيسي: `app/`
- الواجهات العامة: `app/(guest)/`
- لوحة التحكم: `app/dashboard/`
- API routes: `app/api/`

### Shared UI and Logic

- المكونات العامة: `components/`
- hooks المشتركة: `hooks/`
- الخدمات والمنطق المركزي: `lib/`
- الترجمات والـ locale: `lib/i18n/` و `i18n/`

### Database

- Prisma schema: `prisma/schema.prisma`
- Prisma config: `prisma.config.ts`
- عميل قاعدة البيانات: `lib/db.ts`

### Mobile App

- التطبيق الرسمي الوحيد الجاري دعمه: `apps/mobile/`
- التطبيق `mobile-app/` محفوظ كمرجع legacy فقط، وليس مسار التطوير أو التحقق الرسمي.

## Directory Truth Table

### Keep Developing Here

- `app/`
- `components/`
- `hooks/`
- `lib/`
- `prisma/`
- `apps/mobile/`
- `docs/`
- `scripts/`

### Historical / Reference Only

- `mobile-app/`
- `docs/archive/`
- `docs/reports/`

### Local-Only / Disposable

- `.next/`
- `tmp/`
- `*.tsbuildinfo`
- local logs and generated cookies files

## Branding and Theme Rules

- الاسم المعتمد في الواجهة العامة: `Taqam | طاقم`.
- لوجو الوضع الفاتح الأساسي: `public/logo-tight.jpeg`.
- لوجو الوضع الداكن الأساسي: `public/logo-dark.png`.
- أي شاشة loading أو error أو not-found جديدة يجب أن تستخدم `LogoMark` أو نفس الأصول الرسمية، لا صورًا مؤقتة.
- لا يُسمح بإبقاء panels فاتحة داخل الوضع الداكن بدون `dark:` overrides واضحة.

## Dark Mode Status

- صفحة تسجيل الدخول وطلب العرض تم تصحيح تدرجاتها الداكنة.
- صفحة المميزات تم تقوية dark mode في البطاقات والـ gradients الرئيسة.
- شاشات loading تم توحيدها على `components/brand-loading-screen.tsx`.
- شاشة الخطأ العامة وشاشة 404 أصبحتا متسقتين مع الهوية البصرية الحالية.

## Error Handling Rules

- معالج أخطاء التطبيق العام: `app/error.tsx`
- معالج أخطاء الجذر: `app/global-error.tsx`
- معالج أخطاء لوحة التحكم: `app/dashboard/error.tsx`
- صفحة 404 العامة: `app/not-found.tsx`
- صفحة 404 الخاصة بالداشبورد: `app/dashboard/not-found.tsx`

### Important Constraint

كان هناك استخدام زائد لنمط `router.push()` ثم `router.refresh()` في بعض التنقلات العامة.
تم تقليل هذا النمط في نقاط عامة حساسة مثل تبديل اللغة وتسجيل الدخول/التسجيل لتقليل فرص الوقوع في error boundary أثناء الانتقال.

## Mobile Integration

### Official Mobile Path

- المسار الرسمي: `apps/mobile/`
- Expo config: `apps/mobile/app.json`
- API client: `apps/mobile/lib/api.ts`
- base URL resolution: `apps/mobile/lib/config.ts`

### Current Backend Wiring

- متغير البيئة الافتراضي للتطبيق: `EXPO_PUBLIC_API_BASE_URL=https://taqam.net`
- إذا غاب هذا المتغير في production builds، فالتطبيق يسقط تلقائيًا على `https://taqam.net`
- fallback المحلي `http://localhost:3000` يظل محصورًا على سيناريوهات التطوير غير الإنتاجية

### Mobile Capabilities Present

- login
- refresh token rotation
- logout / logout-all
- attendance endpoints
- biometric toggle
- runtime diagnostics screen

## Android Release Reality

### What Is Ready

- مسار بناء Android الرسمي موجود في `apps/mobile`
- أوامر APK و AAB موجودة وموثقة
- التطبيق مربوط بواجهة backend حقيقية

### What Is Still External

- لا يوجد حاليًا upload keystore production داخل الريبو
- نتيجة ذلك: release signing الحالي ما زال fallback على debug keystore
- هذا يمنع اعتبار ملف AAB الحالي store-ready بنسبة 100%

### Required For Store-Ready Release

1. توفير:
   - `TAQAM_UPLOAD_STORE_FILE`
   - `TAQAM_UPLOAD_STORE_PASSWORD`
   - `TAQAM_UPLOAD_KEY_ALIAS`
   - `TAQAM_UPLOAD_KEY_PASSWORD`
2. تشغيل:
   - `pnpm --dir apps/mobile android:signing:status`
   - `pnpm --dir apps/mobile android:aab:release`
3. اختبار البناء الموقع على جهاز فعلي قبل الرفع

## Environment Variables

### Core Web

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`

### Storage / Files

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### Mobile Auth

- `MOBILE_JWT_SECRET`
- `MOBILE_REFRESH_TOKEN_SECRET`
- optional TTL variables if needed

### Optional / Operational

- `ENABLE_SUPER_ADMIN_BOOTSTRAP`
- `SUPER_ADMIN_BOOTSTRAP_TOKEN`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`

## Commands That Matter

### Daily Development

```bash
pnpm install
pnpm dev
```

### Validation

```bash
pnpm typecheck
pnpm lint:strict
pnpm test
pnpm build
pnpm --dir apps/mobile typecheck
```

### Full Validation

```bash
pnpm validate:all
```

### Database

```bash
pnpm db:generate
pnpm db:push
pnpm db:migrate
pnpm db:seed
```

### Mobile

```bash
pnpm --dir apps/mobile start
pnpm --dir apps/mobile android:signing:status
pnpm --dir apps/mobile android:apk:release
pnpm --dir apps/mobile android:aab:release
```

## Documentation Map

- الجذر يجب أن يبقى خفيفًا قدر الإمكان.
- الوثائق التشغيلية الحية:
  - `README.md`
  - `QUICK_START.md`
  - `SETUP_GUIDE.md`
  - `COMPLETE_GUIDE.md`
  - `ANDROID_APK.md`
  - هذا الملف: `docs/FINAL_DEVELOPMENT_GUIDE.md`
- التقارير التاريخية ونتائج التنفيذ القديمة: `docs/reports/`
- الخطط القديمة المؤرشفة: `docs/archive/plans/`

## Cleanup Policy

- لا تُنشئ تقارير جديدة في جذر المشروع.
- أي تقرير مؤقت أو تاريخي يذهب إلى `docs/reports/`.
- أي ملفات تجربة محلية أو e2e cookies أو logs يجب أن تبقى في `tmp/` أو تُحذف بعد انتهاء الاستخدام.
- لا تستخدم `package-lock.json` في هذا المشروع. مدير الحزم الرسمي هو `pnpm`.

## Development Guardrails

- لا تضف مصدر بيانات جديد داخل المكونات إذا كان هناك helper مركزي موجود في `lib/`.
- استخدم React Query في الأسطح العميلية ذات البيانات المتكررة بدل fetch داخل `useEffect` عندما يكون ذلك مناسبًا.
- لا تُبقِ أي صفحة عامة بلا معالجة أخطاء أو loading متسقة مع الهوية.
- أي شعار جديد أو أصل بصري يجب أن يوضع في `public/` ويُستخدم عبر component مشترك بدل تكرار المسارات يدويًا.
- عند تطوير الموبايل، لا تعتمد على `localhost` كحل إنتاجي تحت أي ظرف.

## Known Non-Code Follow-ups

- تفعيل release signing النهائي لتطبيق Android
- اختبار الجهاز الحقيقي بعد التوقيع النهائي
- تنظيف إضافي للتقارير التاريخية غير المستخدمة إذا تقرر تقليل الأرشيف لاحقًا
- معالجة تحذير Sentry المستقبلي بنقل أي بقايا `sentry.client.config.ts` بالكامل عند وقت مناسب

## Recommended Starting Point For Future Work

إذا بدأ مطور جديد اليوم، فالتسلسل الصحيح هو:

1. قراءة `README.md`
2. قراءة `docs/FINAL_DEVELOPMENT_GUIDE.md`
3. تشغيل `pnpm install`
4. إعداد `.env`
5. تشغيل `pnpm typecheck && pnpm lint:strict && pnpm test`
6. ثم البدء بالتطوير من المسار المطلوب