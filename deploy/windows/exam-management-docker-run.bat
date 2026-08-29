@echo off
chcp 65001 > nul

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   Khoi Dong Bang Docker Compose (Windows)
echo ======================================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Docker! Vui long cai dat Docker Desktop tu https://www.docker.com/
    pause
    exit /b 1
)

cd /d "%~dp0..\.."

echo [+] Dang build va khoi chay cac container (db, backend, frontend)...
docker compose up --build -d

if %errorlevel% neq 0 (
    echo [LOI] Khoi chay Docker that bai!
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo   [THANH CONG] CAC CONTAINER DANG CHAY NGAM!
echo.
echo   - Frontend Web: http://localhost:3000
echo   - Backend API:  http://localhost:3001
echo   - Postgres DB:  localhost:5432
echo.
echo   - Xem logs:     docker compose logs -f
echo   - Dung he thong: docker compose down
echo ======================================================================
echo.
pause
