# Workspace ComfyUI Rules & Agent Memory Integration

1. **Workspace Location Rule**:
   - Tất cả các sản phẩm, tệp tin, workflow, custom nodes hoặc tài nguyên liên quan đến ComfyUI sẽ luôn được lưu trữ tại đây:
     `/home/neito/Documents/comfyui`

2. **Mandatory Parallel Frontend & Backend Synchronization Rule**:
   - Từ giờ mỗi khi sửa Frontend (`frontend/index.html`, `frontend/js/app.js`), BẮT BUỘC phải kiểm tra và cập nhật song song Backend (`backend/app.py`), sau đó build lại gói Portable `dist_desktop_backend/`.

3. **Mandatory Google Stitch UI Rule**:
   - Tất cả các yêu cầu điều chỉnh UI/UX đều phải sử dụng Google Stitch MCP (`https://stitch.googleapis.com/mcp`) để tạo thiết kế giao diện thống nhất.

4. **Floating Dock & Modal Control Contract**:
   - Thanh Floating Glass Dock trung tâm phải duy trì 2 nút tab: **Nội Thất / Ngoại Thất** và **Đơn Lẻ / Nhiều View**.
   - Nút Cài Đặt Model Local ⇄ Cloud API Key phải mở modal ID `#settingsModal`.
   - Khu vực Region Tagging (@Tagging) luôn duy trì định dạng thẻ gọn gàng từ Stitch.

5. **Persistent Memory System (`agentmemory`)**:
   - Agent Memory daemon chạy tại `http://localhost:3111` (Agent Memory v0.9.28).
   - Tự động lưu và truy vấn bộ nhớ ngữ cảnh dự án dài hạn qua `remember` và `recall`.

6. **Skill Suite Tracking & Synchronization Rule**:
   - Toàn bộ bộ skill đang sử dụng (`.agents/skills/`) bao gồm bộ dev app skills, claude video watch và agentmemory được lưu trực tiếp trong repository và BẮT BUỘC phải được push đồng bộ lên GitHub mỗi khi commit/push dự án.
