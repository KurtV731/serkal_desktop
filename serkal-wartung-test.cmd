@echo off
setlocal
title SerKal Desktop - Wartungstest
set "SERKAL_WARTUNG_DIR=%LOCALAPPDATA%\SerKal-Wartungstest"
set "SERKAL_WARTUNG_BRANCH=ce-desktop-wartung-1-2-7"
where git >nul 2>&1
if errorlevel 1 goto missing
where npm >nul 2>&1
if errorlevel 1 goto missing
if not exist "%SERKAL_WARTUNG_DIR%\.git" (
    git clone --depth 1 --single-branch --branch "%SERKAL_WARTUNG_BRANCH%" https://github.com/KurtV731/serkal_desktop.git "%SERKAL_WARTUNG_DIR%"
    if errorlevel 1 goto failed
)
pushd "%SERKAL_WARTUNG_DIR%" || goto failed
git pull --ff-only origin "%SERKAL_WARTUNG_BRANCH%"
if errorlevel 1 goto failed
call npm ci --no-audit --no-fund
if errorlevel 1 goto failed
call "%SERKAL_WARTUNG_DIR%\node_modules\.bin\electron.cmd" .
if errorlevel 1 goto failed
popd
exit /b 0

:missing
echo Fuer diesen Start werden Git und Node.js mit npm benoetigt.
pause
exit /b 1

:failed
echo Der Wartungstest konnte nicht starten. Bitte dieses Fenster fuer die Fehlermeldung offen lassen.
pause
exit /b 1
