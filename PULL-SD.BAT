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

for /f %%B in ('git branch --show-current') do set "AKTUELLER_BRANCH=%%B"
if /I not "%AKTUELLER_BRANCH%"=="%SERKAL_BRANCH%" (
  echo.
  echo Wechsle auf den aktuellen SerKal-Stand...
  git switch "%SERKAL_BRANCH%"
  if errorlevel 1 goto :gitfehler
)

echo.
echo Hole den aktuellen SerKal-Stand...
git pull --ff-only
if errorlevel 1 goto :gitfehler

echo.
echo Pruefe die Programmpakete...
call npm install
if errorlevel 1 goto :npmfehler

echo.
echo Starte SerKal Desktop...
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
