@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SerKal Alpha 22.1 - vier Testerpakete bauen

set "SERKAL_REPO=https://github.com/KurtV731/serkal_desktop.git"
set "SERKAL_COMMIT=544f559ab3d64ca2342b96f6ade2ab7266663449"
set "SERKAL_VERSION=1.2.0-alpha.221"
set "SERKAL_BUILD_DIR=C:\ppd\serkal\build\alpha-22-1"
set "SERKAL_DEST_DIR=C:\ppd\serkal\testinstallationen\alpha-22-1"
set "SERKAL_PACKAGES=%SERKAL_DEST_DIR%\testerpakete"
set "SERKAL_SOURCE_ICON=C:\serkal_dev\serkal_desktop\4 assets\icon\serkal.ico"
set "SERKAL_BUILD_ICON=%SERKAL_BUILD_DIR%\4 assets\icon\serkal.ico"
set "SERKAL_SETUP=%SERKAL_BUILD_DIR%\out\make\squirrel.windows\x64\serkal-alpha-22-1-setup.exe"
set "SERKAL_DESKTOP=%SERKAL_DEST_DIR%\serkal-desktop-alpha-22-1-test.exe"
set "SERKAL_DESKTOP_NEW=%SERKAL_DESKTOP%.neu"
set "SERKAL_DESKTOP_SHA=%SERKAL_DESKTOP%.sha256"
set "SERKAL_APK_FILE=G:\Meine Ablage\- - androidtrans\0.0.5a15-serkal-android.apk"
set "SERKAL_APK_SHA_EXPECTED=29fe514aba88ddfcc785c05ac33cf6dd4e853f9c045fd1c8b494e2ec9933f59b"
if not defined SERKAL_GOOGLE_OAUTH_FILE set "SERKAL_GOOGLE_OAUTH_FILE=C:\serkal_dev\serkal_private\google_oauth_client.json"

echo.
echo ============================================================
echo  SerKal Alpha 22.1 - VIER NICHT OEFFENTLICHE TESTERPAKETE
echo ============================================================
echo.

where git >nul 2>&1 || goto :missing_git
where node >nul 2>&1 || goto :missing_node
where npm >nul 2>&1 || goto :missing_npm
if not exist "%SERKAL_SOURCE_ICON%" goto :missing_icon
if not exist "%SERKAL_GOOGLE_OAUTH_FILE%" goto :missing_oauth
if exist "%SERKAL_BUILD_DIR%" goto :build_exists
if exist "%SERKAL_DEST_DIR%" goto :target_exists

echo [1/12] Getrennte Ordner anlegen ...
mkdir "%SERKAL_BUILD_DIR%" || goto :failed
mkdir "%SERKAL_DEST_DIR%" || goto :failed

echo [2/12] Freigegebenen Alpha-22.1-Installerstand holen ...
git clone --no-checkout "%SERKAL_REPO%" "%SERKAL_BUILD_DIR%" || goto :failed
cd /d "%SERKAL_BUILD_DIR%" || goto :failed
git checkout --detach "%SERKAL_COMMIT%" || goto :failed
for /f "delims=" %%G in ('git rev-parse HEAD') do set "SERKAL_ACTUAL_COMMIT=%%G"
if /I not "%SERKAL_ACTUAL_COMMIT%"=="%SERKAL_COMMIT%" goto :wrong_commit

echo [3/12] Version und Dateinamen kontrollieren ...
powershell -NoProfile -Command "$p=Get-Content -Raw package.json|ConvertFrom-Json;if($p.version -ne $env:SERKAL_VERSION){exit 1};$f=Get-Content -Raw forge.config.js;if($f -notmatch 'serkal-alpha-22-1-setup\.exe'){exit 2}" || goto :wrong_version

echo [4/12] Symbol und private OAuth-Grunddatei pruefen ...
copy /y "%SERKAL_SOURCE_ICON%" "%SERKAL_BUILD_ICON%" >nul || goto :failed
powershell -NoProfile -Command "$ErrorActionPreference='Stop';$j=Get-Content -Raw -LiteralPath $env:SERKAL_GOOGLE_OAUTH_FILE|ConvertFrom-Json;if(-not $j.installed -and -not $j.web){throw 'Keine gueltige OAuth-Datei'}" || goto :failed

