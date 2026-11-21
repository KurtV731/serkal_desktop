@echo off
setlocal
title SerKal Desktop - Wartungstest
set "SERKAL_WARTUNG_ALT=%LOCALAPPDATA%\SerKal-Wartungstest"
set "SERKAL_WARTUNG_DIR=%LOCALAPPDATA%\SerKal-Wartungstest-Start"
set "SERKAL_WARTUNG_BRANCH=ce-desktop-wartung-1-2-7"
set "SERKAL_WARTUNG_ELECTRON=node_modules\electron\dist\electron.exe"

where git >nul 2>&1
if errorlevel 1 goto missing
where npm >nul 2>&1
if errorlevel 1 goto missing

rem Check only Electron from the two dedicated test directories.
powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference='Stop'; $paths=@((Join-Path $env:SERKAL_WARTUNG_ALT $env:SERKAL_WARTUNG_ELECTRON),(Join-Path $env:SERKAL_WARTUNG_DIR $env:SERKAL_WARTUNG_ELECTRON)); $running=Get-Process -Name electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -in $paths }; if ($running) { exit 10 }; exit 0"
if errorlevel 11 goto failed
if errorlevel 10 goto running
if errorlevel 1 goto failed

if not exist "%SERKAL_WARTUNG_DIR%\.git" (
    git clone --depth 1 --single-branch --branch "%SERKAL_WARTUNG_BRANCH%" https://github.com/KurtV731/serkal_desktop.git "%SERKAL_WARTUNG_DIR%"
    if errorlevel 1 goto failed
)
pushd "%SERKAL_WARTUNG_DIR%" || goto failed
git pull --ff-only origin "%SERKAL_WARTUNG_BRANCH%"
if errorlevel 1 goto failed

set "SERKAL_WARTUNG_DEPS="
for /f %%H in ('git hash-object package-lock.json') do set "SERKAL_WARTUNG_DEPS=%%H"
if not defined SERKAL_WARTUNG_DEPS goto failed
set "SERKAL_WARTUNG_INSTALLED="
if exist "node_modules\.serkal-wartung-lock" set /p SERKAL_WARTUNG_INSTALLED=<"node_modules\.serkal-wartung-lock"
if not exist "%SERKAL_WARTUNG_ELECTRON%" goto install
if "%SERKAL_WARTUNG_DEPS%"=="%SERKAL_WARTUNG_INSTALLED%" goto launch

:install
call npm ci --no-audit --no-fund
if errorlevel 1 goto failed
if not exist "%SERKAL_WARTUNG_ELECTRON%" goto failed
>"node_modules\.serkal-wartung-lock" echo %SERKAL_WARTUNG_DEPS%

:launch
start "" /wait "%SERKAL_WARTUNG_ELECTRON%" "%CD%"
if errorlevel 1 goto failed
popd
exit /b 0

:running
echo Der SerKal-Wartungstest laeuft noch. Bitte SerKal normal beenden und diesen Starter erneut anklicken.
pause
exit /b 1

:missing
echo Fuer diesen Start werden Git und Node.js mit npm benoetigt.
pause
exit /b 1

:failed
echo Der Wartungstest konnte nicht starten. Bitte dieses Fenster fuer die Fehlermeldung offen lassen.
pause
exit /b 1
