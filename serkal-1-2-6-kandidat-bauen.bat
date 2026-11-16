@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Desktop 1.2.6 - Public-Installer bauen und pruefen

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
for %%I in ("%~dp0.") do set "SERKAL_LOCAL_REPO=%%~fI"
set "SERKAL_COMMIT=07903512a7ac2de4521182ec8b9a89e4cb030a86"
set "SERKAL_VERSION=1.2.6"
set "SERKAL_WRAPPER_COMMIT=fb1d00dd6e43c0ece7f34302f15f7b8a24b93268"
set "SERKAL_RELEASE_NUMBER=38"
set "SERKAL_ANDROID_VERSION_CODE=47"
for /f %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "SERKAL_BUILD_STAMP=%%T"
if not defined SERKAL_BUILD_STAMP goto :failed
set "SERKAL_RUN_ID=%SERKAL_BUILD_STAMP%-%RANDOM%"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\release-1.2.6-%SERKAL_RUN_ID%"
set "SERKAL_DEST_DIR=C:\ppd\serkal\veroeffentlichungen\1.2.6\kandidat-%SERKAL_RUN_ID%"
set "SERKAL_SETUP=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\serkal-desktop-1-2-6-setup.exe"
set "SERKAL_DESKTOP=%SERKAL_DEST_DIR%\serkal-desktop.exe"
set "SERKAL_DESKTOP_NEW=%SERKAL_DESKTOP%.neu"
set "SERKAL_DESKTOP_SHA=%SERKAL_DESKTOP%.sha256"
set "SERKAL_SOURCE_ICON="
if defined SERKAL_DESKTOP_ICON_FILE if exist "%SERKAL_DESKTOP_ICON_FILE%" set "SERKAL_SOURCE_ICON=%SERKAL_DESKTOP_ICON_FILE%"
if not defined SERKAL_SOURCE_ICON if exist "C:\ppd\serkal\serkal_dev\serkal_desktop\4 assets\icon\serkal.ico" set "SERKAL_SOURCE_ICON=C:\ppd\serkal\serkal_dev\serkal_desktop\4 assets\icon\serkal.ico"
if not defined SERKAL_SOURCE_ICON if exist "%SERKAL_LOCAL_REPO%\4 assets\icon\serkal.ico" set "SERKAL_SOURCE_ICON=%SERKAL_LOCAL_REPO%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_WRAPPER=%SERKAL_BUILD_DIR%\5 tools\installer\SerKalInstaller.cs"

if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "C:\ppd\serkal\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=C:\ppd\serkal\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\ppd\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\ppd\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\ppd\serkal\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\ppd\serkal\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Desktop 1.2.6 - NEUEN KANDIDATEN BAUEN
echo ============================================================
echo.
echo Quellstand: %SERKAL_COMMIT%
echo Ziel:       %SERKAL_DESKTOP%
echo.

where git >nul 2>&1 || goto :missing_git
where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm
node -e "const m=Number(process.versions.node.split('.')[0]);process.exit(m>=24?0:1)" || goto :wrong_node
if not exist "%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" if not exist "%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe" goto :missing_csc
if not defined SERKAL_SOURCE_ICON goto :missing_icon
if not exist "%SERKAL_SOURCE_ICON%" goto :missing_icon
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$b=[IO.File]::ReadAllBytes($env:SERKAL_SOURCE_ICON);if($b.Length -lt 22 -or $b[0] -ne 0 -or $b[1] -ne 0 -or $b[2] -ne 1 -or $b[3] -ne 0){throw 'Keine gueltige Windows-ICO-Datei'};$n=[BitConverter]::ToUInt16($b,4);if($n -lt 1 -or $n -gt 64 -or $b.Length -lt (6+16*$n)){throw 'ICO-Verzeichnis ungueltig'};for($i=0;$i -lt $n;$i++){$p=6+16*$i;$size=[BitConverter]::ToUInt32($b,$p+8);$offset=[BitConverter]::ToUInt32($b,$p+12);if($size -lt 40 -or $offset -lt (6+16*$n) -or ([uint64]$offset+[uint64]$size) -gt [uint64]$b.Length){throw ('ICO-Eintrag '+$i+' ungueltig')}};Write-Host ('Windows-ICO: OK ('+$n+' Groessen, '+$b.Length+' Bytes)')" || goto :invalid_icon
if not defined SERKAL_GOOGLE_OAUTH_FILE goto :missing_oauth
if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_BUILD_DIR%" goto :build_exists
if exist "%SERKAL_DEST_DIR%" goto :target_exists

