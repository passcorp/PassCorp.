@echo off
title PASS CORP. Invotor ERP ^& Invoicing
echo Starting PASS CORP Invotor...

:: Try to launch Chrome in app mode (frameless standalone window)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app=https://passcorp.in/invotor.html
    exit
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app=https://passcorp.in/invotor.html
    exit
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app=https://passcorp.in/invotor.html
    exit
)

:: Try to launch Microsoft Edge in app mode
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app=https://passcorp.in/invotor.html
    exit
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app=https://passcorp.in/invotor.html
    exit
)

:: Fallback standard browser open
start https://passcorp.in/invotor.html
