@echo off
chcp 65001 >nul
cd /d "%~dp0"

if not exist ".next" (
  echo 首次运行，正在构建...
  call npm run build
)

set PORT=3100
echo.
echo   AGENT MINE  -  http://127.0.0.1:3100
echo   关闭这个窗口就会停止服务
echo.
call npm start
pause
