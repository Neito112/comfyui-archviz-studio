@echo off
chcp 65001 > nul
echo ========================================================
echo 🏡 KHOI DONG AETHERIS ARCHVIZ AI STUDIO (COMFYUI MINI)
echo ========================================================
echo.
start http://127.0.0.1:8000
python backend/app.py
pause