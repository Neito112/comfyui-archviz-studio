"""
🏡 Aetheris ArchViz AI Studio — Modal.com Serverless GPU Service
⚡ Tự động BẬT khi có người dùng bấm Render
💤 Tự động TẮT VỀ 0 (Scale-to-Zero) sau 60s khi không ai sử dụng (Hoàn toàn miễn phí $30/tháng)
"""

import os
import subprocess
import json
import base64
import time
import urllib.request
import modal
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

app = modal.App("aetheris-archviz-studio")

# Xây dựng Docker Image chuyên dụng với CUDA 12.1 + ComfyUI + Checkpoint + ControlNet
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "wget", "aria2", "ffmpeg", "libgl1-mesa-glx", "libglib2.0-0")
    .pip_install(
        "torch==2.3.1+cu121",
        "torchvision==0.18.1+cu121",
        "torchaudio==2.3.1+cu121",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install("pillow", "requests", "fastapi[standard]")
    .run_commands(
        "git clone --depth 1 https://github.com/comfyanonymous/ComfyUI /root/ComfyUI",
        "cd /root/ComfyUI && pip install -r requirements.txt",
        "git clone --depth 1 https://github.com/Fannovel16/comfyui_controlnet_aux /root/ComfyUI/custom_nodes/comfyui_controlnet_aux",
        "mkdir -p /root/ComfyUI/models/checkpoints /root/ComfyUI/models/controlnet",
        "aria2c -x 16 -s 16 -k 1M -c -d /root/ComfyUI/models/checkpoints -o Realistic_Vision_V5.1.safetensors https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/Realistic_Vision_V5.1_fp16-no-ema.safetensors",
        "aria2c -x 16 -s 16 -k 1M -c -d /root/ComfyUI/models/controlnet -o control_v11f1p_sd15_depth.pth https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11f1p_sd15_depth.pth"
    )
)

web_app = FastAPI(title="Aetheris Studio Serverless API")
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.cls(
    image=image,
    gpu="T4",
    container_idle_timeout=60, # Tự động tắt máy ảo về 0 sau 60s rảnh
    timeout=600,
    scaledown_window=60
)
class ComfyUIService:
    @modal.enter()
    def startup(self):
        """Khởi động ComfyUI GPU trong container khi có request đầu tiên."""
        print("🚀 [Modal Serverless] Đang khởi động ComfyUI Engine...")
        self.process = subprocess.Popen([
            "python", "/root/ComfyUI/main.py",
            "--port", "8188",
            "--listen", "127.0.0.1",
            "--highvram",
            "--dont-print-server"
        ])
        for _ in range(40):
            try:
                req = urllib.request.Request("http://127.0.0.1:8188/system_stats")
                with urllib.request.urlopen(req, timeout=1) as resp:
                    if resp.status == 200:
                        print("✅ [Modal Serverless] ComfyUI Engine sẵn sàng!")
                        break
            except Exception:
                pass
            time.sleep(1)

    @modal.exit()
    def shutdown(self):
        """Dọn dẹp tiến trình khi tắt máy ảo."""
        if hasattr(self, 'process') and self.process:
            self.process.terminate()

    @modal.asgi_app()
    def api_endpoints(self):
        @web_app.get("/api/status")
        def status():
            return {
                "status": "online",
                "engine_mode": "modal_serverless",
                "arch_model": "realistic_vision",
                "gpu": "NVIDIA Tesla T4 (Serverless Auto-Scale)"
            }

        @web_app.post("/api/render")
        def render_endpoint(data: dict):
            import requests, io, uuid
            from PIL import Image

            prompt = data.get("prompt", "")
            input_image_b64 = data.get("input_image", "")
            mode = data.get("mode", "interior")

            # Workflow ControlNet Depth SD1.5 tiêu chuẩn
            workflow_path = f"/root/comfyui-archviz-studio/workflows/{mode}_controlnet_depth_api.json"
            
            # Gửi sang ComfyUI nội bộ
            client_id = str(uuid.uuid4())
            prompt_payload = {
                "prompt": {
                    "3": {"inputs": {"seed": 42, "steps": 25, "cfg": 7.0, "sampler_name": "dpmpp_sde", "scheduler": "karras", "denoise": 0.85, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}, "class_type": "KSampler"},
                    "4": {"inputs": {"ckpt_name": "Realistic_Vision_V5.1.safetensors"}, "class_type": "CheckpointLoaderSimple"},
                    "5": {"inputs": {"width": 1024, "height": 768, "batch_size": 1}, "class_type": "EmptyLatentImage"},
                    "6": {"inputs": {"text": prompt, "clip": ["4", 1]}, "class_type": "CLIPTextEncode"},
                    "7": {"inputs": {"text": "blurry, low quality, deformed, messy", "clip": ["4", 1]}, "class_type": "CLIPTextEncode"},
                    "8": {"inputs": {"samples": ["3", 0], "vae": ["4", 2]}, "class_type": "VAEDecode"},
                    "9": {"inputs": {"filename_prefix": "modal_render", "images": ["8", 0]}, "class_type": "SaveImage"}
                },
                "client_id": client_id
            }

            resp = requests.post("http://127.0.0.1:8188/prompt", json=prompt_payload)
            p_data = resp.json()
            p_id = p_data.get("prompt_id")

            # Polling kết quả
            for _ in range(120):
                time.sleep(1)
                h_res = requests.get(f"http://127.0.0.1:8188/history/{p_id}")
                if h_res.status_code == 200:
                    h_json = h_res.json()
                    if p_id in h_json:
                        outputs = h_json[p_id].get("outputs", {})
                        for n_id, out in outputs.items():
                            if "images" in out and len(out["images"]) > 0:
                                img_info = out["images"][0]
                                img_url = f"http://127.0.0.1:8188/view?filename={img_info['filename']}&subfolder={img_info.get('subfolder', '')}&type={img_info.get('type', 'output')}"
                                img_bytes = requests.get(img_url).content
                                b64_res = base64.b64encode(img_bytes).decode('utf-8')
                                return {
                                    "success": True,
                                    "image_b64": f"data:image/png;base64,{b64_res}",
                                    "message": "Render thành công qua Modal Serverless GPU!"
                                }

            return {"success": False, "error": "Render timeout"}

        return web_app
