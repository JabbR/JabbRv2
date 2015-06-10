@echo off
cd %~dp0

IF EXIST artifacts\ RMDIR /S /Q artifacts\
IF EXIST src\JabbR\wwwroot\lib\ RMDIR /S /Q src\JabbR\wwwroot\lib\

SETLOCAL
SET CACHED_DNVM=%USERPROFILE%\.dnx\bin\dnvm.cmd
SET DNX_UNSTABLE_FEED=https://www.myget.org/F/aspnetrelease/api/v2

IF EXIST %CACHED_DNVM% GOTO dnvminstall
echo Installing dnvm
@powershell -NoProfile -ExecutionPolicy unrestricted -Command "&{$Branch='dev';iex ((new-object net.webclient).DownloadString('https://raw.githubusercontent.com/aspnet/Home/dev/dnvminstall.ps1'))}"

:dnvminstall
echo Installing dnx...
CALL dnvm install 1.0.0-beta5-11911 -u

echo Restoring...
CALL dnu restore src/JabbR

echo Publishing...
CALL dnu publish src/JabbR --no-source --out artifacts/build/jabbr --runtime active
