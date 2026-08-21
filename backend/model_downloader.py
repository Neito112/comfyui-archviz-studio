import os
import sys
import urllib.request
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
COMFYUI_MODELS_DIR = BASE_DIR / "models"

REQUIRED_MODELS = {
    "checkpoints": [
        {
            "name": "v1-5-pruned-emaonly.safetensors",
            "url": "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors",
            "dir": "checkpoints"
        },
        {
            "name": "Realistic_Vision_V5.1.safetensors",
            "url": "https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/Realistic_Vision_V5.1.safetensors",
            "dir": "checkpoints"
        }
    ],
    "controlnet": [
        {
            "name": "control_v11f1p_sd15_depth.pth",
            "url": "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11f1p_sd15_depth.pth",
            "dir": "controlnet"
        },
        {
            "name": "control_v11p_sd15_inpaint.pth",
            "url": "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_inpaint.pth",
            "dir": "controlnet"
        },
        {
            "name": "control_v11f1e_sd15_tile.pth",
            "url": "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11f1e_sd15_tile.pth",
            "dir": "controlnet"
        }
    ]
}

def download_file_with_progress(url, dest_path):
    print(f"📥 Đang tải model: {dest_path.name}...")
    print(f"🔗 Source: {url}")
    
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_dest = dest_path.with_suffix(dest_path.suffix + ".tmp")

    def progress_callback(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = (downloaded / total_size) * 100
            mb_downloaded = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024)
            sys.stdout.write(f"\r progress: {percent:.1f}% ({mb_downloaded:.1f} MB / {mb_total:.1f} MB)")
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, temp_dest, reporthook=progress_callback)
        print("\n✅ Tải thành công!")
        os.rename(temp_dest, dest_path)
        return True
    except Exception as e:
        print(f"\n❌ Lỗi khi tải model {dest_path.name}: {e}")
        if temp_dest.exists():
            temp_dest.unlink()
        return False

def ensure_all_models_downloaded(models_root=COMFYUI_MODELS_DIR):
    print("🔍 Kiểm tra tính sẵn sàng của các AI Models...")
    all_ready = True

    for category, model_list in REQUIRED_MODELS.items():
        cat_dir = models_root / category
        cat_dir.mkdir(parents=True, exist_ok=True)

        for model in model_list:
            model_path = cat_dir / model["name"]
            if not model_path.exists() or model_path.stat().st_size < 100 * 1024 * 1024:
                print(f"⚠️ Thiếu model: {model['name']}. Tiến hành tự động tải về...")
                success = download_file_with_progress(model["url"], model_path)
                if not success:
                    all_ready = False
            else:
                print(f"✨ Model sẵn sàng: {model['name']}")

    return all_ready

if __name__ == "__main__":
    ensure_all_models_downloaded()
