import http.server
import socketserver
import json
import os
import sys
import time
import urllib.parse
import base64
from pathlib import Path
from PIL import Image
import io
import requests

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from backend.comfy_client import ComfyUIClient
from backend.native_engine import native_engine
from backend.hardware_checker import get_hardware_specs

PORT = int(os.environ.get("PORT", 8000))
FRONTEND_DIR = BASE_DIR / "frontend"
WORKFLOWS_DIR = BASE_DIR / "workflows"
GALLERY_DB_FILE = BASE_DIR / "backend" / "gallery_db.json"
SETTINGS_FILE = BASE_DIR / "backend" / "settings.json"

import gc

def purge_gpu_memory():
    """Tự động dọn dẹp RAM/VRAM và giải phóng bộ nhớ GPU CUDA để chống đơ/tràn bộ nhớ OOM."""
    gc.collect()
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.ipc_collect()
    except Exception:
        pass
OUTPUT_DIR = BASE_DIR / "frontend" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
UPSCALED_DIR = BASE_DIR / "frontend" / "upscaled"
UPSCALED_DIR.mkdir(parents=True, exist_ok=True)

comfy_client = ComfyUIClient()

import subprocess
import threading

def ensure_comfyui_core_running():
    """Tự động phát hiện và khởi chạy ComfyUI GPU Core Engine nếu chưa chạy."""
    if comfy_client.is_alive():
        print("⚡ ComfyUI Core Engine is already online at 127.0.0.1:8189!")
        return

    candidates = [
        (BASE_DIR / ".venv" / "bin" / "python", BASE_DIR / "main.py"),
        (BASE_DIR.parent / ".venv" / "bin" / "python", BASE_DIR.parent / "main.py"),
        (Path("/home/neito/ComfyUI-Installs/ComfyUI/ComfyUI/.venv/bin/python"), Path("/home/neito/ComfyUI-Installs/ComfyUI/ComfyUI/main.py"))
    ]

    selected_python = None
    selected_main = None

    for py_path, main_path in candidates:
        if py_path.exists() and main_path.exists():
            selected_python = py_path
            selected_main = main_path
            break

    if not selected_main:
        if (BASE_DIR / "main.py").exists():
            selected_python = Path(sys.executable)
            selected_main = BASE_DIR / "main.py"

    if selected_main and selected_python:
        models_dir = str(BASE_DIR / "models")
        print(f"🚀 Spawning ComfyUI Core Engine: {selected_python} {selected_main} --models-directory {models_dir}...")
        try:
            subprocess.Popen([
                str(selected_python), str(selected_main),
                "--port", "8189",
                "--listen", "127.0.0.1",
                "--models-directory", models_dir
            ], cwd=str(selected_main.parent), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(2)
        except Exception as e:
            print(f"⚠️ Unable to auto-spawn ComfyUI core: {e}")

threading.Thread(target=ensure_comfyui_core_running, daemon=True).start()

DEFAULT_SETTINGS = {
    "engine_mode": "local",  # "local" hoặc "cloud_api"
    "arch_model": "realistic_vision", # "realistic_vision", "sdxl", "flux"
    "cloud_provider": "gemini", # "gemini", "openai", "openrouter", etc.
    "api_key": "",
    "provider_keys": {}, # Key dictionary theo từng nhà cung cấp: {"gemini": "...", "openai": "..."}
    "custom_base_url": "",
    "cloud_model": "imagen-3.0-generate-002"
}

import threading

MODEL_DOWNLOAD_STATUS = {
    "is_downloading": False,
    "current_file": "",
    "progress_percent": 0,
    "downloaded_bytes": 0,
    "total_bytes": 0,
    "completed": False,
    "error": None
}

MODEL_MANIFEST = {
    "sd15": [
        {
            "filename": "v1-5-pruned-emaonly.safetensors",
            "folder": "checkpoints",
            "url": "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.safetensors"
        },
        {
            "filename": "Realistic_Vision_V5.1.safetensors",
            "folder": "checkpoints",
            "url": "https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/Realistic_Vision_V5.1.safetensors"
        },
        {
            "filename": "control_v11f1p_sd15_depth.pth",
            "folder": "controlnet",
            "url": "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11f1p_sd15_depth.pth"
        },
        {
            "filename": "control_v11p_sd15_inpaint.pth",
            "folder": "controlnet",
            "url": "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_inpaint.pth"
        },
        {
            "filename": "control_v11f1e_sd15_tile.pth",
            "folder": "controlnet",
            "url": "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11f1e_sd15_tile.pth"
        }
    ],
    "sdxl": [
        {
            "filename": "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors",
            "folder": "checkpoints",
            "url": "https://huggingface.co/RunDiffusion/Juggernaut-XL-v9/resolve/main/Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
        }
    ]
}

def check_and_download_local_models_async(models_dir_path, requested_arch=None):
    global MODEL_DOWNLOAD_STATUS
    if MODEL_DOWNLOAD_STATUS["is_downloading"]:
        return

    models_path = Path(models_dir_path)
    models_path.mkdir(parents=True, exist_ok=True)

    target_manifest = []
    if requested_arch == "sdxl":
        target_manifest = MODEL_MANIFEST.get("sdxl", [])
    elif requested_arch == "all":
        target_manifest = MODEL_MANIFEST.get("sd15", []) + MODEL_MANIFEST.get("sdxl", [])
    else:  # default sd15
        target_manifest = MODEL_MANIFEST.get("sd15", [])

    missing_models = []
    for item in target_manifest:
        subfolder = models_path / item["folder"]
        subfolder.mkdir(parents=True, exist_ok=True)
        file_path = subfolder / item["filename"]
        root_path = models_path / item["filename"]
        if not file_path.exists() and not root_path.exists():
            missing_models.append((item, file_path))

    if not missing_models:
        MODEL_DOWNLOAD_STATUS["is_downloading"] = False
        MODEL_DOWNLOAD_STATUS["completed"] = True
        MODEL_DOWNLOAD_STATUS["progress_percent"] = 100
        return

    def _download_thread():
        global MODEL_DOWNLOAD_STATUS
        MODEL_DOWNLOAD_STATUS["is_downloading"] = True
        MODEL_DOWNLOAD_STATUS["completed"] = False
        MODEL_DOWNLOAD_STATUS["error"] = None

        try:
            for item, dest_file in missing_models:
                MODEL_DOWNLOAD_STATUS["current_file"] = item["filename"]
                temp_file = dest_file.with_suffix(".downloading")

                download_success = False
                for attempt in range(1, 4):  # Tối đa 3 lần thử, không lặp vô tận
                    try:
                        existing_bytes = temp_file.stat().st_size if temp_file.exists() else 0
                        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                        if existing_bytes > 0:
                            headers["Range"] = f"bytes={existing_bytes}-"
                            print(f"📥 [Auto Model Downloader]: Tiếp tục tải tiếp {item['filename']} từ {existing_bytes / (1024*1024):.1f}MB...")
                        else:
                            print(f"📥 [Auto Model Downloader]: Bắt đầu tải {item['filename']}...")

                        resp = requests.get(item["url"], headers=headers, stream=True, timeout=30, allow_redirects=True)
                        if resp.status_code in [200, 206]:
                            if resp.status_code == 206:
                                content_range = resp.headers.get('content-range', '')
                                if '/' in content_range:
                                    total_size = int(content_range.split('/')[-1])
                                else:
                                    total_size = existing_bytes + int(resp.headers.get('content-length', 0))
                                mode_flag = "ab"
                                downloaded = existing_bytes
                            else:
                                total_size = int(resp.headers.get('content-length', 0))
                                mode_flag = "wb"
                                downloaded = 0

                            MODEL_DOWNLOAD_STATUS["total_bytes"] = total_size

                            with open(temp_file, mode_flag) as f:
                                for chunk in resp.iter_content(chunk_size=1024*1024):
                                    if chunk:
                                        f.write(chunk)
                                        downloaded += len(chunk)
                                        MODEL_DOWNLOAD_STATUS["downloaded_bytes"] = downloaded
                                        if total_size > 0:
                                            percent = int((downloaded / total_size) * 100)
                                            MODEL_DOWNLOAD_STATUS["progress_percent"] = percent

                            if total_size > 0 and downloaded < total_size:
                                print(f"⚠️ [Auto Model Downloader]: Mạng ngắt quãng ({downloaded}/{total_size} bytes). Thử lại...")
                                time.sleep(2)
                                continue

                            temp_file.rename(dest_file)
                            print(f"✅ [Auto Model Downloader]: Hoàn tất tải 100% {item['filename']}!")
                            download_success = True
                            break
                        else:
                            print(f"⚠️ [Auto Model Downloader] HTTP {resp.status_code} khi tải {item['filename']}")
                            if resp.status_code in [401, 403, 404]:
                                MODEL_DOWNLOAD_STATUS["error"] = f"HTTP {resp.status_code}: File không tồn tại hoặc yêu cầu cấp quyền"
                                break
                            time.sleep(2)
                    except Exception as e:
                        print(f"⚠️ [Auto Model Downloader Attempt {attempt} Error]: {e}")
                        time.sleep(2)

                if not download_success:
                    MODEL_DOWNLOAD_STATUS["error"] = f"Không thể tải {item['filename']}"
                    break
        finally:
            MODEL_DOWNLOAD_STATUS["is_downloading"] = False
            if not MODEL_DOWNLOAD_STATUS["error"]:
                MODEL_DOWNLOAD_STATUS["completed"] = True
                MODEL_DOWNLOAD_STATUS["progress_percent"] = 100

    t = threading.Thread(target=_download_thread, daemon=True)
    t.start()

def is_model_ready_for_arch(arch_model, models_dir_path):
    models_path = Path(models_dir_path)
    if arch_model == "sdxl":
        ckpt1 = models_path / "checkpoints" / "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
        ckpt2 = models_path / "checkpoints" / "Juggernaut_XL_v9.safetensors"
        return ckpt1.exists() or ckpt2.exists()
    elif arch_model == "flux":
        ckpt = models_path / "checkpoints" / "flux1-dev.safetensors"
        return ckpt.exists()
    else:  # realistic_vision (SD 1.5)
        rv5 = models_path / "checkpoints" / "Realistic_Vision_V5.1.safetensors"
        v15 = models_path / "checkpoints" / "v1-5-pruned-emaonly.safetensors"
        depth = models_path / "controlnet" / "control_v11f1p_sd15_depth.pth"
        return (rv5.exists() or v15.exists()) and depth.exists()

def load_settings():
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return {**DEFAULT_SETTINGS, **json.load(f)}
        except Exception:
            return DEFAULT_SETTINGS
    return DEFAULT_SETTINGS

def save_settings(data):
    current = load_settings()
    updated = {**current, **data}
    
    if "provider_keys" not in updated or not isinstance(updated["provider_keys"], dict):
        updated["provider_keys"] = {}
        
    current_provider = updated.get("cloud_provider", "gemini")
    if "api_key" in data:
        updated["provider_keys"][current_provider] = data["api_key"]
    elif current_provider in updated["provider_keys"]:
        updated["api_key"] = updated["provider_keys"][current_provider]

    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    return updated

def load_gallery():
    if GALLERY_DB_FILE.exists():
        try:
            with open(GALLERY_DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_gallery_item(item):
    # Nếu là tệp test thử nghiệm, tuyệt đối không đưa vào Kho Ảnh AI
    if item.get("is_test") or str(item.get("filename", "")).startswith("test_") or str(item.get("filename", "")).startswith("bench_"):
        return

    gallery = load_gallery()
    
    req_mode = str(item.get("mode", "")).lower()
    if req_mode in ["interior", "exterior"]:
        item["mode"] = req_mode
    else:
        prompt_str = str(item.get("prompt", "")).lower()
        fn_str = str(item.get("filename", "")).lower()
        if any(k in prompt_str or k in fn_str for k in ["exterior", "ngoại thất", "facade", "building", "villa", "outdoor"]):
            item["mode"] = "exterior"
        else:
            item["mode"] = "interior"

    remote_url = item.get("url", "")
    filename = item.get("filename", "")
    if filename and remote_url.startswith("http://127.0.0.1:8189"):
        try:
            resp = requests.get(remote_url, timeout=10)
            if resp.status_code == 200:
                local_dest = FRONTEND_DIR / "output" / filename
                local_dest.parent.mkdir(parents=True, exist_ok=True)
                local_dest.write_bytes(resp.content)
                item["url"] = f"/output/{filename}"
        except Exception as e:
            print(f"⚠️ Failed to cache gallery image locally: {e}")

    gallery.insert(0, item)
    with open(GALLERY_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(gallery, f, indent=2, ensure_ascii=False)

def handle_api_http_error(provider_name, status_code, response_text):
    if status_code == 429:
        raise Exception(f"API Key của nhà cung cấp [{provider_name.upper()}] đã vượt quá giới hạn truy cập miễn phí (Quota Exceeded 429). Vui lòng đổi sang API Key mới hoặc chuyển qua chế độ Model Local!")
    elif status_code == 401:
        raise Exception(f"API Key của nhà cung cấp [{provider_name.upper()}] không chính xác hoặc đã hết hạn (Unauthorized 401). Vui lòng kiểm tra lại Key!")
    else:
        raise Exception(f"Lỗi nhà cung cấp [{provider_name.upper()}] [{status_code}]: {response_text[:300]}")

def call_cloud_api(provider, api_key, prompt, negative_prompt="", width=1024, height=768, seed=42, input_image_b64="", custom_base_url="", cloud_model=""):
    """Thực thi gọi Cloud API từ danh sách đầy đủ các nhà cung cấp API tạo ảnh nổi tiếng hàng đầu."""
    if not api_key or not api_key.strip():
        raise ValueError("Vui lòng nhập API Key hợp lệ trong phần Cài Đặt (icon Bánh Răng)!")

    api_key = api_key.strip()

    # Tính toán Aspect Ratio tiêu chuẩn
    aspect_ratio = "1:1"
    if width > height:
        aspect_ratio = "16:9" if (width / height) > 1.4 else "4:3"
    elif height > width:
        aspect_ratio = "9:16" if (height / width) > 1.4 else "3:4"

    raw_b64 = input_image_b64.split(",")[-1] if (input_image_b64 and "," in input_image_b64) else input_image_b64
    img_bytes = base64.b64decode(raw_b64) if raw_b64 else None

    # 1. Google Gemini & Imagen 3 API
    if provider == "gemini":
        last_error = None
        
        # Nếu có ảnh đầu vào (sketch/CAD), ưu tiên dùng Gemini Multimodal Vision trước để khóa cứng hình học 3D 100%
        if raw_b64:
            gemini_models = ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash"]
            for model_name in gemini_models:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                parts = [
                    {"text": f"[STRICT ARCHITECTURAL GEOMETRY LOCK]: Examine the attached input architectural sketch/drawing image carefully. Generate a photorealistic 8K architectural render image that STRICTLY PRESERVES the exact building shape, contours, walls, windows, roofline, and 3D depth geometry of this input drawing. Transform this exact input drawing geometry into a high-end photorealistic render. Style details: {prompt}"},
                    {"inline_data": {"mime_type": "image/png", "data": raw_b64}}
                ]

                payload = {"contents": [{"parts": parts}]}
                try:
                    resp = requests.post(endpoint, json=payload, timeout=90)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            content_parts = candidates[0].get("content", {}).get("parts", [])
                            for part in content_parts:
                                if "inline_data" in part and "data" in part["inline_data"]:
                                    return Image.open(io.BytesIO(base64.b64decode(part["inline_data"]["data"])))
                                if "inlineData" in part and "data" in part["inlineData"]:
                                    return Image.open(io.BytesIO(base64.b64decode(part["inlineData"]["data"])))
                except Exception as e:
                    last_error = e
                    continue

        imagen_models = [
            "imagen-3.0-generate-002",
            "imagen-3.0-fast-generate-001",
            "imagen-3.0-capability-001"
        ]

        for img_model in imagen_models:
            imagen_endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{img_model}:predict?key={api_key}"
            imagen_payload = {
                "instances": [{"prompt": f"photorealistic 3D architectural render, {prompt}"}],
                "parameters": {"sampleCount": 1, "aspectRatio": aspect_ratio}
            }
            try:
                resp = requests.post(imagen_endpoint, json=imagen_payload, timeout=90)
                if resp.status_code == 200:
                    data = resp.json()
                    predictions = data.get("predictions", [])
                    if predictions and "bytesBase64Encoded" in predictions[0]:
                        return Image.open(io.BytesIO(base64.b64decode(predictions[0]["bytesBase64Encoded"])))
                else:
                    last_error = Exception(f"Google Imagen 3 API Error [{resp.status_code}]: {resp.text}")
            except Exception as e:
                last_error = e
                continue

        if last_error:
            try:
                encoded_prompt = urllib.parse.quote(f"photorealistic 3D architectural render, {prompt}")
                poll_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={seed}"
                p_resp = requests.get(poll_url, timeout=45)
                if p_resp.status_code == 200:
                    return Image.open(io.BytesIO(p_resp.content))
            except Exception:
                pass
            raise Exception("Lỗi gọi Cloud API (GEMINI): API Key của bạn chưa được kích hoạt quyền sử dụng dịch vụ Imagen 3 (Image Generation). Vui lòng chuyển sang nhà cung cấp OpenAI / OpenRouter / Replicate trong phần Cài Đặt!")

    # 2. OpenAI ChatGPT / DALL-E 3 API
    elif provider == "openai":
        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            if img_bytes:
                endpoint = "https://api.openai.com/v1/images/edits"
                files = {"image": ("input.png", img_bytes, "image/png")}
                data_payload = {
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "response_format": "b64_json"
                }
                resp = requests.post(endpoint, headers=headers, files=files, data=data_payload, timeout=90)
            else:
                endpoint = "https://api.openai.com/v1/images/generations"
                headers["Content-Type"] = "application/json"
                payload = {
                    "model": "dall-e-3",
                    "prompt": prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "response_format": "b64_json"
                }
                resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)

            if resp.status_code == 200:
                data = resp.json()
                b64_str = data["data"][0]["b64_json"]
                return Image.open(io.BytesIO(base64.b64decode(b64_str)))
            else:
                raise Exception(f"OpenAI Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[OpenAI API Error]: {e}")
            raise e

    # 3. Stability AI (Stable Diffusion 3.5 / SDXL)
    elif provider == "stability":
        endpoint = "https://api.stability.ai/v2beta/stable-image/generate/sd3"
        headers = {"Authorization": f"Bearer {api_key}", "Accept": "image/*"}
        data_payload = {
            "prompt": prompt,
            "output_format": "png",
            "aspect_ratio": aspect_ratio
        }
        files = {"none": ''}
        if img_bytes:
            data_payload["mode"] = "image-to-image"
            data_payload["strength"] = 0.7
            files = {"image": ("input.png", img_bytes, "image/png")}

        try:
            resp = requests.post(endpoint, headers=headers, files=files, data=data_payload, timeout=90)
            if resp.status_code == 200:
                return Image.open(io.BytesIO(resp.content))
            else:
                raise Exception(f"Stability AI Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[Stability AI Error]: {e}")
            raise e

    # 4. Fal.ai (FLUX.1 Schnell / Dev / Img2Img)
    elif provider == "fal":
        headers = {"Authorization": f"Key {api_key}", "Content-Type": "application/json"}
        if input_image_b64:
            endpoint = "https://fal.run/fal-ai/flux-general/image-to-image"
            payload = {
                "prompt": prompt,
                "image_url": input_image_b64 if input_image_b64.startswith("data:") else f"data:image/png;base64,{raw_b64}",
                "strength": 0.75
            }
        else:
            endpoint = "https://fal.run/fal-ai/flux/schnell"
            payload = {"prompt": prompt, "image_size": "square_hd" if aspect_ratio == "1:1" else "landscape_16_9"}

        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                img_url = data["images"][0]["url"]
                img_resp = requests.get(img_url, timeout=30)
                return Image.open(io.BytesIO(img_resp.content))
            else:
                raise Exception(f"Fal.ai Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[Fal.ai Error]: {e}")
            raise e

    # 5. Replicate API (FLUX.1 / ControlNet)
    elif provider == "replicate":
        endpoint = "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "Prefer": "wait"}
        input_params = {"prompt": prompt, "aspect_ratio": aspect_ratio}
        if input_image_b64:
            input_params["image"] = input_image_b64 if input_image_b64.startswith("data:") else f"data:image/png;base64,{raw_b64}"

        payload = {"input": input_params}
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=120)
            if resp.status_code in [200, 201]:
                data = resp.json()
                output = data.get("output", [])
                img_url = output[0] if isinstance(output, list) and len(output) > 0 else output
                if isinstance(img_url, str) and img_url.startswith("http"):
                    img_resp = requests.get(img_url, timeout=30)
                    return Image.open(io.BytesIO(img_resp.content))
                raise Exception(f"Replicate response: {data}")
            else:
                raise Exception(f"Replicate Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[Replicate Error]: {e}")
            raise e

    # 6. Together AI (FLUX.1 / SDXL)
    elif provider == "together":
        endpoint = "https://api.together.xyz/v1/images/generations"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "black-forest-labs/FLUX.1-schnell-Free",
            "prompt": prompt,
            "width": width,
            "height": height,
            "response_format": "b64_json"
        }
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                b64_str = data["data"][0]["b64_json"]
                return Image.open(io.BytesIO(base64.b64decode(b64_str)))
            else:
                raise Exception(f"Together AI Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[Together AI Error]: {e}")
            raise e

    # 7. Fireworks AI (FLUX.1 Fast)
    elif provider == "fireworks":
        endpoint = "https://api.fireworks.ai/inference/v1/image_generations"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "accounts/fireworks/models/flux-1-schnell-fp8",
            "prompt": prompt,
            "response_format": "b64_json"
        }
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                b64_str = data["data"][0]["b64_json"]
                return Image.open(io.BytesIO(base64.b64decode(b64_str)))
            else:
                raise Exception(f"Fireworks AI Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[Fireworks AI Error]: {e}")
            raise e

    # 8. DeepInfra (FLUX.1 / SDXL)
    elif provider == "deepinfra":
        endpoint = "https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX.1-schnell"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {"prompt": prompt, "width": width, "height": height}
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                img_b64 = data["images"][0].split(",")[-1]
                return Image.open(io.BytesIO(base64.b64decode(img_b64)))
            else:
                raise Exception(f"DeepInfra Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[DeepInfra Error]: {e}")
            raise e

    # 9. OpenRouter (Multi-Model AI Gateway)
    elif provider == "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000"
        }
        payload = {
            "model": "google/imagen-3",
            "messages": [{"role": "user", "content": prompt}]
        }
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                if "data:image" in content or "http" in content:
                    img_resp = requests.get(content, timeout=30)
                    return Image.open(io.BytesIO(img_resp.content))
                raise Exception(f"OpenRouter response: {content}")
            else:
                raise Exception(f"OpenRouter Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[OpenRouter Error]: {e}")
            raise e

    # 10. Custom API Base URL (OpenAI-Compatible Endpoint)
    elif provider == "custom":
        base_url = (custom_base_url.strip() or "https://api.openai.com/v1").rstrip("/")
        endpoint = f"{base_url}/images/generations"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": "default",
            "prompt": prompt,
            "n": 1,
            "response_format": "b64_json"
        }
        try:
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=90)
            if resp.status_code == 200:
                data = resp.json()
                b64_str = data["data"][0]["b64_json"]
                return Image.open(io.BytesIO(base64.b64decode(b64_str)))
            else:
                raise Exception(f"Custom API Error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            print(f"[Custom API Error]: {e}")
            raise e

    raise ValueError(f"Nhà cung cấp API [{provider}] chưa được hỗ trợ!")

class StudioAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        if hasattr(self, 'headers') and self.headers:
            try:
                if "If-Modified-Since" in self.headers:
                    del self.headers["If-Modified-Since"]
                if "If-None-Match" in self.headers:
                    del self.headers["If-None-Match"]
            except Exception:
                pass

        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/api/status":
            settings = load_settings()
            comfy_online = comfy_client.is_alive()
            default_models_dir = str(BASE_DIR / "models")
            self.send_json({
                "engine_mode": settings.get("engine_mode", "local"),
                "cloud_provider": settings.get("cloud_provider", "gemini"),
                "has_api_key": bool(settings.get("api_key", "").strip()),
                "comfyui_online": comfy_online,
                "standalone_engine_online": True,
                "engine_type": f"Cloud API ({settings.get('cloud_provider', 'gemini').upper()})" if settings.get("engine_mode") == "cloud_api" else ("ComfyUI Local" if comfy_online else "PyTorch Native"),
                "comfyui_host": comfy_client.host,
                "local_models_dir": settings.get("local_models_dir", default_models_dir),
                "has_configured_model_dir": bool(settings.get("local_models_dir", "").strip())
            })
        elif path == "/api/settings":
            settings = load_settings()
            provider_keys = settings.get("provider_keys", {})
            current_provider = settings.get("cloud_provider", "gemini")
            active_key = provider_keys.get(current_provider, settings.get("api_key", ""))

            key = active_key
            masked_key = key[:4] + "*" * (len(key) - 8) + key[-4:] if len(key) > 8 else ("****" if key else "")
            default_models_dir = str(BASE_DIR / "models")
            self.send_json({
                "engine_mode": settings.get("engine_mode", "local"),
                "cloud_provider": current_provider,
                "provider_keys": provider_keys,
                "api_key": active_key,
                "masked_api_key": masked_key,
                "custom_base_url": settings.get("custom_base_url", ""),
                "local_models_dir": settings.get("local_models_dir", default_models_dir),
                "has_configured_model_dir": bool(settings.get("local_models_dir", "").strip())
            })
        elif path == "/api/model-download-status":
            self.send_json(MODEL_DOWNLOAD_STATUS)
        elif path == "/api/hardware-specs":
            self.send_json(get_hardware_specs())
        elif path == "/api/gallery":
            self.send_json(load_gallery())
        elif path.startswith("/api/proxy-image"):
            query = urllib.parse.parse_qs(parsed_path.query)
            image_url = query.get("url", [""])[0]
            if image_url:
                try:
                    if image_url.startswith("http"):
                        resp = requests.get(image_url, timeout=15)
                        self.send_response(200)
                        self.send_header("Content-Type", resp.headers.get("Content-Type", "image/png"))
                        self.send_header("Access-Control-Allow-Origin", "*")
                        self.end_headers()
                        self.wfile.write(resp.content)
                        return
                    else:
                        local_path = FRONTEND_DIR / image_url.lstrip("/")
                        if local_path.exists() and local_path.is_file():
                            with open(local_path, "rb") as f:
                                self.send_response(200)
                                self.send_header("Content-Type", "image/png")
                                self.send_header("Access-Control-Allow-Origin", "*")
                                self.end_headers()
                                self.wfile.write(f.read())
                                return
                        else:
                            self.send_error(404, f"Local image file not found: {image_url}")
                            return
                except Exception as e:
                    self.send_error(500, str(e))
                    return
            self.send_error(400, "Missing url query param")
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        if path == "/api/settings":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8'))
                updated = save_settings(body)
                if updated.get("local_models_dir"):
                    check_and_download_local_models_async(updated["local_models_dir"], requested_arch=updated.get("arch_model", "sd15"))
                self.send_json({"success": True, "settings": updated})
            except Exception as e:
                self.send_json({"error": f"Lỗi lưu cài đặt: {str(e)}"}, status=400)

        elif path == "/api/render":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8'))
            except Exception:
                self.send_json({"error": "Invalid JSON payload"}, status=400)
                return

            purge_gpu_memory()
            settings = load_settings()
            engine_mode = body.get("engine_mode") or settings.get("engine_mode", "local")

            prompt_text = body.get("prompt", "")
            negative_prompt = body.get("negative_prompt", "blurry, low quality, distorted, bad proportions")
            steps = int(body.get("steps", 25))
            cfg = float(body.get("cfg", 7.0))  # Default 7.0 cho SD1.5; sẽ điều chỉnh SDXL→5.8 bên dưới
            seed = int(body.get("seed", 42))
            width = int(body.get("width", 1024))
            height = int(body.get("height", 768))
            input_image_b64 = body.get("input_image", "")
            mode = body.get("mode", "interior")

            region_defs = body.get("region_definitions", [])
            use_ref_mode = body.get("use_ref_image_mode", False)
            ref_images = body.get("reference_images", [])

            full_composed_prompt = prompt_text

            # Xử lý các Định Nghĩa Phân Vùng có gán thẻ Tag (@sofa, @san_go...)
            if region_defs:
                tag_parts = []
                for rdef in region_defs:
                    rtag = rdef.get("tag", "").strip()
                    rprompt = rdef.get("prompt", "").strip()
                    rhas_mask = rdef.get("has_mask", False)
                    if rtag:
                        part = f"[{rtag.upper()} MASK REGION" + (" WITH MASK]" if rhas_mask else "]")
                        if rprompt:
                            part += f": {rprompt}"
                        tag_parts.append(part)
                if tag_parts:
                    full_composed_prompt += f", " + ", ".join(tag_parts)

            # Nếu ở chế độ Ảnh Tham Chiếu Style / Material
            if use_ref_mode:
                ref_count = len(ref_images)
                if not full_composed_prompt:
                    full_composed_prompt = f"Synthesize and combine all architectural design characteristics, lighting, furniture textures, and materials from {ref_count} reference style images into high quality realistic render."
                else:
                    full_composed_prompt = f"[REFERENCE STYLE INSTRUCTIONS]: {full_composed_prompt}. Extract lighting, material textures, and aesthetic mood from {ref_count} reference images."

            # 1. Chế độ Cloud API Key (Gemini, OpenAI ChatGPT, OpenRouter...)
            if engine_mode == "cloud_api":
                provider = body.get("cloud_provider") or settings.get("cloud_provider", "gemini")
                provider_keys = settings.get("provider_keys", {})
                api_key = body.get("api_key") or provider_keys.get(provider) or settings.get("api_key", "")
                custom_url = body.get("custom_base_url") or settings.get("custom_base_url", "")
                cloud_model = body.get("cloud_model") or settings.get("cloud_model", "")

                if not api_key or not api_key.strip():
                    self.send_json({"error": "Bạn đang bật chế độ Cloud API nhưng chưa nhập API Key. Vui lòng bấm vào icon Bánh Răng để nhập API Key!"}, status=400)
                    return

                try:
                    cloud_img = call_cloud_api(
                        provider, api_key, full_composed_prompt, negative_prompt,
                        width, height, seed, input_image_b64,
                        custom_base_url=custom_url, cloud_model=cloud_model
                    )
                    fname = f"cloud_render_{int(time.time()*1000)}.png"
                    fpath = OUTPUT_DIR / fname
                    cloud_img.save(fpath, format="PNG")
                    img_url = f"/output/{fname}"

                    save_gallery_item({
                        "id": f"img_{int(time.time()*1000)}",
                        "mode": mode,
                        "prompt": f"[Cloud API - {provider.upper()}] {full_composed_prompt}",
                        "url": img_url,
                        "filename": fname,
                        "width": width, "height": height,
                        "timestamp": int(time.time())
                    })

                    self.send_json({"success": True, "engine": f"Cloud API ({provider.upper()})", "images": [{"filename": fname, "url": img_url}]})
                    return
                except Exception as e:
                    self.send_json({"error": f"Lỗi gọi Cloud API ({provider.upper()}): {str(e)}"}, status=500)
                    return

            # 2. Chế độ Local (Model Tiêu Chuẩn ComfyUI / PyTorch Native Downloader)
            hw_specs = get_hardware_specs()
            if engine_mode == "local" and hw_specs["tier"] == 3:
                self.send_json({"error": f"⚠️ {hw_specs['reason']}"}, status=400)
                return

            arch_model = body.get("arch_model", settings.get("arch_model", "realistic_vision"))
            if engine_mode == "local" and arch_model in ["sdxl", "flux"] and hw_specs["vram_gb"] < 8.0:
                self.send_json({"error": f"⚠️ Dòng Model [{arch_model.upper()}] yêu cầu GPU VRAM >= 8GB (VRAM hiện tại của bạn: {hw_specs['vram_gb']}GB). Vui lòng chuyển sang Realistic Vision V5.1 hoặc bật Cloud API Key!"}, status=400)
                return

            local_models_dir = settings.get("local_models_dir", str(BASE_DIR / "models"))
            check_and_download_local_models_async(local_models_dir, requested_arch=arch_model)

            if not is_model_ready_for_arch(arch_model, local_models_dir):
                if MODEL_DOWNLOAD_STATUS.get("is_downloading", False):
                    curr_f = MODEL_DOWNLOAD_STATUS.get("current_file", "Model AI")
                    pct = MODEL_DOWNLOAD_STATUS.get("progress_percent", 0)
                    self.send_json({
                        "error": f"⚠️ Đang tự động tải Model Local [{curr_f}] ({pct}%). Vui lòng chờ tải hoàn tất 100% trước khi Render dòng model này!"
                    }, status=400)
                    return
                else:
                    self.send_json({
                        "error": f"⚠️ Dòng Model [{arch_model.upper()}] chưa có trên đĩa cứng. Vui lòng chuyển sang Realistic Vision V5.1 (SD 1.5) đã có sẵn trên máy để Render ngay!"
                    }, status=400)
                    return

            if comfy_client.is_alive():
                has_input_img = bool(input_image_b64 and input_image_b64.strip())
                arch_model = body.get("arch_model", settings.get("arch_model", "realistic_vision"))

                # Phân rã Mode Alignment để tuyệt đối không bao giờ nhầm lẫn giữa Ngoại Thất & Nội Thất
                if mode == "exterior":
                    mode_prompt_prefix = "[EXTERIOR ARCHITECTURAL BUILDING FACADE & LANDSCAPE]: photorealistic 8K exterior building render, realistic glass, concrete, and timber materials, natural daylight, ArchDaily architectural photography, "
                    mode_negative_prefix = "interior, room, furniture, bed, sofa, kitchen, ceiling fan, indoor room, table, bookshelf, rug, carpet, "
                else:
                    mode_prompt_prefix = "[INTERIOR ARCHITECTURAL SPACE]: photorealistic 8K interior room render, realistic furniture, wood and stone materials, natural ambient lighting, ArchDaily interior photography, "
                    mode_negative_prefix = "exterior, building facade, street, sky, outdoor landscape, road, car, outdoor trees, "

                full_composed_prompt = f"{mode_prompt_prefix}{full_composed_prompt}"
                negative_prompt = f"{mode_negative_prefix}{negative_prompt}"

                # Nếu có ảnh input (Sketch/CAD/3D Blockout), BẮT BUỘC dùng Workflow ControlNet Depth Map để giữ 100% bố cục gốc
                if has_input_img:
                    workflow_file = WORKFLOWS_DIR / ("exterior_controlnet_depth_api.json" if mode == "exterior" else "interior_controlnet_depth_api.json")
                else:
                    if arch_model == "sdxl":
                        workflow_file = WORKFLOWS_DIR / ("exterior_sdxl_api.json" if mode == "exterior" else "interior_sdxl_api.json")
                    elif arch_model == "flux":
                        workflow_file = WORKFLOWS_DIR / ("exterior_flux_api.json" if mode == "exterior" else "interior_flux_api.json")
                    else:
                        workflow_file = WORKFLOWS_DIR / ("exterior_text2img_api.json" if mode == "exterior" else "interior_text2img_api.json")

                with open(workflow_file, 'r', encoding='utf-8') as f:
                    wf = json.load(f)

                if has_input_img and "12" in wf:
                    try:
                        img_bytes = base64.b64decode(input_image_b64.split(",")[-1])
                        upload_filename = f"input_{int(time.time()*1000)}.png"
                        upload_res = comfy_client.upload_image(img_bytes, filename=upload_filename)
                        if upload_res and "name" in upload_res:
                            wf["12"]["inputs"]["image"] = upload_res["name"]
                    except Exception as e:
                        print(f"⚠️ Image upload to ComfyUI failed: {e}")

                if has_input_img:
                    negative_prompt = f"sketch, line art, drawing, pencil lines, black and white, monochrome, paper texture, outline, wireframe, draft, {negative_prompt}"
                    if "10" in wf:
                        # Nghiên cứu: strength 0.70 + end_percent 0.75 tốt hơn 0.85/1.0
                        # Cho phép UNet tự do tổng hợp vật liệu ở 25% bước cuối cùng
                        wf["10"]["inputs"]["strength"] = 0.70
                        if "start_percent" in wf["10"]["inputs"]:
                            wf["10"]["inputs"]["start_percent"] = 0.0
                        if "end_percent" in wf["10"]["inputs"]:
                            wf["10"]["inputs"]["end_percent"] = 0.75

                rv5_path = BASE_DIR / "models" / "checkpoints" / "Realistic_Vision_V5.1.safetensors"
                sdxl_path1 = BASE_DIR / "models" / "checkpoints" / "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
                sdxl_path2 = BASE_DIR / "models" / "checkpoints" / "Juggernaut_XL_v9.safetensors"
                
                if arch_model == "sdxl" and (sdxl_path1.exists() or sdxl_path2.exists()):
                    selected_ckpt = sdxl_path1.name if sdxl_path1.exists() else sdxl_path2.name
                elif rv5_path.exists():
                    selected_ckpt = "Realistic_Vision_V5.1.safetensors"
                else:
                    selected_ckpt = "v1-5-pruned-emaonly.safetensors"

                # ══════════════════════════════════════════════════════════════
                # NGHIÊN CỨU LUỒNG 1: Tối ưu KSampler theo dòng model
                # SDXL: cfg=5.8, steps=28, sampler=dpmpp_2m_sde_gpu (loại bỏ CFG burn)
                # SD1.5: cfg=7.0, steps=25, sampler=dpmpp_sde (giữ nguyên baseline)
                # ══════════════════════════════════════════════════════════════
                is_sdxl_model = selected_ckpt.lower().startswith("juggernaut") or "sdxl" in selected_ckpt.lower()
                if is_sdxl_model:
                    optimized_cfg = 5.8
                    optimized_steps = 28
                    optimized_sampler = "dpmpp_2m_sde_gpu"
                    optimized_scheduler = "karras"
                else:
                    optimized_cfg = cfg  # Giữ default 7.0 cho SD1.5
                    optimized_steps = steps  # Giữ default 25
                    optimized_sampler = "dpmpp_sde"
                    optimized_scheduler = "karras"

                for node_id, node in wf.items():
                    c_type = node.get("class_type", "")
                    if c_type == "CheckpointLoaderSimple":
                        node["inputs"]["ckpt_name"] = selected_ckpt
                    elif c_type == "KSampler":
                        node["inputs"]["steps"] = optimized_steps
                        node["inputs"]["cfg"] = optimized_cfg
                        node["inputs"]["seed"] = seed
                        node["inputs"]["sampler_name"] = optimized_sampler
                        node["inputs"]["scheduler"] = optimized_scheduler
                        if has_input_img:
                            node["inputs"]["denoise"] = 1.0
                    elif c_type == "EmptyLatentImage":
                        node["inputs"]["width"] = width
                        node["inputs"]["height"] = height
                    elif c_type == "CLIPTextEncode":
                        title = node.get("_meta", {}).get("title", "")
                        if "Positive" in title or node_id == "6":
                            node["inputs"]["text"] = full_composed_prompt
                        elif "Negative" in title or node_id == "7":
                            node["inputs"]["text"] = negative_prompt

                res = comfy_client.queue_prompt(wf)
                if res and "prompt_id" in res:
                    images = comfy_client.get_output_images(res["prompt_id"], max_wait_sec=120)
                    if images:
                        save_gallery_item({
                            "id": f"img_{int(time.time()*1000)}",
                            "mode": mode,
                            "prompt": full_composed_prompt,
                            "url": images[0]["url"],
                            "filename": images[0]["filename"],
                            "width": width, "height": height,
                            "timestamp": int(time.time())
                        })
                        self.send_json({"success": True, "images": images, "engine": "Local ComfyUI GPU Engine"})
                        return
                    else:
                        self.send_json({"error": "ComfyUI GPU engine finished without producing output images."}, status=500)
                        return
                elif res and "node_errors" in res and res["node_errors"]:
                    self.send_json({"error": f"Lỗi Workflow ComfyUI: {json.dumps(res['node_errors'])}"}, status=400)
                    return

            # Standalone Native Local Model Execution
            input_pil = None
            if input_image_b64:
                img_bytes = base64.b64decode(input_image_b64.split(",")[-1])
                input_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")

            output_img = native_engine.generate_single(
                prompt=prompt_text, negative_prompt=negative_prompt,
                width=width, height=height, steps=steps, cfg=cfg, seed=seed,
                input_image_pil=input_pil
            )

            fname = f"standalone_render_{int(time.time()*1000)}.png"
            fpath = OUTPUT_DIR / fname
            output_img.save(fpath, format="PNG")
            img_url = f"/output/{fname}"

            save_gallery_item({
                "id": f"img_{int(time.time()*1000)}",
                "mode": mode,
                "prompt": prompt_text,
                "url": img_url,
                "filename": fname,
                "width": width, "height": height,
                "timestamp": int(time.time())
            })

            self.send_json({"success": True, "engine": "Standalone Native Engine", "images": [{"filename": fname, "url": img_url}]})

        elif path == "/api/render-multiview":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8'))
            except Exception:
                self.send_json({"error": "Invalid JSON payload"}, status=400)
                return

            settings = load_settings()
            engine_mode = body.get("engine_mode") or settings.get("engine_mode", "local")
            provider = body.get("cloud_provider") or settings.get("cloud_provider", "gemini")
            provider_keys = settings.get("provider_keys", {})
            api_key = body.get("api_key") or provider_keys.get(provider) or settings.get("api_key", "")
            custom_url = body.get("custom_base_url") or settings.get("custom_base_url", "")
            cloud_model = body.get("cloud_model") or settings.get("cloud_model", "")

            input_images = body.get("input_images", [])
            prompt_text = body.get("prompt", "")
            negative_prompt = body.get("negative_prompt", "blurry, low quality, distorted architecture, bad geometry, mismatching style")
            mode = body.get("mode", "interior")
            width = int(body.get("width", 1024))
            height = int(body.get("height", 768))
            master_seed = int(body.get("seed", 42)) or int(time.time())

            if engine_mode == "cloud_api" and not api_key.strip():
                self.send_json({"error": "Vui lòng nhập API Key hợp lệ trong phần Cài Đặt bánh răng!"}, status=400)
                return

            rendered_views = []
            coherent_prompt = f"[SINGLE SPACE MULTI-VIEW COHERENCE]: {prompt_text}. Maintain 100% material, furniture, lighting, texture, wall color, and structural architectural consistency across camera views."

            for idx, img_b64 in enumerate(input_images):
                view_num = idx + 1
                try:
                    if engine_mode == "cloud_api":
                        out_img = call_cloud_api(
                            provider, api_key, coherent_prompt, negative_prompt,
                            width, height, master_seed, img_b64,
                            custom_base_url=custom_url, cloud_model=cloud_model
                        )
                    else:
                        if comfy_client.is_alive():
                            workflow_file = WORKFLOWS_DIR / ("exterior_controlnet_depth_api.json" if mode == "exterior" else "interior_controlnet_depth_api.json")
                            with open(workflow_file, 'r', encoding='utf-8') as f:
                                wf = json.load(f)

                            img_bytes = base64.b64decode(img_b64.split(",")[-1])
                            upload_filename = f"multiview_{idx}_{int(time.time()*1000)}.png"
                            upload_res = comfy_client.upload_image(img_bytes, filename=upload_filename)
                            if upload_res and "name" in upload_res and "12" in wf:
                                wf["12"]["inputs"]["image"] = upload_res["name"]

                            if "10" in wf:
                                # Nghiên cứu Luồng 1: strength 0.70 + end_percent 0.75
                                wf["10"]["inputs"]["strength"] = 0.70
                                if "start_percent" in wf["10"]["inputs"]:
                                    wf["10"]["inputs"]["start_percent"] = 0.0
                                if "end_percent" in wf["10"]["inputs"]:
                                    wf["10"]["inputs"]["end_percent"] = 0.75

                            rv5_path = BASE_DIR / "models" / "checkpoints" / "Realistic_Vision_V5.1.safetensors"
                            sdxl_path1 = BASE_DIR / "models" / "checkpoints" / "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
                            sdxl_path2 = BASE_DIR / "models" / "checkpoints" / "Juggernaut_XL_v9.safetensors"
                            arch_model_mv = body.get("arch_model", "")
                            if arch_model_mv == "sdxl" and (sdxl_path1.exists() or sdxl_path2.exists()):
                                selected_ckpt = sdxl_path1.name if sdxl_path1.exists() else sdxl_path2.name
                            elif rv5_path.exists():
                                selected_ckpt = "Realistic_Vision_V5.1.safetensors"
                            else:
                                selected_ckpt = "v1-5-pruned-emaonly.safetensors"

                            # Tối ưu KSampler theo dòng model (đồng bộ với Single View)
                            is_sdxl = selected_ckpt.lower().startswith("juggernaut") or "sdxl" in selected_ckpt.lower()
                            mv_cfg = 5.8 if is_sdxl else 7.0
                            mv_steps = 28 if is_sdxl else 25
                            mv_sampler = "dpmpp_2m_sde_gpu" if is_sdxl else "dpmpp_sde"

                            for node_id, node in wf.items():
                                c_type = node.get("class_type", "")
                                if c_type == "CheckpointLoaderSimple":
                                    node["inputs"]["ckpt_name"] = selected_ckpt
                                elif c_type == "KSampler":
                                    node["inputs"]["steps"] = mv_steps
                                    node["inputs"]["cfg"] = mv_cfg
                                    node["inputs"]["seed"] = master_seed
                                    node["inputs"]["sampler_name"] = mv_sampler
                                    node["inputs"]["scheduler"] = "karras"
                                    node["inputs"]["denoise"] = 1.0
                                elif c_type == "EmptyLatentImage":
                                    node["inputs"]["width"] = width
                                    node["inputs"]["height"] = height
                                elif c_type == "CLIPTextEncode":
                                    title = node.get("_meta", {}).get("title", "")
                                    if "Positive" in title or node_id == "6":
                                        node["inputs"]["text"] = coherent_prompt
                                    elif "Negative" in title or node_id == "7":
                                        node["inputs"]["text"] = f"sketch, line art, drawing, pencil lines, monochrome, wireframe, {negative_prompt}"

                            res = comfy_client.queue_prompt(wf)
                            if res and "prompt_id" in res:
                                images = comfy_client.get_output_images(res["prompt_id"], max_wait_sec=120)
                                if images:
                                    out_resp = requests.get(f"{comfy_client.base_url}{images[0]['url']}", timeout=30)
                                    out_img = Image.open(io.BytesIO(out_resp.content))
                                else:
                                    raise Exception("ComfyUI MultiView finished without output image")
                            else:
                                raise Exception(f"ComfyUI queue prompt error: {res}")
                        else:
                            img_bytes = base64.b64decode(img_b64.split(",")[-1])
                            input_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                            out_img = native_engine.generate_single(prompt=coherent_prompt, negative_prompt=negative_prompt, width=width, height=height, seed=master_seed, input_image_pil=input_pil)

                    fname = f"sync_v{view_num}_{int(time.time()*1000)}.png"
                    fpath = OUTPUT_DIR / fname
                    out_img.save(fpath, format="PNG")
                    url = f"/output/{fname}"

                    rendered_views.append({"view_number": view_num, "url": url})
                    save_gallery_item({
                        "id": f"img_mv_{int(time.time())}_v{view_num}",
                        "mode": mode,
                        "prompt": f"[Đồng Bộ Góc {view_num}] {prompt_text}",
                        "url": url, "width": width, "height": height,
                        "timestamp": int(time.time())
                    })
                except Exception as e:
                    print(f"MultiView View {view_num} error: {e}")

            self.send_json({"success": True, "engine": engine_mode, "master_seed": master_seed, "total_views": len(rendered_views), "views": rendered_views})

        elif path == "/api/upscale":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                body = json.loads(post_data.decode('utf-8'))
            except Exception:
                self.send_json({"error": "Invalid JSON payload"}, status=400)
                return

            image_url = body.get("image_url", "")
            if not image_url:
                self.send_json({"error": "Missing image_url"}, status=400)
                return

            try:
                if image_url.startswith("/api/proxy-image?url="):
                    actual_url = urllib.parse.unquote(image_url.split("url=")[-1])
                else:
                    actual_url = image_url

                if actual_url.startswith("http"):
                    resp = requests.get(actual_url, timeout=15)
                    img = Image.open(io.BytesIO(resp.content))
                else:
                    local_path = FRONTEND_DIR / actual_url.lstrip("/")
                    img = Image.open(local_path)
                
                orig_w, orig_h = img.size
                new_w, new_h = orig_w * 2, orig_h * 2
                upscaled_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

                out_filename = f"upscaled_2x_{int(time.time()*1000)}.png"
                out_path = UPSCALED_DIR / out_filename
                upscaled_img.save(out_path, format="PNG", quality=95)

                upscaled_relative_url = f"/upscaled/{out_filename}"

                self.send_json({
                    "success": True,
                    "original_dimensions": f"{orig_w}x{orig_h}",
                    "upscaled_dimensions": f"{new_w}x{new_h}",
                    "upscaled_url": upscaled_relative_url
                })
            except Exception as e:
                self.send_json({"error": f"Lỗi tăng cường x2 ảnh: {str(e)}"}, status=500)
        else:
            self.send_json({"error": "Endpoint not found"}, status=404)

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2, ensure_ascii=False).encode('utf-8'))

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        params = urllib.parse.parse_qs(parsed.query)

        if path == "/api/gallery":
            item_id = params.get("id", [""])[0]
            if not item_id:
                self.send_json({"error": "Missing id parameter"}, status=400)
                return

            gallery = load_gallery()
            updated_gallery = []
            deleted_item = None

            for item in gallery:
                if item.get("id") == item_id:
                    deleted_item = item
                else:
                    updated_gallery.append(item)

            if deleted_item:
                with open(GALLERY_DB_FILE, "w", encoding="utf-8") as f:
                    json.dump(updated_gallery, f, indent=2, ensure_ascii=False)

                fn = deleted_item.get("filename", "")
                if fn:
                    local_f = FRONTEND_DIR / "output" / fn
                    if local_f.exists():
                        try:
                            local_f.unlink()
                        except Exception:
                            pass

                self.send_json({"success": True, "message": "Đã xóa ảnh khỏi kho thành công"})
            else:
                self.send_json({"error": "Không tìm thấy ảnh"}, status=404)
        else:
            self.send_json({"error": "Endpoint not found"}, status=404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True

def run_server():
    print(f"==================================================")
    print(f"🏡 Architecture & Interior AI Studio API Server (Multi-Threaded)")
    print(f"📍 Server running at: http://127.0.0.1:{PORT}")
    print(f"==================================================")
    with ThreadedHTTPServer(("127.0.0.1", PORT), StudioAPIHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
