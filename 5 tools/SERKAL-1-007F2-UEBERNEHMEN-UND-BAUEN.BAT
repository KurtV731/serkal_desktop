@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Desktop 1.007f2 - sicher bauen und installieren

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
set "SERKAL_COMMIT=ea35d2394d8ddc6e78f14e526238cd6fd66e3010"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\1.007f2"
set "SERKAL_DEST_DIR=C:\ppd\serkal\testinstallationen\1.007f2"
set "SERKAL_DEST_EXE=%SERKAL_DEST_DIR%\1.007f2-SerKal-Desktop-Testinstallation.exe"
set "SERKAL_DEST_SHA=%SERKAL_DEST_EXE%.sha256"

if not defined SERKAL_GOOGLE_OAUTH_FILE set "SERKAL_GOOGLE_OAUTH_FILE=C:\serkal_dev\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Desktop 1.007f2 - NICHT OEFFENTLICHER TESTBUILD
echo ============================================================
echo.

where git >nul 2>&1 || goto :missing_git
where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm

if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_BUILD_DIR%" goto :build_exists
if exist "%SERKAL_DEST_EXE%" goto :target_exists
if exist "%SERKAL_DEST_SHA%" goto :target_exists

if not exist "C:\ppd\serkal\build" mkdir "C:\ppd\serkal\build" || goto :failed
if not exist "%SERKAL_DEST_DIR%" mkdir "%SERKAL_DEST_DIR%" || goto :failed

echo [1/9] Freigegebenen GitHub-Stand holen ...
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [2/9] Private OAuth-Grunddatei pruefen ...
powershell -NoProfile -Command "$ErrorActionPreference='Stop'; $j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE | ConvertFrom-Json; if(-not $j.installed -and -not $j.web){throw 'Keine gueltige Google-OAuth-Clientdatei'}" || goto :failed

echo [3/9] Abhaengigkeiten installieren ...
call npm ci || goto :failed

echo [4/9] Vollstaendige Testreihe ausfuehren ...
call npm test || goto :failed

echo [5/9] Windows-Installer bauen ...
call npm run make || goto :failed

set "SERKAL_SOURCE_EXE=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\SerKal_1.007f2_Setup.exe"
if not exist "%SERKAL_SOURCE_EXE%" goto :missing_setup

echo [6/9] Eingebettete OAuth-Ressource kontrollieren ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch

echo [7/9] Persoenliche Google-Token ausschliessen ...
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [8/9] Testinstaller sicher ablegen ...
copy /b "%SERKAL_SOURCE_EXE%" "%SERKAL_DEST_EXE%" >nul || goto :failed
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower(); Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DEST_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DEST_EXE))" || goto :failed

echo [9/9] Ablage und Pruefsumme kontrollieren ...
powershell -NoProfile -Command "$line=(Get-Content -Raw -LiteralPath $env:SERKAL_DEST_SHA).Trim(); $expected=($line -split '\s+')[0]; $actual=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DEST_EXE).Hash.ToLower(); if($expected -ne $actual){throw 'SHA-256 stimmt nicht'}" || goto :failed

echo.
echo ============================================================
echo  SERKAL DESKTOP 1.007f2 IST FERTIG UND GEPRUEFT
echo ============================================================
echo.
echo Installer:
echo %SERKAL_DEST_EXE%
echo.
echo SHA-256:
echo %SERKAL_DEST_SHA%
echo.
echo Die Datei ist NICHT oeffentlich und liegt nicht im Website-Ordner.
echo Jetzt wird ausschliesslich dieser Testinstaller gestartet.
echo.
pause
start "" /wait "%SERKAL_DEST_EXE%"
goto :done

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
echo FEHLER: Die private OAuth-Grunddatei fehlt:
echo %SERKAL_GOOGLE_OAUTH_FILE%
echo Der Installer wird absichtlich nicht gebaut.
goto :stop
:build_exists
echo FEHLER: Der getrennte Bauordner existiert bereits:
echo %SERKAL_BUILD_DIR%
echo Nichts wurde ueberschrieben. Bitte Kurt bzw. dem Installer-Chatty zeigen.
goto :stop
:target_exists
echo FEHLER: Im Zielordner existiert bereits ein 1.007f2-Artefakt:
echo %SERKAL_DEST_DIR%
echo Nichts wurde ueberschrieben. Bitte Kurt bzw. dem Installer-Chatty zeigen.
goto :stop
:wrong_commit
echo FEHLER: Der ausgecheckte GitHub-Stand stimmt nicht mit der CE-Freigabe ueberein.
goto :stop
:missing_setup
echo FEHLER: Forge hat den erwarteten 1.007f2-Installer nicht erzeugt.
goto :stop
:missing_packaged_oauth
echo FEHLER: resources\google_oauth_client.json fehlt im gebauten Programmpaket.
goto :stop
:oauth_mismatch
echo FEHLER: Die eingepackte OAuth-Grunddatei stimmt nicht mit der privaten Buildquelle ueberein.
goto :stop
:personal_token_found
echo FEHLER: Im Programmpaket wurde eine persoenliche Google-Token-Datei gefunden.
goto :stop
:failed
echo FEHLER: Der Bau wurde abgebrochen. Es wird nichts installiert.
:stop
echo.
pause
exit /b 1

:done
echo.
echo Installation beendet. Bitte pruefen, ob im Fenster SERKAL Desktop 1.007f2 steht.
pause
exit /b 0
