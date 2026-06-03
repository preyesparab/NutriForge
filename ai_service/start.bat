@echo off
echo.
echo ==========================================================
echo  PoseNutri AI Service — Setup ^& Start
echo ==========================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.9+ from python.org
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Create venv if needed
if not exist "venv\Scripts\activate.bat" (
    echo [1/3] Creating Python virtual environment...
    python -m venv venv
)

:: Activate
call venv\Scripts\activate.bat

:: Install / upgrade deps
echo [2/3] Installing requirements...
pip install -r requirements.txt --quiet

:: Start server
echo [3/3] Starting FastAPI on http://localhost:8000
echo       First run will download YOLOv8 food model weights (~50 MB)
echo.
uvicorn main:app --reload --port 8000 --host 0.0.0.0
