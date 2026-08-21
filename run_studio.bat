@echo off
chcp 65001 > nul
echo ========================================================
echo 🏡 KHOI DONG AETHERIS ARCHVIZ AI STUDIO (COMFYUI MINI)
echo ========================================================
echo.
echo [*] Dang quet GitHub Repository de kiem tra ban cap nhat moi...
python backend/auto_updater.py --check-on-start
echo.
echo [*] Dang khoi dong may chu Aetheris Studio...
start http://127.0.0.1:8000
python backend/app.py
pause