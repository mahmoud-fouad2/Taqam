$BaseUrl = "https://taqam.net"
$SuperAdminEmail = "admin@admin.com"
$SuperAdminPassword = "123456"

$TestResults = @()
$TokenSuperAdmin = $null
$TenantId = $null
$HRUserId = $null
$EmployeeId = $null
$JobPostingId = $null
$ApplicantId = $null
$InterviewId = $null

Write-Host "Starting Real E2E Tests..." -ForegroundColor Cyan

# Test 1: Super Admin Login
Write-Host "`nTest 1: Super Admin Login" -ForegroundColor Yellow
try {
    $loginBody = @{
        email    = $SuperAdminEmail
        password = $SuperAdminPassword
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/mobile/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -SkipHttpErrorCheck
    
    if ($response.StatusCode -eq 200) {
        $loginData = $response.Content | ConvertFrom-Json
        if ($loginData.token) {
            $TokenSuperAdmin = $loginData.token
            Write-Host "✅ Login successful" -ForegroundColor Green
            Write-Host "   Token: $($TokenSuperAdmin.Substring(0, 20))..." -ForegroundColor Gray
            $TestResults += @{ Test = "Super Admin Login"; Status = "PASS" }
        } else {
            Write-Host "❌ No token in response" -ForegroundColor Red
            $TestResults += @{ Test = "Super Admin Login"; Status = "FAIL"; Error = "No token" }
        }
    } else {
        Write-Host "❌ Login failed with status $($response.StatusCode)" -ForegroundColor Red
        Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
        $TestResults += @{ Test = "Super Admin Login"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
    }
} catch {
    Write-Host "❌ Exception: $_" -ForegroundColor Red
    $TestResults += @{ Test = "Super Admin Login"; Status = "FAIL"; Error = $_.Exception.Message }
}

# Test 2: Create Tenant
Write-Host "`nTest 2: Create Tenant" -ForegroundColor Yellow
if ($TokenSuperAdmin) {
    try {
        $tenantBody = @{
            name     = "Advanced Tech Company"
            nameEn   = "Advanced Tech Company"
            email    = "company@advanced-tech.com"
            phone    = "201012345678"
            address  = "Cairo, Egypt"
            industry = "Information Technology"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/tenants" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $TokenSuperAdmin" } `
            -Body $tenantBody `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            $tenantData = $response.Content | ConvertFrom-Json
            if ($tenantData.id) {
                $TenantId = $tenantData.id
                Write-Host "✅ Tenant created" -ForegroundColor Green
                Write-Host "   Tenant ID: $TenantId" -ForegroundColor Gray
                $TestResults += @{ Test = "Create Tenant"; Status = "PASS" }
            } else {
                Write-Host "❌ No ID in response" -ForegroundColor Red
                $TestResults += @{ Test = "Create Tenant"; Status = "FAIL"; Error = "No ID" }
            }
        } else {
            Write-Host "❌ Failed with status $($response.StatusCode)" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
            $TestResults += @{ Test = "Create Tenant"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
        }
    } catch {
        Write-Host "❌ Exception: $_" -ForegroundColor Red
        $TestResults += @{ Test = "Create Tenant"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Test 3: Create Employee (HR)
Write-Host "`nTest 3: Create Employee (HR)" -ForegroundColor Yellow
if ($TokenSuperAdmin -and $TenantId) {
    try {
        $employeeBody = @{
            tenantId    = $TenantId
            firstName   = "Ahmed"
            lastName    = "Salam"
            email       = "ahmed.salam@advanced-tech.com"
            phone       = "201012345679"
            jobTitle    = "HR Manager"
            department  = "Human Resources"
            joinDate    = (Get-Date -Format "yyyy-MM-dd")
            salary      = 8000
            role        = "HR"
            status      = "active"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/employees" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $TokenSuperAdmin" } `
            -Body $employeeBody `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            $employeeData = $response.Content | ConvertFrom-Json
            if ($employeeData.id) {
                $HRUserId = $employeeData.id
                Write-Host "✅ HR Employee created" -ForegroundColor Green
                Write-Host "   HR ID: $HRUserId" -ForegroundColor Gray
                $TestResults += @{ Test = "Create HR Employee"; Status = "PASS" }
            } else {
                Write-Host "❌ No ID in response" -ForegroundColor Red
                $TestResults += @{ Test = "Create HR Employee"; Status = "FAIL"; Error = "No ID" }
            }
        } else {
            Write-Host "❌ Failed with status $($response.StatusCode)" -ForegroundColor Red
            $TestResults += @{ Test = "Create HR Employee"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
        }
    } catch {
        Write-Host "❌ Exception: $_" -ForegroundColor Red
        $TestResults += @{ Test = "Create HR Employee"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Test 4: Create Employee (Regular)
Write-Host "`nTest 4: Create Regular Employee" -ForegroundColor Yellow
if ($TokenSuperAdmin -and $TenantId) {
    try {
        $employeeBody = @{
            tenantId    = $TenantId
            firstName   = "Mohamed"
            lastName    = "Ali"
            email       = "Mohamed.Ali@advanced-tech.com"
            phone       = "201012345680"
            jobTitle    = "Senior Developer"
            department  = "Engineering"
            joinDate    = (Get-Date -Format "yyyy-MM-dd")
            salary      = 10000
            role        = "EMPLOYEE"
            status      = "active"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/employees" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $TokenSuperAdmin" } `
            -Body $employeeBody `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            $employeeData = $response.Content | ConvertFrom-Json
            if ($employeeData.id) {
                $EmployeeId = $employeeData.id
                Write-Host "✅ Regular Employee created" -ForegroundColor Green
                Write-Host "   Employee ID: $EmployeeId" -ForegroundColor Gray
                $TestResults += @{ Test = "Create Regular Employee"; Status = "PASS" }
            } else {
                Write-Host "❌ No ID in response" -ForegroundColor Red
                $TestResults += @{ Test = "Create Regular Employee"; Status = "FAIL"; Error = "No ID" }
            }
        } else {
            Write-Host "❌ Failed with status $($response.StatusCode)" -ForegroundColor Red
            $TestResults += @{ Test = "Create Regular Employee"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
        }
    } catch {
        Write-Host "❌ Exception: $_" -ForegroundColor Red
        $TestResults += @{ Test = "Create Regular Employee"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Test 5: Create Job Posting
Write-Host "`nTest 5: Create Job Posting" -ForegroundColor Yellow
if ($TokenSuperAdmin -and $TenantId) {
    try {
        $jobBody = @{
            tenantId         = $TenantId
            title            = "Senior Full Stack Developer"
            titleAr          = "مطور Full Stack متقدم"
            description      = "We are looking for a senior Full Stack developer"
            requirements     = "5+ years of experience"
            responsibilities = "Develop and maintain web applications"
            benefits         = "Competitive salary, health insurance"
            departmentId     = "ENG"
            jobTitleId       = "DEV"
            status           = "OPEN"
            jobType          = "FULL_TIME"
            experienceLevel  = "SENIOR"
            positions        = 3
            location         = "Cairo"
            salaryMin        = 10000
            salaryMax        = 15000
            salaryCurrency   = "EGP"
            postedAt         = (Get-Date -Format "yyyy-MM-dd")
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/recruitment/job-postings" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $TokenSuperAdmin" } `
            -Body $jobBody `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            $jobData = $response.Content | ConvertFrom-Json
            if ($jobData.id) {
                $JobPostingId = $jobData.id
                Write-Host "✅ Job Posting created" -ForegroundColor Green
                Write-Host "   Job ID: $JobPostingId" -ForegroundColor Gray
                $TestResults += @{ Test = "Create Job Posting"; Status = "PASS" }
            } else {
                Write-Host "❌ No ID in response" -ForegroundColor Red
                $TestResults += @{ Test = "Create Job Posting"; Status = "FAIL"; Error = "No ID" }
            }
        } else {
            Write-Host "❌ Failed with status $($response.StatusCode)" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
            $TestResults += @{ Test = "Create Job Posting"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
        }
    } catch {
        Write-Host "❌ Exception: $_" -ForegroundColor Red
        $TestResults += @{ Test = "Create Job Posting"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Test 6: Create Applicant
Write-Host "`nTest 6: Create Job Applicant" -ForegroundColor Yellow
if ($TokenSuperAdmin -and $JobPostingId) {
    try {
        $applicantBody = @{
            jobPostingId = $JobPostingId
            firstName    = "Sarah"
            lastName     = "Khaled"
            email        = "sarah.khaled@example.com"
            phone        = "201012345681"
            resumeUrl    = "https://example.com/resumes/sarah.pdf"
            status       = "RECEIVED"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/recruitment/applicants" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $TokenSuperAdmin" } `
            -Body $applicantBody `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            $applicantData = $response.Content | ConvertFrom-Json
            if ($applicantData.id) {
                $ApplicantId = $applicantData.id
                Write-Host "✅ Applicant created" -ForegroundColor Green
                Write-Host "   Applicant ID: $ApplicantId" -ForegroundColor Gray
                $TestResults += @{ Test = "Create Applicant"; Status = "PASS" }
            } else {
                Write-Host "❌ No ID in response" -ForegroundColor Red
                $TestResults += @{ Test = "Create Applicant"; Status = "FAIL"; Error = "No ID" }
            }
        } else {
            Write-Host "❌ Failed with status $($response.StatusCode)" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
            $TestResults += @{ Test = "Create Applicant"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
        }
    } catch {
        Write-Host "❌ Exception: $_" -ForegroundColor Red
        $TestResults += @{ Test = "Create Applicant"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Test 7: Schedule Interview
Write-Host "`nTest 7: Schedule Interview" -ForegroundColor Yellow
if ($TokenSuperAdmin -and $ApplicantId -and $JobPostingId -and $HRUserId) {
    try {
        $scheduledTime = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss")
        $interviewBody = @{
            applicantId  = $ApplicantId
            jobPostingId = $JobPostingId
            type         = "FIRST_ROUND"
            status       = "SCHEDULED"
            scheduledAt  = $scheduledTime
            duration     = 60
            location     = "Company Office - Cairo"
            interviewerId = $HRUserId
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/recruitment/interviews" `
            -Method POST `
            -ContentType "application/json" `
            -Headers @{ "Authorization" = "Bearer $TokenSuperAdmin" } `
            -Body $interviewBody `
            -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 201) {
            $interviewData = $response.Content | ConvertFrom-Json
            if ($interviewData.id) {
                $InterviewId = $interviewData.id
                Write-Host "✅ Interview scheduled" -ForegroundColor Green
                Write-Host "   Interview ID: $InterviewId" -ForegroundColor Gray
                $TestResults += @{ Test = "Schedule Interview"; Status = "PASS" }
            } else {
                Write-Host "❌ No ID in response" -ForegroundColor Red
                $TestResults += @{ Test = "Schedule Interview"; Status = "FAIL"; Error = "No ID" }
            }
        } else {
            Write-Host "❌ Failed with status $($response.StatusCode)" -ForegroundColor Red
            Write-Host "   Response: $($response.Content)" -ForegroundColor Yellow
            $TestResults += @{ Test = "Schedule Interview"; Status = "FAIL"; Error = "Status $($response.StatusCode)" }
        }
    } catch {
        Write-Host "❌ Exception: $_" -ForegroundColor Red
        $TestResults += @{ Test = "Schedule Interview"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

# Summary
Write-Host "`n$('='*60)" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "$('='*60)" -ForegroundColor Cyan

$passCount = ($TestResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $TestResults.Count

Write-Host "`nPassed: $passCount / $totalCount" -ForegroundColor Green
Write-Host "Failed: $failCount / $totalCount" -ForegroundColor Red

Write-Host "`nTest Results:" -ForegroundColor Yellow
foreach ($result in $TestResults) {
    if ($result.Status -eq "PASS") {
        Write-Host "  ✅ $($result.Test)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($result.Test) - Error: $($result.Error)" -ForegroundColor Red
    }
}

Write-Host "`nIntegration Data:" -ForegroundColor Yellow
Write-Host "  Tenant ID: $TenantId" -ForegroundColor Gray
Write-Host "  HR User ID: $HRUserId" -ForegroundColor Gray
Write-Host "  Employee ID: $EmployeeId" -ForegroundColor Gray
Write-Host "  Job Posting ID: $JobPostingId" -ForegroundColor Gray
Write-Host "  Applicant ID: $ApplicantId" -ForegroundColor Gray
Write-Host "  Interview ID: $InterviewId" -ForegroundColor Gray

Write-Host "`n✨ Tests Complete!" -ForegroundColor Cyan
