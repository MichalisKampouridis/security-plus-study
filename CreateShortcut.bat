@echo off
set SCRIPT_DIR=%~dp0
set SHORTCUT_PATH=%USERPROFILE%\Desktop\Security+ Study App.lnk
set TARGET=%SCRIPT_DIR%run.bat

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.IconLocation = 'shell32.dll,47'; $s.Description = 'Launch Security+ SY0-701 Study App'; $s.Save()"

echo Shortcut created on Desktop: "Security+ Study App"
pause
