@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   1-Click All-in-One Desktop App Launcher (Windows)
echo ======================================================================
echo.

cd /d "%~dp0..\.."

:: 1. Kiem tra neu chua build thi tu dong chay cai dat & build
if not exist "backend\dist\src\main.js" (
    echo [+] Phat hien he thong chua duoc build. Dang tu dong cai dat va bien dich...
    call "%~dp0exam-management-install.bat"
    if %errorlevel% neq 0 (
        echo [LOI] Khong the khoi tao he thong!
        pause
        exit /b 1
    )
)

if not exist "frontend\.next" (
    echo [+] Dang bien dich Frontend...
    call "%~dp0exam-management-build.bat"
)

:: 2. Tu dong mo 1 cua so App duy nhat sau 3 giay bang PowerShell an toan
start /b "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; if (Get-Command msedge -ErrorAction SilentlyContinue) { Start-Process msedge -ArgumentList '--app=http://localhost:3000' } elseif (Get-Command chrome -ErrorAction SilentlyContinue) { Start-Process chrome -ArgumentList '--app=http://localhost:3000' } else { Start-Process 'http://localhost:3000' }"

:: 3. Khoi dong Backend & Frontend
echo [+] Dang khoi chay may chu Backend (Port 3001) va Frontend (Port 3000)...
echo [+] Cua so Ung dung Desktop se tu dong mo len trong giay lat...
echo.
echo ======================================================================
echo   UNG DUNG EXAM MANAGEMENT DANG HOAT DONG!
echo   - Giao dien Web/App: http://localhost:3000
echo   - API Backend:       http://localhost:3001
echo.
echo   (Nhan Ctrl + C hoac Dong cua so nay de tat toan bo he thong)
echo ======================================================================
echo.

call npm run start
pause
