@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Desktop 1.007f2 - Icon reparieren und Bau fortsetzen

set "SERKAL_COMMIT=ea35d2394d8ddc6e78f14e526238cd6fd66e3010"
set "SERKAL_SOURCE=C:\serkal_dev\serkal_desktop"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\1.007f2"
set "SERKAL_SOURCE_ICON=%SERKAL_SOURCE%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"
set "SERKAL_SETUP=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\SerKal_1.007f2_Setup.exe"
set "SERKAL_DEST_DIR=C:\ppd\serkal\testinstallationen\1.007f2"
set "SERKAL_DEST_EXE=%SERKAL_DEST_DIR%\1.007f2-SerKal-Desktop-Testinstallation.exe"
set "SERKAL_CANDIDATE=%SERKAL_DEST_EXE%.neu"
set "SERKAL_DEST_SHA=%SERKAL_DEST_EXE%.sha256"

if not defined SERKAL_GOOGLE_OAUTH_FILE set "SERKAL_GOOGLE_OAUTH_FILE=C:\serkal_dev\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Desktop 1.007f2 - ICON-REPARATUR UND WEITERBAU
echo ============================================================
echo.

if not exist "%SERKAL_BUILD_DIR%\package.json" goto :missing_build
if not exist "%SERKAL_SOURCE_ICON%" goto :missing_icon
if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_DEST_EXE%" goto :target_exists
if exist "%SERKAL_DEST_SHA%" goto :target_exists
if exist "%SERKAL_CANDIDATE%" del /f /q "%SERKAL_CANDIDATE%"

echo [1/9] Freigegebenen Quellstand kontrollieren ...
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [2/9] Nachweislich gueltiges lokales SerKal-Symbol pruefen ...
powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes($env:SERKAL_SOURCE_ICON); if($b.Length -lt 6 -or $b[0] -ne 0 -or $b[1] -ne 0 -or $b[2] -ne 1 -or $b[3] -ne 0){exit 1}" || goto :invalid_icon
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed

echo [3/9] Fehlgeschlagene erzeugte Buildausgabe entfernen ...
if exist "%SERKAL_BUILD_DIR%\out" rmdir /s /q "%SERKAL_BUILD_DIR%\out" || goto :failed

echo [4/9] Tests mit privater OAuth-Grunddatei wiederholen ...
call npm test || goto :failed

echo [5/9] Windows-Paket mit gueltigem Symbol neu bauen ...
call npm run make || goto :failed
if not exist "%SERKAL_SETUP%" goto :missing_setup

echo [6/9] Eingebettete OAuth-Ressource und persoenliche Token pruefen ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [7/9] Zweisprachige Testinstallation erzeugen ...
if not exist "%SERKAL_DEST_DIR%" mkdir "%SERKAL_DEST_DIR%" || goto :failed
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERKAL_BUILD_DIR%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SERKAL_SETUP%" -OutputPath "%SERKAL_CANDIDATE%" -IconPath "%SERKAL_BUILD_ICON%" || goto :failed
if not exist "%SERKAL_CANDIDATE%" goto :failed
for %%S in ("%SERKAL_SETUP%") do set "SERKAL_SETUP_SIZE=%%~zS"
for %%C in ("%SERKAL_CANDIDATE%") do set "SERKAL_CANDIDATE_SIZE=%%~zC"
powershell -NoProfile -Command "if([int64]$env:SERKAL_CANDIDATE_SIZE -le [int64]$env:SERKAL_SETUP_SIZE){exit 1}" || goto :failed
move /y "%SERKAL_CANDIDATE%" "%SERKAL_DEST_EXE%" >nul || goto :failed

echo [8/9] SHA-256 erzeugen und kontrollieren ...
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower(); Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DEST_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DEST_EXE))" || goto :failed
powershell -NoProfile -Command "$line=(Get-Content -Raw -LiteralPath $env:SERKAL_DEST_SHA).Trim(); $expected=($line -split '\s+')[0]; $actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower(); if($expected -ne $actual){exit 1}" || goto :failed

echo [9/9] Fertigen nicht oeffentlichen Testinstaller starten ...
echo.
echo ============================================================
echo  SERKAL DESKTOP 1.007f2 IST FERTIG UND GEPRUEFT
echo ============================================================
echo %SERKAL_DEST_EXE%
echo %SERKAL_DEST_SHA%
echo.
pause
start "" /wait "%SERKAL_DEST_EXE%"
echo.
echo Installation beendet. Bitte pruefen: SERKAL Desktop 1.007f2
pause
exit /b 0

:missing_build
echo FEHLER: Der vorhandene f2-Bauordner wurde nicht gefunden:
echo %SERKAL_BUILD_DIR%
goto :stop
:missing_icon
echo FEHLER: Das bewaehrte lokale SerKal-Symbol fehlt:
echo %SERKAL_SOURCE_ICON%
goto :stop
:invalid_icon
echo FEHLER: Das lokale SerKal-Symbol ist keine gueltige Windows-ICO-Datei.
goto :stop
:missing_oauth
echo FEHLER: Die private OAuth-Grunddatei fehlt:
echo %SERKAL_GOOGLE_OAUTH_FILE%
goto :stop
:target_exists
echo FEHLER: Im Zielordner liegt bereits ein f2-Artefakt. Nichts wurde ueberschrieben.
echo %SERKAL_DEST_DIR%
goto :stop
:wrong_commit
echo FEHLER: Der vorhandene Bauordner enthaelt nicht den freigegebenen CE-Commit.
goto :stop
:missing_setup
echo FEHLER: Der erwartete Squirrel-Installer wurde nicht erzeugt.
goto :stop
:missing_packaged_oauth
echo FEHLER: resources\google_oauth_client.json fehlt im Programmpaket.
goto :stop
:oauth_mismatch
echo FEHLER: Die eingepackte OAuth-Datei stimmt nicht mit der Buildquelle ueberein.
goto :stop
:personal_token_found
echo FEHLER: Eine persoenliche Google-Token-Datei wurde im Paket gefunden.
goto :stop
:failed
if exist "%SERKAL_CANDIDATE%" del /f /q "%SERKAL_CANDIDATE%"
echo FEHLER: Der Reparaturbau wurde abgebrochen. Es wird nichts installiert.
:stop
echo.
pause
exit /b 1
