# ======================================================================
#   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
#   Script Cai Dat Tu Dong Cho Windows (PowerShell)
# ======================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\..\.."
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  HE THONG QUAN LY KHAO THI - SETUP & BUILD (WINDOWS POWERSHELL)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiem tra Node.js
try {
    $nodeVer = node -v
    Write-Host "[+] Tim thay Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[LOI] Khong tim thay Node.js tren he thong!" -ForegroundColor Red
    Write-Host "Vui long cai dat Node.js LTS (18+ hoac 20+) tu https://nodejs.org/" -ForegroundColor Yellow
    Exit 1
}

# 2. Tao file .env neu chua co
Write-Host "[+] Kiem tra file cau hinh .env..." -ForegroundColor Yellow
if (-not (Test-Path "$RootDir\.env")) {
    if (Test-Path "$RootDir\.env.example") {
        Copy-Item "$RootDir\.env.example" "$RootDir\.env"
        Write-Host "[OK] Da tao .env tu .env.example" -ForegroundColor Green
    }
} else {
    Write-Host "[OK] File .env da ton tai." -ForegroundColor Green
}

if (-not (Test-Path "$RootDir\frontend\.env.local")) {
    if (Test-Path "$RootDir\frontend\.env.example") {
        Copy-Item "$RootDir\frontend\.env.example" "$RootDir\frontend\.env.local"
        Write-Host "[OK] Da tao frontend/.env.local" -ForegroundColor Green
    }
}

# 3. Cai dat Root & Backend
Write-Host "`n[+] Dang cai dat thu vien Root..." -ForegroundColor Cyan
Set-Location $RootDir
npm install

Write-Host "`n[+] Dang cai dat thu vien Backend (NestJS, Prisma)..." -ForegroundColor Cyan
Set-Location "$RootDir\backend"
npm install --legacy-peer-deps

Write-Host "[+] Dang sinh Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# 4. Cai dat Frontend
Write-Host "`n[+] Dang cai dat thu vien Frontend (Next.js)..." -ForegroundColor Cyan
Set-Location "$RootDir\frontend"
npm install --legacy-peer-deps

# 5. Build
Write-Host "`n[+] Dang Build Production toan bo he thong..." -ForegroundColor Cyan
Set-Location $RootDir
npm run build

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "  [THANH CONG] CAI DAT VA BUILD HE THONG HOAN TAT!" -ForegroundColor Green
Write-Host "  - Chay he thong: .\deploy\windows\exam-management-start.bat" -ForegroundColor Yellow
Write-Host "  - Backend API:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "  - Frontend Web: http://localhost:3000" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green