echo [5/12] Abhaengigkeiten installieren ...
call npm ci || goto :failed

echo [6/12] Alle 28 Testprogramme ausfuehren ...
call npm test || goto :failed

echo [7/12] Windows-Setup bauen ...
call npm run make || goto :failed
if not exist "%SERKAL_SETUP%" goto :missing_setup

echo [8/12] Gepackte OAuth-Ressource und Token-Ausschluss pruefen ...
set "SERKAL_PACKAGED_OAUTH="
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_oauth_client.json" 2^>nul') do if not defined SERKAL_PACKAGED_OAUTH set "SERKAL_PACKAGED_OAUTH=%%F"
if not defined SERKAL_PACKAGED_OAUTH goto :missing_packaged_oauth
fc /b "%SERKAL_GOOGLE_OAUTH_FILE%" "%SERKAL_PACKAGED_OAUTH%" >nul || goto :oauth_mismatch
for /f "delims=" %%F in ('dir /s /b "%SERKAL_BUILD_DIR%\out\google_calendar_token.json" 2^>nul') do goto :personal_token_found

echo [9/12] Ein-Datei-Windows-Testinstaller und SHA-256 erzeugen ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SERKAL_BUILD_DIR%\5 tools\installer\build-publish-installer.ps1" -SetupPath "%SERKAL_SETUP%" -OutputPath "%SERKAL_DESKTOP_NEW%" -IconPath "%SERKAL_BUILD_ICON%" || goto :failed
if not exist "%SERKAL_DESKTOP_NEW%" goto :failed
move /y "%SERKAL_DESKTOP_NEW%" "%SERKAL_DESKTOP%" >nul || goto :failed
powershell -NoProfile -Command "$h=(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_DESKTOP).Hash.ToLower();Set-Content -Encoding ascii -LiteralPath $env:SERKAL_DESKTOP_SHA -Value ($h+'  '+[IO.Path]::GetFileName($env:SERKAL_DESKTOP));Write-Host ('Desktop-Groesse: '+(Get-Item -LiteralPath $env:SERKAL_DESKTOP).Length+' Bytes');Write-Host ('Desktop-SHA256: '+$h)" || goto :failed

echo [10/12] Signierte Android-a15-APK aus dem festen Transferordner pruefen ...
if not exist "%SERKAL_APK_FILE%" goto :missing_apk
for /f "delims=" %%H in ('powershell -NoProfile -Command "(Get-FileHash -Algorithm SHA256 -LiteralPath $env:SERKAL_APK_FILE).Hash.ToLower()"') do set "SERKAL_APK_SHA=%%H"
if /I not "%SERKAL_APK_SHA%"=="%SERKAL_APK_SHA_EXPECTED%" goto :wrong_apk
set "SERKAL_APK=%SERKAL_DEST_DIR%\serkal-android-0.0.5a15.apk"
set "SERKAL_APK_SHA_FILE=%SERKAL_APK%.sha256"
copy /y "%SERKAL_APK_FILE%" "%SERKAL_APK%" >nul || goto :failed
powershell -NoProfile -Command "Set-Content -Encoding ascii -LiteralPath $env:SERKAL_APK_SHA_FILE -Value ($env:SERKAL_APK_SHA+'  '+[IO.Path]::GetFileName($env:SERKAL_APK))" || goto :failed

echo [11/12] Vier getrennte Testerpakete erzeugen ...
mkdir "%SERKAL_PACKAGES%" || goto :failed
call :make_package "kurt" "Kurt"
if errorlevel 1 goto :failed
call :make_package "larsalexander2" "larsalexander2@googlemail.com"
if errorlevel 1 goto :failed
call :make_package "fuchsjuergen005" "fuchsjuergen005@gmail.com"
if errorlevel 1 goto :failed
call :make_package "velcrofist69" "velcrofist69@gmail.com"
if errorlevel 1 goto :failed

echo [12/12] Pakete kontrollieren ...
powershell -NoProfile -Command "$z=Get-ChildItem -LiteralPath $env:SERKAL_PACKAGES -Filter '*.zip';if($z.Count -ne 4){exit 1};$z|ForEach-Object{Write-Host ($_.Name+' - '+$_.Length+' Bytes')}" || goto :failed

