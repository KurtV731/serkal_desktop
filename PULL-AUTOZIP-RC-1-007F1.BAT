@echo off
setlocal EnableExtensions
set "PROJECT=C:\serkal_dev\serkal_desktop"
set "PUBLISH=C:\serkal-pages\up\download"
set "PUBLIC_NAME=serkal-desktop-1.007f1-prerelease-setup.exe"
set "BRANCH=installer-1.007f1"
set "REQUIRED_BASE=5185529b19251cc607733cab9bd8fba0cd33ea54"

cd /d "%PROJECT%"
if errorlevel 1 goto :error_project

echo.
echo === SerKal Desktop 1.007f1 Testkandidat aktualisieren ===
git switch "%BRANCH%"
if errorlevel 1 goto :error_branch
git pull --ff-only
if errorlevel 1 goto :error_git

git merge-base --is-ancestor "%REQUIRED_BASE%" HEAD
if errorlevel 1 goto :error_commit

for /f "delims=" %%H in ('git rev-parse --short HEAD') do set "BUILD_COMMIT=%%H"
echo Verwendeter Quellstand: %BUILD_COMMIT%

echo.
echo === Version pruefen ===
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "(Get-Content -Raw -LiteralPath 'package.json' | ConvertFrom-Json).version"`) do set "PACKAGE_VERSION=%%V"
if not "%PACKAGE_VERSION%"=="1.0.7-f1" goto :error_version

echo.
echo === Abhaengigkeiten pruefen ===
call npm install
if errorlevel 1 goto :error_npm

echo.
echo === Automatische Tests ausfuehren ===
call npm test
if errorlevel 1 goto :error_tests

echo.
echo === Alten Build entfernen ===
if exist "out" rmdir /s /q "out"

echo.
echo === SerKal Desktop bauen ===
call npm run make
if errorlevel 1 goto :error_make

echo.
echo === Squirrel-Setup suchen ===
set "SETUP=%PROJECT%\out\make\squirrel.windows\x64\SerKal_1.007f1_Setup.exe"
if not exist "%SETUP%" goto :error_setup
echo Gefunden:
echo "%SETUP%"

echo.
echo === Publish-Ziel pruefen ===
if not exist "%PUBLISH%" goto :error_publish

set "CANDIDATE=%PUBLISH%\%PUBLIC_NAME%.neu"
if exist "%CANDIDATE%" del /f /q "%CANDIDATE%"

echo.
echo === Zweisprachigen Ein-Datei-Installer bauen ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROJECT%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SETUP%" -OutputPath "%CANDIDATE%" -IconPath "%PROJECT%\4 assets\icon\serkal.ico"
if errorlevel 1 goto :error_wrapper
if not exist "%CANDIDATE%" goto :error_wrapper

for %%S in ("%SETUP%") do set "SETUP_SIZE=%%~zS"
for %%C in ("%CANDIDATE%") do set "CANDIDATE_SIZE=%%~zC"
powershell -NoProfile -Command "if ([int64]'%CANDIDATE_SIZE%' -le [int64]'%SETUP_SIZE%') { exit 1 }"
if errorlevel 1 goto :error_wrapper

echo.
echo === Geprueften Release Candidate bereitstellen ===
move /y "%CANDIDATE%" "%PUBLISH%\%PUBLIC_NAME%" >nul
if errorlevel 1 goto :error_copy

echo.
echo ==========================================
echo RELEASE CANDIDATE FERTIG
echo Version: 1.007f1
echo Commit:  %BUILD_COMMIT%
echo Datei:
echo "%PUBLISH%\%PUBLIC_NAME%"
echo NOCH NICHT OEFFENTLICH VEROEFFENTLICHEN
echo ==========================================
echo.
echo Der Release Candidate wird jetzt fuer den Windows-Test gestartet.
start "" "%PUBLISH%\%PUBLIC_NAME%"
pause
exit /b 0

:error_project
echo FEHLER: Projektordner nicht gefunden:
echo "%PROJECT%"
goto :error
:error_branch
echo FEHLER: Der SerKal-Fachbranch konnte nicht aktiviert werden.
goto :error
:error_git
echo FEHLER: git pull --ff-only ist fehlgeschlagen.
goto :error
:error_commit
echo FEHLER: Der Quellstand enthaelt den erforderlichen CE-Commit %REQUIRED_BASE% nicht.
goto :error
:error_version
echo FEHLER: Erwartet wird package.json-Version 1.0.7-f1, gefunden wurde "%PACKAGE_VERSION%".
goto :error
:error_npm
echo FEHLER: npm install ist fehlgeschlagen.
goto :error
:error_tests
echo FEHLER: Die automatischen DE/EN- und Smoke-Tests sind fehlgeschlagen.
echo Es wird kein Installer gebaut.
goto :error
:error_make
echo FEHLER: npm run make ist fehlgeschlagen.
echo Die vorhandene Publish-Datei bleibt unveraendert.
goto :error
:error_setup
echo FEHLER: Build beendet, aber SerKal_1.007f1_Setup.exe wurde nicht gefunden.
echo Die vorhandene Publish-Datei bleibt unveraendert.
goto :error
:error_publish
echo FEHLER: Publish-Ziel existiert nicht:
echo "%PUBLISH%"
goto :error
:error_wrapper
if exist "%CANDIDATE%" del /f /q "%CANDIDATE%"
echo FEHLER: Die zweisprachige SerKal-Installer-EXE konnte nicht sicher gebaut werden.
echo Die vorhandene Publish-Datei bleibt unveraendert.
goto :error
:error_copy
if exist "%CANDIDATE%" del /f /q "%CANDIDATE%"
echo FEHLER: Der Release Candidate konnte nicht ins Publish-Ziel uebernommen werden.
goto :error
:error
echo.
pause
exit /b 1
