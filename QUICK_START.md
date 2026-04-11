# 🎯 خطوات تشغيل النظام - الحل النهائي

## المشكلة

- ❌ Render Free Tier: لا يوجد Shell access
- ❌ تسجيل الدخول يفشل: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
- ❌ Super Admin غير موجود في قاعدة البيانات

## الحل الكامل ✅

### الخيار 1: استخدام Bootstrap API (الأسهل) ⭐

#### 1. Push الكود الجديد

```bash
git push origin main
```

انتظر Render للـ **Auto-Deploy** (2-3 دقائق)

#### 2. استدعاء Bootstrap Endpoint

بعد اكتمال Deploy:

**PowerShell:**

```powershell
$bootstrapToken = $env:SUPER_ADMIN_BOOTSTRAP_TOKEN
$response = Invoke-RestMethod `
  -Uri "https://YOUR-RENDER-DOMAIN/api/bootstrap/super-admin" `
  -Method POST `
  -Headers @{ "x-bootstrap-token" = $bootstrapToken }
Write-Host "✅ $($response.message)" -ForegroundColor Green
Write-Host "Email: $($response.user.email)"
Write-Host "Role: $($response.user.role)"
```

**curl:**

```bash
curl -X POST https://YOUR-RENDER-DOMAIN/api/bootstrap/super-admin \
  -H "x-bootstrap-token: $SUPER_ADMIN_BOOTSTRAP_TOKEN"
```

**النتيجة المتوقعة:**

```json
{
  "success": true,
  "message": "Super admin created",
  "user": {
    "id": "clx...",
    "email": "YOUR_SUPER_ADMIN_EMAIL",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE"
  }
}
```

#### 3. تسجيل الدخول

افتح: https://YOUR-RENDER-DOMAIN/login

```
Email: قيمة SUPER_ADMIN_EMAIL
Password: قيمة SUPER_ADMIN_PASSWORD
```

✅ **يعمل!**

#### 4. حذف Bootstrap Endpoint (بعد الاستخدام)

```bash
# للأمان، احذف الملف بعد أول استخدام
git rm app/api/bootstrap/super-admin/route.ts
git commit -m "Remove bootstrap endpoint after use"
git push
```

---

### الخيار 2: Environment Variables + Force Deploy

إذا لم يعمل Bootstrap API:

#### 1. في Render Dashboard → Environment

أضف/عدّل:

```env
ENABLE_SUPER_ADMIN_BOOTSTRAP=true
SUPER_ADMIN_BOOTSTRAP_TOKEN=replace-with-a-long-random-secret
SUPER_ADMIN_EMAIL=your-admin@example.com
SUPER_ADMIN_PASSWORD=replace-with-a-strong-password
SUPER_ADMIN_FORCE=1
```

#### 2. Manual Deploy

- اضغط **Manual Deploy** → **Clear build cache & deploy**
- انتظر اكتمال البناء

#### 3. تحقق من Logs

ابحث عن:

```
[ensure-super-admin] Created super admin: your-admin@example.com
```

أو:

```
[ensure-super-admin] Updated super admin password: your-admin@example.com
```

#### 4. جرب تسجيل الدخول

https://YOUR-RENDER-DOMAIN/login

---

## ✅ اختبار E2E كامل

بعد نجاح تسجيل الدخول، شغّل الاختبار الكامل:

### السكريبت الجاهز (PowerShell)

حفظ هذا في `run-e2e-test.ps1`:

```powershell
# Complete E2E Test for Taqam HR Platform
$ErrorActionPreference = "Stop"
$BASE_URL = "https://YOUR-RENDER-DOMAIN"

Write-Host "🚀 Starting Complete E2E Test..." -ForegroundColor Green
Write-Host "Base URL: $BASE_URL" -ForegroundColor Cyan
Write-Host ""

# Helper function
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )

    $uri = "$BASE_URL$Endpoint"
    $params = @{
        Uri = $uri
        Method = $Method
        Headers = $Headers
    }

    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
        $params.ContentType = "application/json"
    }

    try {
        return Invoke-RestMethod @params
    } catch {
        Write-Host "❌ API Call Failed: $Method $Endpoint" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        throw
    }
}

