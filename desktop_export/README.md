# Hướng dẫn Cài Đặt Standalone & Đóng Gói Desktop App (Không Phụ Thuộc Setup Thủ Công)

Dự án này đã được chuẩn hóa để **hoàn toàn độc lập** và **tự động hóa 100%**. Khi cài đặt hoặc khởi chạy trên một máy tính mới, ứng dụng sẽ tự động tải về đầy đủ các AI Models cần thiết (Checkpoint & ControlNet Depth) mà người dùng không cần phải cài đặt thủ công.

---

## 1. Khởi Tạo Tự Động & Tải Models (Setup 1-Click)

Chạy file khởi tạo chính của dự án:

```bash
python3 setup_app.py
```

`setup_app.py` sẽ thực hiện tự động các công việc:
1. **Kiểm tra & Tải AI Models:** Tự động tải `v1-5-pruned-emaonly.safetensors` và `control_v11f1p_sd15_depth.pth` từ HuggingFace với tiến độ chi tiết.
2. **Khóa cứng Workflows API:** Kiểm tra tính toàn vẹn của 4 file workflows JSON (Interior Text2Img, Interior ControlNet, Exterior Text2Img, Exterior ControlNet).
3. **Cập nhật Backend Bundle:** Tự động tạo thư mục bundle sẵn sàng đóng gói [`dist_desktop_backend/`](file:///home/neito/Documents/comfyui/dist_desktop_backend).
4. **Khởi chạy API Server:** Bật ứng dụng tại `http://127.0.0.1:8000`.

---

## 2. Đóng Gói Thành Desktop App Thực Thụ (Electron / PyInstaller)

### Cách 1: Tích hợp với Electron (Khuyên dùng)
1. Đặt thư mục [`dist_desktop_backend/`](file:///home/neito/Documents/comfyui/dist_desktop_backend) vào dự án Electron của bạn (`backend-core/`).
2. Trong file `main.js` của Electron, gọi script tự động:
```javascript
const { spawn } = require('child_process');
const path = require('path');

// Khởi chạy Backend & Tải model tự động
const setupScript = path.join(__dirname, 'backend-core', 'main_desktop_backend.py');
const backendProcess = spawn('python3', [setupScript]);

// Load giao diện sau khi Backend khởi tạo xong
mainWindow.loadURL('http://127.0.0.1:8000');
```

### Cách 2: Đóng gói thành File Thực Thi (.exe / AppImage) với PyInstaller
```bash
pip install pyinstaller
pyinstaller --onefile --add-data "workflows:workflows" --add-data "frontend:frontend" --add-data "backend:backend" setup_app.py
```

Sau khi đóng gói, ứng dụng Desktop của bạn sẽ tự động hoạt động mượt mà trên bất kỳ máy tính mới nào mà không cần thao tác cấu hình phức tạp!
