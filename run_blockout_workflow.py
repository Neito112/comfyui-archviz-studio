#!/usr/bin/env python3
"""
Script thử nghiệm Workflow Render Nội Thất Từ Hình Khối Cơ Bản (Blockout) qua ComfyUI API
"""

import os
import json
import time
from pathlib import Path
from backend.comfy_client import ComfyUIClient

BASE_DIR = Path("/home/neito/Documents/comfyui")
WORKFLOW_PATH = BASE_DIR / "workflows" / "interior_controlnet_depth_api.json"
INPUT_IMAGE_PATH = BASE_DIR / "input_blockout.png"

def run_blockout_render():
    print("=" * 65)
    print("🎨 Tác vụ: Render Nội Thất Từ Hình Khối Cơ Bản (Blockout to Render)")
    print("=" * 65)

    client = ComfyUIClient()

    if not client.is_alive():
        print("❌ Lỗi: Không thể kết nối tới ComfyUI tại http://127.0.0.1:8188")
        print("Hãy đảm bảo ComfyUI đang chạy.")
        return

    print("✅ Kết nối ComfyUI Server thành công!")

    # 1. Upload ảnh khối cơ bản (Blockout)
    if not INPUT_IMAGE_PATH.exists():
        print(f"⚠️ Không tìm thấy ảnh {INPUT_IMAGE_PATH}, đang tạo ảnh mẫu...")
        from create_sample_blockout import generate_sample_blockout
        generate_sample_blockout(str(INPUT_IMAGE_PATH))

    with open(INPUT_IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    print("📤 Đang tải ảnh blockout lên ComfyUI...")
    upload_res = client.upload_image(file_bytes, filename="input_blockout.png")
    if not upload_res:
        print("❌ Lỗi tải ảnh lên ComfyUI.")
        return
    print("✓ Tải ảnh thành công!")

    # 2. Đọc Workflow API JSON
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        wf = json.load(f)

    # Cập nhật prompt & cấu hình nếu cần
    wf["12"]["inputs"]["image"] = "input_blockout.png"

    # 3. Gửi lệnh tới Queue
    print("🚀 Đang gửi workflow tới hàng đợi render ComfyUI...")
    prompt_res = client.queue_prompt(wf)
    if not prompt_res or "prompt_id" not in prompt_res:
        print(f"❌ Lỗi khi enqueue prompt: {prompt_res}")
        return

    prompt_id = prompt_res["prompt_id"]
    print(f"⏳ Prompt ID: {prompt_id}. Đang tiến hành xử lý render (ControlNet Depth + KSampler)...")

    # 4. Lấy kết quả
    images = client.get_output_images(prompt_id, max_wait_sec=180)
    if images:
        print("\n🎉 RENDER HOÀN TẤT!")
        for img in images:
            print(f"🖼️  File xuất: {img['filename']}")
            print(f"🔗 URL: {img['url']}")
    else:
        print("⚠️ Hết thời gian chờ hoặc render chưa hoàn thành. Kiểm tra log ComfyUI.")

if __name__ == "__main__":
    run_blockout_render()
