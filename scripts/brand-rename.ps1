Set-Location "d:\Mahmoud\hghvadt\Jisr"
$result = [System.Collections.Generic.List[string]]::new()
$srcDirs = @("app","components","lib","i18n","hooks","types")
$rootFiles = @("proxy.ts","package.json",".env.example")
$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.json","*.css","*.mjs")

function Invoke-BrandRename($path) {
  $c = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $orig = $c
  $c = $c.Replace("Ujoors (ajwaar)", "Taqam (taqam)")
  $c = $c.Replace("Ujoors (أجور)", "Taqam (طاقم)")
  $c = $c.Replace("Ujoors", "Taqam")
  $c = $c.Replace("ujoors", "taqam")
  $c = $c.Replace("UJOORS", "TAQAM")
  $c = $c.Replace("ujoor.onrender.com", "taqam.net")
  $c = $c.Replace('"ujoor"', '"taqam"')
  $c = $c.Replace("ujoor.com", "taqam.net")
  $c = $c.Replace("app_name_ar: ajwaar", "app_name_ar: taqam")
  if ($c -ne $orig) {
    [System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
    return $path
  }
  return $null
}

foreach ($dir in $srcDirs) {
  $full = Join-Path "d:\Mahmoud\hghvadt\Jisr" $dir
  if (Test-Path $full) {
    foreach ($ext in $extensions) {
      Get-ChildItem -Path $full -Recurse -Filter $ext -ErrorAction SilentlyContinue | ForEach-Object {
        $r = Invoke-BrandRename $_.FullName
        if ($r) { $result.Add($r) | Out-Null }
      }
    }
  }
}
foreach ($f in $rootFiles) {
  $fp = Join-Path "d:\Mahmoud\hghvadt\Jisr" $f
  if (Test-Path $fp) {
    $r = Invoke-BrandRename $fp
    if ($r) { $result.Add($r) | Out-Null }
  }
}
Write-Host "Updated $($result.Count) files"
