# 🏡 Aetheris ArchViz AI Studio

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Neito112/comfyui-archviz-studio/blob/main/colab_comfyui_server.ipynb)
[![GitHub Stars](https://img.shields.io/github/stars/Neito112/comfyui-archviz-studio?style=social)](https://github.com/Neito112/comfyui-archviz-studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)

> **Ứng dụng Web App Render Kiến Trúc & Nội Thất AI Đỉnh Cao** kết hợp sức mạnh ComfyUI API, mô hình SDXL Juggernaut, ControlNet Depth Advanced và Google Colab GPU T4 Miễn Phí.

---

## ✨ Tính Năng Nổi Bật

* 🚀 **Google Colab GPU Cloud (T4 15GB Miễn Phí)**: Khởi chạy GPU Server chỉ với 1 click và render trực tiếp từ Web App qua Cloudflare Tunnel.
* 🏛️ **Khóa Móng Hình Học Kép (Dual Conditioning)**: Khóa 100% kết cấu cột, dầm, đố nhôm kính từ bản vẽ CAD/sketch thô bằng `ControlNet Depth (0.70)` + `Canny/LineArt (0.40)` ngắt bước thông minh.
* 🪵 **Bảng Vật Liệu Kiến Trúc Nhanh (PBR Material Swatches)**: Chèn 1 chạm 6 vật liệu xúc giác cao cấp (Gỗ Sồi, Đá Travertine, Bê Tông Trần, Kính Low-E, Đồng Thau, Vữa Venetian).
* 🔍 **Kính Lúp Soi Chi Tiết 1:1 (Canvas Zoom Loupe)**: Soi từng vân đá, thớ gỗ siêu nét ở tỉ lệ 2.5x ngay trên phối cảnh tổng thể (Phím tắt `Z`).
* ↔️ **Thanh So Sánh Trước / Sau (Before / After Split-Screen)**: Kéo trượt mượt mà, hỗ trợ cảm ứng và phím mũi tên `←` / `→`.
* 🎬 **Hậu Kỳ Màu Sắc Điện Ảnh (Post-Production)**: 5 bộ màu chuyên nghiệp (*ArchDaily Warm, Scandi Crisp, Cinematic, Dusk Mood*).
* 🏷️ **Cú Pháp Prompt 4 Tầng Tự Động**: Phân tách trực quan `[CHỦ THỂ]` + `[VẬT LIỆU PBR]` + `[ÁNH SÁNG IES/KELVIN]` + `[GÓC MÁY 8K]`.
* 📐 **Render Đa Góc Nhìn (Multi-View 4 Angles)**: Khóa Master Seed sinh đồng bộ 4 góc cam cùng 1 công trình.

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Sử Dụng Google Colab GPU Miễn Phí (Không cần card đồ họa mạnh)
1. Bấm vào nút [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Neito112/comfyui-archviz-studio/blob/main/colab_comfyui_server.ipynb).
2. Chọn **Runtime > Change runtime type > T4 GPU**.
3. Bấm nút **Play (Run Cell)** để Colab tự động cài đặt và cấp link `https://xxxx.trycloudflare.com`.
4. Dán link đó vào phần **Cài Đặt (icon Bánh Răng) > Colab GPU Server URL** trên Web App!

### Cách 2: Chạy Cục Bộ Trên Máy Tính (Local GPU)
```bash
# 1. Cài đặt thư viện
pip install -r requirements.txt

# 2. Khởi chạy Web App & Backend API
python backend/app.py
```
Mở trình duyệt tại: `http://127.0.0.1:8000`

---

## 📁 Cấu Trúc Dự Án
```
├── frontend/                  # Web App Frontend (HTML/CSS/JS Tailwind)
│   ├── index.html             # Giao diện chính Studio & Floating Dock
│   └── js/app.js              # Toàn bộ logic Render, Loupe, Slider
├── backend/                   # Backend API Server & ComfyUI Client
│   ├── app.py                 # Multi-Threaded HTTP API Server & CORS
│   └── comfy_client.py        # Client kết nối ComfyUI Engine
├── workflows/                 # 8 Workflow ComfyUI API JSON chuẩn hóa
├── colab_comfyui_server.ipynb # 1-Click Jupyter Notebook chạy Colab GPU
└── dist_desktop_backend/      # Gói phần mềm phân phối Portable độc lập
```

---
*Phát triển bởi Neito & DeepMind Agentic Team.*
