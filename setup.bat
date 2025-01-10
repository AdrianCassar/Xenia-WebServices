@echo off

:MENU
cls
echo Choose an option:
echo ==========================
echo 1. Setup Server
echo 2. Start Server
echo 3. Exit
set /p choice=Enter your choice: 

if "%choice%"=="1" goto SETUP_SERVER
if "%choice%"=="2" goto START_SERVER
if "%choice%"=="3" exit
goto MENU

:SETUP_SERVER
cls
echo ==========================
echo Setup Server
echo ==========================
echo Node.js version: & node --version
echo.
echo npm version: & call npm --version
echo.
pause
cls
echo Installing...
call npm install
echo.
echo Building...
call npm run build
echo.

:: Check if .env exists, just echo the result
if exist "%~dp0\.env" (
    echo .env already exists. Skipping renaming.
) else (
    echo .env does not exist. Renaming .env.template to .env...
    if exist "%~dp0\.env.template" (
        ren "%~dp0\.env.template" ".env"
        echo .env.template renamed to .env successfully.
    ) else (
        echo .env.template not found. Please check the setup.
    )
)

echo.
echo Server setup completed.
pause
goto MENU

:START_SERVER
cls
echo ==========================
echo Starting Server...
echo ==========================
start cmd /k "npm run start"
exit
