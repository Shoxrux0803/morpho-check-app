@echo off
echo Starting MorphoCheck Pro...

:: Start Backend
start cmd /k "cd morphocheck_backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Start Frontend
start cmd /k "npm start"

echo Servers are starting. 
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Superadmin: admin@morphocheck.uz / admin123
