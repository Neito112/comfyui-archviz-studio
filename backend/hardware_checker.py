import subprocess
import shutil
import sys

def get_hardware_specs():
    specs = {
        "gpu_name": "CPU / No CUDA GPU",
        "vram_gb": 0.0,
        "ram_gb": 0.0,
        "cuda_available": False,
        "tier": 3, # 1: High (>=8GB VRAM), 2: Med (4-8GB VRAM), 3: Low (<4GB VRAM)
        "recommended_mode": "cloud_api",
        "supported_models": ["cloud_api_only"],
        "reason": "Không tìm thấy GPU NVIDIA CUDA đủ điều kiện"
    }

    # 1. Inspect System RAM
    try:
        import psutil
        specs["ram_gb"] = round(psutil.virtual_memory().total / (1024 ** 3), 1)
    except Exception:
        specs["ram_gb"] = 8.0

    # 2. Inspect PyTorch CUDA VRAM if torch is available
    try:
        import torch
        if torch.cuda.is_available():
            specs["cuda_available"] = True
            specs["gpu_name"] = torch.cuda.get_device_name(0)
            total_vram_bytes = torch.cuda.get_device_properties(0).total_memory
            specs["vram_gb"] = round(total_vram_bytes / (1024 ** 3), 1)
    except Exception:
        pass

    # 3. Fallback nvidia-smi inspection if PyTorch isn't directly imported in main process
    if not specs["cuda_available"] and shutil.which("nvidia-smi"):
        try:
            cmd = ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"]
            output = subprocess.check_output(cmd, encoding="utf-8").strip()
            if output:
                line = output.split("\n")[0]
                parts = line.split(",")
                if len(parts) >= 2:
                    specs["cuda_available"] = True
                    specs["gpu_name"] = parts[0].strip()
                    vram_mb = float(parts[1].strip())
                    specs["vram_gb"] = round(vram_mb / 1024.0, 1)
        except Exception:
            pass

    # 4. Evaluate Tier & Supported Models
    vram = specs["vram_gb"]
    if specs["cuda_available"] and vram >= 8.0:
        specs["tier"] = 1
        specs["recommended_mode"] = "local"
        specs["supported_models"] = ["realistic_vision", "sdxl", "flux"]
        specs["reason"] = f"Cấu hình GPU cao ({specs['gpu_name']} - {vram} GB VRAM). Chạy mượt tất cả Model Local SD1.5, SDXL và FLUX.1!"
    elif specs["cuda_available"] and vram >= 4.0:
        specs["tier"] = 2
        specs["recommended_mode"] = "local"
        specs["supported_models"] = ["realistic_vision"]
        specs["reason"] = f"Cấu hình GPU trung bình ({specs['gpu_name']} - {vram} GB VRAM). Khuyến nghị chạy Model Realistic Vision V5.1 (SD 1.5). Dòng SDXL & FLUX yêu cầu VRAM >= 8GB!"
    else:
        specs["tier"] = 3
        specs["recommended_mode"] = "cloud_api"
        specs["supported_models"] = ["cloud_api_only"]
        specs["reason"] = f"Cấu hình máy của bạn ({specs['gpu_name']} - VRAM {vram} GB) chưa đủ tối thiểu 4GB VRAM để chạy AI Model Local. Ứng dụng tự động kích hoạt chế độ Cloud API để đảm bảo tốc độ tạo ảnh siêu nhanh 8K mà không gây treo máy!"

    return specs

if __name__ == "__main__":
    import json
    print(json.dumps(get_hardware_specs(), indent=2, ensure_ascii=False))
