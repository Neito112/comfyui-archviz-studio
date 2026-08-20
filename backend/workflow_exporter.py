import os
import sys
import shutil
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "dist_desktop_backend"

def export_desktop_backend_bundle():
    print(f"📦 Starting Desktop App Backend Export...")
    print(f"📁 Source: {BASE_DIR}")
    print(f"🎯 Output Target: {DIST_DIR}")

    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Copy Workflows JSON
    shutil.copytree(BASE_DIR / "workflows", DIST_DIR / "workflows")

    # 2. Copy Backend Python API & Clients
    shutil.copytree(BASE_DIR / "backend", DIST_DIR / "backend")

    # 3. Copy Frontend Studio assets
    shutil.copytree(BASE_DIR / "frontend", DIST_DIR / "frontend")

    # 4. Generate Desktop App Configuration & Entry points
    manifest = {
        "appName": "Architecture AI Studio Portable Desktop App",
        "version": "1.2.0",
        "description": "Standalone Portable App Distribution Package for Interior & Exterior AI Architecture Studio",
        "entry_backend": "backend/app.py",
        "default_port": 8000,
        "comfyui_default_host": "127.0.0.1:8189",
        "workflows": {
            "interior_controlnet": "workflows/interior_controlnet_depth_api.json",
            "interior_sdxl": "workflows/interior_sdxl_api.json",
            "interior_flux": "workflows/interior_flux_api.json",
            "interior_text2img": "workflows/interior_text2img_api.json",
            "exterior_controlnet": "workflows/exterior_controlnet_depth_api.json",
            "exterior_sdxl": "workflows/exterior_sdxl_api.json",
            "exterior_flux": "workflows/exterior_flux_api.json",
            "exterior_text2img": "workflows/exterior_text2img_api.json"
        }
    }

    with open(DIST_DIR / "desktop_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    # 5. Create Portable App Launcher Script (GUI & Auto Model Dir Selector)
    portable_launcher_py = """# Portable Desktop App Launcher & Auto Model Directory Manager
import os
import sys
import json
import webbrowser
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

def initialize_portable_environment():
    print("==================================================")
    print("🏡 Architecture & Interior AI Studio (Portable App)")
    print("==================================================")
    
    settings_file = BASE_DIR / "backend" / "settings.json"
    settings = {}
    if settings_file.exists():
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                settings = json.load(f)
        except Exception:
            pass

    # Nếu người dùng phân phối ứng dụng cho khách hàng chưa có đường dẫn models:
    local_dir = settings.get("local_models_dir")
    if not local_dir or not Path(local_dir).exists():
        default_dir = str(BASE_DIR / "models")
        print(f"📍 Lần đầu khởi tạo Portable App: Thiết lập thư mục lưu models tại {default_dir}")
        Path(default_dir).mkdir(parents=True, exist_ok=True)
        settings["local_models_dir"] = default_dir
        settings["has_configured_model_dir"] = True
        settings_file.parent.mkdir(parents=True, exist_ok=True)
        with open(settings_file, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)

    print("🚀 Bắt đầu máy chủ ứng dụng Portable App...")
    
    # Khởi động trình duyệt ứng dụng
    webbrowser.open("http://127.0.0.1:8000")

    from backend.app import run_server
    run_server()

if __name__ == "__main__":
    initialize_portable_environment()
"""
    with open(DIST_DIR / "portable_app_launcher.py", "w", encoding="utf-8") as f:
        f.write(portable_launcher_py)

    with open(DIST_DIR / "main_desktop_backend.py", "w", encoding="utf-8") as f:
        f.write(portable_launcher_py)

    print(f"✅ Portable Desktop App bundle exported successfully!")
    print(f"📍 Location: {DIST_DIR}")
    print(f"💡 Distribution Bundle Ready for packaging into standalone EXE / AppImage / Portable zip.")
    return DIST_DIR

if __name__ == "__main__":
    export_desktop_backend_bundle()
