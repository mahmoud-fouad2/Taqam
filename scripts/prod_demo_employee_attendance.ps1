param(
  [string]$BaseUrl = "https://taqam.net",
  [string]$TenantAdminEmail = "admin@demo.taqam.net",
  [string]$TenantAdminPassword = "Admin@123456",
  [string]$EmployeePassword = "Test12345!"
)

$ErrorActionPreference = "Stop"

$runId = ([Guid]::NewGuid().ToString('N')).Substring(0, 8)
$employeeEmail = "employee+$runId@example.com"
$cookie = Join-Path $env:TEMP "taqam-prod-$runId.cookies.txt"
Remove-Item -Force -ErrorAction SilentlyContinue $cookie

function Write-Utf8File {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter(Mandatory=$true)][string]$Content
  )
  # UTF-8 without BOM for curl payload reliability across PowerShell editions
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function UrlEncode([string]$s) { [uri]::EscapeDataString($s) }

function Invoke-CurlJson {
  param(
    [Parameter(Mandatory=$true)][string[]]$Args,
    [int]$MaxRetries = 6,
    [int]$BaseDelaySeconds = 10
  )

  for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    $raw = (& curl.exe @Args)
    $text = $raw -join "`n"

    # Handle 429s (Cloudflare/Render rate limit)
    if ($text -match "HTTP/\d\.\d\s+429") {
      $reset = $null
      if ($text -match "(?im)^x-ratelimit-reset:\s*(\d+)") {
        $reset = [int64]$Matches[1]
      }
      $now = [int64][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      $wait = if ($reset -and $reset -gt $now) { [Math]::Min(120, [int]($reset - $now + 2)) } else { $BaseDelaySeconds * $attempt }
      Write-Host "Rate limited (429). Waiting $wait seconds then retrying..." -ForegroundColor Yellow
      [System.Threading.Thread]::Sleep($wait * 1000)
      continue
    }

    try {
      return ($text | ConvertFrom-Json)
    } catch {
      # Some calls use -i (headers). Split headers/body if needed.
      $body = ($text -split "\r?\n\r?\n", 2)[1]
      if ($body) { return ($body | ConvertFrom-Json) }
      throw
    }
  }

  throw "Request failed after $MaxRetries retries"
}

