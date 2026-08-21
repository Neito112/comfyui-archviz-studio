# -*- coding: utf-8 -*-
"""
💻 Aetheris Studio Windows Setup Builder (.EXE)
Đóng gói bộ cài đặt Setup.exe hoàn chỉnh và đồng bộ lên GitHub Releases
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import shutil
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "dist"
VERSION = "v1.0.0"

def build_installer():
    print("==================================================")
    print(f"📦 DANG TAO BO CAI DAT WINDOWS SETUP .EXE ({VERSION})...")
    print("==================================================")

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    exe_target = DIST_DIR / f"Aetheris_ArchViz_Studio_{VERSION}_Setup.exe"

    # Compile with PyInstaller into dist/
    cmd = (
        f'pyinstaller --onefile --noconsole '
        f'--name "Aetheris_ArchViz_Studio_{VERSION}_Setup" '
        f'--exclude-module torch --exclude-module torchvision --exclude-module transformers '
        f'--exclude-module scipy --exclude-module matplotlib '
        f'desktop_launcher.py'
    )
    print(f"[*] Đang biên dịch: {cmd}")
    res = subprocess.run(cmd, cwd=BASE_DIR, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    
    if exe_target.exists():
        size_mb = round(exe_target.stat().st_size / (1024 * 1024), 2)
        print(f"[✅] BIÊN DỊCH THÀNH CÔNG TỆP CÀI ĐẶT: {exe_target} ({size_mb} MB)")
        return True, exe_target
    else:
        print(f"[!] Lỗi biên dịch: {res.stderr}")
        return False, None

if __name__ == "__main__":
    build_installer()
