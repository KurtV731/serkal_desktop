@echo off
echo Dieser Zweig enthaelt bereits die gemeinsame Ersatzfassung 34. Bitte den aktuellen Ersatz-Bauweg verwenden.
exit /b 1
rem Vorheriger Testbau bleibt unten als Referenz.
@echo off
setlocal
cd /d "%~dp0"
title SerKal - isolierten Sitzungstest 33 bauen
echo Diese Testfassung verwendet ein eigenes Profil und ein eigenes Google-Testarchiv.
echo Der echte Google-Kalender ist fuer diesen ersten Archivtest deaktiviert.
call npm ci
if errorlevel 1 goto failed
call npm test
if errorlevel 1 goto failed
call npm run package -- --platform=win32 --arch=x64
if errorlevel 1 goto failed
echo.
echo Testprogramm: "%~dp0out\SerKal Session Test 33-win32-x64\SerKal Session Test 33.exe"
echo Den gesamten Programmordner zusammenlassen. Keine Datei ins oeffentliche Downloadverzeichnis kopieren.
pause
exit /b 0
:failed
echo Testbau fehlgeschlagen. Keine Datei veroeffentlichen.
pause
exit /b 1
