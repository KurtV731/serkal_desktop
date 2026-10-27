@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Sitzungstest 33 - isolierten Windows-Pruefstand bauen

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
for %%I in ("%~dp0.") do set "SERKAL_LOCAL_REPO=%%~fI"
set "SERKAL_COMMIT=553972d0008552333d4fba7781668ddd210206ac"
set "SERKAL_VERSION=1.2.1-alpha.33"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\sitzungstest-33"
set "SERKAL_TEST_ROOT=C:\ppd\serkal\testinstallationen"
set "SERKAL_DEST_DIR=%SERKAL_TEST_ROOT%\sitzungstest-33"
set "SERKAL_PROGRAM_DIR=%SERKAL_DEST_DIR%\serkal-session-test-33"
set "SERKAL_PACKAGED_DIR=%SERKAL_BUILD_DIR%\out\SerKal Session Test 33-win32-x64"
set "SERKAL_TEST_EXE=%SERKAL_PROGRAM_DIR%\SerKal Session Test 33.exe"
set "SERKAL_ZIP=%SERKAL_TEST_ROOT%\serkal-sitzungstest-33.zip"
set "SERKAL_ZIP_SHA=%SERKAL_ZIP%.sha256"
set "SERKAL_SOURCE_ICON=%SERKAL_LOCAL_REPO%\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"

if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "C:\ppd\serkal\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=C:\ppd\serkal\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\ppd\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\ppd\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\ppd\serkal\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\ppd\serkal\serkal_private\google_oauth_client.json"
if not defined SERKAL_GOOGLE_OAUTH_FILE if exist "G:\Meine Ablage\serkal_private\google_oauth_client.json" set "SERKAL_GOOGLE_OAUTH_FILE=G:\Meine Ablage\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SERKAL SITZUNGSTEST 33 - ISOLIERTER WINDOWS-PRUEFSTAND
echo ============================================================
echo.
echo Diese Fassung benutzt:
echo   Profil: %%APPDATA%%\SerKal-Session-Test-33
echo   Google: serkal-session-test-33.json
echo Der echte Google-Kalender ist deaktiviert.
echo Die oeffentliche SerKal-1.2-Installation wird nicht ersetzt.
echo.

where git >nul 2>&1 || goto :missing_git
where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm
where robocopy >nul 2>&1 || goto :missing_robocopy
if not exist "%SERKAL_SOURCE_ICON%" goto :missing_icon
if not defined SERKAL_GOOGLE_OAUTH_FILE goto :missing_oauth
if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_BUILD_DIR%" goto :build_exists
if exist "%SERKAL_DEST_DIR%" goto :target_exists
if exist "%SERKAL_ZIP%" goto :zip_exists

echo [1/11] Getrennte Bau- und Testordner anlegen ...
mkdir "%SERKAL_BUILD_DIR%" || goto :failed
if not exist "%SERKAL_TEST_ROOT%" mkdir "%SERKAL_TEST_ROOT%" || goto :failed
mkdir "%SERKAL_DEST_DIR%" || goto :failed

echo [2/11] Festgeschriebenen CE-Teststand 33 holen ...
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [3/11] Testkennung, Version und Isolation kontrollieren ...
powershell -NoProfile -Command "$p=Get-Content -Raw package.json|ConvertFrom-Json;$r=Get-Content -Raw serkal-release.json|ConvertFrom-Json;$m=Get-Content -Raw '2 src\backend\main.js';if($p.name -ne 'serkal_session_test_33' -or $p.productName -ne 'SerKal Session Test 33' -or $p.version -ne $env:SERKAL_VERSION){exit 1};if($r.version -ne $env:SERKAL_VERSION -or [int]$r.number -ne 33){exit 2};if($m -notmatch 'SerKal-Session-Test-33' -or $m -notmatch 'serkal-session-test-33\.json'){exit 3}" || goto :wrong_version

echo [4/11] Bewaehrtes lokales Symbol und private OAuth-Grunddatei pruefen ...
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE|ConvertFrom-Json;if(-not $j.installed -and -not $j.web){throw 'Keine gueltige OAuth-Datei'}" || goto :failed

echo [5/11] Abhaengigkeiten reproduzierbar installieren ...
call npm ci || goto :failed

echo [6/11] Alle 38 Testskripte ausfuehren ...
call npm test || goto :failed

echo [7/11] Vollstaendigen portablen Windows-Programmordner bauen ...
call npm run package -- --platform=win32 --arch=x64 || goto :failed
if not exist "%SERKAL_PACKAGED_DIR%\SerKal Session Test 33.exe" goto :missing_program

