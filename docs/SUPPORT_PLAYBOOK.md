# Support Playbook

Last updated: 2026-04-14

## Purpose

هذا الملف هو مرجع التشغيل السريع لأي بلاغ أو مشكلة إنتاجية بعد الإطلاق.
الهدف منه تقليل وقت التشخيص، توحيد أسلوب الاستجابة، ومنع القرارات المرتجلة وقت الضغط.

## Primary Signals

- Health endpoint: `/api/health`
- Smoke baseline: `SMOKE_BASE_URL=https://taqam.net pnpm smoke`
- Server/runtime errors: Sentry
- Structured application logs: Render logs
- Audit trail for sensitive actions: `/dashboard/audit-logs`

## Severity Model

### P1

- النظام غير متاح بالكامل
- login معطل لكل المستخدمين
- dashboard أو APIs الأساسية ترجع 5xx على نطاق واسع
- payroll أو attendance routes الأساسية لا تعمل في الإنتاج

Target:

- بدء الاستجابة خلال 15 دقيقة

### P2

- جزء مهم من النظام معطل، لكن يوجد workaround جزئي
- feature أساسية متدهورة لعدد محدود من العملاء
- integrations أو notifications متعطلة بدون تأثير شامل على login/core access

Target:

- بدء الاستجابة خلال 60 دقيقة

### P3

- bug محدود أو visual regression أو issue غير حرجة
- inconsistency في محتوى أو metadata أو workflow غير أساسي

Target:

- يدخل backlog أو hotfix حسب الأثر التجاري

## First 10 Minutes Checklist

1. تحقق من `/api/health`.
2. شغّل `SMOKE_BASE_URL=https://taqam.net pnpm smoke`.
3. راجع آخر deployment على Render وهل المشكلة بدأت بعده مباشرة.
4. راجع Sentry للأخطاء الجديدة والـ affected routes.
5. راجع logs الخاصة بالويب أو الـ cron إذا كان البلاغ متعلقًا بالتكاملات.

## Common Incident Paths

### Login / Session Issues

1. تحقق من `NEXTAUTH_URL` و `NEXT_PUBLIC_APP_URL` و `TAQAM_BASE_DOMAIN`.
2. راجع cookies/domain behavior على الدومين الأساسي والـ tenant subdomains.
3. افحص Sentry وserver logs لأي أخطاء auth أو redirect loops.

### API 5xx / Database Issues

1. تحقق من `DATABASE_URL` و `DIRECT_URL`.
2. راجع نجاح آخر `preDeployCommand` migrations على Render.
3. تحقق من آخر migration وهل هي backward-compatible مع النسخة السابقة.

### Integrations / Scheduled Sync

1. راجع خدمة `taqam-integration-sync-cron` على Render.
2. تحقق من `INTEGRATION_SYNC_CRON_SECRET` و target URL.
3. راجع `app/api/integrations/*` logs و run history داخل النظام.

### Files / Documents / Uploads

1. تحقق من إعدادات R2 (`R2_*`).
2. راجع logs الخاصة بالرفع والتوقيع المؤقت.
3. اختبر إنشاء/قراءة ملف واحد يدويًا من المسار المتأثر.

## Rollback Guidance

### Application Rollback

1. استخدم آخر deployment ناجح من Render.
2. بعد rollback مباشرة:
   - تحقق من `/api/health`
   - شغّل smoke checks
   - اختبر login وصفحة dashboard ومسار public رئيسي

### Database Caution

- لا تنفذ rollback لقاعدة البيانات بشكل ارتجالي.
- إذا كانت migration غير backward-compatible، أوقف rollout وقيّم استعادة الخدمة من التطبيق أولًا.
- أي rollback لقاعدة البيانات يجب أن يكون بخطة واضحة ومجربة مسبقًا.

## Minimum Manual Verification After Fix

1. الصفحة الرئيسية
2. login
3. dashboard redirect/auth flow
4. employees or attendance core API
5. one public marketing page in Arabic and English
6. one tenant-specific careers page if recruitment is live

## Release-Day Contacts

- Product owner: confirms messaging and customer impact
- Technical owner: executes fix or rollback
- Support owner: tracks incoming incidents and status updates

## Exit Criteria For Incident Closure

- root cause معروف بوضوح
- smoke checks pass
- `/api/health` stable
- no active P1/P2 errors continuing in Sentry/logs
- post-incident note added to `docs/reports/` if the issue was material
