@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Desktop 1.2.3 - Public-Installer bauen und pruefen

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
for %%I in ("%~dp0.") do set "SERKAL_LOCAL_REPO=%%~fI"
set "SERKAL_COMMIT=6f196e982e18babebf31437fd26d042174e7c4ac"
set "SERKAL_VERSION=1.2.3"
set "SERKAL_RELEASE_NUMBER=37"
set "SERKAL_ANDROID_VERSION_CODE=46"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\release-1.2.3"
set "SERKAL_DEST_DIR=C:\ppd\serkal\veroeffentlichungen\1.2.3"
set "SERKAL_SETUP=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\serkal-desktop-1-2-3-setup.exe"
set "SERKAL_DESKTOP=%SERKAL_DEST_DIR%\serkal-desktop.exe"
set "SERKAL_DESKTOP_NEW=%SERKAL_DESKTOP%.neu"
set "SERKAL_DESKTOP_SHA=%SERKAL_DESKTOP%.sha256"
set "SERKAL_SOURCE_ICON=%SERKAL_LOCAL_REPO%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"

if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "C:\ppd\serkal\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=C:\ppd\serkal\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\ppd\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\ppd\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\ppd\serkal\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\ppd\serkal\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Desktop 1.2.3 - OEFFENTLICHEN INSTALLER BAUEN
echo ============================================================
echo.
echo Quellstand: %SERKAL_COMMIT%
echo Ziel:       %SERKAL_DESKTOP%
echo.

where git >nul 2>&1 || goto :missing_git
where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm
if not exist "%SERKAL_SOURCE_ICON%" if exist "C:\ppd\serkal\serkal_dev\serkal_desktop\4 assets\icon\serkal.ico" set "SERKAL_SOURCE_ICON=C:\ppd\serkal\serkal_dev\serkal_desktop\4 assets\icon\serkal.ico"
if not exist "%SERKAL_SOURCE_ICON%" goto :missing_icon
if not defined SERKAL_GOOGLE_OAUTH_FILE goto :missing_oauth
if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_BUILD_DIR%" goto :build_exists
if exist "%SERKAL_DEST_DIR%" goto :target_exists

echo [1/10] Getrennte Bau- und Freigabeordner anlegen ...
mkdir "%SERKAL_BUILD_DIR%" || goto :failed
mkdir "%SERKAL_DEST_DIR%" || goto :failed

echo [2/10] Festgeschriebenen Release-1.2-Stand holen ...
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [3/10] Stabile Versionsangaben und Dateinamen kontrollieren ...
powershell -NoProfile -Command "$p=Get-Content -Raw package.json|ConvertFrom-Json;$r=Get-Content -Raw serkal-release.json|ConvertFrom-Json;$f=Get-Content -Raw forge.config.js;if($p.version -ne $env:SERKAL_VERSION){exit 1};if($r.version -ne $env:SERKAL_VERSION -or [int]$r.number -ne [int]$env:SERKAL_RELEASE_NUMBER -or [int]$r.androidVersionCode -ne [int]$env:SERKAL_ANDROID_VERSION_CODE){exit 2};if($f -notmatch 'serkal-desktop-1-2-3-setup\.exe'){exit 3}" || goto :wrong_version

echo [4/10] Bewaehrtes lokales Symbol und private OAuth-Grunddatei pruefen ...
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE|ConvertFrom-Json;if(-not $j.installed -and -not $j.web){throw 'Keine gueltige OAuth-Datei'}" || goto :failed

echo [5/10] Abhaengigkeiten reproduzierbar installieren ...
call npm ci || goto :failed

echo [6/10] Alle 41 Testprogramme ausfuehren ...
call npm test || goto :failed

echo [7/10] Windows-Setup bauen ...
call npm run make || goto :failed
if not exist "%SERKAL_SETUP%" goto :missing_setup
if not exist "%SERKAL_BUILD_ICON%" goto :missing_icon

echo [8/10] Gepackte OAuth-Ressource und Token-Ausschluss pruefen ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [9/10] Ein-Datei-Installer erzeugen ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERKAL_BUILD_DIR%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SERKAL_SETUP%" -OutputPath "%SERKAL_DESKTOP_NEW%" -IconPath "%SERKAL_BUILD_ICON%" || goto :failed
if not exist "%SERKAL_DESKTOP_NEW%" goto :failed
move /y "%SERKAL_DESKTOP_NEW%" "%SERKAL_DESKTOP%" >nul || goto :failed

echo [10/10] SHA-256 und Freigabenachweis erzeugen ...
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DESKTOP).Hash.ToLower();Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DESKTOP_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DESKTOP));$lines=@('SerKal Desktop 1.2.3','version=1.2.3','releaseNumber=37',('sourceCommit='+$env:SERKAL_COMMIT),('file='+[IO.Path]::GetFileName($env:SERKAL_DESKTOP)),('bytes='+(Get-Item -LiteralPath $env:SERKAL_DESKTOP).Length),('sha256='+$h),'','Noch nicht in den Website-Downloadordner kopiert. Erst denselben Installer praktisch testen und dann unveraendert publizieren.');Set-Content -Encoding utf8 -LiteralPath (Join-Path $env:SERKAL_DEST_DIR 'freigabenachweis.txt') -Value $lines;Write-Host ('Groesse: '+(Get-Item -LiteralPath $env:SERKAL_DESKTOP).Length+' Bytes');Write-Host ('SHA256: '+$h)" || goto :failed

echo.
echo ============================================================
echo  SERKAL DESKTOP 1.2.3 IST ZUR ABNAHME BEREIT
echo ============================================================
echo %SERKAL_DESKTOP%
echo.
echo Genau diese Datei jetzt installieren und praktisch pruefen.
echo Danach darf sie UNVERAENDERT als serkal-desktop.exe auf die
echo Website und in den GitHub-Release uebernommen werden.
echo.
start "" explorer.exe "%SERKAL_DEST_DIR%"
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
:missing_oauth
echo FEHLER: google_oauth_client.json wurde nicht gefunden.
echo Falls sie woanders liegt, vor dem Start setzen:
echo set "SERKAL_GOOGLE_OAUTH_FILE=X:\pfad\google_oauth_client.json"
goto :stop
:build_exists
echo FEHLER: Der Bauordner existiert bereits:
echo %SERKAL_BUILD_DIR%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:target_exists
echo FEHLER: Der Freigabeordner existiert bereits:
echo %SERKAL_DEST_DIR%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:wrong_commit
echo FEHLER: Der ausgecheckte Stand stimmt nicht.
goto :stop
:wrong_version
echo FEHLER: Version, gemeinsamer Stand oder Setupname stimmt nicht.
goto :stop
:missing_setup
echo FEHLER: serkal-desktop-1-2-3-setup.exe wurde nicht erzeugt.
goto :stop
:missing_icon
echo FEHLER: Das bewaehrte lokale SerKal-Symbol fehlt:
echo %SERKAL_SOURCE_ICON%
goto :stop
:missing_packaged_oauth
echo FEHLER: google_oauth_client.json fehlt im gebauten Paket.
goto :stop
:oauth_mismatch
echo FEHLER: Die eingepackte OAuth-Datei stimmt nicht.
goto :stop
:personal_token_found
echo FEHLER: Eine persoenliche Google-Token-Datei wurde gefunden.
goto :stop
:failed
if exist "%SERKAL_DESKTOP_NEW%" del /f /q "%SERKAL_DESKTOP_NEW%"
echo FEHLER: Der Bau wurde abgebrochen. Es wird nichts installiert.
:stop
echo.
pause
exit /b 1


