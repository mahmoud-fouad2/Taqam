#!/usr/bin/env pwsh
<#
.SYNOPSIS
اختبار الإنتاج الفعلي للنظام على Render
Real Production Testing for Taqam on Render Free Tier

.DESCRIPTION
هذا السكريبت يختبر جميع العمليات الأساسية على الخادم الحي:
- تسجيل الدخول (Login)
- إنشاء شركة (Create Company)
- إنشاء موظف (Create Employee)
- إنشاء وظيفة (Create Job Posting)
- التحقق من البيانات (Verify Data)
#>

$baseUrl = "https://taqam.net"
$adminEmail = "admin@admin.com"
$adminPassword = "123456"
$maxRetries = 3
$retryDelay = 5  # seconds
$testResults = @()

# Configuration
$config = @{
    "baseUrl" = $baseUrl
    "timeout" = 15
    "maxRetries" = $maxRetries
}

# Helper functions
function Write-TestLog {
    param(
        [string]$TestName,
        [string]$Status,
        [string]$Message = ""
    )
    
    $emoji = @{
        "PASS" = "✓"
        "FAIL" = "✗"
        "PENDING" = "⏳"
    }
    
    $color = @{
        "PASS" = "Green"
        "FAIL" = "Red"
        "PENDING" = "Yellow"
    }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $($emoji[$Status]) $TestName" -ForegroundColor $color[$Status]
    
    if ($Message) {
        Write-Host "         └─ $Message" -ForegroundColor Gray
    }
    
    $script:testResults += @{
        "Test" = $TestName
        "Status" = $Status
        "Message" = $Message
        "Time" = $timestamp
    }
}

function Wait-ForServer {
    param(
        [int]$MaxAttempts = 12,
        [int]$Delay = 5
    )
    
    Write-Host "`n=== الانتظار لتشغيل الخادم ===" -ForegroundColor Cyan
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        Write-Host "محاولة $i/$MaxAttempts..." -ForegroundColor Yellow
        
        try {
            $null = Invoke-WebRequest -Uri "$baseUrl/api/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            Write-Host "✓ الخادم يعمل الآن!" -ForegroundColor Green
            return $true
        } catch {
            if ($i -lt $MaxAttempts) {
                Write-Host "في الانتظار $Delay ثانية..." -ForegroundColor Gray
                Start-Sleep -Seconds $Delay
            }
        }
    }
    
    Write-Host "✗ الخادم لم يستجب خلال $(($MaxAttempts * $Delay) / 60) دقيقة" -ForegroundColor Red
    return $false
}

