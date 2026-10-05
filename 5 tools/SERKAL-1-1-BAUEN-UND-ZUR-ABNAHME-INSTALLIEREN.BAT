@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Desktop 1.1 - bauen und zur Abnahme installieren

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
set "SERKAL_COMMIT=6d7e217748ff5ed36021b5e8221517a6c9adcc4f"
set "SERKAL_SOURCE=C:\serkal_dev\serkal_desktop"
set "SERKAL_SOURCE_ICON=%SERKAL_SOURCE%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\1.1"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"
set "SERKAL_SETUP=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\SerKal_1.1_Setup.exe"
set "SERKAL_DEST_DIR=C:\ppd\serkal\testinstallationen\1.1"
set "SERKAL_DEST_EXE=%SERKAL_DEST_DIR%\1.1-SerKal-Desktop-Abnahme.exe"
set "SERKAL_CANDIDATE=%SERKAL_DEST_EXE%.neu"
set "SERKAL_DEST_SHA=%SERKAL_DEST_EXE%.sha256"

if not defined SERKAL_GOOGLE_OAUTH_FILE set "SERKAL_GOOGLE_OAUTH_FILE=C:\serkal_dev\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Desktop 1.1 - ABNAHMEKANDIDAT
echo ============================================================
echo.

where git >nul 2>&1 || goto :missing_git
where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm
if not exist "%SERKAL_SOURCE_ICON%" goto :missing_icon
if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_BUILD_DIR%" goto :build_exists
if exist "%SERKAL_DEST_EXE%" goto :target_exists
if exist "%SERKAL_DEST_SHA%" goto :target_exists

echo [1/11] Bewaehrtes Windows-Symbol pruefen ...
powershell -NoProfile -Command "$b=[IO.File]::ReadAllBytes($env:SERKAL_SOURCE_ICON); if($b.Length -lt 6 -or $b[0] -ne 0 -or $b[1] -ne 0 -or $b[2] -ne 1 -or $b[3] -ne 0){exit 1}" || goto :invalid_icon

if not exist "C:\ppd\serkal\build" mkdir "C:\ppd\serkal\build" || goto :failed
if not exist "%SERKAL_DEST_DIR%" mkdir "%SERKAL_DEST_DIR%" || goto :failed

echo [2/11] Freigegebenen release-1.1-Stand holen ...
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [3/11] Gueltiges SerKal-Symbol in den Bauordner uebernehmen ...
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed

echo [4/11] Private OAuth-Grunddatei pruefen ...
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE | ConvertFrom-Json; if(-not $j.installed -and -not $j.web){throw 'Keine gueltige Google-OAuth-Clientdatei'}" || goto :failed

echo [5/11] Abhaengigkeiten installieren ...
call npm ci || goto :failed

echo [6/11] Alle sieben Testgruppen ausfuehren ...
call npm test || goto :failed

echo [7/11] Windows-Paket SerKal Desktop 1.1 bauen ...
call npm run make || goto :failed
if not exist "%SERKAL_SETUP%" goto :missing_setup

echo [8/11] OAuth-Ressource und persoenliche Token kontrollieren ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [9/11] Zweisprachigen Ein-Datei-Abnahmekandidaten erzeugen ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERKAL_BUILD_DIR%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SERKAL_SETUP%" -OutputPath "%SERKAL_CANDIDATE%" -IconPath "%SERKAL_BUILD_ICON%" || goto :failed
if not exist "%SERKAL_CANDIDATE%" goto :failed
for %%S in ("%SERKAL_SETUP%") do set "SERKAL_SETUP_SIZE=%%~zS"
for %%C in ("%SERKAL_CANDIDATE%") do set "SERKAL_CANDIDATE_SIZE=%%~zC"
powershell -NoProfile -Command "if([int64]$env:SERKAL_CANDIDATE_SIZE -le [int64]$env:SERKAL_SETUP_SIZE){exit 1}" || goto :failed
move /y "%SERKAL_CANDIDATE%" "%SERKAL_DEST_EXE%" >nul || goto :failed

echo [10/11] SHA-256 und Dateigroesse erzeugen und kontrollieren ...
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower(); Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DEST_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DEST_EXE))" || goto :failed
powershell -NoProfile -Command "$line=(Get-Content -Raw -LiteralPath $env:SERKAL_DEST_SHA).Trim(); $expected=($line -split '\s+')[0]; $actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower(); if($expected -ne $actual){exit 1}; Write-Host ('Groesse: '+(Get-Item -LiteralPath $env:SERKAL_DEST_EXE).Length+' Bytes'); Write-Host ('SHA256:  '+$actual)" || goto :failed

echo [11/11] Abnahmekandidat bereitstellen ...
echo.
echo ============================================================
echo  SERKAL DESKTOP 1.1 IST ZUR ABNAHME BEREIT
echo ============================================================
echo Installer:
echo %SERKAL_DEST_EXE%
echo Pruefsumme:
echo %SERKAL_DEST_SHA%
echo.
echo NOCH NICHT OEFFENTLICH VEROEFFENTLICHEN.
echo Zuerst Upgrade von 1.007f2 und DE/EN praktisch abnehmen.
echo.
pause
start "" /wait "%SERKAL_DEST_EXE%"
echo.
echo Installation beendet. Bitte SerKal Desktop 1.1 praktisch pruefen.
pause
exit /b 0

:missing_git
echo FEHLER: Git wurde nicht gefunden.
goto :stop
:missing_node
echo FEHLER: Node.js wurde nicht gefunden.
goto :stop
:missing_npm
echo FEHLER: npm wurde nicht gefunden.
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
:build_exists
echo FEHLER: Der getrennte 1.1-Bauordner existiert bereits:
echo %SERKAL_BUILD_DIR%
echo Nichts wurde geloescht oder ueberschrieben. Bitte die Meldung zeigen.
goto :stop
:target_exists
echo FEHLER: Im Zielordner liegt bereits ein 1.1-Abnahmeartefakt:
echo %SERKAL_DEST_DIR%
echo Nichts wurde ueberschrieben. Bitte die Meldung zeigen.
goto :stop
:wrong_commit
echo FEHLER: Der ausgecheckte Stand stimmt nicht mit der Freigabe ueberein.
goto :stop
:missing_setup
echo FEHLER: SerKal_1.1_Setup.exe wurde nicht erzeugt.
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
echo FEHLER: Der Bau wurde abgebrochen. Es wird nichts installiert.
:stop
echo.
pause
exit /b 1
