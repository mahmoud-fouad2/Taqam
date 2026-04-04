# 🚀 دليل تشغيل المشروع الكامل

## 🎯 نظرة عامة

**Taqam** هو نظام إدارة موارد بشرية (HRMS) متكامل يتضمن:
- 🌐 لوحة تحكم ويب (Next.js)
- 📱 تطبيق موبايل للبصمة (Expo React Native)
- 🔐 نظام مصادقة متعدد المستويات
- ⏰ إدارة الحضور والانصراف مع GPS
- 👔 نظام توظيف كامل (Recruitment)
- 📊 تقارير وإحصائيات

---

## 📋 المتطلبات الأساسية

### للتطوير المحلي:
- ✅ Node.js 20+
- ✅ pnpm (مدير الحزم)
- ✅ PostgreSQL 14+
- ✅ Cloudflare R2 account (للتخزين)

### للتطبيق Mobile:
- ✅ Android Studio (للأندرويد)
- ✅ Xcode (للآيفون - macOS فقط)

---

## 🔧 إعداد البيئة المحلية

### 1. Clone المشروع

```bash
git clone <your-repository-url>
cd taqam
```

### 2. تثبيت Dependencies

```bash
pnpm install
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة بيانات PostgreSQL
createdb taqam_dev

# نسخ ملف المتغيرات البيئية
cp .env.example .env
```

### 4. ملء المتغيرات البيئية في `.env`

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/taqam_dev"

# Auth Secrets (Generate new ones!)
NEXTAUTH_SECRET="YOUR_SECRET_HERE"  # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Mobile JWT
MOBILE_JWT_SECRET="YOUR_JWT_SECRET"
MOBILE_REFRESH_TOKEN_SECRET="YOUR_REFRESH_SECRET"

# Cloudflare R2 (Optional for local dev)
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret"
R2_BUCKET_NAME="taqam"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"
R2_ENDPOINT="https://xxxxx.r2.cloudflarestorage.com"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Push Database Schema

```bash
pnpm db:push
```

### 6. إنشاء حساب Admin

```bash
# يدوياً باستخدام السكريبت
SUPER_ADMIN_EMAIL="admin@admin.com" SUPER_ADMIN_PASSWORD="123456" node scripts/db-create-admin.mjs
```

أو استخدم seed:

```bash
pnpm db:seed
```

### 7. تشغيل السيرفر

```bash
pnpm dev
```

✅ افتح: http://localhost:3000

---

## 📱 تشغيل تطبيق الموبايل

> التطبيق الرسمي الحالي هو `apps/mobile`. مجلد `mobile-app/` محفوظ كمرجع legacy فقط.

### 1. الانتقال لمجلد التطبيق

```bash
cd apps/mobile
```

### 2. تثبيت Dependencies

```bash
pnpm install
```

### 3. إعداد Environment

```bash
# أنشئ .env
echo "EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000" > .env
```

**ملاحظة:** 
- `10.0.2.2` يشير إلى `localhost` من Android Emulator
- للجهاز الحقيقي، استخدم IP الحاسوب: `http://192.168.1.X:3000`

### 4. تشغيل التطبيق

**للأندرويد:**
```bash
pnpm android
```

**للآيفون (macOS فقط):**
```bash
pnpm ios
```

**Expo Go (أسهل):**
```bash
pnpm start
# امسح QR code من التطبيق
```

---

## 🌍 النشر على Render

المشروع جاهز للنشر على Render!

### 1. إنشاء حساب على Render.com

### 2. إنشاء PostgreSQL Database

- اختر **New → PostgreSQL**
- اسم: `taqam-db` (أو أي اسم تختاره)
- Region: `Frankfurt` (الأقرب للسعودية)
- احفظ `Internal Database URL`

### 3. إنشاء Web Service

- اختر **New → Web Service**
- اسم: `taqam-web` (أو أي اسم تختاره)
- ربط GitHub repo
- اسم: `ujoor`
- Runtime: `Node`
- Build Command: 
  ```bash
  npm install -g pnpm && pnpm install && pnpm build
  ```
- Start Command:
  ```bash
  pnpm start:render
  ```

### 4. إضافة Environment Variables

في Render Dashboard → Environment:

```env
NODE_VERSION=20
DATABASE_URL=[Internal Database URL من الخطوة 2]
NEXTAUTH_SECRET=[Generate new]
NEXTAUTH_URL=https://YOUR-RENDER-DOMAIN
NEXT_PUBLIC_APP_URL=https://YOUR-RENDER-DOMAIN
MOBILE_JWT_SECRET=[Generate new]
MOBILE_REFRESH_TOKEN_SECRET=[Generate new]
R2_ACCOUNT_ID=[من Cloudflare]
R2_ACCESS_KEY_ID=[من Cloudflare]
R2_SECRET_ACCESS_KEY=[من Cloudflare]
R2_BUCKET_NAME=taqam
R2_PUBLIC_URL=[من Cloudflare]
R2_ENDPOINT=[من Cloudflare]
SUPER_ADMIN_EMAIL=admin@admin.com
SUPER_ADMIN_PASSWORD=123456
```

