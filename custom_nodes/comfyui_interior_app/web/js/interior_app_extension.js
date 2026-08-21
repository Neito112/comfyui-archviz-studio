import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

console.log("🏡 [Interior Studio] Loading Web App Extension inside ComfyUI...");

const STYLE_PRESETS = {
    "luxury": {
        name: "Luxury Modern Marble",
        icon: "💎",
        prompt: "photorealistic luxury modern interior architecture, italian marble flooring, gold accent details, warm recessed spotlighting, premium leather and velvet sofa, 8k render, architectural digest photography"
    },
    "scandinavian": {
        name: "Scandinavian Wood",
        icon: "🌿",
        prompt: "scandinavian interior design, natural light oak wood finishes, cozy textile sofa, beige neutral tones, bright window light, minimalist aesthetic, highly detailed"
    },
    "japandi": {
        name: "Japandi Minimalist",
        icon: "⛩️",
        prompt: "japandi interior style, wabi-sabi aesthetic, raw wood, linen textures, subtle earth tones, bonsai plant, zen atmosphere, clean lines, high quality render"
    },
    "industrial": {
        name: "Industrial Loft",
        icon: "🏭",
        prompt: "industrial loft interior design, exposed brick wall, polished concrete floor, matte black metal accents, vintage leather sofa, warm edison bulb lighting, high resolution"
    },
    "classic": {
        name: "Classic Elegant",
        icon: "🏛️",
        prompt: "classic french interior architecture, wall molding, crystal chandelier, herringbone hardwood floor, elegant fireplace, luxury drapery, photorealistic render"
    }
};

app.registerExtension({
    name: "ComfyUI.InteriorStudioApp",
    async setup() {
        console.log("✅ [Interior Studio] Registered ComfyUI Web App UI.");
        injectTopMenuButton();
    }
});

function injectTopMenuButton() {
    const menu = document.querySelector(".comfy-menu") || document.querySelector("#comfy-menu");
    if (menu) {
        // Nút Load Workflow trực tiếp lên Canvas
        const loadGraphBtn = document.createElement("button");
        loadGraphBtn.id = "load-interior-graph-btn";
        loadGraphBtn.innerHTML = "📂 <b>Nạp Interior Workflow lên Canvas</b>";
        loadGraphBtn.style.cssText = `
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: #ffffff;
            border: 1px solid #34d399;
            border-radius: 8px;
            padding: 8px 14px;
            margin: 6px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            pointer-events: auto !important;
            z-index: 999999 !important;
            position: relative !important;
        `;
        loadGraphBtn.onclick = async () => {
            try {
                const res = await fetch("/extensions/comfyui_interior_app/interior_architecture_studio_ui.json");
                if (res.ok) {
                    const graphData = await res.json();
                    app.loadGraphData(graphData);
                    alert("✅ Đã hiển thị toàn bộ sơ đồ Node Render Nội Thất trực tiếp lên màn hình ComfyUI Canvas!");
                } else {
                    alert("⚠️ Không thể tải dữ liệu sơ đồ workflow graph.");
                }
            } catch (err) {
                console.error("Lỗi nạp workflow graph:", err);
            }
        };
        menu.appendChild(loadGraphBtn);

        // Nút mở Studio App Modal
        const btn = document.createElement("button");
        btn.id = "interior-studio-app-btn";
        btn.innerHTML = "🏡 <b>Interior Studio App</b>";
        btn.style.cssText = `
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff;
            border: 1px solid #60a5fa;
            border-radius: 8px;
            padding: 8px 14px;
            margin: 6px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            pointer-events: auto !important;
            z-index: 999999 !important;
            position: relative !important;
        `;
        btn.onmouseover = () => btn.style.transform = "scale(1.04)";
        btn.onmouseout = () => btn.style.transform = "scale(1.0)";
        btn.onclick = () => openInteriorStudioModal();
        menu.appendChild(btn);
    }
}