echo [1/11] Getrennte Bau- und Freigabeordner anlegen ...
mkdir "%SERKAL_BUILD_DIR%" || goto :failed
mkdir "%SERKAL_DEST_DIR%" || goto :failed

echo [2/11] Festgeschriebenen Release-1.2-Stand holen ...
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit
git fetch --no-tags origin "%SERKAL_WRAPPER_COMMIT%" || goto :missing_wrapper
git checkout "%SERKAL_WRAPPER_COMMIT%" -- "5 tools/installer/SerKalInstaller.cs" || goto :missing_wrapper
if not exist "%SERKAL_BUILD_WRAPPER%" goto :missing_wrapper

echo [3/11] Stabile Versionsangaben, Wrapper und Dateinamen kontrollieren ...
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$p=Get-Content -Raw package.json|ConvertFrom-Json;$r=Get-Content -Raw serkal-release.json|ConvertFrom-Json;$f=Get-Content -Raw forge.config.js;$w=Get-Content -Raw -LiteralPath $env:SERKAL_BUILD_WRAPPER;if($p.version -ne $env:SERKAL_VERSION){throw ('package.json: '+$p.version)};if($r.version -ne $env:SERKAL_VERSION -or [int]$r.number -ne [int]$env:SERKAL_RELEASE_NUMBER -or [int]$r.androidVersionCode -ne [int]$env:SERKAL_ANDROID_VERSION_CODE){throw ('serkal-release.json: version='+$r.version+', number='+$r.number+', androidVersionCode='+$r.androidVersionCode)};if(-not $f.Contains('serkal-desktop-1-2-6-setup.exe')){throw 'forge.config.js: Setupname 1.2.6 fehlt'};$required=@('[assembly: AssemblyVersion(\"1.2.6.0\")]','[assembly: AssemblyFileVersion(\"1.2.6.0\")]','serkal-desktop-1-2-6-setup.exe');foreach($value in $required){if(-not $w.Contains($value)){throw ('Installerhuelle: '+$value+' fehlt')}};Write-Host 'Versionen und Installerhuelle: OK'" || goto :wrong_version

echo [4/11] Bewaehrtes lokales Symbol und private OAuth-Grunddatei pruefen ...
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE|ConvertFrom-Json;if(-not $j.installed -and -not $j.web){throw 'Keine gueltige OAuth-Datei'}" || goto :failed

echo [5/11] Abhaengigkeiten reproduzierbar installieren ...
call npm ci || goto :failed

echo [6/11] Alle 45 Testprogramme ausfuehren ...
call npm test || goto :failed

echo [7/11] Windows-Setup bauen ...
call npm run make || goto :failed
if not exist "%SERKAL_SETUP%" goto :missing_setup
if not exist "%SERKAL_BUILD_ICON%" goto :missing_icon