### 5. Deploy!

Render سيقوم تلقائياً بـ:
1. بناء المشروع
2. تشغيل Prisma migrations
3. إنشاء حساب super admin
4. بدء السيرفر

---

## 🧪 إجراء اختبار E2E

### اختبار سريع بـ curl:

```bash
# 1. Login
curl -X POST https://YOUR-RENDER-DOMAIN/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -H "x-device-id: TEST-001" \
  -H "x-device-platform: android" \
  -d '{"email":"admin@admin.com","password":"123456"}'

# 2. احفظ token من الرد

# 3. Check-in
curl -X POST https://YOUR-RENDER-DOMAIN/api/mobile/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-device-id: TEST-001" \
  -d '{"action":"CHECK_IN","location":{"lat":24.7136,"lng":46.6753,"accuracy":10}}'
```

📄 **للتفاصيل الكاملة:** راجع ملف `E2E_TESTING.md`

---

## 🗂️ هيكل المشروع

```
Taqam/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── mobile/          # Mobile App APIs
│   │   │   ├── auth/        # Login, refresh, logout
│   │   │   └── attendance/  # Check-in/out
│   │   ├── employees/       # Employee management
│   │   ├── recruitment/     # Hiring system
│   │   └── leave-requests/  # Leave management
│   ├── dashboard/           # Admin dashboard pages
│   └── (guest)/            # Public pages (login)
│
├── apps/
│   └── mobile/             # Official Expo mobile workspace
│       ├── app/            # Expo Router
│       ├── components/     # UI components
│       └── lib/            # API client, auth
│
├── mobile-app/             # Legacy Expo reference app
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Initial data
│
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── db.ts               # Prisma client
│   └── r2-storage.ts       # File uploads
│
└── scripts/
    ├── db-create-admin.mjs # Create super admin
    └── render-start.mjs    # Render deployment script
```

---

## 🎭 الأدوار والصلاحيات

| الدور | الوصف | الصلاحيات |
|------|-------|-----------|
| `SUPER_ADMIN` | مدير النظام | كل شيء |
| `ADMIN` | مدير الشركة | إدارة كاملة للموظفين |
| `HR` | موارد بشرية | التوظيف، الإجازات، الحضور |
| `MANAGER` | مدير قسم | إدارة فريقه فقط |
| `EMPLOYEE` | موظف | عرض بياناته، تقديم طلبات |

---

## 📊 الميزات المتاحة حالياً

### ✅ جاهز للإنتاج:
- [x] نظام مصادقة متعدد (Web + Mobile)
- [x] إدارة الموظفين
- [x] تسجيل حضور/انصراف مع GPS
- [x] نظام الإجازات
- [x] نظام التوظيف (Recruitment)
  - إنشاء وظائف
  - استقبال طلبات
  - جدولة مقابلات
  - إرسال عروض عمل
- [x] لوحة تحكم متعددة اللغات (EN/AR)
- [x] تطبيق موبايل مع Biometric
- [x] رفع ملفات على Cloudflare R2
- [x] Refresh tokens مع rotation
- [x] Multi-tenancy (شركات متعددة)

### 🚧 قيد التطوير:
- [ ] نظام الرواتب (Payroll)
- [ ] تقييم الأداء
- [ ] التدريب والتطوير
- [ ] التقارير المتقدمة
- [ ] إشعارات Push للموبايل

---

## 🐛 استكشاف الأخطاء

### Database connection fails:
```bash
# تحقق من PostgreSQL
psql -U postgres -d ujoor_dev

# أعد بناء Prisma Client
pnpm db:generate
```

### Mobile app can't connect:
```bash
# تحقق من API_BASE_URL في apps/mobile/.env
# للإيميوليتور:
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# للجهاز الحقيقي (استبدل بـ IP حاسوبك):
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:3000
```

### Token expired:
```bash
# استخدم refresh endpoint
curl -X POST .../api/mobile/auth/refresh \
  -d '{"refreshToken":"rt_xxx"}'
```

---

## 📞 الدعم

- 📧 Email: support@your-domain.com
- 📚 Docs: راجع المجلد `docs/`
- 🐛 Issues: GitHub Issues

---

## 🎉 جاهز للاستخدام!

المشروع الآن **حقيقي ومكتمل**، ليس demo أو mockup!

**البيانات المباشرة:**
- URL: https://YOUR-RENDER-DOMAIN
- Admin: admin@admin.com / 123456
