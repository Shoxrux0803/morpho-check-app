@echo off
cd /d %~dp0
set "ROOT_DIR=%~dp0"
set "PYTHON_EXE=%ROOT_DIR%venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
    echo XATOLIK: Virtual muhit topilmadi! (d:\BOT\morpho-check-app\venv)
    pause
    exit /b 1
)

echo Backend papkasiga o'tilmoqda...
cd morphocheck_backend
echo ============================================
echo  Backend server http://localhost:8000 da
echo  Frontend http://localhost:3000 dan ishlaydi
echo  API docs: http://localhost:8000/docs
echo ============================================
echo Uvicorn serveri ishga tushirilmoqda (port 8000)...
"%PYTHON_EXE%" -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
