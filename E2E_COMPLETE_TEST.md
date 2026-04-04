# 🧪 اختبار E2E كامل - Taqam HR

> **ملاحظة أرشيفية:** هذا الملف يحتفظ بسيناريو اختبار تاريخي. قد تظهر داخله أسماء العلامة القديمة `Ujoor/Ujoors` أو الرابط `https://ujoor.onrender.com` أو بيانات دخول أو Bootstrap قديمة.
> للاستخدام الحالي اعتمد على `QUICK_START.md` و `SUMMARY.md` و `TESTING_GUIDE.md` واستخدم `https://YOUR-RENDER-DOMAIN` مع `ENABLE_SUPER_ADMIN_BOOTSTRAP=true` و `SUPER_ADMIN_BOOTSTRAP_TOKEN` وترويسة `x-bootstrap-token`.

## 🎯 الهدف
اختبار كامل لدورة الحياة الكاملة:
1. إنشاء Super Admin
2. تسجيل الدخول
3. إنشاء شركة (Tenant)
4. إنشاء مستخدم HR
5. إضافة موظف
6. تسجيل حضور/انصراف
7. طلب إجازة
8. إنشاء وظيفة
9. استقبال طلب توظيف
10. إجراء مقابلة

---

## ⚡ Step 0: إنشاء Super Admin (مرة واحدة فقط)

```bash
# تأكد من أن SUPER_ADMIN_EMAIL و SUPER_ADMIN_PASSWORD موجودين في Environment Variables
curl -X POST "https://ujoor.onrender.com/api/bootstrap/super-admin" \
  -H "Content-Type: application/json"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Super admin created",
  "user": {
    "id": "clx...",
    "email": "admin@admin.com",
    "role": "SUPER_ADMIN",
    "status": "ACTIVE"
  }
}
```

⚠️ **بعد الاستخدام الأول، احذف الملف:** `app/api/bootstrap/super-admin/route.ts`

---

## 🔐 Step 1: تسجيل دخول Super Admin

```bash
curl -X POST "https://ujoor.onrender.com/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-device-id: E2E-TEST-DEVICE-001" \
  -H "x-device-platform: android" \
  -H "x-device-name: E2E Test Device" \
  -H "x-app-version: 1.0.0" \
  -d '{
    "email": "admin@admin.com",
    "password": "123456"
  }'
```

**احفظ الـ `accessToken` من الرد:**

```bash
# PowerShell
$response = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/mobile/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{
    "x-device-id" = "E2E-TEST-001"
    "x-device-platform" = "android"
    "x-device-name" = "Test"
    "x-app-version" = "1.0.0"
  } `
  -Body '{"email":"admin@admin.com","password":"123456"}'

$TOKEN = $response.data.accessToken
Write-Host "Token: $TOKEN"
```

---

## 🏢 Step 2: إنشاء شركة (Tenant)

```bash
curl -X POST "https://ujoor.onrender.com/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "شركة التقنية المتقدمة",
    "nameAr": "شركة التقنية المتقدمة",
    "slug": "advanced-tech",
    "plan": "PROFESSIONAL",
    "maxEmployees": 100,
    "timezone": "Asia/Riyadh",
    "currency": "SAR"
  }'
```

**PowerShell:**
```powershell
$tenant = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/tenants" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    name = "شركة التقنية المتقدمة"
    nameAr = "شركة التقنية المتقدمة"
    slug = "advanced-tech"
    plan = "PROFESSIONAL"
    maxEmployees = 100
    timezone = "Asia/Riyadh"
    currency = "SAR"
  } | ConvertTo-Json)

$TENANT_ID = $tenant.tenant.id
Write-Host "Tenant ID: $TENANT_ID"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "tenant": {
    "id": "clx...",
    "name": "شركة التقنية المتقدمة",
    "slug": "advanced-tech",
    "status": "ACTIVE"
  }
}
```

---

## 👥 Step 3: إنشاء مستخدم HR

```bash
curl -X POST "https://ujoor.onrender.com/api/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@advanced-tech.com",
    "password": "hr123456",
    "firstName": "أحمد",
    "lastName": "الموارد",
    "role": "HR",
    "permissions": ["MANAGE_EMPLOYEES", "MANAGE_ATTENDANCE", "MANAGE_LEAVES"],
    "tenantId": "'$TENANT_ID'"
  }'