# Step 1: Login as Super Admin
Write-Host "🔐 Step 1: Login as Super Admin..." -ForegroundColor Yellow
$adminLogin = Invoke-ApiCall -Method POST -Endpoint "/api/mobile/auth/login" `
  -Headers @{
    "x-device-id" = "E2E-TEST-ADMIN"
    "x-device-platform" = "test"
    "x-device-name" = "E2E Test Device"
    "x-app-version" = "1.0.0"
  } `
  -Body @{
    email = $env:SUPER_ADMIN_EMAIL
    password = $env:SUPER_ADMIN_PASSWORD
  }

$ADMIN_TOKEN = $adminLogin.data.accessToken
Write-Host "✅ Super Admin logged in" -ForegroundColor Green
Write-Host "   User: $($adminLogin.data.user.email)" -ForegroundColor Gray
Write-Host ""

# Step 2: Create Tenant
Write-Host "🏢 Step 2: Create Tenant..." -ForegroundColor Yellow
$tenant = Invoke-ApiCall -Method POST -Endpoint "/api/tenants" `
  -Headers @{
    "Authorization" = "Bearer $ADMIN_TOKEN"
  } `
  -Body @{
    name = "شركة التقنية المتقدمة"
    nameAr = "شركة التقنية المتقدمة"
    slug = "advanced-tech-$(Get-Random -Maximum 9999)"
    plan = "PROFESSIONAL"
    maxEmployees = 100
    timezone = "Asia/Riyadh"
    currency = "SAR"
  }

$TENANT_ID = $tenant.tenant.id
Write-Host "✅ Tenant created: $($tenant.tenant.name)" -ForegroundColor Green
Write-Host "   ID: $TENANT_ID" -ForegroundColor Gray
Write-Host ""

# Step 3: Create HR User
Write-Host "👥 Step 3: Create HR User..." -ForegroundColor Yellow
$hrUser = Invoke-ApiCall -Method POST -Endpoint "/api/users" `
  -Headers @{
    "Authorization" = "Bearer $ADMIN_TOKEN"
  } `
  -Body @{
    email = "hr@test-$(Get-Random).com"
    password = "hr123456"
    firstName = "أحمد"
    lastName = "الموارد"
    role = "HR"
    permissions = @("MANAGE_EMPLOYEES", "MANAGE_ATTENDANCE", "MANAGE_LEAVES")
    tenantId = $TENANT_ID
  }

Write-Host "✅ HR User created: $($hrUser.user.email)" -ForegroundColor Green
Write-Host ""

# Step 4: Login as HR
Write-Host "🔐 Step 4: Login as HR..." -ForegroundColor Yellow
$hrLogin = Invoke-ApiCall -Method POST -Endpoint "/api/mobile/auth/login" `
  -Headers @{
    "x-device-id" = "E2E-TEST-HR"
    "x-device-platform" = "test"
    "x-device-name" = "HR Device"
    "x-app-version" = "1.0.0"
  } `
  -Body @{
    email = $hrUser.user.email
    password = "hr123456"
  }

$HR_TOKEN = $hrLogin.data.accessToken
Write-Host "✅ HR logged in" -ForegroundColor Green
Write-Host ""

# Step 5: Create Employee
Write-Host "👨‍💼 Step 5: Create Employee..." -ForegroundColor Yellow
$employee = Invoke-ApiCall -Method POST -Endpoint "/api/employees" `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
  } `
  -Body @{
    firstName = "محمد"
    lastName = "أحمد"
    email = "mohamed$(Get-Random)@test.com"
    phone = "+966501234567"
    nationalId = "$(Get-Random -Minimum 1000000000 -Maximum 9999999999)"
    dateOfBirth = "1990-05-15"
    gender = "MALE"
    nationality = "SA"
    hireDate = (Get-Date).ToString("yyyy-MM-dd")
    employmentType = "FULL_TIME"
    contractType = "PERMANENT"
    salary = 8000
    salaryCurrency = "SAR"
  }

