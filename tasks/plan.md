# Implementation Plan: Interior Architecture ComfyUI App & Desktop Backend

## Overview
Xây dựng ứng dụng chuyên render và chỉnh sửa kiến trúc nội thất kết nối với ComfyUI Local Backend. Hỗ trợ nhập prompt, phong cách nội thất, ControlNet Depth/Inpaint và đóng gói dữ liệu build thành Backend độc lập cho Desktop App.

## Architecture Decisions
1. **ComfyUI API Layer:** Sử dụng WebSocket + REST API (`/prompt`, `/upload/image`, `/history`, `/ws`) để điều khiển ComfyUI local running trên port 8188.
2. **Modular Architecture:** Tách riêng Workflow Engine (`workflows/`), Backend API Adapter (`backend/`), Frontend Studio (`frontend/`) và Desktop Bundle Exporter (`desktop_export/`).
3. **Desktop App Compatibility:** Thiết kế Backend Adapter nhẹ bằng Python/FastAPI có thể chạy độc lập hoặc đóng gói cùng PyInstaller / Electron / Tauri.

## Task List

### Phase 1: Workflow Engine & Models
- [ ] Task 1: Tạo JSON API Workflows cho Render Nội thất (Text2Img & ControlNet Depth)

### Phase 2: Python Backend Adapter
- [ ] Task 2: Xây dựng ComfyUI API Client & WebSocket Listener (`comfy_client.py`)
- [ ] Task 3: Xây dựng REST API Server cho Studio (`app.py`)

### Phase 3: Interior Studio UI
- [ ] Task 4: Xây dựng HTML/CSS/JS Studio Interface (Prompt input, Style Presets, Image Upload, Before/After Slider, Live Progress)

### Phase 4: Desktop Backend Exporter
- [ ] Task 5: Xây dựng Workflow Exporter & Desktop App Adapter (`workflow_exporter.py` & `desktop_export/`)

---

## Checkpoint: Verification
- [ ] Render nội thất thành công qua UI
- [ ] Nhận tiến độ phần trăm % realtime qua WebSocket
- [ ] Xuất dữ liệu build backend thành công cho Desktop App
