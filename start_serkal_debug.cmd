@echo off
setlocal
cd /d "%~dp0"
set "SERKAL_DEBUG=1"
echo SERKAL Desktop wird im Debugmodus gestartet.
echo Die Entwicklerwerkzeuge oeffnen sich automatisch in einem zweiten Fenster.
npm start
endlocal