$EMPLOYEE_ID = $employee.employee.id
Write-Host "✅ Employee created: $($employee.employee.employeeCode)" -ForegroundColor Green
Write-Host "   Name: $($employee.employee.firstName) $($employee.employee.lastName)" -ForegroundColor Gray
Write-Host ""

# Step 6: Create Employee User Account
Write-Host "📱 Step 6: Create Employee User Account..." -ForegroundColor Yellow
$empUser = Invoke-ApiCall -Method POST -Endpoint "/api/users" `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
  } `
  -Body @{
    email = $employee.employee.email
    password = "emp123456"
    firstName = $employee.employee.firstName
    lastName = $employee.employee.lastName
    role = "EMPLOYEE"
    tenantId = $TENANT_ID
    employeeId = $EMPLOYEE_ID
  }

Write-Host "✅ Employee user account created" -ForegroundColor Green
Write-Host ""

# Step 7: Login as Employee
Write-Host "🔐 Step 7: Login as Employee..." -ForegroundColor Yellow
$empLogin = Invoke-ApiCall -Method POST -Endpoint "/api/mobile/auth/login" `
  -Headers @{
    "x-device-id" = "EMP-PHONE-001"
    "x-device-platform" = "android"
    "x-device-name" = "Samsung Galaxy"
    "x-app-version" = "1.0.0"
  } `
  -Body @{
    email = $employee.employee.email
    password = "emp123456"
  }

$EMP_TOKEN = $empLogin.data.accessToken
Write-Host "✅ Employee logged in" -ForegroundColor Green
Write-Host ""

# Step 8: Check-in
Write-Host "⏰ Step 8: Check-in..." -ForegroundColor Yellow
$checkin = Invoke-ApiCall -Method POST -Endpoint "/api/mobile/attendance" `
  -Headers @{
    "Authorization" = "Bearer $EMP_TOKEN"
    "x-device-id" = "EMP-PHONE-001"
  } `
  -Body @{
    action = "CHECK_IN"
    location = @{
      lat = 24.7136
      lng = 46.6753
      accuracy = 8
    }
    notes = "وصلت في الموعد"
  }

Write-Host "✅ Check-in successful" -ForegroundColor Green
Write-Host "   Time: $($checkin.record.checkInTime)" -ForegroundColor Gray
Write-Host ""

# Step 9: Check-out
Write-Host "🏃 Step 9: Check-out..." -ForegroundColor Yellow
Start-Sleep -Seconds 2  # Simulate work time
$checkout = Invoke-ApiCall -Method POST -Endpoint "/api/mobile/attendance" `
  -Headers @{
    "Authorization" = "Bearer $EMP_TOKEN"
    "x-device-id" = "EMP-PHONE-001"
  } `
  -Body @{
    action = "CHECK_OUT"
    location = @{
      lat = 24.7136
      lng = 46.6753
      accuracy = 10
    }
    notes = "انتهى العمل"
  }

Write-Host "✅ Check-out successful" -ForegroundColor Green
Write-Host "   Time: $($checkout.record.checkOutTime)" -ForegroundColor Gray
if ($checkout.record.totalHours) {
    Write-Host "   Hours: $($checkout.record.totalHours)" -ForegroundColor Gray
}
Write-Host ""

# Step 10: Create Job Posting
Write-Host "👔 Step 10: Create Job Posting..." -ForegroundColor Yellow
$jobPosting = Invoke-ApiCall -Method POST -Endpoint "/api/recruitment/job-postings" `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
  } `
  -Body @{
    title = "مطور Full Stack Senior"
    description = "نبحث عن مطور محترف"
    status = "OPEN"
    jobType = "FULL_TIME"
    experienceLevel = "SENIOR"
    minSalary = 12000
    maxSalary = 18000
    currency = "SAR"
    location = "الرياض"
    remote = $false
    benefits = @("تأمين صحي", "مكافآت")
    expiresAt = (Get-Date).AddMonths(2).ToString("yyyy-MM-ddT23:59:59Z")
  }

