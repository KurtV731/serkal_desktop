@echo off
setlocal EnableExtensions
title SerKal - Spieler wechseln

set "SERKAL_DATA=%APPDATA%\SerKal"
set "PROFILE_ROOT=%SERKAL_DATA%\spieler"
set "KURT_PROFILE=%PROFILE_ROOT%\kurt"
set "XAVER_PROFILE=%PROFILE_ROOT%\xaver_hoeger"
set "XAVER_ARCHIVE=%XAVER_PROFILE%\archiv"
set "BACKUP_PROFILE=%PROFILE_ROOT%\sicherung_letzter_wechsel"
set "MARKER=%PROFILE_ROOT%\aktiver_spieler.txt"

cls
echo.
echo ============================================================
echo   SERKAL - SPIELER WECHSELN
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "if(Get-Process -ErrorAction SilentlyContinue ^| Where-Object {$_.MainWindowTitle -like 'SERKAL Desktop*'}){exit 1}else{exit 0}"
if errorlevel 1 goto SERKAL_RUNNING

if not exist "%SERKAL_DATA%" mkdir "%SERKAL_DATA%"
if errorlevel 1 goto CREATE_ERROR
if not exist "%PROFILE_ROOT%" mkdir "%PROFILE_ROOT%"
if errorlevel 1 goto CREATE_ERROR
if not exist "%KURT_PROFILE%" mkdir "%KURT_PROFILE%"
if errorlevel 1 goto CREATE_ERROR
if not exist "%XAVER_PROFILE%" mkdir "%XAVER_PROFILE%"
if errorlevel 1 goto CREATE_ERROR
if not exist "%BACKUP_PROFILE%" mkdir "%BACKUP_PROFILE%"
if errorlevel 1 goto CREATE_ERROR

set "ACTIVE=kurt"
if exist "%MARKER%" set /p ACTIVE=<"%MARKER%"

if /I "%ACTIVE%"=="kurt" (
    set "CURRENT_NAME=Kurt-Peter Vogelsaenger"
    set "CURRENT_PROFILE=%KURT_PROFILE%"
    set "TARGET_NAME=Xaver Hoeger"
    set "TARGET_ID=xaver_hoeger"
    set "TARGET_PROFILE=%XAVER_PROFILE%"
) else if /I "%ACTIVE%"=="xaver_hoeger" (
    set "CURRENT_NAME=Xaver Hoeger"
    set "CURRENT_PROFILE=%XAVER_PROFILE%"
    set "TARGET_NAME=Kurt-Peter Vogelsaenger"
    set "TARGET_ID=kurt"
    set "TARGET_PROFILE=%KURT_PROFILE%"
) else (
    goto MARKER_ERROR
)

echo Aktuell bist du: %CURRENT_NAME%
echo Umgeschaltet wird auf: %TARGET_NAME%
echo.
choice /C JN /N /M "Jetzt umschalten? [J/N] "
if errorlevel 2 goto CANCELLED

if /I "%ACTIVE%"=="kurt" (
    rem Kurts vollstaendigen lokalen SerKal-Zustand doppelt sichern:
    rem Sicherheitskopie plus Spielerprofil.
    call :BACKUP_FILE "settings.json"
    if errorlevel 1 goto COPY_ERROR
    call :BACKUP_FILE "tmdb.json"
    if errorlevel 1 goto COPY_ERROR
    call :BACKUP_FILE "google_calendar_token.json"
    if errorlevel 1 goto COPY_ERROR
    call :BACKUP_FILE "maintenance_tmdb_cache.json"
    if errorlevel 1 goto COPY_ERROR

    call :STORE_FILE "settings.json"
    if errorlevel 1 goto MOVE_ERROR
    call :STORE_FILE "tmdb.json"
    if errorlevel 1 goto MOVE_ERROR
    call :STORE_FILE "google_calendar_token.json"
    if errorlevel 1 goto MOVE_ERROR
    call :STORE_FILE "maintenance_tmdb_cache.json"
    if errorlevel 1 goto MOVE_ERROR
) else (
    rem Xaver ist ein Wegwerf-Testnutzer. Sein Zustand wird nie aufbewahrt.
    call :DELETE_ACTIVE_FILE "settings.json"
    call :DELETE_ACTIVE_FILE "tmdb.json"
    call :DELETE_ACTIVE_FILE "google_calendar_token.json"
    call :DELETE_ACTIVE_FILE "maintenance_tmdb_cache.json"
)

if /I "%TARGET_ID%"=="xaver_hoeger" (
    call :PREPARE_EMPTY_XAVER
    if errorlevel 1 goto XAVER_RESET_ERROR
) else (
    if not exist "%KURT_PROFILE%\settings.json" goto KURT_PROFILE_MISSING

    call :RESTORE_FILE "settings.json"
    if errorlevel 1 goto MOVE_ERROR
    call :RESTORE_FILE "tmdb.json"
    if errorlevel 1 goto MOVE_ERROR
    call :RESTORE_FILE "google_calendar_token.json"
    if errorlevel 1 goto MOVE_ERROR
    call :RESTORE_FILE "maintenance_tmdb_cache.json"
    if errorlevel 1 goto MOVE_ERROR
)

> "%MARKER%.neu" echo %TARGET_ID%
move /Y "%MARKER%.neu" "%MARKER%" >nul
if errorlevel 1 goto MARKER_WRITE_ERROR

