@echo off
setlocal
title SerKal Desktop - Wartungstest
set "SERKAL_WARTUNG_ALT=%LOCALAPPDATA%\SerKal-Wartungstest"
set "SERKAL_WARTUNG_DIR=%LOCALAPPDATA%\SerKal-Wartungstest-Start"
set "SERKAL_WARTUNG_BRANCH=ce-desktop-wartung-1-2-7"
set "SERKAL_WARTUNG_ELECTRON=node_modules\electron\dist\electron.exe"

where git >nul 2>&1
if errorlevel 1 goto missing
where npm >nul 2>&1
if errorlevel 1 goto missing

rem Check only Electron from the two dedicated test directories.
powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference='Stop'; $paths=@((Join-Path $env:SERKAL_WARTUNG_ALT $env:SERKAL_WARTUNG_ELECTRON),(Join-Path $env:SERKAL_WARTUNG_DIR $env:SERKAL_WARTUNG_ELECTRON)); $running=Get-Process -Name electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -in $paths }; if ($running) { exit 10 }; exit 0"
if errorlevel 11 goto failed
if errorlevel 10 goto running
if errorlevel 1 goto failed

if not exist "%SERKAL_WARTUNG_DIR%\.git" (
    git clone --depth 1 --single-branch --branch "%SERKAL_WARTUNG_BRANCH%" https://github.com/KurtV731/serkal_desktop.git "%SERKAL_WARTUNG_DIR%"
    if errorlevel 1 goto failed
)
pushd "%SERKAL_WARTUNG_DIR%" || goto failed
git pull --ff-only origin "%SERKAL_WARTUNG_BRANCH%"
if errorlevel 1 goto failed

set "SERKAL_WARTUNG_DEPS="
for /f %%H in ('git hash-object package-lock.json') do set "SERKAL_WARTUNG_DEPS=%%H"
if not defined SERKAL_WARTUNG_DEPS goto failed
set "SERKAL_WARTUNG_INSTALLED="
if exist "node_modules\.serkal-wartung-lock" set /p SERKAL_WARTUNG_INSTALLED=<"node_modules\.serkal-wartung-lock"
if not exist "%SERKAL_WARTUNG_ELECTRON%" goto install
if "%SERKAL_WARTUNG_DEPS%"=="%SERKAL_WARTUNG_INSTALLED%" goto launch

:install
call npm ci --no-audit --no-fund
if errorlevel 1 goto failed
if not exist "%SERKAL_WARTUNG_ELECTRON%" goto failed
>"node_modules\.serkal-wartung-lock" echo %SERKAL_WARTUNG_DEPS%

:launch
set "SERKAL_WARTUNG_TARGET=%SERKAL_WARTUNG_DIR%"
call :oauth
if errorlevel 1 goto oauth_missing
start "" /wait "%SERKAL_WARTUNG_ELECTRON%" "%CD%"
if errorlevel 1 goto failed
popd
exit /b 0

:running
set "SERKAL_WARTUNG_TARGET=%SERKAL_WARTUNG_DIR%"
if exist "%SERKAL_WARTUNG_DIR%\%SERKAL_WARTUNG_ELECTRON%" call :oauth
set "SERKAL_WARTUNG_TARGET=%SERKAL_WARTUNG_ALT%"
if exist "%SERKAL_WARTUNG_ALT%\%SERKAL_WARTUNG_ELECTRON%" call :oauth
if not defined SERKAL_WARTUNG_OAUTH_READY goto oauth_missing
echo Google-Konfiguration ist bereit. Bitte zur offenen SerKal-Sitzung wechseln und Beenden mit Speichern erneut versuchen.
pause
exit /b 0

:oauth_missing
echo Die Google-Konfiguration der installierten SerKal-Version wurde nicht gefunden.
echo Falls SerKal noch offen ist, bitte geoeffnet lassen.
pause
exit /b 1

:missing
echo Fuer diesen Start werden Git und Node.js mit npm benoetigt.
pause
exit /b 1

:failed
echo Der Wartungstest konnte nicht starten. Bitte dieses Fenster fuer die Fehlermeldung offen lassen.
pause
exit /b 1

:oauth
powershell.exe -NoProfile -NonInteractive -Command "$ErrorActionPreference='Stop'; $name='google_oauth_client.json'; $target=Join-Path (Join-Path $env:SERKAL_WARTUNG_TARGET 'node_modules\electron\dist\resources') $name; if(Test-Path -LiteralPath $target -PathType Leaf){exit 0}; $sources=@($env:SERKAL_GOOGLE_OAUTH_FILE,(Join-Path $env:LOCALAPPDATA ('serkal_private\'+$name)),('C:\serkal_dev\serkal_private\'+$name)); $roots=@($env:LOCALAPPDATA,$env:ProgramFiles,${env:ProgramFiles(x86)}) | Where-Object { $_ }; foreach($root in $roots){$folders=Get-ChildItem -LiteralPath $root -Directory -Filter '*SerKal*' -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike 'SerKal-Wartungstest*' }; foreach($folder in $folders){$sources+=Join-Path $folder.FullName ('resources\'+$name); $sources+=Get-ChildItem -LiteralPath $folder.FullName -Directory -Filter 'app-*' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | ForEach-Object { Join-Path $_.FullName ('resources\'+$name) } }}; $ws=New-Object -ComObject WScript.Shell; foreach($place in @('Desktop','CommonDesktopDirectory','StartMenu','CommonStartMenu')){$directory=[Environment]::GetFolderPath($place); if($directory){$links=Get-ChildItem -LiteralPath $directory -Filter '*SerKal*.lnk' -File -Recurse -ErrorAction SilentlyContinue; foreach($link in $links){$exe=$ws.CreateShortcut($link.FullName).TargetPath; if($exe){$sources+=Join-Path (Split-Path -Parent $exe) ('resources\'+$name)}}}}; foreach($source in $sources){if($source -and (Test-Path -LiteralPath $source -PathType Leaf)){try{$json=Get-Content -LiteralPath $source -Raw | ConvertFrom-Json; $config=$json.installed; if(-not $config){$config=$json.web}; if(-not $config){$config=$json}; if($config.client_id){$null=New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target); Copy-Item -LiteralPath $source -Destination $target; exit 0}}catch{}}}; exit 1"
if errorlevel 1 exit /b 1
set "SERKAL_WARTUNG_OAUTH_READY=1"
exit /b 0
