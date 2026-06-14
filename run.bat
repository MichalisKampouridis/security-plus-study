@echo off
cd /d "%~dp0"

python --version >nul 2>&1
if errorlevel 1 (
  powershell -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Python 3 is required. Download it from https://www.python.org/ and check Add Python to PATH during installation.', 'Security+ Study App')"
  exit /b 1
)

set PORT=8080
set "SCRIPT_DIR=%~dp0"

:: Start Python server silently in background via VBScript
echo python -m http.server %PORT% > "%TEMP%\start_server.bat"
wscript.exe "%SCRIPT_DIR%launch.vbs" "%TEMP%\start_server.bat"

:: Wait 1.5 seconds then open browser
timeout /t 2 >nul
start "" "http://localhost:%PORT%"
