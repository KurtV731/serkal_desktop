@echo off
setlocal EnableExtensions EnableDelayedExpansion
title SERKAL Desktop - Build & Release

set "PROJECT=C:\serkal_dev\serkal_desktop"
set "RELEASES=C:\serkal_dev\releases"

cd /d "%PROJECT%" || (
  echo FEHLER: Projektordner nicht gefunden:
  echo %PROJECT%
  pause
  exit /b 1
)

for /f "usebackq delims=" %%V in (`node -p "require('./package.json').version"`) do set "VERSION=%%V"

if not defined VERSION (
  echo FEHLER: Versionsnummer konnte nicht aus package.json gelesen werden.
  pause
  exit /b 1
)

echo.
echo ============================================
echo SERKAL Desktop %VERSION%
echo ============================================
echo Projekt:  %PROJECT%
echo Release:  %RELEASES%\%VERSION%
echo.

if exist "%PROJECT%\out\make\squirrel.windows\x64" (
  echo Alte Squirrel-Ausgabe wird entfernt ...
  rmdir /S /Q "%PROJECT%\out\make\squirrel.windows\x64" 2>nul
  if exist "%PROJECT%\out\make\squirrel.windows\x64" (
    echo.
    echo FEHLER: Der Squirrel-Ausgabeordner ist noch gesperrt:
    echo %PROJECT%\out\make\squirrel.windows\x64
    echo.
    echo Ressourcenmonitor oeffnen: resmon
    echo CPU ^> Zugeordnete Handles ^> nach "squirrel.windows" suchen.
    echo Den dort genannten Prozess gezielt beenden und diese Datei erneut starten.
    echo.
    pause
    exit /b 2
  )
)

echo.
echo Build startet ...
call npm run make
if errorlevel 1 (
  echo.
  echo FEHLER: npm run make ist abgebrochen.
  pause
  exit /b 3
)

set "SOURCE=%PROJECT%\out\make\squirrel.windows\x64\serkal_desktop-%VERSION% Setup.exe"
set "TARGETDIR=%RELEASES%\%VERSION%"
set "TARGET=%TARGETDIR%\serkal_desktop-%VERSION% Setup.exe"

if not exist "%SOURCE%" (
  echo.
  echo FEHLER: Erwarteter Installer wurde nicht gefunden:
  echo %SOURCE%
  pause
  exit /b 4
)

if not exist "%TARGETDIR%" mkdir "%TARGETDIR%"

copy /Y "%SOURCE%" "%TARGET%" >nul
if errorlevel 1 (
  echo.
  echo FEHLER: Installer konnte nicht in den Release-Ordner kopiert werden.
  pause
  exit /b 5
)

echo.
echo ============================================
echo FERTIG
echo ============================================
echo %TARGET%
echo.
echo Der Installer wurde gebaut und archiviert.
echo.
pause
endlocal