echo.
echo ============================================================
echo   FERTIG - AKTIVER SPIELER: %TARGET_NAME%
echo ============================================================
echo.
if /I "%TARGET_ID%"=="xaver_hoeger" (
    echo Xaver startet bei NULL:
    echo - leeres eigenes Archiv
    echo - kein Google-Kalender und keine Google-Anmeldung
    echo - kein TMDB-Key und kein Wartungs-Cache
) else (
    echo Kurts zuvor gesicherter SerKal-Zustand ist wieder aktiv.
)
echo.
pause
exit /b 0

:BACKUP_FILE
if exist "%SERKAL_DATA%\%~1" (
    copy /Y "%SERKAL_DATA%\%~1" "%BACKUP_PROFILE%\%~1" >nul
    if errorlevel 1 exit /b 1
)
exit /b 0

:STORE_FILE
if exist "%CURRENT_PROFILE%\%~1" del /Q "%CURRENT_PROFILE%\%~1" >nul 2>nul
if exist "%SERKAL_DATA%\%~1" (
    move /Y "%SERKAL_DATA%\%~1" "%CURRENT_PROFILE%\%~1" >nul
    if errorlevel 1 exit /b 1
)
exit /b 0

:RESTORE_FILE
if exist "%TARGET_PROFILE%\%~1" (
    move /Y "%TARGET_PROFILE%\%~1" "%SERKAL_DATA%\%~1" >nul
    if errorlevel 1 exit /b 1
)
exit /b 0

:DELETE_ACTIVE_FILE
if exist "%SERKAL_DATA%\%~1" del /Q "%SERKAL_DATA%\%~1" >nul 2>nul
exit /b 0

:PREPARE_EMPTY_XAVER
rem Alte Xaver-Testdaten gezielt entfernen.
if exist "%XAVER_PROFILE%\settings.json" del /Q "%XAVER_PROFILE%\settings.json" >nul 2>nul
if exist "%XAVER_PROFILE%\tmdb.json" del /Q "%XAVER_PROFILE%\tmdb.json" >nul 2>nul
if exist "%XAVER_PROFILE%\google_calendar_token.json" del /Q "%XAVER_PROFILE%\google_calendar_token.json" >nul 2>nul
if exist "%XAVER_PROFILE%\maintenance_tmdb_cache.json" del /Q "%XAVER_PROFILE%\maintenance_tmdb_cache.json" >nul 2>nul
if exist "%XAVER_ARCHIVE%" rmdir /S /Q "%XAVER_ARCHIVE%"
if exist "%XAVER_ARCHIVE%" exit /b 1
mkdir "%XAVER_ARCHIVE%"
if errorlevel 1 exit /b 1

rem Frische Grundeinstellung: eigenes leeres Archiv, keine Kalendervorgabe.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[ordered]@{setupDone=$false;archive=[ordered]@{folderPath=$env:XAVER_ARCHIVE};calendar=[ordered]@{mode='';googleCalendarId=''}};$j=$s|ConvertTo-Json -Depth 4;[IO.File]::WriteAllText((Join-Path $env:SERKAL_DATA 'settings.json'),$j+[Environment]::NewLine,(New-Object Text.UTF8Encoding($false)))"
if errorlevel 1 exit /b 1

rem TMDB, Google-Anmeldung und Wartungs-Cache bleiben absichtlich nicht vorhanden.
exit /b 0

:SERKAL_RUNNING
echo SerKal laeuft noch.
echo Bitte SerKal vollstaendig schliessen und diese Batch danach erneut starten.
goto FAILED

:CREATE_ERROR
echo Die Spielerordner konnten nicht angelegt werden:
echo "%PROFILE_ROOT%"
goto FAILED

:MARKER_ERROR
echo Die Markerdatei enthaelt einen unbekannten Spieler:
echo "%MARKER%"
echo.
echo Erlaubt sind nur kurt und xaver_hoeger.
goto FAILED

:COPY_ERROR
echo Kurts Sicherheitskopie vor dem Spielerwechsel ist fehlgeschlagen.
goto FAILED

:MOVE_ERROR
echo Mindestens eine SerKal-Datei konnte nicht umgeschaltet werden.
echo Kurts vorheriger Zustand liegt zusaetzlich hier:
echo "%BACKUP_PROFILE%"
goto FAILED

:XAVER_RESET_ERROR
echo Xavers leerer Testzustand konnte nicht sauber angelegt werden.
echo Kurts Daten liegen sicher in:
echo "%KURT_PROFILE%"
echo und zusaetzlich in:
echo "%BACKUP_PROFILE%"
goto FAILED

:KURT_PROFILE_MISSING
echo Kurts gespeicherte Grundeinstellungen wurden nicht gefunden:
echo "%KURT_PROFILE%\settings.json"
echo.
echo Der Wechsel wurde abgebrochen, damit kein leerer Zustand als Kurt startet.
goto FAILED

:MARKER_WRITE_ERROR
echo Der Spieler wurde umgeschaltet, aber die Markerdatei konnte nicht gespeichert werden.
echo Bitte SerKal noch nicht starten und den Fehler klaeren.
goto FAILED

:CANCELLED
echo.
echo Nicht umgeschaltet. Du bleibst %CURRENT_NAME%.
echo.
pause
exit /b 0

:FAILED
echo.
echo Spielerwechsel abgebrochen.
echo.
pause
exit /b 1