echo.
echo ============================================================
echo  VIER TESTERPAKETE SIND BEREIT
echo ============================================================
echo %SERKAL_PACKAGES%
echo.
echo Erst Kurts Paket testen. Danach die drei anderen weitergeben.
echo NICHT AUF DER OEFFENTLICHEN DOWNLOADSEITE VERLINKEN.
echo.
start "" explorer.exe "%SERKAL_PACKAGES%"
pause
exit /b 0

:make_package
set "SERKAL_PACKAGE_KEY=%~1"
set "SERKAL_PACKAGE_FOR=%~2"
set "SERKAL_STAGE=%SERKAL_PACKAGES%\%SERKAL_PACKAGE_KEY%"
set "SERKAL_ZIP=%SERKAL_PACKAGES%\serkal-testerpaket-%SERKAL_PACKAGE_KEY%.zip"
mkdir "%SERKAL_STAGE%" || exit /b 1
copy /y "%SERKAL_DESKTOP%" "%SERKAL_STAGE%\" >nul || exit /b 1
copy /y "%SERKAL_DESKTOP_SHA%" "%SERKAL_STAGE%\" >nul || exit /b 1
copy /y "%SERKAL_APK%" "%SERKAL_STAGE%\" >nul || exit /b 1
copy /y "%SERKAL_APK_SHA_FILE%" "%SERKAL_STAGE%\" >nul || exit /b 1
powershell -NoProfile -Command "if($env:SERKAL_PACKAGE_KEY -eq 'velcrofist69'){$lines=@('SerKal test package for: '+$env:SERKAL_PACKAGE_FOR,'','Windows: serkal-desktop-alpha-22-1-test.exe','Android: serkal-android-0.0.5a15.apk','','Please install and test the Windows version first.','Install the APK as an update. Do not uninstall the existing Android app first.','The SHA-256 files allow you to verify that both installers arrived unchanged.','This package is for your personal test only. Please do not publish or redistribute it.')}else{$lines=@('SerKal-Testpaket fuer: '+$env:SERKAL_PACKAGE_FOR,'','Windows: serkal-desktop-alpha-22-1-test.exe','Android: serkal-android-0.0.5a15.apk','','Windows vor Android installieren und pruefen.','APK als Update installieren, nicht vorher deinstallieren.','Nur fuer den persoenlichen Test; keine oeffentliche Weitergabe.')};Set-Content -Encoding utf8 -LiteralPath (Join-Path $env:SERKAL_STAGE 'bitte-lesen.txt') -Value $lines;Compress-Archive -Path (Join-Path $env:SERKAL_STAGE '*') -DestinationPath $env:SERKAL_ZIP -CompressionLevel Optimal" || exit /b 1
rmdir /s /q "%SERKAL_STAGE%"
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
echo FEHLER: Der neue Bauordner existiert bereits:
echo %SERKAL_BUILD_DIR%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:target_exists
echo FEHLER: Der Zielordner existiert bereits:
echo %SERKAL_DEST_DIR%
echo Nichts wurde geloescht oder ueberschrieben.
goto :stop
:wrong_commit
echo FEHLER: Der ausgecheckte Stand stimmt nicht.
goto :stop
:wrong_version
echo FEHLER: Version oder Setupname stimmt nicht.
goto :stop
:missing_setup
echo FEHLER: serkal-alpha-22-1-setup.exe wurde nicht erzeugt.
goto :stop
:missing_packaged_oauth
echo FEHLER: google_oauth_client.json fehlt im Paket.
goto :stop
:oauth_mismatch
echo FEHLER: Die eingepackte OAuth-Datei stimmt nicht.
goto :stop
:personal_token_found
echo FEHLER: Eine persoenliche Google-Token-Datei wurde gefunden.
goto :stop
:missing_apk
echo FEHLER: Die signierte a15-APK wurde im festen Transferordner nicht gefunden:
echo %SERKAL_APK_FILE%
goto :stop
:wrong_apk
echo FEHLER: Die APK ist nicht die freigegebene signierte a15-Datei.
echo Erwartet: %SERKAL_APK_SHA_EXPECTED%
echo Gefunden: %SERKAL_APK_SHA%
goto :stop
:failed
if exist "%SERKAL_DESKTOP_NEW%" del /f /q "%SERKAL_DESKTOP_NEW%"
echo FEHLER: Der Bau wurde abgebrochen. Es wird nichts installiert.
:stop
echo.
pause
exit /b 1
