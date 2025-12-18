@echo off
echo Starting Shibu Assistant Backend...
python -m uvicorn main:app --reload --port 8000
pause
