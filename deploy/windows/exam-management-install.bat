@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   Script Cai Dat Tu Dong Cho Windows (Auto Installer)
echo ======================================================================
echo.

:: 1. Kiem tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren he thong!
    echo Vui long cai dat Node.js LTS tu https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo [+] Da tim thay Node.js: %NODE_VER%

:: 2. Kiem tra NPM
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay NPM!
    pause
    exit /b 1
)

:: 3. Khoi tao file cau hinh .env neu chua co
echo.
echo [+] Dang kiem tra file cau hinh moi truong .env...
if not exist "%~dp0..\..\.env" (
    if exist "%~dp0..\..\.env.example" (
        copy "%~dp0..\..\.env.example" "%~dp0..\..\.env" >nul
        echo [OK] Da tao file .env tu .env.example. Vui long cap nhat DATABASE_URL neu can thiet.
    )
) else (
    echo [OK] File .env da ton tai.
)

if not exist "%~dp0..\..\frontend\.env.local" (
    if exist "%~dp0..\..\frontend\.env.example" (
        copy "%~dp0..\..\frontend\.env.example" "%~dp0..\..\frontend\.env.local" >nul
        echo [OK] Da tao frontend/.env.local
    )
)

:: 4. Cai dat dependencies goc va backend
echo.
echo ======================================================================
echo [+] Dang cai dat dependencies cho Root va Backend...
echo ======================================================================
cd /d "%~dp0..\.."

call npm install
if %errorlevel% neq 0 (
    echo [CANH BAO] Cai dat root packages co canh bao, tiep tuc...
)

cd /d "%~dp0..\..\backend"
echo [+] Dang cai dat thu vien Backend: NestJS, Prisma...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [LOI] Khong the cai dat thu vien cho Backend!
    pause
    exit /b 1
)

echo [+] Dang sinh Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [LOI] Sinh Prisma Client that bai!
    pause
    exit /b 1
)

:: 5. Cai dat dependencies frontend
echo.
echo ======================================================================
echo [+] Dang cai dat dependencies cho Frontend: Next.js...
echo ======================================================================
cd /d "%~dp0..\..\frontend"
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [LOI] Khong the cai dat thu vien cho Frontend!
    pause
    exit /b 1
)

:: 6. Build he thong
echo.
echo ======================================================================
echo [+] Dang tien hanh Build Production cho toan bo he thong...
echo ======================================================================
cd /d "%~dp0..\.."
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Qua trinh build that bai! Vui long kiem tra log o tren.
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo   [THANH CONG] CAI DAT VA BUILD HE THONG HOAN TAT!
echo.
echo   - De chay he thong, hay chay: deploy\windows\exam-management-start.bat
echo   - Hoac mo cmd tai thu muc goc va go: npm start
echo   - Backend API: http://localhost:3001
echo   - Frontend Web: http://localhost:3000
echo ======================================================================
echo.
pause
