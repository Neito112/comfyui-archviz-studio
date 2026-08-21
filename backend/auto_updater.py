# -*- coding: utf-8 -*-
"""
🔄 Aetheris Studio Auto-Updater Engine
Tự động quét GitHub Repository (Neito112/comfyui-archviz-studio) khi khởi động
và cập nhật mã nguồn / gói ứng dụng mới nhất về máy mà không làm gián đoạn người dùng.
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import json
import time
import subprocess
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_OWNER = "Neito112"
REPO_NAME = "comfyui-archviz-studio"
CURRENT_VERSION = "v1.0.0"

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, cwd=BASE_DIR, shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        return res.returncode == 0, res.stdout.strip(), res.stderr.strip()
    except Exception as e:
        return False, '', str(e)

def check_for_updates():
    """
    Kiểm tra cập nhật từ cả 2 nguồn:
    1. Git Origin Remote (Nếu đang ở trong Git repo)
    2. GitHub Releases API (Phiên bản phát hành chính thức)
    """
    update_info = {
        "current_version": CURRENT_VERSION,
        "has_update": False,
        "remote_version": CURRENT_VERSION,
        "update_type": "none",
        "message": "Ứng dụng đang ở phiên bản mới nhất.",
        "release_url": f"https://github.com/{REPO_OWNER}/{REPO_NAME}/releases"
    }

    # 1. Kiểm tra Git Repository
    is_git_repo = (BASE_DIR / ".git").exists()
    if is_git_repo:
        try:
            ok, _, _ = run_cmd("git fetch origin main")
            if ok:
                _, local_hash, _ = run_cmd("git rev-parse HEAD")
                _, remote_hash, _ = run_cmd("git rev-parse origin/main")
                if local_hash and remote_hash and local_hash != remote_hash:
                    update_info["has_update"] = True
                    update_info["update_type"] = "git_commits"
                    update_info["remote_version"] = f"Commit {remote_hash[:7]}"
                    update_info["message"] = f"Phát hiện bản cập nhật mới trên GitHub (Commit: {remote_hash[:7]})"
                    return update_info
        except Exception:
            pass

    # 2. Kiểm tra GitHub Releases API
    try:
        api_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/releases/latest"
        req = urllib.request.Request(api_url, headers={"User-Agent": "Aetheris-Studio-Updater"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                tag_name = data.get("tag_name", "")
                if tag_name and tag_name != CURRENT_VERSION:
                    update_info["has_update"] = True
                    update_info["update_type"] = "github_release"
                    update_info["remote_version"] = tag_name
                    update_info["message"] = f"Có phiên bản phát hành mới: {tag_name} - {data.get('name', '')}"
                    update_info["release_notes"] = data.get("body", "")
    except Exception:
        pass

    return update_info

def perform_auto_update():
    """Thực hiện cập nhật tự động an toàn"""
    print("==================================================")
    print("🔄 DANG TIEN HANH CAP NHAT TU DONG TU GITHUB...")
    print("==================================================")
    
    is_git_repo = (BASE_DIR / ".git").exists()
    if is_git_repo:
        # Sử dụng git_sync_guard an toàn
        guard_script = BASE_DIR / "backend" / "git_sync_guard.py"
        if guard_script.exists():
            ok, out, err = run_cmd(f"python {guard_script}")
            if ok:
                print("[✅] Đã tự động kéo mã nguồn mới nhất về máy thành công!")
                return True, "Cập nhật thành công!"
            else:
                print(f"[!] Quá trình cập nhật ghi nhận: {out} {err}")
                return False, err
        else:
            ok, out, err = run_cmd("git pull --rebase origin main")
            return ok, out if ok else err
    
    return False, "Không phát hiện Git repo để tự động pull"

if __name__ == "__main__":
    if "--check-on-start" in sys.argv:
        print("[*] Đang kiểm tra cập nhật từ GitHub...")
        info = check_for_updates()
        if info["has_update"]:
            print(f"[🚀] {info['message']}")
            print("[*] Đang tự động đồng bộ code mới nhất trước khi mở Studio...")
            perform_auto_update()
        else:
            print("[✅] Hệ thống đã ở phiên bản mới nhất!")
    else:
        info = check_for_updates()
        print(json.dumps(info, indent=2, ensure_ascii=False))