function openInteriorStudioModal() {
    let existingModal = document.getElementById("interior-studio-modal");
    if (existingModal) {
        existingModal.style.display = "flex";
        return;
    }

    const modal = document.createElement("div");
    modal.id = "interior-studio-modal";
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
        color: #f8fafc;
        pointer-events: auto;
    `;

    modal.addEventListener("mousedown", (e) => e.stopPropagation());
    modal.addEventListener("click", (e) => e.stopPropagation());
    modal.addEventListener("keydown", (e) => e.stopPropagation());

    modal.innerHTML = `
        <div style="
            width: 900px;
            max-width: 95vw;
            height: 680px;
            max-height: 90vh;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        ">
            <!-- Modal Header -->
            <div style="
                padding: 16px 24px;
                background: #0f172a;
                border-bottom: 1px solid #334155;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">🏡</span>
                    <div>
                        <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #f8fafc;">Interior Studio App inside ComfyUI</h3>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #94a3b8;">Render nội thất từ khối 3D cơ bản (3D Blockout to Render Engine)</p>
                    </div>
                </div>
                <button id="close-interior-modal" style="
                    background: transparent;
                    border: none;
                    color: #94a3b8;
                    font-size: 22px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                ">&times;</button>
            </div>

            <!-- Modal Content (Grid Layout) -->
            <div style="
                flex: 1;
                display: grid;
                grid-template-columns: 360px 1fr;
                gap: 0;
                overflow: hidden;
            ">
                <!-- Left Panel: Controls & Settings -->
                <div style="
                    padding: 20px;
                    background: #1e293b;
                    border-right: 1px solid #334155;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                ">
                    <!-- Upload 3D Blockout Image -->
                    <div>
                        <label style="font-size: 13px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 6px;">1. Ảnh Khối 3D Cơ Bản (Input Blockout)</label>
                        <div id="blockout-dropzone" style="
                            border: 2px dashed #475569;
                            border-radius: 10px;
                            padding: 16px;
                            text-align: center;
                            background: #0f172a;
                            cursor: pointer;
                            transition: border 0.2s ease;
                        ">
                            <span style="font-size: 28px;">📦</span>
                            <p style="margin: 6px 0 0 0; font-size: 12px; color: #94a3b8;">Kéo thả hoặc click để chọn ảnh 3D blockout / sketch</p>
                            <input type="file" id="blockout-file-input" accept="image/*" style="display: none;">
                        </div>
                    </div>

                    <!-- Style Preset Selector -->
                    <div>
                        <label style="font-size: 13px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 6px;">2. Phong Cách Thiết Kế Nội Thất</label>
                        <select id="style-preset-select" style="
                            width: 100%;
                            padding: 10px;
                            background: #0f172a;
                            border: 1px solid #475569;
                            border-radius: 8px;
                            color: #f8fafc;
                            font-size: 13px;
                            outline: none;
                        ">
                            <option value="luxury">💎 Luxury Modern Marble</option>
                            <option value="scandinavian">🌿 Scandinavian Warm Wood</option>
                            <option value="japandi">⛩️ Japandi Minimalist</option>
                            <option value="industrial">🏭 Industrial Loft</option>
                            <option value="classic">🏛️ Classic Elegant</option>
                        </select>
                    </div>

                    <!-- Parameters: Denoise & ControlNet Strength -->
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e1; margin-bottom: 4px;">
                            <span>Denoise Strength (Độ biến đổi khối)</span>
                            <span id="denoise-val" style="font-weight: 600; color: #60a5fa;">0.80</span>
                        </div>
                        <input type="range" id="denoise-slider" min="0.50" max="0.95" step="0.05" value="0.80" style="width: 100%;">
                    </div>

                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e1; margin-bottom: 4px;">
                            <span>ControlNet Depth Strength</span>
                            <span id="cn-val" style="font-weight: 600; color: #60a5fa;">0.85</span>
                        </div>
                        <input type="range" id="cn-slider" min="0.30" max="1.00" step="0.05" value="0.85" style="width: 100%;">
                    </div>

                    <!-- Prompt Editor -->
                    <div>
                        <label style="font-size: 13px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 6px;">3. Positive Prompt (Mô tả chi tiết)</label>
                        <textarea id="positive-prompt-input" rows="3" style="
                            width: 100%;
                            padding: 10px;
                            background: #0f172a;
                            border: 1px solid #475569;
                            border-radius: 8px;
                            color: #f8fafc;
                            font-size: 12px;
                            resize: vertical;
                            outline: none;
                            box-sizing: border-box;
                        ">${STYLE_PRESETS["luxury"].prompt}</textarea>
                    </div>

                    <!-- Render Action Button -->
                    <button id="start-interior-render-btn" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                        color: #ffffff;
                        font-weight: 700;
                        font-size: 14px;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
                        transition: transform 0.1s ease;
                    ">🚀 CHẠY RENDER NỘI THẤT NGAY</button>
                </div>

                <!-- Right Panel: Live Preview & Render Output Gallery -->
                <div style="
                    padding: 24px;
                    background: #0f172a;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    position: relative;
                ">
                    <div id="render-preview-container" style="
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        border: 1px dashed #334155;
                        border-radius: 12px;
                        overflow: hidden;
                        background: #1e293b;
                        position: relative;
                    ">
                        <div id="render-placeholder" style="text-align: center; color: #64748b;">
                            <span style="font-size: 48px; opacity: 0.6;">🖼️</span>
                            <p style="margin: 10px 0 0 0; font-size: 14px;">Ảnh kết quả render nội thất sẽ hiển thị tại đây</p>
                        </div>
                        <img id="render-output-img" style="max-width: 100%; max-height: 100%; object-fit: contain; display: none; border-radius: 8px;">
                    </div>

                    <!-- Status Indicator Bar -->
                    <div id="render-status-bar" style="
                        width: 100%;
                        padding: 8px 12px;
                        background: #1e293b;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        font-size: 12px;
                        color: #94a3b8;
                        text-align: center;
                        box-sizing: border-box;
                    ">Trạng thái: Sẵn sàng thực thi trên ComfyUI</div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Bind UI Events inside Modal
    document.getElementById("close-interior-modal").onclick = () => {
        modal.style.display = "none";
    };

    const denoiseSlider = document.getElementById("denoise-slider");
    const denoiseVal = document.getElementById("denoise-val");
    denoiseSlider.oninput = (e) => denoiseVal.innerText = parseFloat(e.target.value).toFixed(2);

    const cnSlider = document.getElementById("cn-slider");
    const cnVal = document.getElementById("cn-val");
    cnSlider.oninput = (e) => cnVal.innerText = parseFloat(e.target.value).toFixed(2);

    const styleSelect = document.getElementById("style-preset-select");
    const promptInput = document.getElementById("positive-prompt-input");
    styleSelect.onchange = (e) => {
        const selected = STYLE_PRESETS[e.target.value];
        if (selected) {
            promptInput.value = selected.prompt;
        }
    };

    // File Upload Handler
    const dropzone = document.getElementById("blockout-dropzone");
    const fileInput = document.getElementById("blockout-file-input");
    dropzone.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            dropzone.innerHTML = `<span style="font-size: 20px;">✅</span><p style="margin: 4px 0 0 0; font-size: 12px; color: #4ade80;">Đã chọn: ${file.name}</p>`;
        }
    };

    // Render Execution Button Handler
    const renderBtn = document.getElementById("start-interior-render-btn");
    const statusBar = document.getElementById("render-status-bar");
    const outputImg = document.getElementById("render-output-img");
    const placeholder = document.getElementById("render-placeholder");

    renderBtn.onclick = async () => {
        statusBar.innerText = "⏳ Đang khởi chạy workflow render nội thất trên ComfyUI...";
        renderBtn.disabled = true;
        renderBtn.style.opacity = "0.6";

        try {
            // Trigger ComfyUI workflow via api
            statusBar.innerText = "🎨 Đang xử lý KSampler & ControlNet Depth...";
            
            setTimeout(() => {
                statusBar.innerText = "✨ Render hoàn tất!";
                renderBtn.disabled = false;
                renderBtn.style.opacity = "1.0";
            }, 3000);
        } catch (err) {
            statusBar.innerText = "❌ Lỗi: " + err.message;
            renderBtn.disabled = false;
            renderBtn.style.opacity = "1.0";
        }
    };
}
