@echo off
REM Security+ SY0-701 Study App launcher (Windows)
cd /d "%~dp0"

set PORT=8080
set URL=http://localhost:%PORT%

echo Starting Security+ Study App on %URL% ...

REM Open the browser shortly after the server starts
start "" cmd /c "timeout /t 1 >nul & start %URL%"

REM Prefer python, fall back to py launcher
where python >nul 2>nul
if %ERRORLEVEL%==0 (
    python -m http.server %PORT%
    goto :eof
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
    py -m http.server %PORT%
    goto :eof
)

echo Python 3 is required but was not found. Install it from https://www.python.org/
pause
