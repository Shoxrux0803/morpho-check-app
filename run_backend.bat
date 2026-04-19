@echo off
cd /d %~dp0
echo Virtual muhit faollashtirilmoqda...
call venv\Scripts\activate
if %errorlevel% neq 0 (
    echo XATOLIK: Virtual muhit topilmadi! (d:\BOT\morpho-check-app\venv)
    pause
    exit /b %errorlevel%
)
echo Backend papkasiga o'tilmoqda...
cd morphocheck_backend
echo ============================================
echo  Backend server http://localhost:8000 da
echo  Frontend http://localhost:3000 dan ishlaydi
echo  API docs: http://localhost:8000/docs
echo ============================================
echo Uvicorn serveri ishga tushirilmoqda (port 8000)...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
