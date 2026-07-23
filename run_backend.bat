@echo off
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%morphocheck_backend"
set "PYTHON_EXE=%BACKEND_DIR%\venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
    echo Virtual muhit topilmadi. Yaratilmoqda...
    where py >nul 2>nul
    if errorlevel 1 (
        echo XATOLIK: Python topilmadi. Python 3.11 yoki yangirog'ini o'rnating.
        pause
        exit /b 1
    )
    py -3 -m venv "%BACKEND_DIR%\venv"
    if errorlevel 1 (
        echo XATOLIK: Virtual muhitni yaratib bo'lmadi.
        pause
        exit /b 1
    )
)

"%PYTHON_EXE%" -c "import fastapi, uvicorn, sqlalchemy" >nul 2>nul
if errorlevel 1 (
    echo Backend kutubxonalari o'rnatilmoqda...
    "%PYTHON_EXE%" -m pip install --upgrade pip
    "%PYTHON_EXE%" -m pip install -r "%BACKEND_DIR%\requirements.txt"
    if errorlevel 1 (
        echo XATOLIK: Backend kutubxonalarini o'rnatib bo'lmadi.
        pause
        exit /b 1
    )
)

if not exist "%BACKEND_DIR%\.env" (
    for /f "delims=" %%S in ('"%PYTHON_EXE%" -c "import secrets; print(secrets.token_urlsafe(48))"') do set "GENERATED_SECRET=%%S"
    (
        echo # Avtomatik yaratilgan lokal konfiguratsiya
        echo DATABASE_URL=
        echo SECRET_KEY=%GENERATED_SECRET%
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=1440
        echo CACHE_BACKEND=memory
        echo DEBUG=true
        echo CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
        echo ALLOWED_HOSTS=localhost,127.0.0.1,testserver
        echo PORT=8000
        echo UVICORN_WORKERS=1
    ) > "%BACKEND_DIR%\.env"
    echo .env fayli yaratildi. Lokal rejimda SQLite ishlatiladi.
)

cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo XATOLIK: Backend papkasi topilmadi: %BACKEND_DIR%
    pause
    exit /b 1
)

echo ============================================
echo  Backend server http://localhost:8000 da
echo  Frontend http://localhost:3000 dan ishlaydi
echo  API docs: http://localhost:8000/docs
echo ============================================
echo Uvicorn serveri ishga tushirilmoqda (port 8000)...
"%PYTHON_EXE%" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
