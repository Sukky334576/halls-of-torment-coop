@echo off
title Torment of Souls - Game Launcher
echo ===================================================
echo     TORMENT OF SOULS (4-Player Co-op Survival)
echo ===================================================
echo Starting WebSocket Dedicated Server on ws://localhost:8080...
start cmd /k "npm run server"

timeout /t 2 /nobreak >nul

echo Starting WebGL Client on http://localhost:3000...
start cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
start http://localhost:3000
echo.
echo Game is ready! Open http://localhost:3000 in up to 4 browser tabs to test co-op.
pause
