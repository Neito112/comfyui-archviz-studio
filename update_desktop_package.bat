@echo off
chcp 65001 > nul
echo ========================================================
echo 📦 DANG CAP NHAT GOI CAI DAT DESKTOP (DIST_DESKTOP_BACKEND)
echo ========================================================
echo.
python backend/workflow_exporter.py
echo.
echo [✅] DA CAP NHAT TOAN BO CODE MOI SANG GOI DESKTOP THANH CONG!
echo.
pause