$JOB_ID = $jobPosting.jobPosting.id
Write-Host "✅ Job posting created: $($jobPosting.jobPosting.title)" -ForegroundColor Green
Write-Host ""

# Step 11: Create Applicant
Write-Host "📝 Step 11: Create Applicant..." -ForegroundColor Yellow
$applicant = Invoke-ApiCall -Method POST -Endpoint "/api/recruitment/applicants" `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
  } `
  -Body @{
    jobPostingId = $JOB_ID
    firstName = "سارة"
    lastName = "خالد"
    email = "sara$(Get-Random)@test.com"
    phone = "+966509876543"
    coverLetter = "خبرة 6 سنوات في التطوير"
    status = "NEW"
    source = "WEBSITE"
  }

$APPLICANT_ID = $applicant.applicant.id
Write-Host "✅ Applicant created: $($applicant.applicant.firstName) $($applicant.applicant.lastName)" -ForegroundColor Green
Write-Host ""

# Step 12: Schedule Interview
Write-Host "📅 Step 12: Schedule Interview..." -ForegroundColor Yellow
$interview = Invoke-ApiCall -Method POST -Endpoint "/api/recruitment/interviews" `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
  } `
  -Body @{
    applicantId = $APPLICANT_ID
    jobPostingId = $JOB_ID
    type = "TECHNICAL"
    status = "SCHEDULED"
    scheduledAt = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
    duration = 60
    meetingLink = "https://meet.google.com/test-$(Get-Random)"
  }

Write-Host "✅ Interview scheduled" -ForegroundColor Green
Write-Host "   Meeting: $($interview.interview.meetingLink)" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ E2E Test Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host "  • Tenant: $($tenant.tenant.name)" -ForegroundColor White
Write-Host "  • HR User: $($hrUser.user.email)" -ForegroundColor White
Write-Host "  • Employee: $($employee.employee.employeeCode)" -ForegroundColor White
Write-Host "  • Attendance: Check-in & Check-out ✓" -ForegroundColor White
Write-Host "  • Job Posting: $($jobPosting.jobPosting.title)" -ForegroundColor White
Write-Host "  • Applicant: $($applicant.applicant.firstName)" -ForegroundColor White
Write-Host "  • Interview: Scheduled ✓" -ForegroundColor White
Write-Host ""
Write-Host "🎉 All systems operational!" -ForegroundColor Green
```

ثم شغّله:

```powershell
.\run-e2e-test.ps1
```

---

## 📋 الخلاصة

### ما يجب فعله الآن:

1. ✅ **Push الكود:**

   ```bash
   git push origin main
   ```

2. ⏳ **انتظر Render Deploy** (2-3 دقائق)

3. ⚡ **استدعِ Bootstrap:**

   ```powershell
   Invoke-RestMethod -Uri "https://YOUR-RENDER-DOMAIN/api/bootstrap/super-admin" -Method POST -Headers @{ "x-bootstrap-token" = $env:SUPER_ADMIN_BOOTSTRAP_TOKEN }
   ```

4. 🔐 **سجّل دخول:**
   https://YOUR-RENDER-DOMAIN/login

- قيمة `SUPER_ADMIN_EMAIL`
- قيمة `SUPER_ADMIN_PASSWORD`

5. 🧪 **شغّل E2E Test:**

   ```powershell
   .\run-e2e-test.ps1
   ```

6. 🗑️ **احذف Bootstrap (اختياري):**
   ```bash
   git rm app/api/bootstrap/super-admin/route.ts
   git commit -m "Remove bootstrap endpoint"
   git push
   ```

---

## 🎯 النتيجة النهائية

بعد هذه الخطوات:

- ✅ Super Admin موجود
- ✅ تسجيل الدخول يعمل
- ✅ نظام كامل مختبَر E2E
- ✅ جاهز للاستخدام الفعلي

**المشروع 100% جاهز للإنتاج!** 🚀
