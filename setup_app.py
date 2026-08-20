# 🚀 Script Tự Động Khởi Tạo & Cài Đặt Ứng Dụng (Standalone Desktop Installer)
import os
import sys
import subprocess
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

from backend.model_downloader import ensure_all_models_downloaded

def setup_and_launch():
    print("=" * 65)
    print("🏡 Khởi Tạo Ứng Dụng Render Kiến Trúc & Nội Thất AI Standalone")
    print("=" * 65)

    # 1. Tự động kiểm tra & Tải đầy đủ AI Models cần thiết khi chạy trên máy mới
    print("\n1️⃣ Kiểm tra & Tải các AI Models cần thiết...")
    models_ready = ensure_all_models_downloaded()
    if not models_ready:
        print("⚠️ Cảnh báo: Có một số model chưa hoàn tất tải về. Bạn vẫn có thể tiếp tục.")

    # 2. Khóa cứng cấu hình Workflows API JSON
    print("\n2️⃣ Kiểm tra tính hợp lệ của Workflows ComfyUI API...")
    workflows_dir = BASE_DIR / "workflows"
    required_workflows = [
        "interior_controlnet_depth_api.json",
        "interior_sdxl_api.json",
        "interior_flux_api.json",
        "interior_text2img_api.json",
        "exterior_controlnet_depth_api.json",
        "exterior_sdxl_api.json",
        "exterior_flux_api.json",
        "exterior_text2img_api.json"
    ]
    for wf in required_workflows:
        wf_path = workflows_dir / wf
        if wf_path.exists():
            print(f"  ✓ Workflow locked & ready: {wf}")
        else:
            print(f"  ❌ Lỗi: Thiếu file workflow {wf}")

    # 3. Đóng gói bộ xuất Backend cho Desktop App
    print("\n3️⃣ Cập nhật dữ liệu build cho Desktop Backend Bundle...")
    try:
        from backend.workflow_exporter import export_desktop_backend_bundle
        export_desktop_backend_bundle()
    except Exception as e:
        print(f"  ⚠️ Lỗi xuất bundle: {e}")

    # 4. Khởi chạy API Server
    print("\n4️⃣ Khởi chạy API Server...")
    server_path = BASE_DIR / "backend" / "app.py"
    print(f"📍 Mở ứng dụng tại: http://127.0.0.1:8000")
    print("=" * 65)

    os.system(f"python3 {server_path}")

if __name__ == "__main__":
    setup_and_launch()
