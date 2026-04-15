# 🚀 دليل إعداد الميزات الجديدة

## Baseline الحالي للمشروع

- **Node.js:** 24 LTS
- **pnpm:** 9.15.9
- **التحقق الكامل:** `pnpm validate:ci`
- **تثبيت متطلبات E2E:** `pnpm test:e2e:install`
- **تدقيق dependencies:** `pnpm audit:deps`
- **تنسيق الويب + الموبايل:** `pnpm format:all`

### أوامر البداية المقترحة

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install --frozen-lockfile
pnpm test:e2e:install
pnpm validate:ci
pnpm dev
```

---

## 1. Sentry Error Monitoring

### الإعداد:

#### أ) إنشاء حساب Sentry

1. انتقل إلى https://sentry.io
2. أنشئ حساب جديد (مجاني للمشاريع الصغيرة)
3. أنشئ مشروع جديد > Next.js
4. انسخ الـ DSN الخاص بك

#### ب) إضافة متغيرات البيئة

أضف إلى `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_ORG=your-organization
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token  # Optional for source maps
```

#### ج) التحقق من التكامل

```bash
# سيبدأ Sentry بالعمل تلقائياً بعد ضبط DSN للعميل والسيرفر
pnpm dev

# للتأكد من التكامل، ارمِ خطأ تجريبي:
# في أي API route:
throw new Error("Test Sentry Integration");
```

---

## 2. Structured Logging (Pino)

### الاستخدام:

#### في API Routes:

```typescript
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  logger.info("Fetching employees");

  try {
    const result = await prisma.employee.findMany();
    logger.info("Employees fetched successfully", { count: result.length });
    return NextResponse.json({ data: result });
  } catch (error) {
    logger.error("Failed to fetch employees", { error });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

#### قياس الأداء:

```typescript
import { createTimer } from "@/lib/logger";

async function heavyOperation() {
  const timer = createTimer();

  // Your heavy operation
  await processPayroll();

  timer.log("Payroll Processing");
  // Output: "Payroll Processing took 2345ms"
}
```

#### الأحداث الأمنية:

```typescript
import { logger } from "@/lib/logger";

// عند محاولة دخول غير مصرح بها
logger.security("unauthorized_access", {
  userId: "user-123",
  resource: "/api/admin/users",
  ipAddress: "192.168.1.1"
});
```

---

## 3. Audit Logging System

### الإعداد:

#### أ) تفعيل Middleware (مفعّل افتراضياً)

```bash
# في .env.local - اتركه فارغاً للتفعيل
ENABLE_AUDIT_LOGGING=true  # أو لا تضفه (مفعّل تلقائياً)

# لتعطيل Audit Logging:
ENABLE_AUDIT_LOGGING=false
```

#### ب) استخدام Audit Context في API Routes

```typescript
import { setAuditContext, clearAuditContext } from "@/lib/audit/middleware";
import { getRequestMetadata } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const metadata = getRequestMetadata(request);

  // Set audit context before any DB operations
  setAuditContext({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
  });

  try {
    // Any Prisma operations here will be logged automatically
    await prisma.employee.create({ data: {...} });

    return NextResponse.json({ success: true });
  } finally {
    clearAuditContext();
  }
}
```

#### ج) تسجيل يدوي لعمليات خاصة

```typescript
import { createAuditLog } from "@/lib/audit/logger";

// عند تصدير بيانات
await createAuditLog({
  tenantId: session.user.tenantId,
  userId: session.user.id,
  action: "DATA_EXPORT",
  entity: "Employee",
  metadata: { count: 1000, format: "csv" },
  ipAddress: metadata.ipAddress,
  userAgent: metadata.userAgent
});
```

#### د) عرض Audit Logs

1. انتقل إلى: `/dashboard/audit-logs`
2. صفّي حسب:
   - نوع العملية (CREATE, UPDATE, DELETE...)
   - الكيان (User, Employee, LeaveRequest...)
   - التاريخ
   - المستخدم
3. اضغط على أي سجل لعرض التفاصيل الكاملة

---

## 4. إضافة إلى Sidebar

لإظهار صفحة Audit Logs في القائمة الجانبية، أضف إلى `lib/routes-config.tsx`:

```typescript
{
  title: "سجل التدقيق",
  href: "/dashboard/audit-logs",
  icon: Activity,
  role: ["SUPER_ADMIN", "ADMIN"], // فقط للمشرفين
},
```

---

## 5. Best Practices

### Logging Guidelines:

#### ✅ افعل:

```typescript
// Use appropriate log levels
logger.debug("User clicked button"); // Development
logger.info("User logged in"); // Normal operations
logger.warn("High memory usage"); // Potential issues
logger.error("Database connection failed", { error }); // Errors

// Add context
logger.info("Payroll processed", {
  periodId: "period-123",
  employeeCount: 45,
  totalAmount: 150000
});
```

#### ❌ لا تفعل:

```typescript
// Don't log sensitive data
logger.info("User password", { password: "123456" });  // ❌

// Don't use console.log in production
console.log("Something happened");  // ❌

// Don't log excessive data
logger.info("All employees", { employees: [...1000 employees] });  // ❌
```

### Audit Logging Guidelines:

#### ✅ سجّل هذه العمليات:

- تسجيل الدخول/الخروج
- إنشاء/تحديث/حذف الموظفين
- معالجة الرواتب
- الموافقة على الإجازات
- تصدير البيانات
- تغيير الصلاحيات

#### ❌ لا تسجّل:

- قراءة البيانات العادية (GET requests)
- عمليات النظام الداخلية
- Heartbeat checks

---

## 6. Monitoring Dashboard

### Sentry Dashboard:

1. انتقل إلى: https://sentry.io/organizations/[org]/issues/
2. شاهد:
   - أحدث الأخطاء
   - معدل الأخطاء
   - المستخدمون المتأثرون
   - Performance metrics

### Audit Logs Dashboard:

1. انتقل إلى: `/dashboard/audit-logs`
2. شاهد:
   - إجمالي العمليات
   - أكثر عملية تكراراً
   - المستخدمون الأكثر نشاطاً
   - آخر النشاطات

---

## 7. Troubleshooting

### Sentry لا يعمل؟

```bash
# تحقق من وجود DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# تحقق من أن الملفات موجودة
ls sentry.*.config.ts

# أعد تشغيل السيرفر
pnpm dev
```

### Audit Logs لا تظهر؟

```bash
# تحقق من الـ middleware
# في lib/db.ts يجب أن يكون موجود:
client.$use(createAuditMiddleware());

# تحقق من الجدول في قاعدة البيانات
pnpm prisma studio
# افتح AuditLog table
```

### Logs لا تظهر بشكل جميل في Development؟

```bash
# تأكد من تثبيت pino-pretty
pnpm list pino-pretty

# إن لم يكن موجوداً:
pnpm add -D pino-pretty
```

---

## 8. Production Checklist

قبل Deploy إلى Production:

- [ ] أضف `NEXT_PUBLIC_SENTRY_DSN` و `SENTRY_DSN` إلى Render/Vercel
- [ ] اضبط `LOG_LEVEL=info` (لا تستخدم debug)
- [ ] فعّل Sentry Alerts للأخطاء الحرجة
- [ ] راجع Audit Logs بانتظام (مرة يومياً)
- [ ] اضبط Retention Policy لـ Audit Logs (احذف القديم)
- [ ] اختبر Sentry بخطأ تجريبي واحد
- [ ] اضبط Rate Limiting للـ APIs الحساسة

---

## 9. Environment Variables الكاملة

```bash
# Database
DATABASE_URL=postgresql://...?...&sslmode=verify-full

# Authentication
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# Sentry (NEW)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Logging (NEW)
LOG_LEVEL=info  # debug | info | warn | error
ENABLE_AUDIT_LOGGING=true  # true | false

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

ملاحظة: إذا كنت تستخدم Neon أو PostgreSQL مُدارًا، فاجعل `sslmode` صريحًا داخل `DATABASE_URL`. القيمة `verify-full` تحافظ على السلوك الآمن الحالي وتمنع تحذير `pg` المستقبلي.

---

## 10. الدعم والتوثيق

### Resources:

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Pino Docs: https://getpino.io/
- Prisma Middleware: https://www.prisma.io/docs/concepts/components/prisma-client/middleware

### Contact:

إذا واجهت مشاكل، راجع:

1. `/FEATURES_AUDIT.md` - قائمة الميزات
2. `/IMPLEMENTATION_SUMMARY.md` - ملخص التنفيذ
3. Sentry Dashboard - للأخطاء
4. `/dashboard/audit-logs` - للعمليات

---

**آخر تحديث:** 2026-02-01
**الحالة:** ✅ جاهز للاستخدام