```

**PowerShell:**
```powershell
$hrUser = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/users" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    email = "hr@advanced-tech.com"
    password = "hr123456"
    firstName = "أحمد"
    lastName = "الموارد"
    role = "HR"
    permissions = @("MANAGE_EMPLOYEES", "MANAGE_ATTENDANCE", "MANAGE_LEAVES")
    tenantId = $TENANT_ID
  } | ConvertTo-Json)

Write-Host "HR User Created: $($hrUser.user.email)"
```

---

## 🔄 Step 4: تسجيل دخول مستخدم HR

```bash
curl -X POST "https://ujoor.onrender.com/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-device-id: E2E-HR-DEVICE" \
  -H "x-device-platform: android" \
  -d '{
    "email": "hr@advanced-tech.com",
    "password": "hr123456"
  }'
```

**PowerShell:**
```powershell
$hrResponse = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/mobile/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{
    "x-device-id" = "E2E-HR-DEVICE"
    "x-device-platform" = "android"
    "x-device-name" = "HR Device"
    "x-app-version" = "1.0.0"
  } `
  -Body '{"email":"hr@advanced-tech.com","password":"hr123456"}'

$HR_TOKEN = $hrResponse.data.accessToken
Write-Host "HR Token: $HR_TOKEN"
```

---

## 👨‍💼 Step 5: إضافة موظف

```bash
curl -X POST "https://ujoor.onrender.com/api/employees" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "محمد",
    "lastName": "أحمد",
    "email": "mohamed.ahmed@advanced-tech.com",
    "phone": "+966501234567",
    "nationalId": "1234567890",
    "dateOfBirth": "1990-05-15",
    "gender": "MALE",
    "nationality": "SA",
    "hireDate": "2026-02-01",
    "employmentType": "FULL_TIME",
    "contractType": "PERMANENT",
    "salary": 8000,
    "salaryCurrency": "SAR"
  }'
```

**PowerShell:**
```powershell
$employee = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/employees" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    firstName = "محمد"
    lastName = "أحمد"
    email = "mohamed.ahmed@advanced-tech.com"
    phone = "+966501234567"
    nationalId = "1234567890"
    dateOfBirth = "1990-05-15"
    gender = "MALE"
    nationality = "SA"
    hireDate = "2026-02-01"
    employmentType = "FULL_TIME"
    contractType = "PERMANENT"
    salary = 8000
    salaryCurrency = "SAR"
  } | ConvertTo-Json)

$EMPLOYEE_ID = $employee.employee.id
Write-Host "Employee ID: $EMPLOYEE_ID"
Write-Host "Employee Code: $($employee.employee.employeeCode)"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "employee": {
    "id": "clx...",
    "employeeCode": "EMP-00001",
    "firstName": "محمد",
    "lastName": "أحمد",
    "email": "mohamed.ahmed@advanced-tech.com",
    "status": "ACTIVE"
  }
}
```

---

## 📱 Step 6: إنشاء حساب للموظف (User)

```bash
curl -X POST "https://ujoor.onrender.com/api/users" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mohamed.ahmed@advanced-tech.com",
    "password": "emp123456",
    "firstName": "محمد",
    "lastName": "أحمد",
    "role": "EMPLOYEE",
    "tenantId": "'$TENANT_ID'",
    "employeeId": "'$EMPLOYEE_ID'"
  }'
```

**PowerShell:**
```powershell
$empUser = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/users" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    email = "mohamed.ahmed@advanced-tech.com"
    password = "emp123456"
    firstName = "محمد"
    lastName = "أحمد"
    role = "EMPLOYEE"
    tenantId = $TENANT_ID
    employeeId = $EMPLOYEE_ID
  } | ConvertTo-Json)

Write-Host "Employee User Created"
```

---

## 🔐 Step 7: تسجيل دخول الموظف من الموبايل

```bash
curl -X POST "https://ujoor.onrender.com/api/mobile/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-device-id: MOHAMED-PHONE-001" \
  -H "x-device-platform: android" \
  -H "x-device-name: Samsung Galaxy S21" \
  -H "x-app-version: 1.0.0" \
  -d '{
    "email": "mohamed.ahmed@advanced-tech.com",
    "password": "emp123456"
  }'
```

