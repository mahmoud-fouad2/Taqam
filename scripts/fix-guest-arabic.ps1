Set-Location "d:\Mahmoud\hghvadt\Jisr"
$result = [System.Collections.Generic.List[string]]::new()
$dir = "d:\Mahmoud\hghvadt\Jisr\app\(guest)"
$extensions = @("*.ts","*.tsx","*.js","*.jsx")

function Fix-GuestPage($path) {
  $c = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $orig = $c
  # Fix Arabic title patterns: "XYZ | أجور" → "XYZ | طاقم"
  $c = $c -replace ' \| أجور"', ' | طاقم"'
  $c = $c -replace '"أجور \|', '"طاقم |'
  # Fix description patterns
  $c = $c -replace 'حول أجور', 'حول طاقم'
  $c = $c -replace 'لأجور\.', 'لطاقم.'
  $c = $c -replace 'أجور\. ', 'طاقم. '
  $c = $c -replace 'بأجور', 'بطاقم'
  $c = $c -replace 'لأجور ', 'لطاقم '
  $c = $c -replace 'مع أجور', 'مع طاقم'
  $c = $c -replace 'get started with Taqam', 'get started with Taqam'
  $c = $c -replace 'start with Taqam', 'start with Taqam'
  if ($c -ne $orig) {
    [System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
    return $path
  }
  return $null
}

foreach ($ext in $extensions) {
  Get-ChildItem -Path $dir -Recurse -Filter $ext -ErrorAction SilentlyContinue | ForEach-Object {
    $r = Fix-GuestPage $_.FullName
    if ($r) { $result.Add($r) | Out-Null }
  }
}
Write-Host "Fixed $($result.Count) guest pages"
