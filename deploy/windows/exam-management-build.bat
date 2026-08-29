@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   Script Build Nhanh Production (Windows)
echo ======================================================================
echo.

cd /d "%~dp0..\..\backend"
echo [+] 1/3 Sinh Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [LOI] Sinh Prisma Client that bai!
    pause
    exit /b 1
)

echo [+] 2/3 Build Backend (NestJS)...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Build Backend that bai!
    pause
    exit /b 1
)

cd /d "%~dp0..\..\frontend"
echo [+] 3/3 Build Frontend (Next.js Standalone)...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Build Frontend that bai!
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo   [THANH CONG] BUILD PRODUCTION TOAN BO THANH CONG!
echo ======================================================================
echo.
pause
