# Taqam HR Platform

نظام إدارة موارد بشرية شامل متعدد المستأجرين (Multi-tenant) مبني على:

- **Frontend**: Next.js 16 + React 19 + TailwindCSS + shadcn/ui
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL (Render)
- **Storage**: Cloudflare R2
- **Auth**: NextAuth.js (Credentials)
- **Hosting**: Render

## 🚀 البدء السريع

### 1. Clone & Install

```bash
git clone <your-repository-url>
cd Jisr
pnpm install
```

### 2. إعداد المتغيرات البيئية

```bash
cp .env.example .env
```

أضف القيم التالية في `.env`:

```env
# Database
DATABASE_URL="postgresql://..."

# R2 Storage
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."

# Auth
NEXTAUTH_SECRET="..." # openssl rand -base64 32

# Mobile Auth (Bearer JWT)
# استخدم قيمة قوية (32+ بايت). مثال (Node): node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
MOBILE_JWT_SECRET="..."

# Mobile Refresh Tokens (hashing/rotation)
# سر مختلف عن MOBILE_JWT_SECRET
MOBILE_REFRESH_TOKEN_SECRET="..."

# Optional
# MOBILE_REFRESH_TOKEN_TTL_DAYS=30
# MOBILE_CHALLENGE_TTL_SECONDS=120
```

### 3. إعداد قاعدة البيانات

```bash
# Push schema to database
pnpm db:push

# Or run migrations
pnpm db:migrate

# Seed initial data
pnpm db:seed
```

### 4. تشغيل المشروع

```bash
pnpm dev
```

افتح [http://localhost:3000](http://localhost:3000)

## 📱 ملاحظة الموبايل

- التطبيق الرسمي الحالي للموبايل موجود في `apps/mobile`
- المجلد `mobile-app` محفوظ كنسخة مرجعية قديمة وليس هو الـ workspace الرسمي الذي تتحقق منه أوامر الجذر
- أمر التحقق الحالي للموبايل هو `pnpm typecheck:mobile`

## 📁 هيكل المشروع

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard pages
│   └── (guest)/           # Public pages (login, register)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                   # Utilities & services
│   ├── api/              # API client services
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   └── r2-storage.ts     # R2 storage service
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── apps/mobile/          # Official Expo mobile workspace
├── mobile-app/           # Legacy mobile reference workspace
├── hooks/                # Custom React hooks
└── types/                # TypeScript types
```

## 🔐 الأدوار والصلاحيات

| الدور | الوصف |
|-------|-------|
| `SUPER_ADMIN` | مدير النظام الرئيسي |
| `TENANT_ADMIN` | مدير المنشأة |
| `HR_MANAGER` | مدير الموارد البشرية |
| `MANAGER` | مدير القسم |
| `EMPLOYEE` | موظف |

## 🗄️ قاعدة البيانات

### Models الرئيسية:

- **Tenant**: المنشآت
- **User**: المستخدمين
- **Employee**: الموظفين
- **Department**: الأقسام
- **Shift**: الورديات
- **AttendanceRecord**: سجلات الحضور
- **LeaveRequest**: طلبات الإجازات
- **Document**: المستندات

## 🚢 النشر على Render

### 1. أنشئ خدمة Web Service جديدة

- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start:render`

### 2. أنشئ قاعدة بيانات PostgreSQL

- انسخ `DATABASE_URL` وأضفه في Environment Variables

### 3. أضف المتغيرات البيئية

```
DATABASE_URL=...
R2_ACCOUNT_ID=de95c4f37b252fdb5c22a69ed3d7d3a1
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ujoor
R2_PUBLIC_URL=https://pub-408c0f665b964f47bcd1abfe89ac8aed.r2.dev
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.onrender.com
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
ENABLE_SUPER_ADMIN_BOOTSTRAP=true
SUPER_ADMIN_BOOTSTRAP_TOKEN=[openssl rand -hex 32]
SUPER_ADMIN_EMAIL=admin@your-app.com
SUPER_ADMIN_PASSWORD=[strong password]
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...

# Mobile Auth
MOBILE_JWT_SECRET=...
MOBILE_REFRESH_TOKEN_SECRET=...

# Optional
# MOBILE_REFRESH_TOKEN_TTL_DAYS=30
# MOBILE_CHALLENGE_TTL_SECONDS=120
# PRISMA_SCHEMA_SYNC_MODE=push

> ملاحظة reCAPTCHA: الواجهة تستخدم `react-google-recaptcha` (reCAPTCHA v2 Checkbox). إذا ظهرت رسالة
> `ERROR for site owner: Invalid key type` فغالبًا المفاتيح تم إنشاؤها لنوع آخر (مثل v3) أو نطاق غير صحيح.
```

### 4. قاعدة البيانات على Render

- `pnpm build` لم يعد يغيّر قاعدة البيانات أثناء البناء.
- `pnpm start:render` يشغّل `prisma migrate deploy` افتراضياً عند الإقلاع.
- إذا احتجت fallback قديم لبيئة مؤقتة فقط، اضبط `PRISMA_SCHEMA_SYNC_MODE=push` صراحة.
- بعد إنشاء أول Super Admin، عطّل `ENABLE_SUPER_ADMIN_BOOTSTRAP` أو احذف متغيراته.

## 📜 الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `pnpm dev` | تشغيل بيئة التطوير |
| `pnpm build` | بناء للإنتاج |
| `pnpm start` | تشغيل السيرفر |
| `pnpm validate:all` | تحقق موحد للويب والموبايل |
| `pnpm db:push` | Push schema للـ DB |
| `pnpm db:migrate` | إنشاء migration |
| `pnpm db:seed` | تشغيل seed |
| `pnpm db:studio` | فتح Prisma Studio |

## 📝 License

MIT
