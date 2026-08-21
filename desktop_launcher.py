# -*- coding: utf-8 -*-
"""
🏡 Aetheris ArchViz AI Studio - Windows Desktop Application Launcher
"""
import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import time
import json
import webbrowser
from pathlib import Path

# Handle PyInstaller _MEIPASS bundle directory or local repo directory
if getattr(sys, 'frozen', False):
    BUNDLE_DIR = Path(sys._MEIPASS)
    BASE_DIR = Path(sys.executable).parent
else:
    BUNDLE_DIR = Path(__file__).resolve().parent
    BASE_DIR = BUNDLE_DIR

sys.path.insert(0, str(BUNDLE_DIR))
sys.path.insert(0, str(BASE_DIR))

def main():
    print("==================================================")
    print("🏛️ AETHERIS ARCHVIZ AI STUDIO (COMFYUI MINI DESKTOP)")
    print("==================================================")
    
    # 1. Check & run auto-updater on startup
    try:
        from backend.auto_updater import check_for_updates, perform_auto_update
        print("[*] Đang kiểm tra cập nhật từ GitHub...")
        info = check_for_updates()
        if info.get("has_update"):
            print(f"[🚀] {info.get('message')}")
            perform_auto_update()
    except Exception as e:
        print(f"[Info] Updater check: {e}")

    # 2. Auto open browser
    time.sleep(1)
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

    # 3. Start embedded backend server
    from backend.app import run_server
    run_server()

if __name__ == "__main__":
    main()
