# 🚀 إعداد المشروع على Render

## نظرة سريعة

- استخدم `pnpm start:render` كأمر التشغيل على Render.
- الإقلاع ينفذ `prisma migrate deploy` افتراضياً.
- تفعيل إنشاء Super Admin أصبح صريحاً ومؤقتاً عبر `ENABLE_SUPER_ADMIN_BOOTSTRAP=true`.
- الـ endpoint العام الخاص بالـ bootstrap يتطلب أيضاً `SUPER_ADMIN_BOOTSTRAP_TOKEN` في الهيدر `x-bootstrap-token`.

## المتغيرات المطلوبة

أضف هذه القيم في **Render Dashboard → Environment Variables**:

```env
# Core
NODE_VERSION=20
DATABASE_URL=[Render Postgres internal URL]
NEXTAUTH_SECRET=[openssl rand -base64 32]
NEXTAUTH_URL=https://your-app.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com

# Super Admin bootstrap - فعّلها فقط أثناء الإنشاء الأول
ENABLE_SUPER_ADMIN_BOOTSTRAP=true
SUPER_ADMIN_BOOTSTRAP_TOKEN=[openssl rand -hex 32]
SUPER_ADMIN_EMAIL=admin@your-app.com
SUPER_ADMIN_PASSWORD=[strong-password]
SUPER_ADMIN_FORCE=1

# Prisma schema sync
PRISMA_SCHEMA_SYNC_MODE=migrate
# استخدم push فقط في بيئات مؤقتة عند الضرورة
# PRISMA_SCHEMA_SYNC_MODE=push

# Mobile Auth
MOBILE_JWT_SECRET=[openssl rand -base64 32]
MOBILE_REFRESH_TOKEN_SECRET=[openssl rand -base64 32]

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=ujoor
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
R2_ENDPOINT=https://xxxxx.r2.cloudflarestorage.com
```

## إعداد الخدمة

1. اجعل **Build Command** هو `pnpm install && pnpm build`.
2. اجعل **Start Command** هو `pnpm start:render`.
3. نفّذ deploy بعد حفظ المتغيرات.
4. راقب السجلات حتى ترى نجاح `prisma migrate deploy` ثم `ensure-super-admin`.

## إنشاء Super Admin يدوياً

إذا احتجت إعادة الإنشاء من Render Shell:

```bash
export ENABLE_SUPER_ADMIN_BOOTSTRAP="true"
export SUPER_ADMIN_EMAIL="admin@your-app.com"
export SUPER_ADMIN_PASSWORD="your-strong-password"
export SUPER_ADMIN_FORCE="1"
node scripts/ensure-super-admin.mjs
```

أو:

```bash
export ENABLE_SUPER_ADMIN_BOOTSTRAP="true"
export SUPER_ADMIN_EMAIL="admin@your-app.com"
export SUPER_ADMIN_PASSWORD="your-strong-password"
node scripts/db-create-admin.mjs
```

## التحقق

بعد الإقلاع، اختبر تسجيل الدخول على `/login` باستخدام البريد وكلمة المرور اللذين قمت بتعيينهما.

للتحقق من وجود المستخدم من Render Shell:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ where: { email: 'admin@your-app.com' } })
  .then(u => console.log(u ? 'Super Admin exists' : 'NOT FOUND'))
  .finally(() => prisma.\$disconnect());
"
```

## بعد أول دخول ناجح

1. عطّل `ENABLE_SUPER_ADMIN_BOOTSTRAP` أو احذفه.
2. احذف `SUPER_ADMIN_FORCE` إذا لم تعد تحتاجه.
3. احتفظ بـ `SUPER_ADMIN_BOOTSTRAP_TOKEN` خارج الاستخدام اليومي.

## Troubleshooting

### `Invalid credentials`

- تأكد أن البريد يطابق `SUPER_ADMIN_EMAIL`.
- أعد ضبط كلمة المرور عبر `scripts/ensure-super-admin.mjs` مع تفعيل `ENABLE_SUPER_ADMIN_BOOTSTRAP=true`.

### فشل schema sync عند الإقلاع

- افحص `DATABASE_URL`.
- تأكد أن migrations موجودة ومطابقة للبيئة.
- استخدم `PRISMA_SCHEMA_SYNC_MODE=push` فقط كحل مؤقت في بيئات غير حرجة.

### الحساب مقفل مؤقتاً

نفّذ من Render Shell:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.update({
  where: { email: 'admin@your-app.com' },
  data: { failedLoginAttempts: 0, lockedUntil: null }
}).then(() => console.log('Unlocked')).finally(() => p.\$disconnect());
"
```
