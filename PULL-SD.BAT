@echo off
setlocal EnableExtensions
title SerKal Desktop - aktuellen Entwicklungsstand starten

set "SERKAL_REPO=C:\serkal_dev\serkal_desktop"
set "SERKAL_BRANCH=serkal-0.0.5-archiv-start"

echo.
echo SerKal Desktop wird aktualisiert und gestartet.
echo.

if not exist "%SERKAL_REPO%\.git" (
  echo FEHLER: Das SerKal-Repository wurde nicht gefunden:
  echo %SERKAL_REPO%
  goto :fehler
)

where git >nul 2>&1
if errorlevel 1 (
  echo FEHLER: Git wurde nicht gefunden.
  goto :fehler
)

where npm >nul 2>&1
if errorlevel 1 (
  echo FEHLER: npm wurde nicht gefunden.
  goto :fehler
)

pushd "%SERKAL_REPO%"
if errorlevel 1 (
  echo FEHLER: Der SerKal-Ordner konnte nicht geoeffnet werden.
  goto :fehler
)

git status --porcelain
if errorlevel 1 goto :gitfehler

echo.
echo Hole den freigegebenen Entwicklungsstand von GitHub...
git fetch origin
if errorlevel 1 goto :gitfehler

git switch "%SERKAL_BRANCH%"
if errorlevel 1 goto :gitfehler

git pull --ff-only origin "%SERKAL_BRANCH%"
if errorlevel 1 goto :gitfehler

for /f %%H in ('git rev-parse --short HEAD') do set "SERKAL_COMMIT=%%H"
echo.
echo Geladener SerKal-Stand: %SERKAL_BRANCH% / %SERKAL_COMMIT%

echo.
echo Pruefe die Programmpakete...
call npm install
if errorlevel 1 goto :npmfehler

echo.
echo Beende eine noch laufende alte SerKal-Instanz...
taskkill /F /IM serkal_desktop.exe >nul 2>&1
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-CimInstance Win32_Process -Filter \"Name='electron.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*C:\serkal_dev\serkal_desktop*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul

echo.
echo Starte SerKal Desktop aus Commit %SERKAL_COMMIT%...
call npm start
set "SERKAL_EXIT=%ERRORLEVEL%"
popd
if not "%SERKAL_EXIT%"=="0" goto :startfehler
exit /b 0

:gitfehler
echo.
echo FEHLER: SerKal konnte nicht sicher aktualisiert werden.
echo Eigene oder widerspruechliche Dateien wurden nicht ueberschrieben.
goto :fehler_mit_popd

:npmfehler
echo.
echo FEHLER: Die benoetigten Programmpakete konnten nicht vorbereitet werden.
goto :fehler_mit_popd

:startfehler
echo.
echo FEHLER: SerKal wurde mit Fehlercode %SERKAL_EXIT% beendet.
goto :fehler

:fehler_mit_popd
popd

:fehler
echo.
echo Bitte dieses Fenster offenlassen und die Meldung an den CE weitergeben.
pause
exit /b 1