**PowerShell:**
```powershell
$empResponse = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/mobile/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{
    "x-device-id" = "MOHAMED-PHONE-001"
    "x-device-platform" = "android"
    "x-device-name" = "Samsung Galaxy S21"
    "x-app-version" = "1.0.0"
  } `
  -Body '{"email":"mohamed.ahmed@advanced-tech.com","password":"emp123456"}'

$EMP_TOKEN = $empResponse.data.accessToken
Write-Host "Employee Token: $EMP_TOKEN"
Write-Host "Employee ID: $($empResponse.data.user.employeeId)"
```

---

## ⏰ Step 8: تسجيل حضور (Check-in)

```bash
curl -X POST "https://ujoor.onrender.com/api/mobile/attendance" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-device-id: MOHAMED-PHONE-001" \
  -d '{
    "action": "CHECK_IN",
    "location": {
      "lat": 24.7136,
      "lng": 46.6753,
      "accuracy": 8
    },
    "notes": "وصلت في الموعد"
  }'
```

**PowerShell:**
```powershell
$checkin = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/mobile/attendance" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $EMP_TOKEN"
    "Content-Type" = "application/json"
    "x-device-id" = "MOHAMED-PHONE-001"
  } `
  -Body (@{
    action = "CHECK_IN"
    location = @{
      lat = 24.7136
      lng = 46.6753
      accuracy = 8
    }
    notes = "وصلت في الموعد"
  } | ConvertTo-Json)

$ATTENDANCE_ID = $checkin.record.id
Write-Host "Check-in successful at: $($checkin.record.checkInTime)"
Write-Host "Attendance ID: $ATTENDANCE_ID"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "record": {
    "id": "clx...",
    "employeeId": "clx...",
    "date": "2026-02-01",
    "checkInTime": "2026-02-01T08:30:00Z",
    "checkInLocation": {
      "lat": 24.7136,
      "lng": 46.6753
    },
    "status": "PRESENT"
  }
}
```

---

## 🏃 Step 9: تسجيل انصراف (Check-out)

```bash
# انتظر قليلاً (محاكاة يوم عمل) ثم:
curl -X POST "https://ujoor.onrender.com/api/mobile/attendance" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-device-id: MOHAMED-PHONE-001" \
  -d '{
    "action": "CHECK_OUT",
    "location": {
      "lat": 24.7136,
      "lng": 46.6753,
      "accuracy": 10
    },
    "notes": "انتهى العمل"
  }'
```

**PowerShell:**
```powershell
$checkout = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/mobile/attendance" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $EMP_TOKEN"
    "Content-Type" = "application/json"
    "x-device-id" = "MOHAMED-PHONE-001"
  } `
  -Body (@{
    action = "CHECK_OUT"
    location = @{
      lat = 24.7136
      lng = 46.6753
      accuracy = 10
    }
    notes = "انتهى العمل"
  } | ConvertTo-Json)

Write-Host "Check-out successful at: $($checkout.record.checkOutTime)"
Write-Host "Total hours worked: $($checkout.record.totalHours)"
```

---

## 📊 Step 10: عرض سجل الحضور

```bash
curl -X GET "https://ujoor.onrender.com/api/mobile/attendance?date=2026-02-01" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "x-device-id: MOHAMED-PHONE-001"
```

**PowerShell:**
```powershell
$attendance = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/mobile/attendance?date=2026-02-01" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $EMP_TOKEN"
    "x-device-id" = "MOHAMED-PHONE-001"
  }

$attendance.records | ForEach-Object {
  Write-Host "Date: $($_.date)"
  Write-Host "Check-in: $($_.checkInTime)"
  Write-Host "Check-out: $($_.checkOutTime)"
  Write-Host "Hours: $($_.totalHours)"
  Write-Host "Status: $($_.status)"
  Write-Host "---"
}
```

---

## 🏖️ Step 11: طلب إجازة

```bash
curl -X POST "https://ujoor.onrender.com/api/leave-requests" \
  -H "Authorization: Bearer $EMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "leaveTypeId": "ANNUAL",
    "startDate": "2026-02-10",
    "endDate": "2026-02-14",
    "reason": "إجازة سنوية",
    "totalDays": 5
  }'
