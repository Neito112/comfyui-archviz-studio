# -*- coding: utf-8 -*-
"""
🚀 Aetheris Studio GitHub Release Publisher
Đóng gói thư mục dist_desktop_backend/ thành tệp Zip hoàn chỉnh
và tự động tạo Official Release trên GitHub qua GitHub CLI (gh).
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
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "dist_desktop_backend"
RELEASES_DIR = BASE_DIR / "releases_dist"
VERSION = "v1.0.0"

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, cwd=BASE_DIR, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        return res.returncode == 0, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return False, '', str(e)

def build_and_publish_release():
    print("==================================================")
    print(f"🚀 DANG XUAT BAN GITHUB RELEASE PHIEN BAN {VERSION}...")
    print("==================================================")

    # 1. Export fresh desktop bundle
    print("[*] 1. Xuất bản gói Desktop Portable mới nhất...")
    ok, out, err = run_cmd("python backend/workflow_exporter.py")
    if not ok:
        print(f"[!] Lỗi export bundle: {err}")
        return False

    # 2. Zip dist_desktop_backend folder
    RELEASES_DIR.mkdir(parents=True, exist_ok=True)
    zip_filename = f"Aetheris_ArchViz_Studio_{VERSION}_Portable"
    zip_output_path = RELEASES_DIR / zip_filename
    
    print(f"[*] 2. Đang nén toàn bộ gói ứng dụng thành file Zip: {zip_filename}.zip...")
    shutil.make_archive(str(zip_output_path), 'zip', DIST_DIR)
    full_zip_file = RELEASES_DIR / f"{zip_filename}.zip"
    print(f"[✅] Đã đóng gói thành công: {full_zip_file} ({round(full_zip_file.stat().st_size / (1024*1024), 2)} MB)")

    # 3. Create Git Tag if not exists
    run_cmd(f"git tag -a {VERSION} -m 'Release {VERSION}: ComfyUI Mini Standalone Studio'")
    run_cmd(f"git push origin {VERSION}")

    # 4. Publish to GitHub Releases via gh CLI
    print(f"[*] 3. Đang xuất bản Official Release lên GitHub Repository...")
    release_title = f"Aetheris ComfyUI ArchViz AI Studio {VERSION} (Standalone Desktop Edition)"
    release_notes = f"""# 🏛️ Aetheris ComfyUI ArchViz AI Studio {VERSION} - Official Desktop Release

Bản phát hành chính thức độc lập hoàn chỉnh dành cho Kiến Trúc Sư & Nhà Thiết Kế Nội/Ngoại Thất.

### ✨ Các Tính Năng Cốt Lõi:
- 🧠 **ComfyUI Mini Embedded Graph Engine**: Tự nạp và thực thi trực tiếp các Node Workflows chuẩn ComfyUI (`workflows/*.json`) mà không cần cài app ComfyUI ngoài.
- ⚡ **Multi-Tier Render Engine**: Hỗ trợ PyTorch GPU nội bộ + Cloud GPU 24/7 Serverless siêu tốc.
- ☁️ **Google Drive Auto-Sync**: Tự động đồng bộ và sao lưu 8K renders & metadata dự án lên Google Drive cá nhân.
- 🔄 **Auto-Updater**: Tự động quét repo GitHub và cập nhật code mới nhất mỗi khi khởi động.
- 🎨 **ArchViz Specialized Studio**: Đầy đủ tính năng Inpaint Canvas, Multi-View, Upscale 2x, Video Flythrough, Xuất layer Photoshop PSD.

### 📥 Cách Sử Dụng:
1. Tải file `{zip_filename}.zip` bên dưới.
2. Giải nén vào thư mục trên máy tính.
3. Nhấp đúp chuột vào `run_app.bat` để bắt đầu sáng tạo!
"""

    notes_file = RELEASES_DIR / "release_notes.md"
    with open(notes_file, "w", encoding="utf-8") as f:
        f.write(release_notes.strip())

    gh_cmd = f'gh release create {VERSION} "{full_zip_file}" --title "{release_title}" --notes-file "{notes_file}"'
    ok, out, err = run_cmd(gh_cmd)
    
    if not ok and "already exists" in err:
        print("[*] Release đã tồn tại, đang cập nhật file đính kèm mới...")
        gh_update_cmd = f'gh release upload {VERSION} "{full_zip_file}" --clobber'
        ok, out, err = run_cmd(gh_update_cmd)

    # 5. Upload .EXE installer if present
    exe_file = BASE_DIR / "dist" / "Aetheris_ArchViz_Studio_v1.0.0_Setup.exe"
    if exe_file.exists():
        print(f"[*] 4. Đang tải tệp cài đặt Windows Setup.exe lên GitHub Release...")
        ok_exe, out_exe, err_exe = run_cmd(f'gh release upload {VERSION} "{exe_file}" --clobber')
        if ok_exe:
            print(f"[✅] Đã tải lên file EXE thành công: {exe_file.name}")

    if ok:
        print(f"[🎉] XUẤT BẢN THÀNH CÔNG OFFICIAL GITHUB RELEASE!")
        print(f"🔗 Xem tại: https://github.com/Neito112/comfyui-archviz-studio/releases/tag/{VERSION}")
        return True
    else:
        print(f"[!] Quá trình xuất bản ghi nhận: {out} {err}")
        return False

if __name__ == "__main__":
    build_and_publish_release()
