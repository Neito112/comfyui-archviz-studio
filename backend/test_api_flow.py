import requests
import json

BASE_URL = "http://127.0.0.1:8000"

print("🔍 --- 1. Testing GET /api/status ---")
r = requests.get(f"{BASE_URL}/api/status")
print(f"Status Code: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
assert r.status_code == 200

print("\n🔍 --- 2. Testing GET /api/settings ---")
r = requests.get(f"{BASE_URL}/api/settings")
print(f"Status Code: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
assert r.status_code == 200

print("\n🔍 --- 3. Testing POST /api/render (Real Workflow Execution) ---")
payload = {
    "prompt": "Modern luxury interior living room, natural sunlight, walnut wood",
    "negative_prompt": "blurry, low quality",
    "width": 1024,
    "height": 768,
    "steps": 20,
    "mode": "interior",
    "region_definitions": [
        {"tag": "@sofa", "prompt": "Italian leather sofa", "has_mask": False}
    ]
}
r = requests.post(f"{BASE_URL}/api/render", json=payload)
print(f"Status Code: {r.status_code}")
print(f"Response: {json.dumps(r.json(), indent=2)}")
assert r.status_code == 200

print("\n🔍 --- 4. Testing GET /api/gallery ---")
r = requests.get(f"{BASE_URL}/api/gallery")
print(f"Status Code: {r.status_code}")
gallery_items = r.json()
print(f"Gallery Items Count: {len(gallery_items)}")
assert r.status_code == 200

print("\n🎉 ALL BACKEND WORKFLOW & SIGNAL FLOW TESTS PASSED 100% PERFECTLY!")
