@echo off
setlocal EnableExtensions
set "SOURCE=C:\serkal_dev\serkal_desktop"
set "BUILD=C:\serkal_dev\serkal_desktop_build_10007f1"
set "PUBLISH=C:\serkal-pages\up\download"
set "REMOTE_BRANCH=installer-1.007f1"
set "REQUIRED_CE=5185529b19251cc607733cab9bd8fba0cd33ea54"
set "REQUIRED_INSTALLER=6880a677a2bdac220f5dc49b3b9179c6a9ba2e6f"
set "SOURCE_ICON=%SOURCE%\4 assets\icon\serkal.ico"
set "BUILD_ICON=%BUILD%\4 assets\icon\serkal.ico"
set "SETUP=%BUILD%\out\make\squirrel.windows\x64\SerKal_1.007f1_Setup.exe"
set "FINAL=%PUBLISH%\serkal-desktop-1.007f1-prerelease-setup.exe"
set "CANDIDATE=%FINAL%.neu"

if not exist "%SOURCE%\.git" goto :error_project
if not exist "%SOURCE_ICON%" goto :error_icon_missing
if exist "%BUILD%" goto :error_build_exists
if exist "%FINAL%" goto :error_final_exists

echo.
echo === Lokales SerKal-Symbol pruefen ===
powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes('%SOURCE_ICON%'); if($b.Length -lt 6 -or $b[0] -ne 0 -or $b[1] -ne 0 -or $b[2] -ne 1 -or $b[3] -ne 0) { exit 1 }"
if errorlevel 1 goto :error_icon_invalid
echo Gueltiges Windows-ICO gefunden.

echo.
echo === Freigegebenen 1.007f1-Stand von GitHub holen ===
git -C "%SOURCE%" fetch origin "%REMOTE_BRANCH%"
if errorlevel 1 goto :error_git
git -C "%SOURCE%" merge-base --is-ancestor "%REQUIRED_CE%" "origin/%REMOTE_BRANCH%"
if errorlevel 1 goto :error_ce_commit
git -C "%SOURCE%" merge-base --is-ancestor "%REQUIRED_INSTALLER%" "origin/%REMOTE_BRANCH%"
if errorlevel 1 goto :error_installer_commit

echo.
echo === Sauberen getrennten Bauordner fuer 1.007f1 anlegen ===
git -C "%SOURCE%" worktree add --detach "%BUILD%" "%REQUIRED_INSTALLER%"
if errorlevel 1 goto :error_worktree

echo.
echo === Gueltiges SerKal-Symbol in den Bauordner uebernehmen ===
copy /y "%SOURCE_ICON%" "%BUILD_ICON%" >nul
if errorlevel 1 goto :error_icon_copy

cd /d "%BUILD%"
if errorlevel 1 goto :error_worktree

echo.
echo === Version und Abhaengigkeiten pruefen ===
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "(Get-Content -Raw -LiteralPath 'package.json' | ConvertFrom-Json).version"`) do set "PACKAGE_VERSION=%%V"
if not "%PACKAGE_VERSION%"=="1.0.7-f1" goto :error_version
call npm install
if errorlevel 1 goto :error_npm

echo.
echo === Automatische Tests ausfuehren ===
call npm test
if errorlevel 1 goto :error_tests

echo.
echo === SerKal Desktop 1.007f1 bauen ===
call npm run make
if errorlevel 1 goto :error_make
if not exist "%SETUP%" goto :error_setup
if not exist "%PUBLISH%" goto :error_publish
if exist "%CANDIDATE%" del /f /q "%CANDIDATE%"

echo.
echo === Zweisprachigen Ein-Datei-Installer bauen ===
powershell -NoProfile -ExecutionPolicy Bypass -File "%BUILD%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SETUP%" -OutputPath "%CANDIDATE%" -IconPath "%BUILD_ICON%"
if errorlevel 1 goto :error_wrapper
if not exist "%CANDIDATE%" goto :error_wrapper
for %%S in ("%SETUP%") do set "SETUP_SIZE=%%~zS"
for %%C in ("%CANDIDATE%") do set "CANDIDATE_SIZE=%%~zC"
powershell -NoProfile -Command "if ([int64]'%CANDIDATE_SIZE%' -le [int64]'%SETUP_SIZE%') { exit 1 }"
if errorlevel 1 goto :error_wrapper
move /y "%CANDIDATE%" "%FINAL%" >nul
if errorlevel 1 goto :error_copy

echo.
echo ==========================================
echo TESTKANDIDAT 1.007f1 FERTIG
echo Technische Version: 1.0.7-f1
echo CE-Commit:          %REQUIRED_CE%
echo Installer-Commit:   %REQUIRED_INSTALLER%
echo Datei:
echo "%FINAL%"
echo DIE OEFFENTLICHE VERSION WURDE NICHT VERAENDERT
echo NICHT OEFFENTLICH VEROEFFENTLICHEN
echo ==========================================
echo.
echo Der Test-Installer wird jetzt gestartet.
start "" "%FINAL%"
pause
exit /b 0

:error_project
echo FEHLER: SerKal-Projekt nicht gefunden: "%SOURCE%"
goto :error
:error_icon_missing
echo FEHLER: Das lokale SerKal-Icon wurde nicht gefunden: "%SOURCE_ICON%"
goto :error
:error_icon_invalid
echo FEHLER: Das lokale serkal.ico ist keine gueltige Windows-ICO-Datei.
goto :error
:error_build_exists
echo FEHLER: Der getrennte Bauordner existiert bereits: "%BUILD%"
echo Es wurde nichts geloescht oder ueberschrieben.
goto :error
:error_final_exists
echo FEHLER: Der 1.007f1-Test-Installer existiert bereits: "%FINAL%"
echo Es wurde nichts ueberschrieben.
goto :error
:error_git
echo FEHLER: Der freigegebene GitHub-Stand konnte nicht geholt werden.
goto :error
:error_ce_commit
echo FEHLER: Der erforderliche CE-Commit %REQUIRED_CE% fehlt.
goto :error
:error_installer_commit
echo FEHLER: Der gepruefte Installer-Commit %REQUIRED_INSTALLER% fehlt.
goto :error
:error_worktree
echo FEHLER: Der getrennte Bauordner konnte nicht angelegt werden.
goto :error
:error_icon_copy
echo FEHLER: Das gepruefte Icon konnte nicht in den Bauordner kopiert werden.
goto :error
:error_version
echo FEHLER: Erwartet wurde Version 1.0.7-f1, gefunden wurde "%PACKAGE_VERSION%".
goto :error
:error_npm
echo FEHLER: npm install ist fehlgeschlagen.
goto :error
:error_tests
echo FEHLER: Die automatischen Tests sind fehlgeschlagen. Kein Installer wurde gebaut.
goto :error
:error_make
echo FEHLER: npm run make ist fehlgeschlagen. Vorhandene Download-Dateien bleiben unveraendert.
goto :error
:error_setup
echo FEHLER: SerKal_1.007f1_Setup.exe wurde nicht gefunden.
goto :error
:error_publish
echo FEHLER: Publish-Ordner nicht gefunden: "%PUBLISH%"
goto :error
:error_wrapper
if exist "%CANDIDATE%" del /f /q "%CANDIDATE%"
echo FEHLER: Der zweisprachige Ein-Datei-Installer konnte nicht gebaut werden.
goto :error
:error_copy
if exist "%CANDIDATE%" del /f /q "%CANDIDATE%"
echo FEHLER: Der Testkandidat konnte nicht bereitgestellt werden.
goto :error
:error
echo.
pause
exit /b 1
