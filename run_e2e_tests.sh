#!/bin/bash

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@admin.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-123456}"
DEVICE_ID="e2e-test-$(date +%s)"
DEVICE_NAME="Taqam E2E Device"
APP_VERSION="1.0.0"

echo "🔥 بدء اختبارات E2E الحقيقية"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Super Admin Login
echo "1️⃣ اختبار تسجيل دخول Super Admin..."
LOGIN_RESPONSE=$(curl -s "$BASE_URL/api/mobile/auth/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: $DEVICE_ID" \
  -H "X-Device-Name: $DEVICE_NAME" \
  -H "X-App-Version: $APP_VERSION" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ACCESS_TOKEN" ]; then
    echo "✅ تسجيل الدخول نجح"
    echo "   Token: ${ACCESS_TOKEN:0:30}..."
else
    echo "❌ فشل تسجيل الدخول"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo ""

# Test 2: Create Tenant
echo "2️⃣ اختبار إنشاء شركة (Tenant)..."
TENANT_RESPONSE=$(curl -s "$BASE_URL/api/tenants" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "شركة التقنية المتقدمة",
    "nameEn": "Advanced Tech Company",
    "email": "company@advanced-tech.com",
    "phone": "201012345678",
    "address": "Cairo, Egypt",
    "industry": "Information Technology"
  }')

TENANT_ID=$(echo "$TENANT_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$TENANT_ID" ]; then
    echo "✅ تم إنشاء الشركة"
    echo "   Tenant ID: $TENANT_ID"
else
    echo "❌ فشل إنشاء الشركة"
    echo "$TENANT_RESPONSE" | head -c 200
    echo ""
fi

echo ""

# Test 3: Create HR Employee
echo "3️⃣ اختبار إنشاء موظف (مدير HR)..."
HR_RESPONSE=$(curl -s "$BASE_URL/api/employees" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"firstName\": \"Ahmed\",
    \"lastName\": \"Salam\",
    \"email\": \"ahmed.salam@advanced-tech.com\",
    \"phone\": \"201012345679\",
    \"jobTitle\": \"HR Manager\",
    \"department\": \"Human Resources\",
    \"joinDate\": \"$(date +%Y-%m-%d)\",
    \"salary\": 8000,
    \"role\": \"HR\",
    \"status\": \"active\"
  }")

HR_ID=$(echo "$HR_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$HR_ID" ]; then
    echo "✅ تم إنشاء موظف HR"
    echo "   HR ID: $HR_ID"
else
    echo "❌ فشل إنشاء موظف HR"
    echo "$HR_RESPONSE" | head -c 200
    echo ""
fi

echo ""

# Test 4: Create Regular Employee
echo "4️⃣ اختبار إنشاء موظف عادي..."
EMP_RESPONSE=$(curl -s "$BASE_URL/api/employees" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"firstName\": \"Mohamed\",
    \"lastName\": \"Ali\",
    \"email\": \"Mohamed.Ali@advanced-tech.com\",
    \"phone\": \"201012345680\",
    \"jobTitle\": \"Senior Developer\",
    \"department\": \"Engineering\",
    \"joinDate\": \"$(date +%Y-%m-%d)\",
    \"salary\": 10000,
    \"role\": \"EMPLOYEE\",
    \"status\": \"active\"
  }")

EMP_ID=$(echo "$EMP_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$EMP_ID" ]; then
    echo "✅ تم إنشاء موظف"
    echo "   Employee ID: $EMP_ID"
else
    echo "❌ فشل إنشاء موظف"
    echo "$EMP_RESPONSE" | head -c 200
    echo ""
fi

echo ""

# Test 5: Create Job Posting
echo "5️⃣ اختبار إنشاء إعلان وظيفي..."
JOB_RESPONSE=$(curl -s "$BASE_URL/api/recruitment/job-postings" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"title\": \"Senior Full Stack Developer\",
    \"titleAr\": \"مطور Full Stack متقدم\",
    \"description\": \"We are looking for a senior Full Stack developer\",
    \"requirements\": \"5+ years of experience\",
    \"responsibilities\": \"Develop and maintain web applications\",
    \"benefits\": \"Competitive salary, health insurance\",
    \"departmentId\": \"ENG\",
    \"jobTitleId\": \"DEV\",
    \"status\": \"OPEN\",
    \"jobType\": \"FULL_TIME\",
    \"experienceLevel\": \"SENIOR\",
    \"positions\": 3,
    \"location\": \"Cairo\",
    \"salaryMin\": 10000,
    \"salaryMax\": 15000,
    \"salaryCurrency\": \"EGP\",
    \"postedAt\": \"$(date +%Y-%m-%d)\"
  }")

JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$JOB_ID" ]; then
    echo "✅ تم إنشاء إعلان وظيفي"
    echo "   Job Posting ID: $JOB_ID"
else
    echo "❌ فشل إنشاء إعلان وظيفي"
    echo "$JOB_RESPONSE" | head -c 200
    echo ""
fi

echo ""

# Test 6: Create Applicant
echo "6️⃣ اختبار إنشاء متقدم وظيفي..."
APP_RESPONSE=$(curl -s "$BASE_URL/api/recruitment/applicants" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"jobPostingId\": \"$JOB_ID\",
    \"firstName\": \"Sarah\",
    \"lastName\": \"Khaled\",
    \"email\": \"sarah.khaled@example.com\",
    \"phone\": \"201012345681\",
    \"resumeUrl\": \"https://example.com/resumes/sarah.pdf\",
    \"status\": \"RECEIVED\"
  }")

APPLICANT_ID=$(echo "$APP_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$APPLICANT_ID" ]; then
    echo "✅ تم إنشاء متقدم وظيفي"
    echo "   Applicant ID: $APPLICANT_ID"
else
    echo "❌ فشل إنشاء متقدم وظيفي"
    echo "$APP_RESPONSE" | head -c 200
    echo ""
fi

echo ""

# Test 7: Schedule Interview
echo "7️⃣ اختبار جدولة مقابلة..."
SCHEDULED_TIME=$(date -u -d "+3 days" +"%Y-%m-%dT%H:%M:%S")
INTERVIEW_RESPONSE=$(curl -s "$BASE_URL/api/recruitment/interviews" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"applicantId\": \"$APPLICANT_ID\",
    \"jobPostingId\": \"$JOB_ID\",
    \"type\": \"FIRST_ROUND\",
    \"status\": \"SCHEDULED\",
    \"scheduledAt\": \"$SCHEDULED_TIME\",
    \"duration\": 60,
    \"location\": \"Company Office - Cairo\",
    \"interviewerId\": \"$HR_ID\"
  }")

INTERVIEW_ID=$(echo "$INTERVIEW_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$INTERVIEW_ID" ]; then
    echo "✅ تم جدولة المقابلة"
    echo "   Interview ID: $INTERVIEW_ID"
else
    echo "❌ فشل جدولة المقابلة"
    echo "$INTERVIEW_RESPONSE" | head -c 200
    echo ""
fi

echo ""

# Test 8: Attendance Check-In
echo "8️⃣ اختبار تسجيل الدخول (Attendance)..."
CHECKIN_RESPONSE=$(curl -s "$BASE_URL/api/mobile/attendance/check-in" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-Device-Id: $DEVICE_ID" \
  -H "X-Device-Name: $DEVICE_NAME" \
  -H "X-App-Version: $APP_VERSION" \
  -d "{
    \"tenantId\": \"$TENANT_ID\",
    \"employeeId\": \"$EMP_ID\",
    \"latitude\": 30.0444,
    \"longitude\": 31.2357
  }")

CHECK_ID=$(echo "$CHECKIN_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$CHECK_ID" ]; then
    echo "✅ تم تسجيل الدخول"
    echo "   Check-In ID: $CHECK_ID"
else
    echo "❌ فشل تسجيل الدخول"
    echo "$CHECKIN_RESPONSE" | head -c 200
    echo ""
fi

echo ""
echo "================================"
echo "✨ اكتملت الاختبارات!"
echo "================================"
echo ""
echo "📋 بيانات التكامل:"
echo "  - Tenant ID: $TENANT_ID"
echo "  - HR User ID: $HR_ID"
echo "  - Employee ID: $EMP_ID"
echo "  - Job Posting ID: $JOB_ID"
echo "  - Applicant ID: $APPLICANT_ID"
echo "  - Interview ID: $INTERVIEW_ID"
echo "  - Check-In ID: $CHECK_ID"
echo ""
