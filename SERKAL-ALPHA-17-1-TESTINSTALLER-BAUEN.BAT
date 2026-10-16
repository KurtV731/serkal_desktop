@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Desktop Alpha 17.1 - Testinstaller bauen

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
set "SERKAL_COMMIT=5b795e68e948861de7ba122a8ff467be5b25639a"
set "SERKAL_VERSION=1.2.0-alpha.17.1"
set "SERKAL_SOURCE=C:\serkal_dev\serkal_desktop"
set "SERKAL_SOURCE_ICON=%SERKAL_SOURCE%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\alpha-17-1"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"
set "SERKAL_SETUP=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\SerKal_Alpha_17_1_Setup.exe"
set "SERKAL_DEST_DIR=C:\ppd\serkal\testinstallationen\alpha-17-1"
set "SERKAL_DEST_EXE=%SERKAL_DEST_DIR%\Alpha-17-1-SerKal-Desktop-Testinstallation.exe"
set "SERKAL_CANDIDATE=%SERKAL_DEST_EXE%.neu"
set "SERKAL_DEST_SHA=%SERKAL_DEST_EXE%.sha256"
if not defined SERKAL_GOOGLE_OAUTH_FILE set "SERKAL_GOOGLE_OAUTH_FILE=C:\serkal_dev\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Desktop Alpha 17.1 - NICHT OEFFENTLICHER TEST
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

echo [1/10] Getrennten Bauordner anlegen ...
if not exist "C:\ppd\serkal\build" mkdir "C:\ppd\serkal\build" || goto :failed
if not exist "%SERKAL_DEST_DIR%" mkdir "%SERKAL_DEST_DIR%" || goto :failed
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [2/10] Eindeutige Versionsnummer kontrollieren ...
powershell -NoProfile -Command "$p=Get-Content -Raw package.json|ConvertFrom-Json;if($p.version -ne $env:SERKAL_VERSION){exit 1}" || goto :wrong_version

echo [3/10] Bewaehrtes Windows-Symbol uebernehmen ...
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed

echo [4/10] Private OAuth-Grunddatei pruefen ...
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE|ConvertFrom-Json;if(-not $j.installed -and -not $j.web){throw 'Keine gueltige Google-OAuth-Clientdatei'}" || goto :failed

echo [5/10] Abhaengigkeiten installieren ...
call npm ci || goto :failed

echo [6/10] Alle 26 Testprogramme ausfuehren ...
call npm test || goto :failed

echo [7/10] Windows-Setup bauen ...
call npm run make || goto :failed
if not exist "%SERKAL_SETUP%" goto :missing_setup

echo [8/10] Paketinhalt kontrollieren ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [9/10] Ein-Datei-Testinstaller erzeugen ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERKAL_BUILD_DIR%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SERKAL_SETUP%" -OutputPath "%SERKAL_CANDIDATE%" -IconPath "%SERKAL_BUILD_ICON%" || goto :failed
if not exist "%SERKAL_CANDIDATE%" goto :failed
move /y "%SERKAL_CANDIDATE%" "%SERKAL_DEST_EXE%" >nul || goto :failed

echo [10/10] SHA-256 erzeugen und pruefen ...
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower();Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DEST_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DEST_EXE));Write-Host ('Groesse: '+(Get-Item -LiteralPath $env:SERKAL_DEST_EXE).Length+' Bytes');Write-Host ('SHA256:  '+$h)" || goto :failed

echo.
echo ============================================================
echo  ALPHA 17.1 IST FUER KURTS TEST BEREIT
echo ============================================================
echo Installer:
echo %SERKAL_DEST_EXE%
echo Pruefsumme:
echo %SERKAL_DEST_SHA%
echo.
echo NICHT OEFFENTLICH VEROEFFENTLICHEN.
echo Erst Kurt testen lassen, danach unveraendert an VelcroFist.
echo.
pause
start "" /wait "%SERKAL_DEST_EXE%"
echo.
echo Installation beendet. Bitte Alpha 17.1 praktisch pruefen.
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
echo FEHLER: Das bewaehrte SerKal-Symbol fehlt:
echo %SERKAL_SOURCE_ICON%
goto :stop
:missing_oauth
echo FEHLER: Die private OAuth-Grunddatei fehlt:
echo %SERKAL_GOOGLE_OAUTH_FILE%
goto :stop
:build_exists
echo FEHLER: Der getrennte Bauordner existiert bereits:
echo %SERKAL_BUILD_DIR%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:target_exists
echo FEHLER: Das Testartefakt existiert bereits:
echo %SERKAL_DEST_DIR%
echo Nichts wurde ueberschrieben.
goto :stop
:wrong_commit
echo FEHLER: Der ausgecheckte Stand stimmt nicht mit der Freigabe ueberein.
goto :stop
:wrong_version
echo FEHLER: Die erwartete eindeutige Version %SERKAL_VERSION% fehlt.
goto :stop
:missing_setup
echo FEHLER: SerKal_Alpha_17_1_Setup.exe wurde nicht erzeugt.
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
