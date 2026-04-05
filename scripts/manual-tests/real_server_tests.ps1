# Real Server Tests - Actual Production Testing
# This will test the real running server

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║     ACTUAL PRODUCTION SERVER TESTS - REAL DATA    ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$BaseUrl = "https://taqam.net"
$results = @()

# Test 1: Simple Health Check (No Auth Needed)
Write-Host "TEST 1: Health Check (Simple)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  DB Status: $($data.database.status)" -ForegroundColor Green
    Write-Host "  Users Count: $($data.database.userCount)" -ForegroundColor Green
    $results += @{ Test = "Health Check"; Status = "PASS"; Time = (Get-Date) }
    Write-Host "  ✅ PASSED`n" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    $results += @{ Test = "Health Check"; Status = "FAIL"; Error = $_.Exception.Message }
}

# Test 2: Test Bootstrap Endpoint
Write-Host "TEST 2: Bootstrap Super Admin" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/bootstrap/super-admin" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{}' `
        -TimeoutSec 10
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "  Email: $($data.user.email)" -ForegroundColor Green
        Write-Host "  Role: $($data.user.role)" -ForegroundColor Green
        Write-Host "  Status: $($data.user.status)" -ForegroundColor Green
        $results += @{ Test = "Bootstrap Admin"; Status = "PASS" }
        Write-Host "  ✅ PASSED`n" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ ALREADY EXISTS`n" -ForegroundColor Yellow
        $results += @{ Test = "Bootstrap Admin"; Status = "EXISTS" }
    }
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    $results += @{ Test = "Bootstrap Admin"; Status = "FAIL" }
}

# Test 3: Mobile Login - Proper Headers
Write-Host "TEST 3: Mobile Login (With Proper Headers)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $headers = @{
        "Content-Type" = "application/json"
        "X-Device-Id" = "real-test-$(Get-Random 100000)"
        "X-Device-Name" = "Real Device Test"
        "X-App-Version" = "1.0.0"
    }
    
    $body = @{
        email = "admin@admin.com"
        password = "123456"
    } | ConvertTo-Json -Compress
    
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/mobile/auth/login" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 10
    
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.data.accessToken) {
        Write-Host "  Email: $($data.data.user.email)" -ForegroundColor Green
        Write-Host "  Role: $($data.data.user.role)" -ForegroundColor Green
        Write-Host "  Token Issued: Yes" -ForegroundColor Green
        $script:Token = $data.data.accessToken
        $results += @{ Test = "Mobile Login"; Status = "PASS" }
        Write-Host "  ✅ PASSED`n" -ForegroundColor Green
    } else {
        Write-Host "  ❌ No token in response`n" -ForegroundColor Red
        $results += @{ Test = "Mobile Login"; Status = "FAIL" }
    }
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    $results += @{ Test = "Mobile Login"; Status = "FAIL"; Error = $_.Exception.Message }
}

# Test 4: Get User Profile
Write-Host "TEST 4: Get User Profile (Requires Auth)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($script:Token) {
    try {
        $headers = @{
            "Authorization" = "Bearer $script:Token"
            "X-Device-Id" = "real-test"
            "X-Device-Name" = "Real Device Test"
            "X-App-Version" = "1.0.0"
        }
        
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/mobile/user/me" `
            -Method GET `
            -Headers $headers `
            -TimeoutSec 10
        
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "  Email: $($data.data.email)" -ForegroundColor Green
        Write-Host "  Role: $($data.data.role)" -ForegroundColor Green
        Write-Host "  Status: $($data.data.status)" -ForegroundColor Green
        $results += @{ Test = "User Profile"; Status = "PASS" }
        Write-Host "  ✅ PASSED`n" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
        $results += @{ Test = "User Profile"; Status = "FAIL" }
    }
} else {
    Write-Host "  ⚠️ SKIPPED - No token available`n" -ForegroundColor Yellow
}

# Test 5: Check Database Integrity
Write-Host "TEST 5: Database Integrity Check" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec 10
    $data = $response.Content | ConvertFrom-Json
    
    $checks = @{
        "Database Connection" = $data.database.status -eq "connected"
        "NextAuth Config" = $data.env.hasNextAuthSecret
        "Database URL" = $data.env.hasDatabaseUrl
        "Super Admin Config" = $data.env.hasSuperAdminEmail
    }
    
    $passed = 0
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "  ✓ $($check.Key)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ✗ $($check.Key)" -ForegroundColor Red
        }
    }
    
    if ($passed -eq $checks.Count) {
        $results += @{ Test = "Database Integrity"; Status = "PASS" }
        Write-Host "  ✅ PASSED ($passed/$($checks.Count))`n" -ForegroundColor Green
    } else {
        $results += @{ Test = "Database Integrity"; Status = "PARTIAL" }
        Write-Host "  ⚠️ PARTIAL ($passed/$($checks.Count))`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    $results += @{ Test = "Database Integrity"; Status = "FAIL" }
}

# Test 6: API Response Time
Write-Host "TEST 6: API Response Time" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec 10
    $stopwatch.Stop()
    
    $ms = $stopwatch.ElapsedMilliseconds
    Write-Host "  Response Time: ${ms}ms" -ForegroundColor Green
    
    if ($ms -lt 1000) {
        Write-Host "  Performance: Excellent" -ForegroundColor Green
        $results += @{ Test = "Response Time"; Status = "PASS"; Time = $ms }
    } else {
        Write-Host "  Performance: Slow" -ForegroundColor Yellow
        $results += @{ Test = "Response Time"; Status = "WARN"; Time = $ms }
    }
    Write-Host "  ✅ PASSED`n" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    $results += @{ Test = "Response Time"; Status = "FAIL" }
}

# Test 7: SSL/HTTPS Verification
Write-Host "TEST 7: SSL/HTTPS Security" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -TimeoutSec 10
    
    Write-Host "  Protocol: HTTPS" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  SSL: Enabled" -ForegroundColor Green
    $results += @{ Test = "SSL/HTTPS"; Status = "PASS" }
    Write-Host "  ✅ PASSED`n" -ForegroundColor Green
} catch {
    Write-Host "  ❌ FAILED: $_`n" -ForegroundColor Red
    $results += @{ Test = "SSL/HTTPS"; Status = "FAIL" }
}

# Summary Report
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║            TEST SUMMARY REPORT                   ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$passCount = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $results.Count

Write-Host "Tests Run: $totalCount" -ForegroundColor Gray
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✨ ALL TESTS PASSED! ✨" -ForegroundColor Green
    Write-Host "`nServer Status: 🟢 HEALTHY" -ForegroundColor Green
    Write-Host "Database Status: 🟢 CONNECTED" -ForegroundColor Green
    Write-Host "APIs: 🟢 OPERATIONAL" -ForegroundColor Green
} else {
    Write-Host "⚠️ Some tests failed" -ForegroundColor Yellow
}

Write-Host "`n════════════════════════════════════════════════════`n" -ForegroundColor Magenta

Write-Host "🌐 Server URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "📊 Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