echo [8/11] OAuth-Beilage und Ausschluss persoenlicher Tokens pruefen ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_PACKAGED_DIR%\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_PACKAGED_DIR%\google_calendar_token.json" 2^>nul') do goto :personal_token_found
for /f "delims=" %%F in ('dir /s /b "%SERKAL_PACKAGED_DIR%\google_archive_token.json" 2^>nul') do goto :personal_token_found

echo [9/11] Vollstaendigen Programmordner in den Testbereich kopieren ...
robocopy "%SERKAL_PACKAGED_DIR%" "%SERKAL_PROGRAM_DIR%" /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 >nul
if errorlevel 8 goto :failed
if not exist "%SERKAL_TEST_EXE%" goto :missing_program
powershell -NoProfile -Command "$lines=@('@echo off','cd /d "%%~dp0serkal-session-test-33"','start "" "SerKal Session Test 33.exe"');Set-Content -Encoding ascii -LiteralPath (Join-Path $env:SERKAL_DEST_DIR 'start-serkal-sitzungstest-33.cmd') -Value $lines" || goto :failed

echo [10/11] Nachweis und ZIP fuer zweiten PC erzeugen ...
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_TEST_EXE).Hash.ToLower();$bytes=(Get-Item -LiteralPath $env:SERKAL_TEST_EXE).Length;$lines=@('SerKal Sitzungstest 33','version=1.2.1-alpha.33',('sourceCommit='+$env:SERKAL_COMMIT),'profile=%%APPDATA%%\SerKal-Session-Test-33','googleFile=serkal-session-test-33.json','calendar=disabled',('exe='+[IO.Path]::GetFileName($env:SERKAL_TEST_EXE)),('exeBytes='+$bytes),('exeSha256='+$h),'','Nur isolierter Test. Nicht veroeffentlichen und nicht in den SerKal-Downloadordner kopieren.');Set-Content -Encoding utf8 -LiteralPath (Join-Path $env:SERKAL_DEST_DIR 'pruefnachweis.txt') -Value $lines;Compress-Archive -LiteralPath $env:SERKAL_DEST_DIR -DestinationPath $env:SERKAL_ZIP -CompressionLevel Optimal" || goto :failed

echo [11/11] ZIP pruefen und SHA-256 schreiben ...
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_ZIP).Hash.ToLower();Set-Content -Encoding ascii -LiteralPath $env:SERKAL_ZIP_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_ZIP));Write-Host ('Programmordner: '+$env:SERKAL_DEST_DIR);Write-Host ('ZIP-Groesse: '+(Get-Item -LiteralPath $env:SERKAL_ZIP).Length+' Bytes');Write-Host ('ZIP-SHA256: '+$h)" || goto :failed

echo.
echo ============================================================
echo  SITZUNGSTEST 33 IST BEREIT
echo ============================================================
echo.
echo Auf diesem PC starten mit:
echo "%SERKAL_DEST_DIR%\start-serkal-sitzungstest-33.cmd"
echo.
echo Fuer den zweiten PC den GESAMTEN Ordner oder diese ZIP verwenden:
echo "%SERKAL_ZIP%"
echo.
echo NICHT in C:\ppd\serkal\veroeffentlichungen oder auf die Website kopieren.
echo Der erste Start darf ein leeres Testarchiv zeigen.
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
:missing_robocopy
echo FEHLER: robocopy wurde nicht gefunden.
goto :stop
:missing_icon
echo FEHLER: Das bewaehrte lokale SerKal-Symbol fehlt:
echo %SERKAL_SOURCE_ICON%
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
echo FEHLER: Der Testordner existiert bereits:
echo %SERKAL_DEST_DIR%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:zip_exists
echo FEHLER: Die Test-ZIP existiert bereits:
echo %SERKAL_ZIP%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:wrong_commit
echo FEHLER: Der ausgecheckte Stand stimmt nicht.
goto :stop
:wrong_version
echo FEHLER: Version oder Isolation stimmt nicht.
goto :stop
:missing_program
echo FEHLER: Der vollstaendige portable Programmordner wurde nicht erzeugt.
goto :stop
:missing_packaged_oauth
echo FEHLER: google_oauth_client.json fehlt im Testprogramm.
goto :stop
:oauth_mismatch
echo FEHLER: Die eingepackte OAuth-Datei stimmt nicht.
goto :stop
:personal_token_found
echo FEHLER: Eine persoenliche Google-Token-Datei wurde im Paket gefunden.
goto :stop
:failed
echo FEHLER: Der Testbau wurde abgebrochen. Nichts wird installiert oder veroeffentlicht.
:stop
echo.
pause
exit /b 1