echo [8/11] Gepackte OAuth-Ressource, ASAR-Inhalt und Token-Ausschluss pruefen ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [9/11] Neue Google-Fensterdateien im gepackten ASAR pruefen ...
set "SERKAL_PACKAGED_ASAR="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\app.asar" 2^>nul') do if not defined SERKAL_PACKAGED_ASAR set "SERKAL_PACKAGED_ASAR=%%F"
if not defined SERKAL_PACKAGED_ASAR goto :missing_packaged_asar
set "SERKAL_ASAR_LIST=%SERKAL_BUILD_DIR%\asar-list.txt"
call npx --no-install asar list "%SERKAL_PACKAGED_ASAR%" > "%SERKAL_ASAR_LIST%" || goto :asar_check_failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$text=(Get-Content -Raw -LiteralPath $env:SERKAL_ASAR_LIST).Replace('\','/');$required=@('/2 src/common/google-auth-window.js','/2 src/common/google-auth-window-position.ps1');foreach($value in $required){if(-not $text.Contains($value)){throw ('ASAR: '+$value+' fehlt')}};Write-Host 'Google-Fensterdateien im ASAR: OK'" || goto :asar_check_failed
del /f /q "%SERKAL_ASAR_LIST%" >nul 2>&1

echo [10/11] Ein-Datei-Installer erzeugen ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERKAL_BUILD_DIR%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SERKAL_SETUP%" -OutputPath "%SERKAL_DESKTOP_NEW%" -IconPath "%SERKAL_BUILD_ICON%" || goto :failed
if not exist "%SERKAL_DESKTOP_NEW%" goto :failed
move /y "%SERKAL_DESKTOP_NEW%" "%SERKAL_DESKTOP%" >nul || goto :failed

echo [11/11] SHA-256 und Freigabenachweis erzeugen ...
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DESKTOP).Hash.ToLower();Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DESKTOP_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DESKTOP));$lines=@('SerKal Desktop 1.2.6','version=1.2.6','releaseNumber=38',('sourceCommit='+$env:SERKAL_COMMIT),('file='+[IO.Path]::GetFileName($env:SERKAL_DESKTOP)),('bytes='+(Get-Item -LiteralPath $env:SERKAL_DESKTOP).Length),('sha256='+$h),'','Noch nicht in den Website-Downloadordner kopiert. Erst denselben Installer praktisch testen und dann unveraendert publizieren.');Set-Content -Encoding utf8 -LiteralPath (Join-Path $env:SERKAL_DEST_DIR 'freigabenachweis.txt') -Value $lines;Write-Host ('Groesse: '+(Get-Item -LiteralPath $env:SERKAL_DESKTOP).Length+' Bytes');Write-Host ('SHA256: '+$h)" || goto :failed

echo.
echo ============================================================
echo  SERKAL DESKTOP 1.2.6 IST ZUR ABNAHME BEREIT
echo ============================================================
echo %SERKAL_DESKTOP%
echo.
echo Bestehende Public bleibt unveraendert. Kein Serverupload ausgefuehrt.
echo Genau diese Datei jetzt installieren und praktisch pruefen.
echo Erst nach Kurts Abnahme darf sie UNVERAENDERT als serkal-desktop.exe auf die
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
:wrong_node
echo FEHLER: Node.js 24 oder neuer wird fuer diesen geprueften Bauweg benoetigt.
echo Gefunden:
node --version 2^>nul
goto :stop
:missing_csc
echo FEHLER: Der Windows-C#-Compiler fuer die Ein-Datei-Installerhuelle fehlt.
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
echo FEHLER: serkal-desktop-1-2-6-setup.exe wurde nicht erzeugt.
goto :stop
:missing_icon
echo FEHLER: Das bewaehrte lokale SerKal-Symbol fehlt:
echo %SERKAL_SOURCE_ICON%
goto :stop
:invalid_icon
echo FEHLER: Die gefundene Datei ist kein technisch gueltiges Windows-ICO:
echo %SERKAL_SOURCE_ICON%
echo Bitte das bewaehrte lokale Desktop-Symbol ueber SERKAL_DESKTOP_ICON_FILE angeben.
goto :stop
:missing_wrapper
echo FEHLER: Die festgeschriebene Installerhuelle fuer 1.2.6 konnte nicht geladen werden.
echo Wrapper-Commit: %SERKAL_WRAPPER_COMMIT%
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
:missing_packaged_asar
echo FEHLER: app.asar wurde im gebauten Paket nicht gefunden.
goto :stop
:asar_check_failed
echo FEHLER: Die neuen Google-Fensterdateien fehlen im gepackten ASAR oder konnten nicht gelesen werden.
goto :stop
:failed
if exist "%SERKAL_DESKTOP_NEW%" del /f /q "%SERKAL_DESKTOP_NEW%"
echo FEHLER: Der Bau wurde abgebrochen. Es wird nichts installiert.
echo Public und bisherige Kandidaten bleiben erhalten. Fehler zuerst auswerten.
echo Ein neuer Aufruf verwendet neue Ordner und denselben Quellstand.
:stop
echo.
pause
exit /b 1