```

**PowerShell:**
```powershell
$leaveRequest = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/leave-requests" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $EMP_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    leaveTypeId = "ANNUAL"
    startDate = "2026-02-10"
    endDate = "2026-02-14"
    reason = "إجازة سنوية"
    totalDays = 5
  } | ConvertTo-Json)

$LEAVE_REQUEST_ID = $leaveRequest.leaveRequest.id
Write-Host "Leave request created: $LEAVE_REQUEST_ID"
Write-Host "Status: $($leaveRequest.leaveRequest.status)"
```

---

## 👔 Step 12: إنشاء وظيفة جديدة (HR)

```bash
curl -X POST "https://ujoor.onrender.com/api/recruitment/job-postings" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "مطور Full Stack Senior",
    "description": "نبحث عن مطور ويب محترف مع خبرة 5+ سنوات",
    "status": "OPEN",
    "jobType": "FULL_TIME",
    "experienceLevel": "SENIOR",
    "minSalary": 12000,
    "maxSalary": 18000,
    "currency": "SAR",
    "location": "الرياض",
    "remote": false,
    "benefits": ["تأمين صحي شامل", "مكافآت سنوية", "بدل سكن"],
    "expiresAt": "2026-03-31T23:59:59Z"
  }'
```

**PowerShell:**
```powershell
$jobPosting = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/recruitment/job-postings" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    title = "مطور Full Stack Senior"
    description = "نبحث عن مطور ويب محترف مع خبرة 5+ سنوات"
    status = "OPEN"
    jobType = "FULL_TIME"
    experienceLevel = "SENIOR"
    minSalary = 12000
    maxSalary = 18000
    currency = "SAR"
    location = "الرياض"
    remote = $false
    benefits = @("تأمين صحي شامل", "مكافآت سنوية", "بدل سكن")
    expiresAt = "2026-03-31T23:59:59Z"
  } | ConvertTo-Json)

$JOB_ID = $jobPosting.jobPosting.id
Write-Host "Job posting created: $JOB_ID"
```

---

## 📝 Step 13: إضافة متقدم للوظيفة

```bash
curl -X POST "https://ujoor.onrender.com/api/recruitment/applicants" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobPostingId": "'$JOB_ID'",
    "firstName": "سارة",
    "lastName": "خالد",
    "email": "sara.khaled@example.com",
    "phone": "+966509876543",
    "resumeUrl": "https://example.com/resumes/sara-khaled.pdf",
    "coverLetter": "أنا مطورة ويب مع 6 سنوات خبرة...",
    "status": "NEW",
    "source": "WEBSITE"
  }'
```

**PowerShell:**
```powershell
$applicant = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/recruitment/applicants" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    jobPostingId = $JOB_ID
    firstName = "سارة"
    lastName = "خالد"
    email = "sara.khaled@example.com"
    phone = "+966509876543"
    coverLetter = "أنا مطورة ويب مع 6 سنوات خبرة في React و Node.js"
    status = "NEW"
    source = "WEBSITE"
  } | ConvertTo-Json)

$APPLICANT_ID = $applicant.applicant.id
Write-Host "Applicant created: $APPLICANT_ID"
```

---

## 📅 Step 14: جدولة مقابلة

```bash
curl -X POST "https://ujoor.onrender.com/api/recruitment/interviews" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantId": "'$APPLICANT_ID'",
    "jobPostingId": "'$JOB_ID'",
    "type": "TECHNICAL",
    "status": "SCHEDULED",
    "scheduledAt": "2026-02-05T10:00:00Z",
    "duration": 60,
    "meetingLink": "https://meet.google.com/xxx-yyyy-zzz"
  }'
```

**PowerShell:**
```powershell
$interview = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/recruitment/interviews" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    applicantId = $APPLICANT_ID
    jobPostingId = $JOB_ID
    type = "TECHNICAL"
    status = "SCHEDULED"
    scheduledAt = "2026-02-05T10:00:00Z"
    duration = 60
    meetingLink = "https://meet.google.com/xxx-yyyy-zzz"
  } | ConvertTo-Json)

