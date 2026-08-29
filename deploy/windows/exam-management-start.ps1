# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Khoi Dong He Thong Production Mode (PowerShell)
# ======================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$RootDir = Resolve-Path "$PSScriptRoot\..\.."

Set-Location $RootDir

if (-not (Test-Path "$RootDir\backend\dist\src\main.js") -or -not (Test-Path "$RootDir\frontend\.next")) {
    Write-Host "[CANH BAO] Chua phat hien ban build. Dang tu dong chay build..." -ForegroundColor Yellow
    & "$PSScriptRoot\exam-management-build.bat"
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  DANG KHOI DONG HE THONG QUAN LY KHAO THI (PRODUCTION)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  - Frontend Web: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Backend API:  http://localhost:3001" -ForegroundColor Green
Write-Host "  (Nhan Ctrl + C de dung he thong)`n" -ForegroundColor Yellow

npm run start
