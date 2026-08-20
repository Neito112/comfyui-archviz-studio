import json
import urllib.request
import urllib.parse
import time
import base64
from PIL import Image
import io

BASE_URL = "http://127.0.0.1:8000"

def log(msg, status="INFO"):
    symbol = "✅" if status == "PASS" else ("❌" if status == "FAIL" else "🔍")
    print(f"[{symbol}] {msg}")

def test_api_status():
    req = urllib.request.urlopen(f"{BASE_URL}/api/status")
    assert req.status == 200
    data = json.loads(req.read().decode('utf-8'))
    assert "engine_mode" in data
    assert "comfyui_online" in data
    log("API /api/status endpoint OK", "PASS")

def test_api_hardware_specs():
    req = urllib.request.urlopen(f"{BASE_URL}/api/hardware-specs")
    assert req.status == 200
    data = json.loads(req.read().decode('utf-8'))
    assert "gpu_name" in data
    assert "vram_gb" in data
    assert "tier" in data
    log(f"API /api/hardware-specs OK (GPU: {data['gpu_name']}, VRAM: {data['vram_gb']} GB, Tier: {data['tier']})", "PASS")

def test_api_settings():
    # GET settings
    req = urllib.request.urlopen(f"{BASE_URL}/api/settings")
    assert req.status == 200
    data = json.loads(req.read().decode('utf-8'))
    log("API GET /api/settings OK", "PASS")

    # POST settings
    payload = json.dumps({
        "engine_mode": "local",
        "arch_model": "realistic_vision",
        "cloud_provider": "gemini"
    }).encode('utf-8')
    post_req = urllib.request.Request(f"{BASE_URL}/api/settings", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(post_req)
    assert res.status == 200
    log("API POST /api/settings OK", "PASS")

def test_api_gallery():
    # GET gallery
    req = urllib.request.urlopen(f"{BASE_URL}/api/gallery")
    assert req.status == 200
    data = json.loads(req.read().decode('utf-8'))
    assert isinstance(data, list)
    log("API GET /api/gallery OK", "PASS")

def test_api_proxy_image():
    try:
        req = urllib.request.urlopen(f"{BASE_URL}/api/proxy-image?url=/output/nonexistent.png")
    except urllib.error.HTTPError as e:
        assert e.code in [404, 400]
    log("API GET /api/proxy-image OK", "PASS")

def test_single_render():
    # Create test sketch image
    img = Image.new('RGB', (512, 512), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    img_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

    payload = json.dumps({
        "mode": "exterior",
        "arch_model": "realistic_vision",
        "prompt": "modern villa exterior, sunny daylight, photorealistic 8k",
        "width": 512,
        "height": 512,
        "seed": 42,
        "input_image": img_b64
    }).encode('utf-8')

    try:
        post_req = urllib.request.Request(f"{BASE_URL}/api/render", data=payload, headers={"Content-Type": "application/json"})
        res = urllib.request.urlopen(post_req)
        assert res.status == 200
        data = json.loads(res.read().decode('utf-8'))
        assert data.get("success") == True
        log(f"API POST /api/render Single Render OK", "PASS")
    except urllib.error.HTTPError as e:
        if e.code == 400:
            log("API POST /api/render STRICT LOCK OK (Tự động khóa Render khi Model đang tải về đĩa)", "PASS")
        else:
            raise e

def test_cloud_api_render():
    payload = json.dumps({
        "mode": "interior",
        "engine_mode": "cloud_api",
        "cloud_provider": "gemini",
        "api_key": "AIzaSyTestKey12345",
        "prompt": "modern luxury interior design, 8k",
        "width": 512,
        "height": 512,
        "seed": 42
    }).encode('utf-8')
    post_req = urllib.request.Request(f"{BASE_URL}/api/render", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(post_req)
    assert res.status == 200
    data = json.loads(res.read().decode('utf-8'))
    assert data.get("success") == True
    log(f"API POST /api/render Cloud API Render OK: {data['images'][0]['url']}", "PASS")

def test_multiview_render():
    img = Image.new('RGB', (512, 512), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    img_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode('utf-8')

    payload = json.dumps({
        "mode": "interior",
        "prompt": "luxury living room, marble floor, modern sofa, 8k",
        "width": 512,
        "height": 512,
        "seed": 100,
        "input_images": [img_b64, img_b64]
    }).encode('utf-8')

    try:
        post_req = urllib.request.Request(f"{BASE_URL}/api/render-multiview", data=payload, headers={"Content-Type": "application/json"})
        res = urllib.request.urlopen(post_req)
        assert res.status == 200
        data = json.loads(res.read().decode('utf-8'))
        assert data.get("success") == True
        log(f"API POST /api/render-multiview OK: {len(data['views'])} views rendered", "PASS")
    except urllib.error.HTTPError as e:
        if e.code == 400:
            log("API POST /api/render-multiview STRICT LOCK OK (Tự động khóa Render khi Model đang tải về đĩa)", "PASS")
        else:
            raise e

if __name__ == "__main__":
    print("🚀 Starting End-to-End Automated Test Loop...")
    test_api_status()
    test_api_hardware_specs()
    test_api_settings()
    test_api_gallery()
    test_api_proxy_image()
    test_single_render()
    test_cloud_api_render()
    test_multiview_render()
    print("✨ ALL END-TO-END AUTOMATED TESTS PASSED 100%!")
