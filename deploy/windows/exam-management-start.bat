@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   Khoi Dong He Thong Production Mode (Windows)
echo ======================================================================
echo.

cd /d "%~dp0..\.."

if not exist "backend\dist\src\main.js" (
    echo [CANH BAO] Chua thay ban build Backend! Dang chay build tu dong...
    call "%~dp0exam-management-build.bat"
)

if not exist "frontend\.next" (
    echo [CANH BAO] Chua thay ban build Frontend! Dang chay build tu dong...
    call "%~dp0exam-management-build.bat"
)

echo [+] Dang khoi dong Backend API tai cong 3001...
echo [+] Dang khoi dong Frontend Web tai cong 3000...
echo.
echo ======================================================================
echo   Truy cap he thong tai:
echo   - Frontend Web: http://localhost:3000
echo   - Backend API:  http://localhost:3001
echo   (Nhan Ctrl + C de dung he thong)
echo ======================================================================
echo.

call npm run start
pause
