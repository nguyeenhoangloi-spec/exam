@echo off
chcp 65001 > nul

echo ======================================================================
echo   HE THONG QUAN LY KHAO THI (EXAM MANAGEMENT SYSTEM)
echo   Dung va Don Dep Docker Containers (Windows)
echo ======================================================================
echo.

cd /d "%~dp0..\.."
docker compose down

echo.
echo [+] Da dung tat ca container.
echo.
pause
