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
echo Uvicorn serveri ishga tushirilmoqda...
uvicorn main:app --reload
pause
