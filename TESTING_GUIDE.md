# خطة الاختبار الفعلي - Real Testing Plan

## الحالة الحالية

تم نشر التعديلات التالية على Render:
- ✅ إصلاح معالجة JSON في login endpoint
- ✅ إضافة connection pooling بحد أقصى 5 اتصالات
- ✅ تحسين معالجة الأخطاء

## الخطوات المطلوبة الآن

### 1️⃣ الانتظار لإكمال البناء على Render
- الخادم قد يستغرق 1-5 دقائق للانتهاء من البناء الجديد
- يمكنك متابعة البناء على: https://dashboard.render.com
- علامات النجاح:
  - ✓ Build succeeded
  - ✓ "Ready in X.Xs" في اللوجات
  - ✓ API يستجيب للطلبات

### 2️⃣ تشغيل الاختبارات الفعلية
```powershell
# شغّل السكريبت من مجلد scripts/manual-tests
# ثم شغله بعد انتهاء البناء
.\scripts\manual-tests\test-production.ps1
```

أو تشغيل اختبار يدوي:

```powershell
# اختبار تسجيل الدخول
$BASE_URL = "https://YOUR-RENDER-DOMAIN"
$headers = @{
    "X-Device-Id" = "test-device-001"
    "X-Device-Name" = "Test Device"
    "X-Device-Platform" = "Android"
    "X-App-Version" = "1.0.0"
}

$body = @{
  email = "YOUR_SUPER_ADMIN_EMAIL"
  password = "YOUR_SUPER_ADMIN_PASSWORD"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "$BASE_URL/api/mobile/auth/login" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -ContentType "application/json"
```

## النتائج المتوقعة

### ✅ الاختبار ناجح إذا:
```json
{
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "email": "YOUR_SUPER_ADMIN_EMAIL",
      "firstName": "Admin",
      "lastName": "User",
      "role": "SUPER_ADMIN"
    }
  }
}
```

### ❌ الاختبار فاشل إذا:
- `"error": "Invalid JSON in request body"` → مشكلة في البناء أو الـ headers
- `"error": "Invalid credentials"` → بيانات الدخول خاطئة
- Timeout → الخادم لم ينته من البناء بعد

## المشاكل المعروفة والحلول

### مشكلة: Render Server Timeout
**السبب**: البناء الجديد لم ينته بعد
**الحل**: انتظر 2-3 دقائق إضافية وحاول مرة أخرى

### مشكلة: Connection Pool Exhausted
**السبب**: عدد الاتصالات الزائدة على Free Tier
**الحل**: تم التعديل من خلال `pool_size=5`

### مشكلة: JSON Parsing Error
**السبب**: headers device غير صحيحة أو request body فارغ
**الحل**: تم إضافة try-catch شامل للتعامل مع الخطأ

## الخطوات التالية بعد نجاح الاختبار

1. **اختبار إنشاء شركة**
   ```powershell
   $body = @{
       nameAr = "شركة الاختبار"
       nameEn = "Test Company"
       slug = "test-company"
       plan = "PROFESSIONAL"
       maxEmployees = 100
       timezone = "Asia/Riyadh"
       currency = "SAR"
   } | ConvertTo-Json
   
   Invoke-WebRequest `
       -Uri "$BASE_URL/api/tenants" `
       -Method POST `
       -Headers @{"Authorization" = "Bearer $accessToken"} `
       -Body $body
   ```

2. **اختبار إنشاء موظف**
3. **اختبار إنشاء وظيفة**
4. **التحقق من قاعدة البيانات**

## ملاحظات هامة

⚠️ **Render Free Tier قيود:**
- ⏱️ Server sleeps after 15 min of inactivity → استيقاظ يستغرق 30 ثانية
- 📊 4 GB Database limit
- 🔌 Limited connections (تم ضبطه على 5)
- ⚠️ Limited compute resources

✅ **ما تم إصلاحه:**
- JSON parsing error handling
- Connection pooling configuration
- Rate limiting للـ login endpoint
- Proper error logging

💡 **نصيحة:**
لا تقلق من timeout الأول - Render قد يعيد تشغيل الخادم بعد البناء.
انتظر ثم حاول مرة أخرى.
