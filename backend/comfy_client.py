import json
import urllib.request
import urllib.parse
import uuid
import time
import os
import requests

def auto_detect_comfyui_host():
    env_host = os.environ.get("COMFYUI_HOST")
    if env_host:
        return env_host
    for port in [8189, 8188]:
        try:
            url = f"http://127.0.0.1:{port}/system_stats"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=1) as resp:
                if resp.status == 200:
                    return f"127.0.0.1:{port}"
        except Exception:
            pass
    return "127.0.0.1:8189"

COMFYUI_HOST = auto_detect_comfyui_host()
BASE_URL = f"http://{COMFYUI_HOST}"

class ComfyUIClient:
    def __init__(self, host=None):
        self.host = (host or auto_detect_comfyui_host()).rstrip('/')
        if not self.host.startswith("http://") and not self.host.startswith("https://"):
            self.host = f"http://{self.host}"
        self.client_id = str(uuid.uuid4())

    def is_alive(self):
        """Kiểm tra xem ComfyUI local server có đang phản hồi hay không."""
        try:
            res = requests.get(f"{self.host}/system_stats", timeout=3)
            return res.status_code == 200
        except Exception:
            return False

    def get_models(self):
        """Lấy danh sách Checkpoint và ControlNet models từ ComfyUI."""
        checkpoints = []
        controlnets = []
        try:
            res = requests.get(f"{self.host}/object_info", timeout=5)
            if res.status_code == 200:
                data = res.json()
                if "CheckpointLoaderSimple" in data:
                    checkpoints = data["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
                if "ControlNetLoader" in data:
                    controlnets = data["ControlNetLoader"]["input"]["required"]["control_net_name"][0]
        except Exception as e:
            print(f"[ComfyUIClient] Lỗi khi lấy danh sách model: {e}")
        return {
            "checkpoints": checkpoints,
            "controlnets": controlnets
        }

    def upload_image(self, file_bytes, filename="input_room.png"):
        """Tải ảnh hiện trạng / bản vẽ lên ComfyUI server."""
        try:
            files = {'image': (filename, file_bytes, 'image/png')}
            data = {'overwrite': 'true'}
            res = requests.post(f"{self.host}/upload/image", files=files, data=data)
            if res.status_code == 200:
                return res.json()
        except Exception as e:
            print(f"[ComfyUIClient] Lỗi khi upload ảnh: {e}")
        return None

    def queue_prompt(self, workflow_dict):
        """Gửi JSON Workflow tới Queue của ComfyUI."""
        payload = {
            "prompt": workflow_dict,
            "client_id": self.client_id
        }
        try:
            res = requests.post(f"{self.host}/prompt", json=payload)
            if res.status_code == 200:
                return res.json()
            else:
                print(f"[ComfyUIClient] Prompt queue error ({res.status_code}): {res.text}")
        except Exception as e:
            print(f"[ComfyUIClient] Lỗi khi gửi queue prompt: {e}")
        return None

    def get_history(self, prompt_id):
        """Lấy thông tin lịch sử render từ prompt_id."""
        try:
            res = requests.get(f"{self.host}/history/{prompt_id}")
            if res.status_code == 200:
                return res.json().get(prompt_id, {})
        except Exception as e:
            print(f"[ComfyUIClient] Lỗi khi lấy history: {e}")
        return {}

    def get_output_images(self, prompt_id, max_wait_sec=120):
        """Chờ và lấy danh sách đường dẫn ảnh kết quả sau khi render xong."""
        start_time = time.time()
        while time.time() - start_time < max_wait_sec:
            history = self.get_history(prompt_id)
            if history and "outputs" in history:
                images = []
                outputs = history["outputs"]
                for node_id, node_output in outputs.items():
                    if "images" in node_output:
                        for img in node_output["images"]:
                            img_url = f"{self.host}/view?filename={img['filename']}&subfolder={img.get('subfolder', '')}&type={img.get('type', 'output')}"
                            images.append({
                                "filename": img["filename"],
                                "subfolder": img.get("subfolder", ""),
                                "type": img.get("type", "output"),
                                "url": img_url
                            })
                if images:
                    return images
            time.sleep(1.0)
        return []
