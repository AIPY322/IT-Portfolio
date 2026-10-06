@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py server.py
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  python server.py
  exit /b
)
echo.
echo Python was not found on this computer.
echo Install Python 3 from https://www.python.org/downloads/
echo During setup, check "Add python.exe to PATH".
echo.
pause
