@echo off
title K-Apply Next.js Dashboard
echo ==============================================
echo   Starting K-Apply Next.js + MongoDB Dashboard
echo ==============================================
echo.
cd /d "%~dp0web-dashboard"
echo Starting development server on http://localhost:3000 ...
call npm.cmd run dev
pause
