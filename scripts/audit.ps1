Write-Output "============= UJOOR SYSTEM AUDIT ============="
Write-Output "
1. MOCK DATA & COMPONENTS COUNT:"
Get-ChildItem -Recurse -Include "*mock*", "*dummy*" | Measure-Object | Select-Object Count | ForEach-Object { Write-Output "Found 0 mock-related files." }

Write-Output "
2. HARDCODED COLORS (Dark Mode Inconsistencies):"
 = Get-ChildItem -Path "app", "components" -Recurse -Filter "*.tsx" | Select-String "bg-white/" -AllMatches | Measure-Object | Select-Object Count
Write-Output "Found 0 files containing 'bg-white/...' instead of 'bg-background' or 'bg-card'."

Write-Output "
3. TODOs & FIXMEs:"
 = Get-ChildItem -Path "app", "components", "lib" -Recurse -Filter "*.ts", "*.tsx" | Select-String "TODO" -AllMatches | Measure-Object | Select-Object Count
Write-Output "Found 0 TODO comments in the codebase."

Write-Output "
4. MISSING TYPE DEFINITIONS (any):"
 = Get-ChildItem -Path "app", "components", "lib" -Recurse -Filter "*.ts", "*.tsx" | Select-String "\bany\b" -AllMatches | Measure-Object | Select-Object Count
Write-Output "Found 0 uses of 'any' type."

Write-Output "
5. ORPHANED PAGES OR TESTS:"
Get-ChildItem -Path "app" -Recurse -Filter "page.tsx" | Measure-Object | Select-Object Count | ForEach-Object { Write-Output "Total App Pages: 0" }

Write-Output "
6. DB AUDIT (Prisma Schema):"
If (Test-Path "prisma/schema.prisma") {
     = (Get-Content "prisma/schema.prisma" | Select-String "model " | Measure-Object | Select-Object Count -ExpandProperty Count)
    Write-Output "Prisma Schema has  models."
} Else {
    Write-Output "No Prisma schema found."
}