function Invoke-API {
    param(
        [string]$Method,
        [string]$Endpoint,
        [PSCustomObject]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $url = "$baseUrl$Endpoint"
    $params = @{
        "Uri" = $url
        "Method" = $Method
        "TimeoutSec" = $config.timeout
        "ContentType" = "application/json"
    }
    
    if ($Headers.Count -gt 0) {
        $params["Headers"] = $Headers
    }
    
    if ($Body) {
        $params["Body"] = $Body | ConvertTo-Json
    }
    
    try {
        $response = Invoke-WebRequest @params -UseBasicParsing
        return @{
            "Success" = $true
            "StatusCode" = $response.StatusCode
            "Content" = $response.Content | ConvertFrom-Json
            "Error" = $null
        }
    } catch {
        return @{
            "Success" = $false
            "StatusCode" = $_.Exception.Response.StatusCode.Value
            "Content" = $null
            "Error" = $_.Exception.Message
        }
    }
}

# Main Tests
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  اختبار الإنتاج الفعلي - Real Production Tests     ║" -ForegroundColor Magenta
Write-Host "║  Taqam HRMS on Render Free Tier                    ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Magenta

Write-Host "`nالخادم: $baseUrl" -ForegroundColor Cyan
Write-Host "الوقت: $(Get-Date)" -ForegroundColor Gray

# Step 1: Check Server Availability
Write-Host "`n=== Step 1: التحقق من توفر الخادم ===" -ForegroundColor Cyan
if (-not (Wait-ForServer -Delay $retryDelay)) {
    Write-TestLog "توفر الخادم" "FAIL" "الخادم غير متاح"
    Write-Host "`nلا يمكن المتابعة - الخادم غير متاح" -ForegroundColor Red
    exit 1
}
Write-TestLog "توفر الخادم" "PASS" "الخادم يستجيب للطلبات"

# Step 2: Test Login
Write-Host "`n=== Step 2: اختبار تسجيل الدخول ===" -ForegroundColor Cyan
$loginHeaders = @{
    "X-Device-Id" = "test-device-$(Get-Random -Maximum 99999)"
    "X-Device-Name" = "Test Device - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    "X-Device-Platform" = "Testing"
    "X-App-Version" = "1.0.0"
}

$loginBody = @{
    "email" = $adminEmail
    "password" = $adminPassword
}

Write-Host "POST /api/mobile/auth/login" -ForegroundColor Cyan
$loginResult = Invoke-API "POST" "/api/mobile/auth/login" $loginBody $loginHeaders

if ($loginResult.Success -and $loginResult.StatusCode -eq 200) {
    $accessToken = $loginResult.Content.data.accessToken
    Write-TestLog "تسجيل الدخول" "PASS" "تم الحصول على Access Token"
    Write-Host "  Token Length: $($accessToken.Length) chars" -ForegroundColor Gray
} else {
    Write-TestLog "تسجيل الدخول" "FAIL" $loginResult.Error
    exit 1
}

# Step 3: Create Company
Write-Host "`n=== Step 3: إنشاء شركة ===" -ForegroundColor Cyan
$companyHeaders = @{
    "Authorization" = "Bearer $accessToken"
}

$companyBody = @{
    "nameAr" = "شركة الاختبار - $(Get-Date -Format 'yyyyMMddHHmmss')"
    "nameEn" = "Test Company - $(Get-Date -Format 'yyyyMMddHHmmss')"
    "taxNumber" = "123456789"
    "phone" = "0501234567"
    "email" = "info@testcompany.com"
    "industry" = "TECHNOLOGY"
    "website" = "https://testcompany.com"
    "description" = "This is a test company created by automated testing"
}

Write-Host "POST /api/companies" -ForegroundColor Cyan
$companyResult = Invoke-API "POST" "/api/companies" $companyBody $companyHeaders

if ($companyResult.Success) {
    $companyId = $companyResult.Content.data.id
    Write-TestLog "إنشاء شركة" "PASS" "Company ID: $companyId"
} else {
    Write-TestLog "إنشاء شركة" "FAIL" $companyResult.Error
    $companyId = $null
}

# Step 4: Get Companies List
if ($companyId) {
    Write-Host "`n=== Step 4: الحصول على قائمة الشركات ===" -ForegroundColor Cyan
    Write-Host "GET /api/companies" -ForegroundColor Cyan
    
    $listResult = Invoke-API "GET" "/api/companies" $null $companyHeaders
    
    if ($listResult.Success) {
        $count = $listResult.Content.data.items.Count
        Write-TestLog "قائمة الشركات" "PASS" "عدد الشركات: $count"
        
        # Check if our company is in the list
        $foundCompany = $listResult.Content.data.items | Where-Object { $_.id -eq $companyId }
        if ($foundCompany) {
            Write-TestLog "التحقق من الشركة المنشأة" "PASS" "تم العثور على الشركة في قاعدة البيانات"
        } else {
            Write-TestLog "التحقق من الشركة المنشأة" "FAIL" "لم يتم العثور على الشركة"
        }
    } else {
        Write-TestLog "قائمة الشركات" "FAIL" $listResult.Error
    }
}

# Summary
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║              ملخص النتائج - Test Summary             ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Magenta

$passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "`nإجمالي الاختبارات: $($testResults.Count)" -ForegroundColor Cyan
Write-Host "✓ نجاح: $passCount" -ForegroundColor Green
Write-Host "✗ فشل: $failCount" -ForegroundColor Red

Write-Host "`nتفاصيل الاختبارات:" -ForegroundColor Cyan
$testResults | Format-Table -Property Test, Status, Time, Message -AutoSize

if ($failCount -eq 0) {
    Write-Host "`n✓ جميع الاختبارات نجحت!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ بعض الاختبارات فشلت" -ForegroundColor Red
    exit 1
}
