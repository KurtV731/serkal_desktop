@echo off
setlocal
title SERKAL - Naechste Version

cd /d "C:\serkal_dev\serkal_desktop" || (
  echo FEHLER: Projektordner nicht gefunden.
  pause
  exit /b 1
)

echo.
echo Aktuelle Version:
node -p "require('./package.json').version"
echo.

echo Die letzte Stelle wird jetzt um 1 erhoeht.
echo Beispiel: 0.0.2 ^> 0.0.3
echo.

call npm version patch --no-git-tag-version

if errorlevel 1 (
  echo.
  echo FEHLER beim Erhoehen der Versionsnummer.
  pause
  exit /b 2
)

echo.
echo Neue Version:
node -p "require('./package.json').version"
echo.
echo package.json und package-lock.json wurden gemeinsam aktualisiert.
echo.
pause
endlocal
