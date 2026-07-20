@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "EXT_DIR=%CD%"

powershell -NoProfile -Command "Set-Clipboard -Value (Get-Location).Path" >nul 2>&1
if errorlevel 1 echo %EXT_DIR%| clip

explorer "%EXT_DIR%"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE64=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME%" (
  start "" "%CHROME%" "chrome://extensions"
) else if exist "%CHROME86%" (
  start "" "%CHROME86%" "chrome://extensions"
) else if exist "%EDGE64%" (
  start "" "%EDGE64%" "edge://extensions"
) else if exist "%EDGE%" (
  start "" "%EDGE%" "edge://extensions"
) else (
  echo Buka manual: chrome://extensions
)

echo.
echo ========================================
echo  Remove TikTok — install shortcut
echo ========================================
echo  Path sudah di-clipboard:
echo  %EXT_DIR%
echo.
echo  1. Aktifkan Developer mode (kanan atas)
echo  2. Klik Load unpacked
echo  3. Ctrl+V di bar path folder, Enter
echo  4. Kembali ke dashboard, hard refresh
echo ========================================
echo.
pause