function Invoke-CurlJsonWithStatus {
  param(
    [Parameter(Mandatory=$true)][string[]]$Args,
    [int]$MaxRetries = 6,
    [int]$BaseDelaySeconds = 10
  )

  for ($attempt = 1; $attempt -le $MaxRetries; $attempt++) {
    $raw = (& curl.exe @Args)
    $text = $raw -join "`n"

    $status = $null
    if ($text -match "HTTP/\d\.\d\s+(\d{3})") {
      $status = [int]$Matches[1]
    }

    if ($status -eq 429) {
      $reset = $null
      if ($text -match "(?im)^x-ratelimit-reset:\s*(\d+)") {
        $reset = [int64]$Matches[1]
      }
      $now = [int64][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
      $wait = if ($reset -and $reset -gt $now) { [Math]::Min(120, [int]($reset - $now + 2)) } else { $BaseDelaySeconds * $attempt }
      Write-Host "Rate limited (429). Waiting $wait seconds then retrying..." -ForegroundColor Yellow
      [System.Threading.Thread]::Sleep($wait * 1000)
      continue
    }

    if ($status -ge 500 -and $status -lt 600) {
      $wait = [Math]::Min(60, $BaseDelaySeconds * $attempt)
      Write-Host "Server error ($status). Waiting $wait seconds then retrying..." -ForegroundColor Yellow
      [System.Threading.Thread]::Sleep($wait * 1000)
      continue
    }

    $body = ($text -split "\r?\n\r?\n", 2)[1]
    $json = $null
    try {
      if ($body) { $json = ($body | ConvertFrom-Json) }
    } catch {
      $json = $null
    }

    return [pscustomobject]@{ Status = $status; Json = $json; Raw = $text }
  }

  throw "Request failed after $MaxRetries retries"
}

Write-Host "[1/5] NextAuth login (cookie) as tenant admin" -ForegroundColor Cyan
$csrf = Invoke-CurlJson -Args @('-sS','-c',$cookie,'-b',$cookie,"$BaseUrl/api/auth/csrf")
if (-not $csrf.csrfToken) { throw "No csrfToken" }
$form = @{
  csrfToken   = $csrf.csrfToken
  email       = $TenantAdminEmail
  password    = $TenantAdminPassword
  callbackUrl = "$BaseUrl/dashboard"
  json        = 'true'
}
$body = ($form.Keys | ForEach-Object { "$(UrlEncode $_)=$(UrlEncode ([string]$form[$_]))" }) -join '&'
$raw = (& curl.exe -sS -i -X POST -c $cookie -b $cookie -H 'Content-Type: application/x-www-form-urlencoded' --data $body "$BaseUrl/api/auth/callback/credentials")
$rawText = $raw -join "`n"
if ($rawText -match 'HTTP/\d\.\d\s+429') {
  # Retry login once rate limit window passes
  Write-Host "Rate limited (429) on NextAuth login. Retrying..." -ForegroundColor Yellow
  $null = Invoke-CurlJson -Args @('-sS','-i','-X','POST','-c',$cookie,'-b',$cookie,'-H','Content-Type: application/x-www-form-urlencoded','--data',$body,"$BaseUrl/api/auth/callback/credentials")
  $raw = (& curl.exe -sS -i -X POST -c $cookie -b $cookie -H 'Content-Type: application/x-www-form-urlencoded' --data $body "$BaseUrl/api/auth/callback/credentials")
  $rawText = $raw -join "`n"
}
if ($rawText -notmatch 'HTTP/\d\.\d\s+(200|30[23])') {
  Write-Host ($rawText -split "`n" | Select-Object -First 30 | Out-String) -ForegroundColor Yellow
  throw "Unexpected NextAuth login response"
}

Write-Host "[2/5] Create EMPLOYEE user" -ForegroundColor Cyan
$userPayload = @{
  firstName = 'Demo'
  lastName  = 'Employee'
  email     = $employeeEmail
  password  = $EmployeePassword
  role      = 'EMPLOYEE'
  phone     = '0500000002'
} | ConvertTo-Json -Compress
$userPayloadFile = Join-Path $env:TEMP "taqam-prod-$runId.user.json"
Remove-Item -Force -ErrorAction SilentlyContinue $userPayloadFile
Write-Utf8File -Path $userPayloadFile -Content $userPayload
$userResp = Invoke-CurlJsonWithStatus -Args @('-sS','-i','-X','POST','-c',$cookie,'-b',$cookie,'-H','Content-Type: application/json','--data-binary',"@$userPayloadFile","$BaseUrl/api/users")
if ($userResp.Status -ne 201 -or -not $userResp.Json -or -not $userResp.Json.data -or -not $userResp.Json.data.id) {
  Write-Host "User create failed (HTTP $($userResp.Status))" -ForegroundColor Yellow
  Write-Host (($userResp.Raw -split "`n" | Select-Object -First 60) -join "`n") -ForegroundColor DarkYellow
  throw ('User create failed: ' + (($userResp.Json | ConvertTo-Json -Depth 10)))
}
$userId = $userResp.Json.data.id

Write-Host "[3/5] Link Employee record" -ForegroundColor Cyan
$empPayload = @{
  userId          = $userId
  firstName       = 'Demo'
  lastName        = 'Employee'
  email           = $employeeEmail
  hireDate        = (Get-Date).ToString('yyyy-MM-dd')
  employmentType  = 'FULL_TIME'
} | ConvertTo-Json -Compress
$empPayloadFile = Join-Path $env:TEMP "taqam-prod-$runId.emp.json"
Remove-Item -Force -ErrorAction SilentlyContinue $empPayloadFile
Write-Utf8File -Path $empPayloadFile -Content $empPayload
$empRaw = (& curl.exe -sS -i -X POST -c $cookie -b $cookie -H 'Content-Type: application/json' --data-binary "@$empPayloadFile" "$BaseUrl/api/employees")
$empText = $empRaw -join "`n"
$empBody = ($empText -split "\r?\n\r?\n", 2)[1]
$empRes = $null
try { $empRes = ($empBody | ConvertFrom-Json) } catch { $empRes = $null }
if (-not $empRes -or -not $empRes.data -or -not $empRes.data.id) {
  $status = ""
  if ($empText -match "HTTP/\d\.\d\s+(\d{3})") { $status = $Matches[1] }
  Write-Host "Employee create failed (HTTP $status)" -ForegroundColor Yellow
  Write-Host (($empText -split "`n" | Select-Object -First 40) -join "`n") -ForegroundColor DarkYellow
  throw ('Employee create failed: ' + (($empRes | ConvertTo-Json -Depth 10)))
}
$employeeId = $empRes.data.id

Write-Host "[4/5] Mobile login + attendance check-in/out" -ForegroundColor Cyan
$deviceId = "demo-device-$runId"
$loginPayload = @{ email = $employeeEmail; password = $EmployeePassword } | ConvertTo-Json -Compress
$loginPayloadFile = Join-Path $env:TEMP "taqam-prod-$runId.mobile-login.json"
Remove-Item -Force -ErrorAction SilentlyContinue $loginPayloadFile
Write-Utf8File -Path $loginPayloadFile -Content $loginPayload
$loginRes = (& curl.exe -sS -X POST -H 'Content-Type: application/json' -H "x-device-id: $deviceId" -H 'x-device-platform: android' -H 'x-device-name: e2e' -H 'x-app-version: 1.0.0' --data-binary "@$loginPayloadFile" "$BaseUrl/api/mobile/auth/login") | ConvertFrom-Json
$accessToken = $loginRes.data.accessToken
if (-not $accessToken) { throw 'No accessToken from mobile login' }

function Get-Today {
  (& curl.exe -sS -X GET -H "Authorization: Bearer $accessToken" -H "x-device-id: $deviceId" "$BaseUrl/api/mobile/attendance/today") | ConvertFrom-Json
}
function New-Challenge {
  (& curl.exe -sS -X POST -H "Authorization: Bearer $accessToken" -H "x-device-id: $deviceId" "$BaseUrl/api/mobile/auth/challenge") | ConvertFrom-Json
}

$today = Get-Today
if ($today.data.status -eq 'NONE') {
  $nonce = (New-Challenge).data.nonce
  $attPayload = @{ type = 'check-in' } | ConvertTo-Json -Compress
  $attPayloadFile = Join-Path $env:TEMP "taqam-prod-$runId.att-in.json"
  Remove-Item -Force -ErrorAction SilentlyContinue $attPayloadFile
  Write-Utf8File -Path $attPayloadFile -Content $attPayload
  $null = (& curl.exe -sS -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $accessToken" -H "x-device-id: $deviceId" -H "x-mobile-challenge: $nonce" --data-binary "@$attPayloadFile" "$BaseUrl/api/mobile/attendance") | ConvertFrom-Json
}

$today2 = Get-Today
if ($today2.data.status -eq 'CHECKED_IN') {
  $nonce2 = (New-Challenge).data.nonce
  $attPayload2 = @{ type = 'check-out' } | ConvertTo-Json -Compress
  $attPayload2File = Join-Path $env:TEMP "taqam-prod-$runId.att-out.json"
  Remove-Item -Force -ErrorAction SilentlyContinue $attPayload2File
  Write-Utf8File -Path $attPayload2File -Content $attPayload2
  $null = (& curl.exe -sS -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer $accessToken" -H "x-device-id: $deviceId" -H "x-mobile-challenge: $nonce2" --data-binary "@$attPayload2File" "$BaseUrl/api/mobile/attendance") | ConvertFrom-Json
}

$today3 = Get-Today

Write-Host "[5/5] Done" -ForegroundColor Green
Write-Host "Tenant slug: demo" -ForegroundColor Green
Write-Host "Tenant link: $BaseUrl/t/demo" -ForegroundColor Green
Write-Host "Employee email: $employeeEmail" -ForegroundColor Green
Write-Host "Employee password: $EmployeePassword" -ForegroundColor Green
Write-Host "EmployeeId: $employeeId" -ForegroundColor DarkGray
Write-Host "Attendance status now: $($today3.data.status)" -ForegroundColor DarkGray
