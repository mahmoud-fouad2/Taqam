# خطة ترقية المشروع إلى Node 24

## الهدف

هذه الوثيقة تشرح خطة ترقية وتشغيل المشروع على Node.js 24 بشكل آمن، مع الحفاظ على استقرار الـ CI، وبيئة التطوير المحلية، وبيئة النشر، وتطبيق الجوال.

## الحالة الحالية

- تم تثبيت Node 24 في `.node-version` و `.nvmrc`
- تم تحديث CI لاستخدام Node 24
- تم تحديث Render لاستخدام Node 24
- تم تثبيت `packageManager` على `pnpm@9.15.9`
- تم تفعيل فحص شامل عبر `pnpm validate:ci`

## النطاق

- الويب: Next.js + Prisma + Vitest + ESLint + Prettier
- الموبايل: Expo / React Native + TypeScript
- CI: GitHub Actions
- Deployment: Render

## مرحلة 1: توحيد بيئة التشغيل

### المطلوب

- Node.js 24 LTS على كل أجهزة المطورين
- pnpm 9.15.9 على كل البيئات
- منع اختلافات البيئة بين local و CI و production

### التنفيذ

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
```

### نقاط التحقق

- `node -v` يجب أن ترجع `v24.x`
- `pnpm -v` يجب أن ترجع `9.15.9`
- `pnpm install --frozen-lockfile` يجب أن ينجح بدون تعديل lockfiles

## مرحلة 2: بوابات الجودة

### الفحوص الإلزامية

```bash
pnpm format:check:all
pnpm typecheck
pnpm lint:strict
pnpm test
pnpm build
pnpm typecheck:mobile
```

### الهدف

- منع دخول أي تغييرات غير منسقة
- منع أخطاء TypeScript قبل النشر
- ضمان أن بناء Next.js ينجح على نفس runtime المستهدف

## مرحلة 3: تنسيق المشروع

### أوامر التنسيق

```bash
pnpm format:all
```

### ماذا يشمل

- تنسيق الويب والمكتبات المشتركة
- تنسيق ملفات المصدر الآمنة داخل `apps/mobile`
- استبعاد الملفات المولدة والبنية المبنية وملفات Android الناتجة

### سياسة العمل

- الأفضل تنفيذ تنسيق شامل في PR مستقل إذا كان حجم التغييرات كبيرًا
- بعد ذلك، أي PR جديد يجب أن يمر من `format:check:all`

## مرحلة 4: التحقق الوظيفي

### تحقق الويب

- تسجيل الدخول والخروج
- تحميل لوحة التحكم
- تشغيل API الصحة `/api/health`
- اختبار build production
- مراجعة تحذيرات Sentry و Prisma أثناء البناء

### تحقق الموبايل

- `pnpm --dir apps/mobile typecheck`
- تشغيل Build Android عند الحاجة
- في بيئة Windows الحالية، Build الـ Android release تم بنجاح عند ضبط `JAVA_HOME` على JDK 21

## مرحلة 5: النشر المرحلي

### قبل النشر

- تأكد أن `pnpm validate:ci` أخضر محليًا وعلى GitHub Actions
- راجع متغيرات البيئة في Render
- راجع أي تغييرات على Prisma أو Sentry أو build flags

### أثناء النشر

- ابدأ بنشر واحد مراقَب
- تابع Logs مباشرة بعد الإقلاع
- اختبر `/api/health`
- اختبر تسجيل الدخول ومسار صفحة حرجة واحدة على الأقل

### بعد النشر

- راقب Sentry لمدة 24 إلى 48 ساعة
- راقب استهلاك الذاكرة أثناء الـ build والـ runtime
- راقب أي أخطاء مرتبطة بـ SSL أو native modules

## مرحلة 6: إدارة المخاطر

### أكثر النقاط حساسية

- `sharp`
- Prisma engines
- إعدادات Android / Java
- أي dependency بها native binaries

### إشارات يجب مراقبتها

- فشل build على Linux فقط
- فروق سلوك بين local و production
- تحذيرات SSL من `pg`
- اتساق `sslmode` بين البيئات المحلية وبيئات الاستضافة

## خطة الرجوع السريع

إذا ظهرت مشكلة حرجة بعد النشر:

1. أعد `NODE_VERSION` في Render إلى النسخة السابقة
2. أعد `node-version` في GitHub Actions إلى النسخة السابقة
3. أعد `.node-version` و `.nvmrc` إلى النسخة السابقة
4. نفّذ redeploy فوري
5. افتح تحقيق منفصل للسبب الجذري بدل الترقيع السريع داخل نفس PR

## Checklist التنفيذ

- [ ] المطورون على Node 24
- [ ] pnpm مضبوط على 9.15.9
- [ ] `pnpm install --frozen-lockfile` ناجح
- [ ] `pnpm format:check:all` ناجح
- [ ] `pnpm validate:ci` ناجح
- [ ] GitHub Actions أخضر
- [ ] Render مضبوط على Node 24
- [ ] فحص smoke بعد النشر ناجح
- [ ] مراقبة Sentry والـ logs بعد النشر مفعلة

## تحسينات تالية مقترحة

- نقل إعداد Sentry العميل بالكامل إلى `instrumentation-client.ts`
- حسم تحذير `pg` المتعلق بـ `sslmode` بشكل صريح
- إضافة smoke tests آلية بعد deploy
- فصل PR التنسيق الشامل إذا كان diff الحالي كبيرًا