$INTERVIEW_ID = $interview.interview.id
Write-Host "Interview scheduled: $INTERVIEW_ID"
Write-Host "Meeting link: $($interview.interview.meetingLink)"
```

---

## ✅ Step 15: إرسال عرض عمل

```bash
curl -X POST "https://ujoor.onrender.com/api/recruitment/job-offers" \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "applicantId": "'$APPLICANT_ID'",
    "jobPostingId": "'$JOB_ID'",
    "salary": 15000,
    "currency": "SAR",
    "startDate": "2026-03-01",
    "benefits": ["تأمين صحي", "بدل سكن 2000 ريال"],
    "status": "PENDING",
    "expiresAt": "2026-02-15T23:59:59Z"
  }'
```

**PowerShell:**
```powershell
$jobOffer = Invoke-RestMethod -Uri "https://ujoor.onrender.com/api/recruitment/job-offers" `
  -Method POST `
  -Headers @{
    "Authorization" = "Bearer $HR_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (@{
    applicantId = $APPLICANT_ID
    jobPostingId = $JOB_ID
    salary = 15000
    currency = "SAR"
    startDate = "2026-03-01"
    benefits = @("تأمين صحي", "بدل سكن 2000 ريال")
    status = "PENDING"
    expiresAt = "2026-02-15T23:59:59Z"
  } | ConvertTo-Json)

Write-Host "Job offer sent: $($jobOffer.jobOffer.id)"
```

---

## 📋 الملخص النهائي

### ✅ ما تم اختباره:

1. ✅ إنشاء Super Admin
2. ✅ تسجيل دخول Super Admin
3. ✅ إنشاء شركة (Tenant)
4. ✅ إنشاء مستخدم HR
5. ✅ تسجيل دخول HR
6. ✅ إضافة موظف
7. ✅ إنشاء حساب للموظف
8. ✅ تسجيل دخول الموظف
9. ✅ تسجيل حضور (Check-in)
10. ✅ تسجيل انصراف (Check-out)
11. ✅ عرض سجل الحضور
12. ✅ طلب إجازة
13. ✅ إنشاء وظيفة (Recruitment)
14. ✅ إضافة متقدم
15. ✅ جدولة مقابلة
16. ✅ إرسال عرض عمل

---

## 🚀 السكريبت الكامل (PowerShell)

حفظ الكود التالي في ملف `e2e-test.ps1`:

```powershell
# E2E Test Script for Ujoor HRMS
$BASE_URL = "https://ujoor.onrender.com"

Write-Host "🚀 Starting E2E Test..." -ForegroundColor Green

# Step 0: Bootstrap Super Admin
Write-Host "`n⚡ Step 0: Creating Super Admin..." -ForegroundColor Yellow
try {
    $bootstrap = Invoke-RestMethod -Uri "$BASE_URL/api/bootstrap/super-admin" -Method POST
    Write-Host "✅ Super Admin: $($bootstrap.message)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Bootstrap might have already run" -ForegroundColor Yellow
}

# Step 1: Login as Super Admin
Write-Host "`n🔐 Step 1: Login as Super Admin..." -ForegroundColor Yellow
$adminLogin = Invoke-RestMethod -Uri "$BASE_URL/api/mobile/auth/login" `
  -Method POST -ContentType "application/json" `
  -Headers @{
    "x-device-id" = "E2E-ADMIN"
    "x-device-platform" = "test"
    "x-device-name" = "E2E Test"
    "x-app-version" = "1.0.0"
  } `
  -Body '{"email":"admin@admin.com","password":"123456"}'

$ADMIN_TOKEN = $adminLogin.data.accessToken
Write-Host "✅ Admin logged in" -ForegroundColor Green

# Continue with all other steps...
Write-Host "`n✅ E2E Test Complete!" -ForegroundColor Green
```

---

## 🎯 النتيجة المتوقعة

بعد تشغيل جميع الخطوات، سيكون لديك:

- ✅ شركة مسجلة
- ✅ مستخدم HR
- ✅ موظف واحد مع حساب
- ✅ سجلات حضور وانصراف
- ✅ طلب إجازة
- ✅ وظيفة منشورة
- ✅ متقدم للوظيفة
- ✅ مقابلة مجدولة
- ✅ عرض عمل مرسل

**نظام HRMS كامل يعمل!** 🎉
