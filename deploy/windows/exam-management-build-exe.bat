@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   Script Dong Goi Native Desktop App (.EXE Installer) Cho Windows
echo ======================================================================
echo.

cd /d "%~dp0..\.."

:: 1. Build toan bo backend va frontend
echo [+] 1/3 Dang bien dich Backend va Frontend...
call npm run package:release
if %errorlevel% neq 0 (
    echo [LOI] Bien dich that bai!
    pause
    exit /b 1
)

:: 2. Cai dat dependencies desktop
echo.
echo [+] 2/3 Dang kiem tra dependencies cho Electron Desktop...
cd /d "%~dp0..\..\desktop"
if not exist "node_modules" (
    call npm install
    if %errorlevel% neq 0 (
        echo [LOI] Cai dat dependencies Electron that bai!
        pause
        exit /b 1
    )
)

:: 3. Dong goi thanh file .exe
echo.
echo ======================================================================
echo [+] 3/3 Dang dong goi thanh file Cai Dat (.EXE Setup) va Portable...
echo ======================================================================
call npm run dist:win

if %errorlevel% neq 0 (
    echo [LOI] Qua trinh dong goi .exe that bai!
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo   [THANH CONG] FILE CAI DAT DESKTOP APP DA DUOC TAO TAI:
echo   release-app\ExamManagement-Setup-1.0.0.exe
echo   release-app\ExamManagement-1.0.0.exe (Ban Portable chay ngay)
echo ======================================================================
echo.
pause
