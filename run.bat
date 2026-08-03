@echo off
title He thong Quan ly Khao thi Sinh vien
echo =========================================================================
echo       DANG KHOI DONG HE THONG QUAN LY KHAO THI SINH VIEN (FULL-STACK)
echo =========================================================================
echo  Backend NestJS API:  http://localhost:3001
echo  Frontend Next.js:    http://localhost:3000
echo =========================================================================
echo.

set PATH=%PATH%;C:\Program Files\nodejs

rem Wait 3 seconds then open browser automatically
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

npm run dev
pause
