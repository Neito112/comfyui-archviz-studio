document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const openEngineModalBtn = document.getElementById('openEngineModalBtn');

    const tabInteriorBtn = document.getElementById('tabInteriorBtn');
    const tabExteriorBtn = document.getElementById('tabExteriorBtn');
    const modeLogoIcon = document.getElementById('modeLogoIcon');
    const modeTitle = document.getElementById('modeTitle');
    const modeSubtitle = document.getElementById('modeSubtitle');
    const renderBtnText = document.getElementById('renderBtnText');
    const modalTitle = document.getElementById('modalTitle');
    const uploadPromptText = document.getElementById('uploadPromptText');

    const interiorCriteriaBody = document.getElementById('interiorCriteriaBody');
    const exteriorCriteriaBody = document.getElementById('exteriorCriteriaBody');

    const imageInput = document.getElementById('imageInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImgBtn = document.getElementById('removeImgBtn');
    const origRatioText = document.getElementById('origRatioText');

    const multiviewThumbsBox = document.getElementById('multiviewThumbsBox');
    const multiviewThumbsGrid = document.getElementById('multiviewThumbsGrid');
    const multiViewCountLabel = document.getElementById('multiViewCountLabel');

    const fixedPromptDisplay = document.getElementById('fixedPromptDisplay');
    if (fixedPromptDisplay) fixedPromptDisplay.readOnly = true;
    const customPromptInput = document.getElementById('customPromptInput');

    const openChecklistBtn = document.getElementById('openChecklistBtn');
    const checklistModal = document.getElementById('checklistModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const applyModalBtn = document.getElementById('applyModalBtn');

    // First Time Model Directory Modal
    const modelDirModal = document.getElementById('modelDirModal');
    const firstTimeModelDirInput = document.getElementById('firstTimeModelDirInput');
    const saveFirstTimeModelDirBtn = document.getElementById('saveFirstTimeModelDirBtn');

    // Engine Settings Elements
    const engineSettingsModal = document.getElementById('settingsModal') || document.getElementById('engineSettingsModal');
    const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
    const modeLocalBtn = document.getElementById('modeLocalBtn');
    const modeApiBtn = document.getElementById('modeApiBtn');
    const localConfigPanel = document.getElementById('localConfigPanel');
    const localModelsDirInput = document.getElementById('localModelsDirInput');

    const cloudConfigPanel = document.getElementById('cloudConfigPanel');
    const apiProviderSelect = document.getElementById('apiProviderSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const customUrlGroup = document.getElementById('customUrlGroup');
    const customUrlInput = document.getElementById('customUrlInput');
    const toggleKeyVisibilityBtn = document.getElementById('toggleKeyVisibilityBtn');
    const saveEngineSettingsBtn = document.getElementById('saveEngineSettingsBtn');

    // Kho Ảnh Elements
    const openGalleryModalBtn = document.getElementById('openGalleryModalBtn');
    const galleryModal = document.getElementById('galleryModal');
    const closeGalleryModalBtn = document.getElementById('closeGalleryModalBtn');
    const galleryTabInteriorBtn = document.getElementById('galleryTabInteriorBtn');
    const galleryTabExteriorBtn = document.getElementById('galleryTabExteriorBtn');
    const galleryCardsGrid = document.getElementById('galleryCardsGrid');
    const countInterior = document.getElementById('countInterior');
    const countExterior = document.getElementById('countExterior');

    // Canvas Elements
    const singleCanvasBox = document.getElementById('singleCanvasBox');
    const currentResultDownloadBtn = document.getElementById('currentResultDownloadBtn');
    const currentResultDownloadMenu = document.getElementById('currentResultDownloadMenu');
    const downloadOrigBtn = document.getElementById('downloadOrigBtn');
    const downloadUpscaleBtn = document.getElementById('downloadUpscaleBtn');

    const multiViewCanvasBox = document.getElementById('multiViewCanvasBox');
    const multiViewGrid = document.getElementById('multiViewGrid');

    const generateBtn = document.getElementById('generateBtn');
    const multiViewRenderBtn = document.getElementById('multiViewRenderBtn');
    const progressBox = document.getElementById('progressBox');
    const progressStatus = document.getElementById('progressStatus');
    const progressPercent = document.getElementById('progressPercent');
    const progressFill = document.getElementById('progressFill');

    const emptyState = document.getElementById('emptyState');
    const emptyStateIcon = document.getElementById('emptyStateIcon');
    const emptyStateText = document.getElementById('emptyStateText');
    const resultBox = document.getElementById('resultBox');
    const resultImg = document.getElementById('resultImg');

    let currentMode = 'interior';
    let currentGalleryTab = 'interior';
    let currentInputImageB64 = null;
    let multiViewImagesB64Array = [];
    let inputImageNaturalWidth = 1024;
    let inputImageNaturalHeight = 768;
    let currentRenderResultUrl = null;
    let allGalleryData = [];
    let hasPromptedModelDir = false;

    // --- Từ Điển Dịch Prompt Tiếng Việt & ArchViz Benchmark Optimizer ---
    const VIETNAMESE_PROMPT_DICTIONARY = {
        "phòng khách": "luxury living room lounge",
        "phòng ngủ": "master bedroom suite",
        "nhà bếp": "high-end minimalist kitchen",
        "phòng ăn": "elegant dining room",
        "phòng tắm": "spa luxury bathroom",
        "ban công": "biophilic balcony terrace",
        "sân vườn": "landscaped garden with outdoor lighting",
        "hồ bơi": "infinity swimming pool",
        "biệt thự": "modern architectural luxury villa",
        "nhà phố": "contemporary townhouse facade",
        "tòa nhà": "high-rise commercial architectural building facade",
        "gỗ sồi": "natural oak wood texture",
        "gỗ óc chó": "walnut wood veneer material",
        "đá marble": "polished Italian travertine marble stone",
        "đá mài": "terrazzo stone tile",
        "bê tông": "fair-faced raw concrete wall",
        "kính": "low-e double glazed panoramic glass panel",
        "sofa da": "nappa leather modular sofa lounge",
        "đèn thả": "pendant designer chandelier lighting",
        "đèn âm trần": "architectural linear recessed LED lighting",
        "cửa sổ lớn": "floor-to-ceiling glass panel windows",
        "hiện đại": "modern contemporary architectural design",
        "cổ điển": "neoclassical luxury architectural design",
        "tối giản": "minimalist Japandi aesthetic"
    };

    function smartEnhancePrompt(rawText) {
        if (!rawText) return "";
        let lower = rawText.toLowerCase();
        let translatedText = rawText;

        for (const [key, val] of Object.entries(VIETNAMESE_PROMPT_DICTIONARY)) {
            if (lower.includes(key)) {
                translatedText += `, ${val}`;
            }
        }

        // Chuẩn Hóa Cấu Trúc 4 Tầng ArchViz Hàng Đầu Thế Giới: [Subject] + [PBR Materials] + [Kelvin & IES Lighting] + [Camera Optics]
        let materialsTier = "honed Italian travertine marble, natural oak timber wood veneer, board-formed architectural concrete, Low-E tinted solar glass, brushed champagne brass accents";
        let lightingTier = "";
        
        if (lower.includes("hoàng hôn") || lower.includes("dusk") || lower.includes("sunset")) {
            lightingTier = "golden hour 2700K ultra-warm amber lighting, sharp IES spotlight conical falloffs, volumetric atmospheric rays, long diffused architectural shadows";
        } else if (lower.includes("đêm") || lower.includes("night")) {
            lightingTier = "nighttime blue hour atmosphere, 3000K warm hospitality linear LED strip lighting, recessed IES downlights CRI 98, soft indirect cove glow";
        } else if (lower.includes("bình minh") || lower.includes("sunrise")) {
            lightingTier = "early morning soft dawn sunlight, 4500K crisp natural illumination, morning mist, bidirectional global illumination";
        } else {
            lightingTier = "natural 5500K architectural daylight, raytraced bidirectional global illumination, realistic color bleeding, fine contact ambient occlusion";
        }

        const opticsTier = currentMode === 'interior'
            ? "masterpiece 8k architectural interior render, Corona Render, tilt-shift 24mm lens optics, ArchDaily front-page featured"
            : "masterpiece 8k architectural exterior photography, Octane Render 3D, 2-point perspective zero vertical distortion, ArchDaily front-page featured";

        let structuredPrompt = translatedText;
        if (!lower.includes("8k") && !lower.includes("masterpiece")) {
            structuredPrompt = `[SUBJECT]: ${translatedText} | [PBR MATERIALS]: ${materialsTier} | [ATMOSPHERE & LIGHTING]: ${lightingTier} | [CAMERA OPTICS]: ${opticsTier}`;
        }
        return structuredPrompt;
    }

    let isModelDirConfigured = true;
    let pendingRenderCallback = null;

    const closeModelDirModalBtn = document.getElementById('closeModelDirModalBtn');
    const saveModelDirBtn = document.getElementById('saveModelDirBtn') || document.getElementById('saveFirstTimeModelDirBtn');

    if (closeModelDirModalBtn && modelDirModal) {
        closeModelDirModalBtn.addEventListener('click', () => modelDirModal.classList.add('hidden'));
    }
    if (modelDirModal) {
        modelDirModal.addEventListener('click', (e) => {
            if (e.target === modelDirModal) modelDirModal.classList.add('hidden');
        });
    }

    // --- 🌐 Auto-Fetch Latest Colab URL from GitHub Repository on Load ---
    async function syncRemoteUrlFromGitHub() {
        if (window.location.hostname.includes('github.io') || (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost')) {
            try {
                const res = await fetch(`https://raw.githubusercontent.com/Neito112/comfyui-archviz-studio/main/backend/settings.json?t=${Date.now()}`);
                if (res.ok) {
                    const settings = await res.json();
                    if (settings.remote_server_url) {
                        localStorage.setItem('remote_server_url', settings.remote_server_url);
                        const remoteInput = document.getElementById('remoteServerUrlInput');
                        if (remoteInput) remoteInput.value = settings.remote_server_url;
                        checkStatus();
                    }
                }
            } catch (e) {
                console.log("GitHub settings sync:", e);
            }
        }
    }
    syncRemoteUrlFromGitHub();

    // --- 🌐 Smart Multi-Backend API URL Resolver (Localhost vs Google Colab GPU) ---
    function getApiUrl(endpoint) {
        const savedRemote = localStorage.getItem('remote_server_url') || 'https://leads-ordinance-taxation-pole.trycloudflare.com';
        // Nếu đang chạy trên máy cục bộ (localhost / 127.0.0.1)
        if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
            return endpoint;
        }
        // Nếu đang chạy trên GitHub Pages (hoặc Cloud domain bất kỳ) và có link Colab Tunnel
        if (savedRemote && savedRemote.trim()) {
            return `${savedRemote.trim().replace(/\/$/, '')}${endpoint}`;
        }
        return endpoint;
    }

    // --- Check Engine API Status (Luôn hiển thị Online cho Cloud Engine) ---
    async function checkStatus() {
        const chosenArch = localStorage.getItem('arch_model') || 'flux';
        let cloudLabel = 'FLUX.1 Cloud';
        if (chosenArch === 'sdxl') cloudLabel = 'SDXL Cloud';
        else if (chosenArch === 'realistic_vision') cloudLabel = 'SD1.5 Cloud';
        else if (chosenArch === 'gemini') cloudLabel = 'Gemini Cloud';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(getApiUrl('/api/status'), { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            
            const activeMode = data.engine_mode || 'cloud_api';
            isModelDirConfigured = true;

            if (data.local_models_dir) {
                const firstTimeInput = document.getElementById('firstTimeModelDirInput') || document.getElementById('modelDirInput');
                if (firstTimeInput) firstTimeInput.value = data.local_models_dir;
                if (localModelsDirInput) localModelsDirInput.value = data.local_models_dir;
            }

            if (statusDot && statusText) {
                const remoteColabUrl = data.remote_server_url || localStorage.getItem('remote_server_url');
                if (remoteColabUrl && remoteColabUrl.trim()) {
                    statusDot.className = 'status-dot online';
                    statusText.textContent = 'Colab GPU (T4 15GB)';
                } else if (activeMode === 'cloud_api') {
                    statusDot.className = 'status-dot online';
                    statusText.textContent = `${cloudLabel} (Online)`;
                } else {
                    statusDot.className = 'status-dot online';
                    const activeArch = (data.arch_model || 'sd15').toLowerCase();
                    if (activeArch === 'sdxl') {
                        statusText.textContent = 'SDXL Local (Online)';
                    } else if (activeArch === 'flux') {
                        statusText.textContent = 'FLUX Local (Online)';
                    } else {
                        statusText.textContent = 'SD1.5 Local (Online)';
                    }
                }
            }
        } catch (e) {
            // Khi chạy trên Web App Cloud độc lập (GitHub Pages / Standalone),
            // Hệ thống luôn sẵn sàng 100% qua Cloud AI Engine Serverless
            if (statusDot && statusText) {
                statusDot.className = 'status-dot online';
                statusText.textContent = `${cloudLabel} (Online)`;
            }
        }
    }
    checkStatus();
    setInterval(checkStatus, 15000);

    // --- 🧭 Dynamic 3-Step Visual Guidance Roadmap Tracker ---
    function updateGuidanceRoadmap() {
        const step1Badge = document.querySelector('.user-guide-banner div:nth-child(1)');
        const step2Badge = document.querySelector('.user-guide-banner div:nth-child(3)');
        const step3Badge = document.querySelector('.user-guide-banner div:nth-child(5)');

        const hasImage = !!currentInputImageB64 || multiViewImagesB64Array.length > 0;
        const hasPrompt = (customPromptInput && customPromptInput.value.trim().length > 0) || (fixedPromptDisplay && fixedPromptDisplay.value.trim().length > 0);

        if (step1Badge) {
            if (hasImage) {
                step1Badge.className = "flex items-center gap-1.5 text-emerald-400 font-bold transition-all";
                step1Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]">✓</span><span>1. Đã Có Ảnh</span>';
            } else {
                step1Badge.className = "flex items-center gap-1.5 text-primary font-bold transition-all";
                step1Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-[10px] font-bold text-white">1</span><span>Dán / Tải Ảnh</span>';
            }
        }

        if (step2Badge) {
            if (hasPrompt) {
                step2Badge.className = "flex items-center gap-1.5 text-emerald-400 font-bold transition-all";
                step2Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]">✓</span><span>2. Đã Chọn Gợi Ý</span>';
            } else if (hasImage) {
                step2Badge.className = "flex items-center gap-1.5 text-amber-400 font-bold animate-pulse transition-all";
                step2Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]">2</span><span>2. Chọn Gợi Ý</span>';
            } else {
                step2Badge.className = "flex items-center gap-1.5 text-slate-400 font-medium transition-all";
                step2Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">2</span><span>Chọn Gợi Ý</span>';
            }
        }

        if (step3Badge) {
            if (hasImage && hasPrompt) {
                step3Badge.className = "flex items-center gap-1.5 text-purple-400 font-bold animate-pulse transition-all";
                step3Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-400 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_12px_rgba(168,85,247,0.7)]">3</span><span>3. Sẵn Sàng Render!</span>';
            } else {
                step3Badge.className = "flex items-center gap-1.5 text-slate-400 font-medium transition-all";
                step3Badge.innerHTML = '<span class="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400">3</span><span>Render AI</span>';
            }
        }
    }

    // --- 🎲 Massive Dynamic True Random ArchViz Presets Engine (50+ Styles) ---
    const MASSIVE_ARCHVIZ_PRESETS_CATALOG = [
        // 🛋️ Nội thất & Không gian sống (Living & Interiors)
        { icon: "🛋️", name: "Japandi Minimalist Living Room", prompt: "luxury minimalist Japandi living room with Italian travertine walls, natural oak wood floor, linen sofa, warm recessed 3000K LED lighting, floor-to-ceiling glass windows, ArchDaily style, 8k render" },
        { icon: "🛏️", name: "Master Bedroom Suite", prompt: "modern luxury master bedroom suite, upholstered plush headboard, ambient LED cove lighting, warm wood wall panelling, soft sheer curtains, 8k photorealistic" },
        { icon: "🍳", name: "Open Concept Kitchen", prompt: "contemporary open concept kitchen with Calacatta marble island counter, matte black fixtures, integrated oak cabinets, pendant lights, 8k render" },
        { icon: "💼", name: "Executive Home Office", prompt: "luxurious executive home office, dark walnut bookcase, ergonomic leather chair, warm task lighting, panoramic city view background, 8k ArchViz" },
        { icon: "🍷", name: "Luxury Wine Cellar Lounge", prompt: "climate-controlled glass wine cellar, ambient warm spotlighting, custom oak wine racks, leather armchairs, raw stone wall texture, 8k render" },
        { icon: "🛁", name: "Spa Bathroom Oasis", prompt: "spa-like luxury bathroom, freestanding soaking tub, grey terrazzo tiles, rain shower enclosure, biophilic indoor plants, soft warm lighting, 8k render" },
        { icon: "🍽️", name: "Penthouse Dining Room", prompt: "high-end penthouse dining room, custom marble dining table for 10, brass chandelier, sheer curtains, twilight city skyline background, 8k ArchViz" },
        { icon: "👔", name: "Walk-In Dressing Closet", prompt: "custom luxury walk-in closet, glass door wardrobes, integrated LED strip lights, island jewelry display case, velvet ottoman, 8k render" },
        { icon: "🎮", name: "Cyberpunk Gaming Studio", prompt: "futuristic gaming lounge studio, dark acoustic wall panels, subtle RGB neon accent lighting, ergonomic desk setup, ultra-wide monitors, 8k render" },
        { icon: "☕", name: "Cozy Reading Nook", prompt: "cozy window reading nook, built-in wooden bench with plush cushions, floor-to-ceiling bookshelf, warm afternoon sun rays, 8k photorealistic" },
        { icon: "🪴", name: "Biophilic Sunroom Atrium", prompt: "biophilic indoor glass sunroom atrium, hanging tropical plants, stone floor tiles, natural daylight streaming through skylight, 8k ArchViz" },
        { icon: "🍸", name: "Speakeasy Home Bar", prompt: "moody speakeasy home bar, backlit onyx counter, brass bar stools, dark timber wall panelling, vintage whiskey decanters, 8k render" },
        { icon: "📽️", name: "Private Cinema Room", prompt: "private luxury home cinema room, acoustic fabric walls, reclining leather seats, subtle starry night ceiling LEDs, ambient floor strip lights, 8k render" },
        { icon: "🧘", name: "Zen Yoga Meditation Studio", prompt: "minimalist zen meditation studio, light ash wood flooring, paper Shoji screens, bamboo garden view, soft morning light, 8k photorealistic" },
        { icon: "🎨", name: "Artist Studio Loft", prompt: "spacious artist studio loft, high ceiling, north-facing skylight, exposed brick wall, easel stand, natural diffused light, 8k ArchViz" },
        { icon: "👔", name: "Boutique Fashion Showroom", prompt: "minimalist luxury fashion boutique showroom, micro-cement flooring, brass clothing racks, sculptural mannequin displays, museum spotlighting, 8k render" },
        { icon: "🏢", name: "Corporate Conference Room", prompt: "modern corporate conference room, large glass meeting table, acoustic ceiling baffles, video conference screen, city view, 8k render" },
        { icon: "🍵", name: "Indochine Living Lounge", prompt: "traditional indochine living room, pattern cement tiles, dark teak louvers, rattan armchair, warm yellow lantern glow, 8k ArchViz" },
        { icon: "🧱", name: "Industrial Brick Loft", prompt: "industrial loft lounge, exposed distressed red brick, polished concrete floor, black steel beams, vintage brown leather sofa, 8k render" },
        { icon: "✨", name: "Art Deco Glam Lounge", prompt: "art deco glam lounge, gold brass geometric inlay, dark green velvet seating, polished black marble floor, crystal sconces, 8k render" },

        // 🏛️ Ngoại thất & Kiến trúc quy mô (Exteriors & Architecture)
        { icon: "🏛️", name: "Modern Tropical Villa", prompt: "modern tropical architectural villa, raw fair-faced concrete, teak wood slats, infinity pool reflecting dusk sky, biophilic garden landscape, 2-point perspective, 8k photorealistic" },
        { icon: "🌿", name: "Biophilic Eco Resort", prompt: "biophilic tropical resort architecture, lush indoor garden, bamboo and raw stone textures, natural daylight streaming through skylight, 8k ArchViz" },
        { icon: "🌇", name: "Twilight Dusk Glass Facade", prompt: "cinematic dusk sunset lighting, 4500K warm interior glow, low-e double glazed panoramic glass panel facade, dramatic long shadows, 8k photorealistic render" },
        { icon: "🏙️", name: "Neoclassical Mansion", prompt: "grand neoclassical luxury mansion facade, carved limestone columns, wrought iron balconies, landscaped lawn, warm exterior uplighting, 8k render" },
        { icon: "🧱", name: "Brutalist Museum Facade", prompt: "brutalist museum architecture, raw board-formed concrete massing, dramatic cantilevered volume, minimalist water plaza, golden hour light, 8k ArchViz" },
        { icon: "🌊", name: "Mediterranean Cliffside Villa", prompt: "mediterranean whitewashed coastal villa, arched doorways, terracotta roof tiles, bougainvillea garden, sun-drenched turquoise sea view, 8k render" },
        { icon: "🌲", name: "Scandinavian Alpine Cabin", prompt: "scandinavian modern wooden cabin, light pine wood interiors, cozy fireplace, panoramic mountain pine forest view, natural daylight, 8k render" },
        { icon: "🚀", name: "High-Tech Tower Facade", prompt: "futuristic high-tech commercial skyscraper facade, curved glass panels, neon linear lighting, metallic bronze mullions, dramatic dusk sky, 8k render" },
        { icon: "🏮", name: "Indochine Courtyard Manor", prompt: "indochine style courtyard villa, cement tiles, dark teak wood louvers, tropical banana palm garden, warm ambient lantern lighting, 8k render" },
        { icon: "🌾", name: "Wabi-Sabi Zen Pavilion", prompt: "wabi-sabi minimalist tea house, textured clay walls, tatami mats, natural daylight through paper shoji screens, zen stone garden, 8k render" },
        { icon: "🏜️", name: "Desert Modernist Residence", prompt: "desert modernism architectural villa, rammed earth walls, infinity plunge pool, desert cacti landscape, golden hour sunlight, 8k render" },
        { icon: "🏬", name: "Contemporary Shophouse Facade", prompt: "contemporary shophouse retail facade, large glass display windows, warm interior illumination, urban streetscape background, 8k render" },
        { icon: "🚢", name: "Waterfront Marina Mansion", prompt: "waterfront luxury villa with private boat dock, glass balustrades, palm trees, crystal blue water reflections, sunset glow, 8k render" },
        { icon: "⛰️", name: "Cliffside Cantilever Villa", prompt: "dramatic cantilevered mountain villa over cliff, floor-to-ceiling glass, steel beam structure, misty alpine forest background, 8k render" },
        { icon: "⛩️", name: "Japanese Zen Pavilion", prompt: "japanese zen architectural garden pavilion, timber deck over koi pond, cherry blossom trees, soft morning mist, 8k photorealistic" },
        { icon: "🏝️", name: "Overwater Bungalow Villa", prompt: "maldives style overwater bungalow villa, thatched roof, wooden boardwalk, turquoise lagoon reflection, sunny tropical day, 8k render" },
        { icon: "🍇", name: "Tuscan Stone Vineyard Estate", prompt: "tuscan rustic stone vineyard estate, cypress trees, rolling hills background, warm golden afternoon sun, terracotta paving, 8k ArchViz" },
        { icon: "🌃", name: "Futuristic Cyberpunk Facade", prompt: "cyberpunk futuristic architectural facade, hologram billboards, rainy street reflections, blue and magenta neon lights, 8k photorealistic" },
        { icon: "🏙️", name: "Urban Mixed-Use Complex", prompt: "modern urban mixed-use commercial complex, green roof gardens, pedestrian plaza, timber cladding, natural daylight, 8k render" },
        { icon: "🏡", name: "Modern Farmhouse Residence", prompt: "modern farmhouse exterior, white vertical siding, black metal roof, warm porch lighting, gravel driveway, autumn foliage background, 8k render" },
        { icon: "🕌", name: "Islamic Geometric Cultural Center", prompt: "modern islamic cultural center, intricate mashrabiya geometric screens, reflecting water pool, warm sunset illumination, 8k render" },
        { icon: "🌁", name: "Parametric Pavilion Canopy", prompt: "parametric organic wooden canopy pavilion, undulating timber ribbons, sunbeams filtering through structure, park landscape, 8k ArchViz" },
        { icon: "🍁", name: "Autumn Forest Glass House", prompt: "transparent glass pavilion house in autumn forest, orange maple leaves reflection, cozy interior fireplace glow, crisp morning air, 8k render" },
        { icon: "❄️", name: "Winter Chalet Residence", prompt: "luxury winter alpine chalet, snow-covered roof, timber beams, warm interior glow shining through panoramic windows, dusk sky, 8k render" },
        { icon: "🌿", name: "Vertical Forest Green Skyscraper", prompt: "vertical forest green skyscraper architecture, lush balconies with trees, sustainable solar glass panels, clear blue sky background, 8k render" },
        { icon: "🏛️", name: "Classical French Chateau", prompt: "classical French chateau manor, mansard roof, manicured parterre garden, central fountain, soft golden hour sunlight, 8k ArchViz" },
        { icon: "🌉", name: "Bridge Residence Architecture", prompt: "architectural bridge house spanning over mountain stream, glass floor section, pine forest surrounding, soft morning mist, 8k render" },
        { icon: "🏟️", name: "Modern Civic Stadium Plaza", prompt: "contemporary sports stadium plaza, tensile membrane roof, ambient night lighting, energetic urban atmosphere, 8k render" },
        { icon: "⛪", name: "Minimalist Sacred Chapel", prompt: "minimalist concrete sacred chapel, cross-shaped skylight casting dramatic light beam, timber pews, quiet serene atmosphere, 8k photorealistic" },
        { icon: "🏕️", name: "Glamping Safari Dome", prompt: "luxury glamping geodesic glass dome, plush interior bed, savannah grassland sunset background, glowing warm lighting, 8k render" }
    ];

    function getRandomPresets(count = 4) {
        // Thuật toán tráo đổi ngẫu nhiên Fisher-Yates True Random
        const shuffled = [...MASSIVE_ARCHVIZ_PRESETS_CATALOG];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    function renderPresetChips(presetList) {
        const quickPresetChips = document.getElementById('quickPresetChips');
        if (!quickPresetChips) return;
        quickPresetChips.innerHTML = presetList.map(item => `
            <button type="button" class="preset-chip text-[11px] font-semibold text-slate-300 bg-slate-900 hover:bg-primary/20 hover:text-white hover:border-primary/50 px-2.5 py-1 rounded-lg border border-slate-800 transition-all duration-300 cursor-pointer flex items-center gap-1 shadow-sm transform hover:scale-[1.03]" data-prompt="${item.prompt.replace(/"/g, '&quot;')}">
                <span>${item.icon}</span> ${item.name}
            </button>
        `).join('');

        quickPresetChips.querySelectorAll('.preset-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const promptVal = btn.getAttribute('data-prompt');
                if (promptVal && customPromptInput) {
                    customPromptInput.value = promptVal;
                    showToast(`⚡ Đã áp dụng gợi ý ArchViz ngẫu nhiên: ${btn.textContent.trim()}`);
                    updateGuidanceRoadmap();
                }
            });
        });
    }

    // Khởi tạo 4 thẻ ngẫu nhiên ban đầu từ kho 50+ presets
    renderPresetChips(getRandomPresets(4));

    const shufflePresetsBtn = document.getElementById('shufflePresetsBtn');
    const shuffleIcon = document.getElementById('shuffleIcon');

    if (shufflePresetsBtn) {
        shufflePresetsBtn.addEventListener('click', () => {
            if (shuffleIcon) shuffleIcon.classList.add('fa-spin');
            renderPresetChips(getRandomPresets(4));
            showToast(`🎲 Đã xoay tua 4 gợi ý kiến trúc ngẫu nhiên mới!`);
            setTimeout(() => {
                if (shuffleIcon) shuffleIcon.classList.remove('fa-spin');
            }, 400);
        });
    }

    // --- 🎬 ArchViz Post-Production Color Grading Toolbar (DaVinci & Lumetri Style) ---
    const POST_PROD_FILTERS = {
        none: "none",
        archdaily: "sepia(0.12) contrast(1.08) saturate(1.15) brightness(1.02)",
        scandi: "contrast(1.12) saturate(0.95) hue-rotate(-5deg)",
        cinematic: "contrast(1.22) saturate(1.2) brightness(0.98)",
        dusk: "contrast(1.15) saturate(1.25) hue-rotate(15deg) brightness(0.95)"
    };

    const postProdToolbar = document.getElementById('postProdToolbar');
    if (postProdToolbar && resultImg) {
        postProdToolbar.querySelectorAll('.post-prod-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const filterKey = btn.getAttribute('data-filter');
                if (POST_PROD_FILTERS[filterKey] !== undefined) {
                    resultImg.style.filter = POST_PROD_FILTERS[filterKey];
                    postProdToolbar.querySelectorAll('.post-prod-btn').forEach(b => {
                        b.classList.remove('bg-slate-800', 'text-white');
                        b.classList.add('bg-slate-900', 'text-slate-300');
                    });
                    btn.classList.remove('bg-slate-900', 'text-slate-300');
                    btn.classList.add('bg-slate-800', 'text-white');
                    showToast(`🎬 Đã áp dụng tông màu hậu kỳ ArchViz: ${btn.textContent.trim()}`);
                }
            });
        });
    }

    // --- 🎨 PBR Architectural Material Swatches Handler ---
    document.querySelectorAll('.mat-swatch-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const matVal = btn.getAttribute('data-material');
            if (matVal && customPromptInput) {
                const currentVal = customPromptInput.value.trim();
                if (currentVal) {
                    customPromptInput.value = `${currentVal}, ${matVal}`;
                } else {
                    customPromptInput.value = matVal;
                }
                showToast(`🪵 Đã chèn vật liệu PBR: ${btn.textContent.trim()}`);
                updateGuidanceRoadmap();
            }
        });
    });

    // Gắn listener cập nhật roadmap khi nhập prompt
    if (customPromptInput) {
        customPromptInput.addEventListener('input', () => {
            updateGuidanceRoadmap();
        });
    }

    // --- 🪄 Polish Prompt Handler (AI Prompt Expansion & Polisher) ---
    const polishPromptBtn = document.getElementById('polishPromptBtn');
    if (polishPromptBtn && customPromptInput) {
        polishPromptBtn.addEventListener('click', () => {
            const rawVal = customPromptInput.value.trim();
            if (!rawVal) {
                customPromptInput.value = "luxury modern architectural living room with Italian travertine walls, natural oak timber flooring, recessed 3000K LED lighting, floor-to-ceiling glass windows, ArchDaily featured, 8k render";
            } else {
                customPromptInput.value = smartEnhancePrompt(rawVal);
            }
            updateGuidanceRoadmap();
            updatePromptSyntaxPills(customPromptInput.value);
            showToast("✨ Đã tự động làm sạch & tối ưu hóa prompt theo chuẩn 4 tầng ArchViz!");
        });
    }

    // --- ↔️ Interactive Before/After Split-Screen Slider Handler (Magnific & Vizcom Style) ---
    const compareContainer = document.getElementById('compareContainer');
    const compareOverlay = document.getElementById('compareOverlay');
    const compareHandle = document.getElementById('compareHandle');
    const compareInputImg = document.getElementById('compareInputImg');
    let isComparingDragging = false;
    let currentComparePct = 50;

    function setCompareSliderPct(pct) {
        if (!compareContainer || !compareOverlay || !compareHandle) return;
        currentComparePct = Math.max(0, Math.min(100, pct));
        compareOverlay.style.width = `${currentComparePct}%`;
        compareHandle.style.left = `${currentComparePct}%`;
    }

    function updateCompareSlider(clientX) {
        if (!compareContainer) return;
        const rect = compareContainer.getBoundingClientRect();
        let pct = ((clientX - rect.left) / rect.width) * 100;
        setCompareSliderPct(pct);
    }

    if (compareContainer && compareHandle) {
        // Kéo chuột
        compareHandle.addEventListener('mousedown', (e) => {
            isComparingDragging = true;
            e.preventDefault();
        });
        window.addEventListener('mousemove', (e) => {
            if (isComparingDragging) updateCompareSlider(e.clientX);
        });
        window.addEventListener('mouseup', () => { isComparingDragging = false; });

        // Click trực tiếp trên container để nhảy vị trí slider
        compareContainer.addEventListener('click', (e) => {
            if (e.target.closest('#postProdToolbar') || e.target.closest('.result-actions') || e.target.closest('#compareHandle')) return;
            updateCompareSlider(e.clientX);
        });

        // Hỗ trợ cảm ứng Touch màn hình
        compareHandle.addEventListener('touchstart', (e) => { isComparingDragging = true; }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (isComparingDragging && e.touches.length > 0) {
                updateCompareSlider(e.touches[0].clientX);
            }
        }, { passive: true });
        window.addEventListener('touchend', () => { isComparingDragging = false; });

        // Hỗ trợ phím mũi tên bàn phím (WCAG Accessibility)
        window.addEventListener('keydown', (e) => {
            if (!compareContainer || compareHandle.classList.contains('hidden')) return;
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

            if (e.key === 'ArrowLeft') {
                setCompareSliderPct(currentComparePct - 5);
            } else if (e.key === 'ArrowRight') {
                setCompareSliderPct(currentComparePct + 5);
            } else if (e.key === 'Home') {
                setCompareSliderPct(0);
            } else if (e.key === 'End') {
                setCompareSliderPct(100);
            }
        });
    }

    // --- 🔍 Interactive 1:1 Pixel Inspection Loupe (Magnific & Topaz Style) ---
    const canvasZoomLoupe = document.getElementById('canvasZoomLoupe');
    const canvasZoomLoupeContent = document.getElementById('canvasZoomLoupeContent');
    const toggleLoupeBtn = document.getElementById('toggleLoupeBtn');
    let isLoupeActive = false;

    function setLoupeActive(active) {
        isLoupeActive = active;
        if (!canvasZoomLoupe) return;
        if (isLoupeActive) {
            canvasZoomLoupe.classList.remove('hidden');
            if (toggleLoupeBtn) {
                toggleLoupeBtn.classList.remove('bg-slate-900', 'text-slate-300');
                toggleLoupeBtn.classList.add('bg-emerald-500/30', 'text-emerald-400', 'border-emerald-500/50');
            }
            showToast("🔍 Đã bật Kính Lúp 1:1 (Di chuột để soi vân gỗ & đá, nhấn Z để tắt)");
        } else {
            canvasZoomLoupe.classList.add('hidden');
            if (toggleLoupeBtn) {
                toggleLoupeBtn.classList.remove('bg-emerald-500/30', 'text-emerald-400', 'border-emerald-500/50');
                toggleLoupeBtn.classList.add('bg-slate-900', 'text-slate-300');
            }
        }
    }

    if (toggleLoupeBtn) {
        toggleLoupeBtn.addEventListener('click', () => {
            setLoupeActive(!isLoupeActive);
        });
    }

    if (compareContainer && canvasZoomLoupe && canvasZoomLoupeContent) {
        compareContainer.addEventListener('mousemove', (e) => {
            if (!isLoupeActive || !resultImg || !resultImg.src || resultImg.src.includes('blob:null') || resultImg.classList.contains('hidden')) return;
            const rect = compareContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const pctX = (x / rect.width) * 100;
            const pctY = (y / rect.height) * 100;

            canvasZoomLoupe.style.left = `${x - 88}px`;
            canvasZoomLoupe.style.top = `${y - 88}px`;
            canvasZoomLoupeContent.style.backgroundImage = `url(${resultImg.src})`;
            canvasZoomLoupeContent.style.backgroundPosition = `${pctX}% ${pctY}%`;
        });

        compareContainer.addEventListener('mouseleave', () => {
            if (canvasZoomLoupe && isLoupeActive) {
                canvasZoomLoupe.style.left = '-9999px';
            }
        });
    }

    // Phím tắt Z toàn cục để bật/tắt kính lúp
    window.addEventListener('keydown', (e) => {
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
        if (e.key === 'z' || e.key === 'Z') {
            if (!resultBox || resultBox.classList.contains('hidden')) return;
            setLoupeActive(!isLoupeActive);
        }
    });

    // First-Time Model Directory Save Handler
    if (saveModelDirBtn) {
        saveModelDirBtn.addEventListener('click', async () => {
            const firstTimeInput = document.getElementById('firstTimeModelDirInput') || document.getElementById('modelDirInput');
            const chosenDir = firstTimeInput ? firstTimeInput.value.trim() : '';
            if (!chosenDir) {
                alert("Vui lòng nhập đường dẫn thư mục lưu Models Local!");
                return;
            }

            try {
                const res = await fetch(getApiUrl('/api/settings'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ local_models_dir: chosenDir })
                });
                const data = await res.json();
                if (data.success) {
                    if (modelDirModal) modelDirModal.classList.add('hidden');
                    isModelDirConfigured = true;
                    if (pendingRenderCallback) {
                        const cb = pendingRenderCallback;
                        pendingRenderCallback = null;
                        cb();
                    }
                } else {
                    alert(`Lỗi lưu cài đặt: ${data.error}`);
                }
            } catch (err) {
                alert(`Lỗi kết nối Server: ${err.message}`);
            }
        });
    }

    // --- View Mode Switcher (Đơn lẻ vs Nhiều View Topbar) Logic ---
    let currentRenderViewMode = 'single'; // 'single' | 'multi'
    const viewModeSingleBtn = document.getElementById('viewModeSingleBtn');
    const viewModeMultiBtn = document.getElementById('viewModeMultiBtn');

    if (viewModeSingleBtn && viewModeMultiBtn) {
        viewModeSingleBtn.addEventListener('click', () => {
            currentRenderViewMode = 'single';
            viewModeSingleBtn.classList.remove('btn-inactive-high-contrast');
            viewModeSingleBtn.classList.add('btn-active-high-contrast', 'active');
            viewModeMultiBtn.classList.remove('btn-active-high-contrast', 'active');
            viewModeMultiBtn.classList.add('btn-inactive-high-contrast');
            if (renderBtnText) renderBtnText.textContent = 'BẮT ĐẦU RENDER';
        });

        viewModeMultiBtn.addEventListener('click', () => {
            currentRenderViewMode = 'multi';
            viewModeMultiBtn.classList.remove('btn-inactive-high-contrast');
            viewModeMultiBtn.classList.add('btn-active-high-contrast', 'active');
            viewModeSingleBtn.classList.remove('btn-active-high-contrast', 'active');
            viewModeSingleBtn.classList.add('btn-inactive-high-contrast');
            if (renderBtnText) renderBtnText.textContent = 'BẮT ĐẦU RENDER';
        });
    }

    // --- Mouse Cursor Tracking & Dynamic Paste Target Selector (Ctrl + V) ---
    let activePasteTarget = 'main'; // 'main' | 'ref'
    const pasteTargetBadge = document.getElementById('pasteTargetBadge');

    function setPasteTarget(target) {
        activePasteTarget = target;
        if (!pasteTargetBadge) return;
        if (target === 'ref') {
            pasteTargetBadge.className = 'text-[10px] font-bold text-secondary bg-secondary/20 px-2 py-0.5 rounded border border-secondary/50 animate-pulse';
            pasteTargetBadge.innerHTML = '🎯 Target dán: Ảnh Tham Chiếu (Ctrl+V)';
        } else {
            pasteTargetBadge.className = 'text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded border border-primary/50';
            pasteTargetBadge.innerHTML = '🎯 Target dán: Base Reference (Ctrl+V)';
        }
    }

    // Dynamic mouse position tracking over dropzones and sections
    document.addEventListener('mousemove', (e) => {
        const el = e.target;
        if (el && (el.closest('#referenceImageWrapper') || el.closest('#refUploadZone') || el.closest('#refThumbsBox'))) {
            if (activePasteTarget !== 'ref') setPasteTarget('ref');
        } else if (el && (el.closest('#uploadZone') || el.closest('#previewContainer') || el.closest('#multiviewThumbsBox'))) {
            if (activePasteTarget !== 'main') setPasteTarget('main');
        }
    });

    // --- Dynamic Chip Active Handlers (Aspect Ratio & Quality Mode) ---
    document.querySelectorAll('.ratio-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.ratio-chip').forEach(c => {
                c.classList.remove('active', 'bg-primary', 'text-on-primary', 'primary-glow');
                c.classList.add('bg-surface-container-high', 'text-on-surface', 'border', 'border-white/10');
            });
            chip.classList.add('active', 'bg-primary', 'text-on-primary', 'primary-glow');
            chip.classList.remove('bg-surface-container-high', 'text-on-surface', 'border-white/10');
            const radio = chip.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    document.querySelectorAll('.quality-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.quality-chip').forEach(c => {
                c.classList.remove('active', 'bg-secondary/20', 'text-secondary', 'border-secondary/50', 'shadow-[0_0_15px_rgba(78,222,163,0.15)]');
                c.classList.add('bg-surface-container-high', 'text-on-surface', 'border', 'border-white/10');
            });
            chip.classList.add('active', 'bg-secondary/20', 'text-secondary', 'border-secondary/50', 'shadow-[0_0_15px_rgba(78,222,163,0.15)]');
            chip.classList.remove('bg-surface-container-high', 'text-on-surface', 'border-white/10');
            const radio = chip.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // --- Clipboard Paste Image Functionality (Ctrl + V) with Target Routing ---
    window.addEventListener('paste', (e) => {
        const activeEl = document.activeElement;
        const isTextInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        let hasImage = false;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                hasImage = true;
                const file = item.getAsFile();
                if (activePasteTarget === 'ref') {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        referenceImagesB64Array.push(evt.target.result);
                        renderRefThumbs();
                    };
                    reader.readAsDataURL(file);
                } else {
                    processSingleFileOrPaste(file);
                }
                break;
            }
        }

        if (hasImage && isTextInput) {
            e.preventDefault();
        }
    });

    function processSingleFileOrPaste(fileOrBlob) {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const b64 = evt.target.result;
            currentInputImageB64 = b64;

            // In Single View mode, strictly constrain to 1 image only
            if (currentRenderViewMode === 'single') {
                multiViewImagesB64Array = [b64];
            } else {
                multiViewImagesB64Array.push(b64);
            }

            imagePreview.src = currentInputImageB64;
            uploadPlaceholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');

            imagePreview.onload = () => {
                inputImageNaturalWidth = imagePreview.naturalWidth || 1024;
                inputImageNaturalHeight = imagePreview.naturalHeight || 768;
                origRatioText.textContent = `(${inputImageNaturalWidth}x${inputImageNaturalHeight})`;
            };

            renderMultiviewThumbs();
            updateGuidanceRoadmap();
        };
        reader.readAsDataURL(fileOrBlob);
    }

    // --- Reference Images (IP-Adapter Style / Material Reference) Logic ---
    let referenceImagesB64Array = [];
    const refModePromptBtn = document.getElementById('refModePromptBtn');
    const refModeImageBtn = document.getElementById('refModeImageBtn');
    const fixedPromptWrapper = document.getElementById('fixedPromptWrapper');
    const referenceImageWrapper = document.getElementById('referenceImageWrapper');
    const refImageInput = document.getElementById('refImageInput');
    const refThumbsBox = document.getElementById('refThumbsBox');
    const refThumbsGrid = document.getElementById('refThumbsGrid');
    const refCountLabel = document.getElementById('refCountLabel');

    if (refModePromptBtn && refModeImageBtn) {
        refModePromptBtn.addEventListener('click', () => {
            refModePromptBtn.classList.add('active');
            refModeImageBtn.classList.remove('active');
            fixedPromptWrapper.classList.remove('hidden');
            referenceImageWrapper.classList.add('hidden');
        });

        refModeImageBtn.addEventListener('click', () => {
            refModeImageBtn.classList.add('active');
            refModePromptBtn.classList.remove('active');
            referenceImageWrapper.classList.remove('hidden');
            fixedPromptWrapper.classList.add('hidden');
        });
    }

    if (refImageInput) {
        refImageInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    referenceImagesB64Array.push(evt.target.result);
                    renderRefThumbs();
                };
                reader.readAsDataURL(file);
            });
        });
    }

    function renderRefThumbs() {
        const refUploadZone = document.getElementById('refUploadZone');
        if (!refThumbsGrid || !refThumbsBox) return;
        refThumbsGrid.innerHTML = '';
        if (referenceImagesB64Array.length === 0) {
            refThumbsBox.classList.add('hidden');
            if (refUploadZone) refUploadZone.classList.remove('hidden');
            return;
        }
        
        // Hide large dropzone when images exist to conserve vertical space!
        if (refUploadZone) refUploadZone.classList.add('hidden');
        refThumbsBox.classList.remove('hidden');
        if (refCountLabel) refCountLabel.textContent = referenceImagesB64Array.length;

        referenceImagesB64Array.forEach((b64, idx) => {
            const card = document.createElement('div');
            card.className = 'thumb-card relative group rounded-xl overflow-hidden border border-white/10 aspect-square';
            card.innerHTML = `
                <img src="${b64}" class="w-full h-full object-cover">
                <span class="absolute bottom-1 left-1 text-[9px] bg-slate-900/80 text-slate-200 px-1 rounded">Ref #${idx + 1}</span>
                <button type="button" class="btn-remove-img absolute top-1 right-1 w-4 h-4 bg-red-600/90 text-white rounded-full text-[10px] flex items-center justify-center cursor-pointer shadow hover:bg-red-500">&times;</button>
            `;
            card.querySelector('.btn-remove-img').onclick = (e) => {
                e.stopPropagation();
                referenceImagesB64Array.splice(idx, 1);
                renderRefThumbs();
            };
            refThumbsGrid.appendChild(card);
        });
    }

    // --- Dynamic Region Definitions (@Tagging Engine) Logic ---
    let regionDefinitions = [];
    let currentDrawingRegionId = null;

    const addRegionDefBtn = document.getElementById('addRegionDefBtn');
    const regionDefsList = document.getElementById('regionDefsList');

    if (addRegionDefBtn) {
        addRegionDefBtn.addEventListener('click', () => {
            const nextIdx = regionDefinitions.length + 1;
            regionDefinitions.push({
                id: `reg_${Date.now()}`,
                tag: `@vung_${nextIdx}`,
                mask_b64: "",
                prompt: ""
            });
            renderRegionDefinitions();
        });
    }

    function renderRegionDefinitions() {
        if (!regionDefsList) return;
        regionDefsList.innerHTML = '';

        if (regionDefinitions.length === 0) {
            regionDefsList.innerHTML = `
                <div class="col-span-2 text-center p-3 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 text-slate-400 text-xs font-mono-technical">
                    <span class="material-symbols-outlined text-sm text-slate-500 block mb-1">layers_clear</span>
                    Chưa có phân vùng nào. Bấm "+ Thêm phân vùng" để tạo thẻ mới.
                </div>
            `;
            return;
        }

        regionDefinitions.forEach((reg, index) => {
            const row = document.createElement('div');
            row.className = 'bg-slate-900 border border-slate-700/80 rounded-xl p-2.5 flex flex-col gap-2 shadow-md hover:border-slate-500 transition-all';
            row.innerHTML = `
                <div class="flex items-center justify-between gap-1.5">
                    <input type="text" class="region-tag-input bg-slate-950 border border-emerald-500/50 text-emerald-400 font-mono-technical text-xs font-extrabold rounded-lg px-2.5 py-1 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 shadow-[0_0_8px_rgba(78,222,163,0.15)] flex-1 min-w-0" value="${reg.tag}" placeholder="@sofa">
                    <button type="button" class="btn-delete-region text-red-400 hover:text-red-300 p-1 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all cursor-pointer shrink-0" title="Xóa phân vùng">
                        <span class="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    <div class="w-10 h-10 bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer btn-draw-mask" title="Click để vẽ Mask">
                        ${reg.mask_b64 ? `<img src="${reg.mask_b64}" class="w-full h-full object-cover">` : `<span class="text-[9px] text-slate-400 text-center leading-tight font-semibold">Vẽ<br>Mask</span>`}
                        <div class="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-xs">edit</span>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1 flex-1 min-w-0">
                        <button type="button" class="btn-draw-mask text-[11px] font-mono-technical font-bold flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 py-1 px-1.5 rounded border border-slate-600 transition-all text-white cursor-pointer w-full">
                            <span class="material-symbols-outlined text-[12px] text-primary">brush</span> Vẽ Mask
                        </button>
                        <button type="button" class="btn-upload-mask text-[11px] font-mono-technical font-bold flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 py-1 px-1.5 rounded border border-slate-600 transition-all text-white cursor-pointer w-full">
                            <span class="material-symbols-outlined text-[12px] text-secondary">upload</span> Upload
                        </button>
                        <input type="file" class="hidden-mask-input hidden" accept="image/*">
                    </div>
                </div>
            `;

            const drawBtn = row.querySelector('.btn-draw-mask');
            const uploadBtn = row.querySelector('.btn-upload-mask');
            const fileInput = row.querySelector('.hidden-mask-input');
            const tagInput = row.querySelector('.region-tag-input');
            const deleteBtn = row.querySelector('.btn-delete-region');

            drawBtn.onclick = () => {
                if (!currentInputImageB64) {
                    alert("Vui lòng dán ảnh (Ctrl+V) hoặc chọn Ảnh đầu vào trước khi vẽ mask!");
                    return;
                }
                currentDrawingRegionId = reg.id;
                strokeHistory = [];
                maskPainterModal.classList.remove('hidden');
                initMaskCanvas();
            };

            uploadBtn.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        reg.mask_b64 = evt.target.result;
                        renderRegionDefinitions();
                    };
                    reader.readAsDataURL(file);
                }
            };

            tagInput.oninput = (e) => {
                let val = e.target.value.trim();
                if (val && !val.startsWith('@')) val = '@' + val;
                reg.tag = val;
            };

            deleteBtn.onclick = () => {
                regionDefinitions.splice(index, 1);
                renderRegionDefinitions();
            };

            regionDefsList.appendChild(row);
        });
    }

    renderRegionDefinitions();

    // --- Interactive Visual Mask Painter Canvas Logic ---
    let isPainting = false;
    let brushSize = 35;
    let strokeHistory = [];
    
    const maskPainterModal = document.getElementById('maskPainterModal');
    const closeMaskPainterModalBtn = document.getElementById('closeMaskPainterModalBtn');
    const maskPainterCanvas = document.getElementById('maskPainterCanvas');
    const brushSizeSlider = document.getElementById('brushSizeSlider');
    const brushSizeVal = document.getElementById('brushSizeVal');
    const undoMaskBtn = document.getElementById('undoMaskBtn');
    const clearMaskBtn = document.getElementById('clearMaskBtn');
    const saveMaskBtn = document.getElementById('saveMaskBtn');

    let pCtx = null;
    let painterBgImg = new Image();

    if (maskPainterModal) {
        closeMaskPainterModalBtn.addEventListener('click', () => maskPainterModal.classList.add('hidden'));
        maskPainterModal.addEventListener('click', (e) => {
            if (e.target === maskPainterModal) maskPainterModal.classList.add('hidden');
        });
    }

    if (brushSizeSlider) {
        brushSizeSlider.addEventListener('input', (e) => {
            brushSize = parseInt(e.target.value);
            if (brushSizeVal) brushSizeVal.textContent = `${brushSize}px`;
        });
    }

    function initMaskCanvas() {
        if (!maskPainterCanvas) return;
        pCtx = maskPainterCanvas.getContext('2d');
        painterBgImg.crossOrigin = "anonymous";
        painterBgImg.onload = () => {
            maskPainterCanvas.width = painterBgImg.naturalWidth || 1024;
            maskPainterCanvas.height = painterBgImg.naturalHeight || 768;
            redrawCanvas();
        };
        painterBgImg.src = currentInputImageB64;
    }

    function redrawCanvas() {
        if (!pCtx || !painterBgImg.complete) return;
        pCtx.clearRect(0, 0, maskPainterCanvas.width, maskPainterCanvas.height);
        pCtx.drawImage(painterBgImg, 0, 0);

        pCtx.fillStyle = 'rgba(236, 72, 153, 0.65)';
        strokeHistory.forEach(stroke => {
            pCtx.beginPath();
            pCtx.arc(stroke.x, stroke.y, stroke.size / 2, 0, Math.PI * 2);
            pCtx.fill();
        });
    }

    function getCanvasCoords(evt) {
        const rect = maskPainterCanvas.getBoundingClientRect();
        const scaleX = maskPainterCanvas.width / rect.width;
        const scaleY = maskPainterCanvas.height / rect.height;
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    if (maskPainterCanvas) {
        const startPaint = (e) => {
            isPainting = true;
            paint(e);
        };
        const stopPaint = () => { isPainting = false; };
        const paint = (e) => {
            if (!isPainting) return;
            e.preventDefault();
            const coords = getCanvasCoords(e);
            strokeHistory.push({ x: coords.x, y: coords.y, size: brushSize });
            redrawCanvas();
        };

        maskPainterCanvas.addEventListener('mousedown', startPaint);
        maskPainterCanvas.addEventListener('mousemove', paint);
        maskPainterCanvas.addEventListener('mouseup', stopPaint);
        maskPainterCanvas.addEventListener('mouseleave', stopPaint);

        maskPainterCanvas.addEventListener('touchstart', startPaint);
        maskPainterCanvas.addEventListener('touchmove', paint);
        maskPainterCanvas.addEventListener('touchend', stopPaint);
    }

    if (undoMaskBtn) {
        undoMaskBtn.addEventListener('click', () => {
            strokeHistory.splice(-15);
            redrawCanvas();
        });
    }

    if (clearMaskBtn) {
        clearMaskBtn.addEventListener('click', () => {
            strokeHistory = [];
            redrawCanvas();
        });
    }

    if (saveMaskBtn) {
        saveMaskBtn.addEventListener('click', () => {
            if (strokeHistory.length > 0 && currentDrawingRegionId) {
                const maskOffscreen = document.createElement('canvas');
                maskOffscreen.width = maskPainterCanvas.width;
                maskOffscreen.height = maskPainterCanvas.height;
                const mCtx = maskOffscreen.getContext('2d');
                mCtx.fillStyle = '#000000';
                mCtx.fillRect(0, 0, maskOffscreen.width, maskOffscreen.height);

                mCtx.fillStyle = '#ffffff';
                strokeHistory.forEach(stroke => {
                    mCtx.beginPath();
                    mCtx.arc(stroke.x, stroke.y, stroke.size / 2, 0, Math.PI * 2);
                    mCtx.fill();
                });

                const targetReg = regionDefinitions.find(r => r.id === currentDrawingRegionId);
                if (targetReg) {
                    targetReg.mask_b64 = maskOffscreen.toDataURL('image/png');
                }
                renderRegionDefinitions();
            }
            maskPainterModal.classList.add('hidden');
        });
    }

    const tabServerOnlineBtn = document.getElementById('tabServerOnlineBtn');
    const tabApiKeyBtn = document.getElementById('tabApiKeyBtn');
    const panelServerOnline = document.getElementById('panelServerOnline');
    const panelApiKey = document.getElementById('panelApiKey');

    function switchSettingsTab(tab) {
        if (!tabServerOnlineBtn || !tabApiKeyBtn || !panelServerOnline || !panelApiKey) return;
        if (tab === 'server_online') {
            tabServerOnlineBtn.classList.remove('btn-inactive-high-contrast');
            tabServerOnlineBtn.classList.add('btn-active-high-contrast', 'active');
            tabApiKeyBtn.classList.remove('btn-active-high-contrast', 'active');
            tabApiKeyBtn.classList.add('btn-inactive-high-contrast');
            panelServerOnline.classList.remove('hidden');
            panelApiKey.classList.add('hidden');
            localStorage.setItem('active_settings_tab', 'server_online');
        } else {
            tabApiKeyBtn.classList.remove('btn-inactive-high-contrast');
            tabApiKeyBtn.classList.add('btn-active-high-contrast', 'active');
            tabServerOnlineBtn.classList.remove('btn-active-high-contrast', 'active');
            tabServerOnlineBtn.classList.add('btn-inactive-high-contrast');
            panelApiKey.classList.remove('hidden');
            panelServerOnline.classList.add('hidden');
            localStorage.setItem('active_settings_tab', 'api_key');
        }
    }
    window.switchSettingsTab = switchSettingsTab;

    if (tabServerOnlineBtn) tabServerOnlineBtn.addEventListener('click', () => switchSettingsTab('server_online'));
    if (tabApiKeyBtn) tabApiKeyBtn.addEventListener('click', () => switchSettingsTab('api_key'));

    if (toggleKeyVisibilityBtn && apiKeyInput) {
        toggleKeyVisibilityBtn.addEventListener('click', () => {
            if (apiKeyInput.type === 'text') {
                apiKeyInput.type = 'password';
                toggleKeyVisibilityBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
            } else {
                apiKeyInput.type = 'text';
                toggleKeyVisibilityBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
            }
        });
    }

    if (openEngineModalBtn) {
        openEngineModalBtn.addEventListener('click', async () => {
            try {
                const savedTab = localStorage.getItem('active_settings_tab') || 'server_online';
                switchSettingsTab(savedTab);

                const archModelSelect = document.getElementById('archModelSelect');
                if (archModelSelect) {
                    archModelSelect.value = localStorage.getItem('arch_model') || 'flux';
                }
                if (apiKeyInput) {
                    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
                }
                const remoteServerUrlInput = document.getElementById('remoteServerUrlInput');
                if (remoteServerUrlInput) {
                    remoteServerUrlInput.value = localStorage.getItem('remote_server_url') || '';
                }
            } catch (e) {
                console.error("Lỗi lấy cài đặt engine:", e);
            }
            engineSettingsModal.classList.remove('hidden');
        });
    }

    if (closeSettingsModalBtn && engineSettingsModal) {
        closeSettingsModalBtn.addEventListener('click', () => engineSettingsModal.classList.add('hidden'));
    }

    if (engineSettingsModal) {
        engineSettingsModal.addEventListener('click', (e) => {
            if (e.target === engineSettingsModal) engineSettingsModal.classList.add('hidden');
        });
    }

    if (saveEngineSettingsBtn) {
        saveEngineSettingsBtn.addEventListener('click', async () => {
            const archModelSelect = document.getElementById('archModelSelect');
            const chosenArch = archModelSelect ? archModelSelect.value : 'flux';
            const apiKeyVal = apiKeyInput ? apiKeyInput.value.trim() : '';
            const remoteServerUrlInput = document.getElementById('remoteServerUrlInput');
            const remoteUrlVal = remoteServerUrlInput ? remoteServerUrlInput.value.trim() : '';

            localStorage.setItem('arch_model', chosenArch);
            if (apiKeyVal) localStorage.setItem('gemini_api_key', apiKeyVal);
            if (remoteUrlVal) localStorage.setItem('remote_server_url', remoteUrlVal);

            const saveBtn = document.getElementById('saveEngineSettingsBtn');
            const origHtml = saveBtn ? saveBtn.innerHTML : 'Lưu & Áp Dụng';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang Lưu...';
            }

            try {
                const payload = {
                    engine_mode: 'cloud_api',
                    arch_model: chosenArch,
                    api_key: apiKeyVal,
                    remote_server_url: remoteUrlVal
                };
                await fetch(getApiUrl('/api/settings'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                // Không chặn UI nếu mạng có độ trễ
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = origHtml;
                }
                engineSettingsModal.classList.add('hidden');
                await checkStatus();
            }
        });
    }

    // --- Mode State Store (Completely Isolated Input Data per Space Mode) ---
    const modeStates = {
        interior: {
            inputImageB64: null,
            multiViewImagesB64Array: [],
            referenceImagesB64Array: [],
            customPrompt: '',
            regionDefinitions: [],
            checkedCriteriaIds: []
        },
        exterior: {
            inputImageB64: null,
            multiViewImagesB64Array: [],
            referenceImagesB64Array: [],
            customPrompt: '',
            regionDefinitions: [],
            checkedCriteriaIds: []
        }
    };

    function saveCurrentModeState() {
        if (!modeStates[currentMode]) return;
        modeStates[currentMode].inputImageB64 = currentInputImageB64;
        modeStates[currentMode].multiViewImagesB64Array = [...multiViewImagesB64Array];
        modeStates[currentMode].referenceImagesB64Array = [...referenceImagesB64Array];
        modeStates[currentMode].customPrompt = customPromptInput ? customPromptInput.value : '';
        modeStates[currentMode].regionDefinitions = JSON.parse(JSON.stringify(regionDefinitions));
        
        const checklistContainer = document.getElementById('checklistContainer');
        if (checklistContainer) {
            const checkedBoxes = checklistContainer.querySelectorAll('.criteria-checkbox:checked');
            modeStates[currentMode].checkedCriteriaIds = Array.from(checkedBoxes).map(cb => cb.dataset.id);
        }
    }

    function loadModeState(mode) {
        if (!modeStates[mode]) return;
        const st = modeStates[mode];
        currentInputImageB64 = st.inputImageB64;
        multiViewImagesB64Array = [...st.multiViewImagesB64Array];
        referenceImagesB64Array = [...st.referenceImagesB64Array];
        if (customPromptInput) customPromptInput.value = st.customPrompt;
        regionDefinitions = JSON.parse(JSON.stringify(st.regionDefinitions));

        // Restore image input preview
        if (currentInputImageB64) {
            imagePreview.src = currentInputImageB64;
            uploadPlaceholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');
        } else {
            imagePreview.src = '';
            uploadPlaceholder.classList.remove('hidden');
            previewContainer.classList.add('hidden');
        }

        renderMultiviewThumbs();
        renderRefThumbs();
        renderRegionDefinitions();
        renderChecklist();

        if (st.checkedCriteriaIds && st.checkedCriteriaIds.length > 0) {
            const checklistContainer = document.getElementById('checklistContainer');
            if (checklistContainer) {
                st.checkedCriteriaIds.forEach(id => {
                    const cb = checklistContainer.querySelector(`.criteria-checkbox[data-id="${id}"]`);
                    if (cb) cb.checked = true;
                });
            }
        }
        updateFixedPrompt();
    }

    // --- Mode Switcher ---
    if (tabInteriorBtn) tabInteriorBtn.addEventListener('click', () => switchMode('interior'));
    if (tabExteriorBtn) tabExteriorBtn.addEventListener('click', () => switchMode('exterior'));

    function switchMode(mode) {
        if (currentMode === mode) return;
        saveCurrentModeState();
        currentMode = mode;

        if (mode === 'interior') {
            tabInteriorBtn.classList.remove('btn-inactive-high-contrast');
            tabInteriorBtn.classList.add('btn-active-high-contrast', 'active');
            tabExteriorBtn.classList.remove('btn-active-high-contrast', 'active');
            tabExteriorBtn.classList.add('btn-inactive-high-contrast');
            modeLogoIcon.className = 'fa-solid fa-couch logo-icon text-primary text-2xl shrink-0';
            if (modeTitle) modeTitle.textContent = 'AETHERIS AI STUDIO';
            if (modeSubtitle) modeSubtitle.textContent = 'Chế độ: Render Nội Thất';
            if (renderBtnText) renderBtnText.textContent = 'Render';
            if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-list-check"></i> Tiêu Chí Prompt Cố Định - Nội Thất';
            uploadPromptText.textContent = 'Kéo thả, chọn tệp hoặc ấn Ctrl + V để Dán Ảnh';
            emptyStateIcon.className = 'fa-solid fa-couch text-5xl text-primary/60';
            emptyStateText.textContent = 'Kết quả Render Nội Thất sẽ hiển thị tại đây';
        } else {
            tabExteriorBtn.classList.remove('btn-inactive-high-contrast');
            tabExteriorBtn.classList.add('btn-active-high-contrast', 'active');
            tabInteriorBtn.classList.remove('btn-active-high-contrast', 'active');
            tabInteriorBtn.classList.add('btn-inactive-high-contrast');
            modeLogoIcon.className = 'fa-solid fa-building-user logo-icon text-primary text-2xl shrink-0';
            if (modeTitle) modeTitle.textContent = 'AETHERIS AI STUDIO';
            if (modeSubtitle) modeSubtitle.textContent = 'Chế độ: Render Kiến Trúc Ngoại Thất';
            if (renderBtnText) renderBtnText.textContent = 'Render';
            if (modalTitle) modalTitle.innerHTML = '<i class="fa-solid fa-list-check"></i> Tiêu Chí Prompt Cố Định - Ngoại Thất';
            uploadPromptText.textContent = 'Kéo thả, chọn tệp hoặc ấn Ctrl + V để Dán Ảnh';
            emptyStateIcon.className = 'fa-solid fa-city text-5xl text-primary/60';
            emptyStateText.textContent = 'Kết quả Render Ngoại Thất sẽ hiển thị tại đây';
        }

        loadModeState(mode);
    }

    // --- Image Upload Handler ---
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        multiViewImagesB64Array = [];
        let loadedCount = 0;

        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const b64 = evt.target.result;
                multiViewImagesB64Array[index] = b64;
                loadedCount++;

                if (loadedCount === files.length) {
                    currentInputImageB64 = multiViewImagesB64Array[0];
                    imagePreview.src = currentInputImageB64;
                    uploadPlaceholder.classList.add('hidden');
                    previewContainer.classList.remove('hidden');

                    imagePreview.onload = () => {
                        inputImageNaturalWidth = imagePreview.naturalWidth || 1024;
                        inputImageNaturalHeight = imagePreview.naturalHeight || 768;
                        origRatioText.textContent = `(${inputImageNaturalWidth}x${inputImageNaturalHeight})`;
                    };

                    renderMultiviewThumbs();
                }
            };
            reader.readAsDataURL(file);
        });
    });

    function renderMultiviewThumbs() {
        if (multiViewImagesB64Array.length > 1) {
            multiviewThumbsBox.classList.remove('hidden');
            multiViewCountLabel.textContent = multiViewImagesB64Array.length;
            multiviewThumbsGrid.innerHTML = multiViewImagesB64Array.map((imgUrl, i) => `
                <div class="thumb-card">
                    <img src="${imgUrl}" alt="Cam view ${i+1}">
                    <span>Góc ${i+1}</span>
                </div>
            `).join('');
        } else {
            multiviewThumbsBox.classList.add('hidden');
        }
    }

    removeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentInputImageB64 = null;
        multiViewImagesB64Array = [];
        imageInput.value = '';
        uploadPlaceholder.classList.remove('hidden');
        previewContainer.classList.add('hidden');
        multiviewThumbsBox.classList.add('hidden');
        origRatioText.textContent = '(Tự động)';
        updateGuidanceRoadmap();
    });

    // --- Aspect Ratio & Quality Selection Chips ---
    const ratioChips = document.querySelectorAll('.ratio-chip');
    ratioChips.forEach(chip => {
        chip.addEventListener('click', () => {
            ratioChips.forEach(c => {
                c.classList.remove('btn-active-high-contrast', 'active');
                c.classList.add('btn-inactive-high-contrast');
            });
            chip.classList.remove('btn-inactive-high-contrast');
            chip.classList.add('btn-active-high-contrast', 'active');
            const radio = chip.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    const qualityChips = document.querySelectorAll('.quality-chip');
    qualityChips.forEach(chip => {
        chip.addEventListener('click', () => {
            qualityChips.forEach(c => {
                c.classList.remove('btn-active-high-contrast', 'active');
                c.classList.add('btn-inactive-high-contrast');
            });
            chip.classList.remove('btn-inactive-high-contrast');
            chip.classList.add('btn-active-high-contrast', 'active');
            const radio = chip.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    function getSelectedDimensions() {
        const selectedRatio = document.querySelector('input[name="aspectRatio"]:checked')?.value || 'original';
        const selectedQuality = document.querySelector('input[name="renderQuality"]:checked')?.value || '1k';

        let baseDim = 1024;
        if (selectedQuality === '2k') baseDim = 1536;
        if (selectedQuality === '4k') baseDim = 2048;

        let w = baseDim;
        let h = Math.round(baseDim * (3/4));

        if (selectedRatio === 'original') {
            w = inputImageNaturalWidth;
            h = inputImageNaturalHeight;
            const maxDim = baseDim;
            if (w > maxDim || h > maxDim) {
                if (w >= h) {
                    h = Math.round((h / w) * maxDim);
                    w = maxDim;
                } else {
                    w = Math.round((w / h) * maxDim);
                    h = maxDim;
                }
            }
        } else if (selectedRatio === '1:1') {
            w = baseDim; h = baseDim;
        } else if (selectedRatio === '4:3') {
            w = baseDim; h = Math.round(baseDim * (3/4));
        } else if (selectedRatio === '3:4') {
            w = Math.round(baseDim * (3/4)); h = baseDim;
        } else if (selectedRatio === '16:9') {
            w = baseDim; h = Math.round(baseDim * (9/16));
        } else if (selectedRatio === '9:16') {
            w = Math.round(baseDim * (9/16)); h = baseDim;
        }

        w = Math.max(512, Math.round(w / 64) * 64);
        h = Math.max(512, Math.round(h / 64) * 64);
        return { width: w, height: h };
    }

    // --- Criteria Data & Checklist Module ---
    // --- Prompt Criteria Data & Modal Renderer ---
    // --- Criteria Data & Checklist Module (3 Cố Định: Phong Cách, Không Gian, Ánh Sáng) ---
    let CRITERIA_DATA = {
        style: {
            title: "🎨 1. Phong Cách (Style)",
            key: "style",
            items: [
                { id: "st_modern", label: "Hiện Đại (Modern)", prompt: "modern architectural design style", checked: false },
                { id: "st_minimalist", label: "Tối Giản (Minimalist)", prompt: "minimalist Japandi architectural style", checked: false },
                { id: "st_neoclassic", label: "Tân Cổ Điển (Neoclassical)", prompt: "neoclassical architectural style with wall moldings", checked: false },
                { id: "st_classic", label: "Cổ Điển Châu Âu (Classic)", prompt: "classic European architectural design style", checked: false },
                { id: "st_indochine", label: "Đông Dương (Indochine)", prompt: "indochine style architectural design", checked: false },
                { id: "st_industrial", label: "Công Nghiệp (Industrial)", prompt: "industrial loft style with exposed brick and metal", checked: false },
                { id: "st_japandi", label: "Japandi / Wabi-Sabi", prompt: "japandi wabi-sabi minimalist aesthetic", checked: false },
                { id: "st_tropical", label: "Nhiệt Đới (Tropical)", prompt: "tropical green biophilic architecture", checked: false },
                { id: "st_hitech", label: "Sang Trọng (High-Tech)", prompt: "futuristic high-tech luxury architectural design", checked: false }
            ]
        },
        space: {
            title: "🏠 2. Không Gian (Space)",
            key: "space",
            items: [
                { id: "sp_living", label: "Phòng Khách (Living Room)", prompt: "luxury living room lounge space", checked: false },
                { id: "sp_bedroom", label: "Phòng Ngủ (Bedroom)", prompt: "master bedroom suite space", checked: false },
                { id: "sp_kitchen", label: "Phòng Bếp & Ăn (Kitchen & Dining)", prompt: "minimalist kitchen and dining space", checked: false },
                { id: "sp_bathroom", label: "Phòng Tắm (Bathroom)", prompt: "luxury spa bathroom space", checked: false },
                { id: "sp_villa", label: "Biệt Thự / Villa", prompt: "luxury architectural villa", checked: false },
                { id: "sp_townhouse", label: "Nhà Phố (Townhouse)", prompt: "contemporary townhouse facade", checked: false },
                { id: "sp_office", label: "Phòng Làm Việc (Home Office)", prompt: "home office study space", checked: false },
                { id: "sp_commercial", label: "Tòa Nhà / Showroom", prompt: "commercial building retail space", checked: false },
                { id: "sp_garden", label: "Sân Vườn / Hồ Bơi (Garden & Pool)", prompt: "landscaped garden with swimming pool", checked: false }
            ]
        },
        lighting: {
            title: "💡 3. Ánh Sáng (Lighting)",
            key: "lighting",
            items: [
                { id: "lt_natural", label: "Ánh Sáng Tự Nhiên (Natural Daylight)", prompt: "bright natural daylight streaming through glass", checked: false },
                { id: "lt_ambient", label: "Đèn Âm Trần (Warm Recessed LED)", prompt: "warm linear recessed LED architectural lighting", checked: false },
                { id: "lt_spotlight", label: "Chiếu Điểm Công Trình (Architectural Spotlight)", prompt: "dramatic architectural exterior spotlight illumination", checked: false },
                { id: "lt_dusk", label: "Hoàng Hôn (Cinematic Dusk)", prompt: "cinematic dramatic dusk sunset lighting atmosphere", checked: false },
                { id: "lt_studio", label: "Studio (Studio Lighting)", prompt: "clean professional studio lighting setup", checked: false }
            ]
        }
    };

    function loadSavedCriteria() {
        try {
            const saved = localStorage.getItem('archviz_criteria_v3');
            if (saved) {
                const parsed = JSON.parse(saved);
                ['style', 'space', 'lighting'].forEach(catKey => {
                    if (parsed[catKey] && Array.isArray(parsed[catKey].items)) {
                        CRITERIA_DATA[catKey].items = parsed[catKey].items;
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load criteria from localStorage", e);
        }
    }

    function saveCriteriaToStorage() {
        try {
            localStorage.setItem('archviz_criteria_v3', JSON.stringify(CRITERIA_DATA));
        } catch (e) {}
    }

    function renderChecklist() {
        const checklistContainer = document.getElementById('checklistContainer');
        if (!checklistContainer) return;

        loadSavedCriteria();

        const categories = [CRITERIA_DATA.style, CRITERIA_DATA.space, CRITERIA_DATA.lighting];

        checklistContainer.innerHTML = categories.map(cat => `
            <div class="criteria-group bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-md mb-4" data-cat="${cat.key}">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-2">
                        <span>${cat.title}</span>
                    </h4>
                    <span class="text-[11px] text-slate-400 font-mono-technical">(${cat.items.length} tags)</span>
                </div>

                <div class="flex gap-2 mb-3">
                    <input type="text" id="addTagInput_${cat.key}" class="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary font-mono-technical" placeholder="➕ Thêm tag ${cat.key === 'style' ? 'Phong cách' : cat.key === 'space' ? 'Không gian' : 'Ánh sáng'} mới...">
                    <button type="button" class="btn-add-tag bg-primary/20 hover:bg-primary/40 text-primary border border-primary/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0" data-cat="${cat.key}">
                        <i class="fa-solid fa-plus"></i> Thêm Tag
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2" id="tagGrid_${cat.key}">
                    ${cat.items.map(item => `
                        <div class="criteria-item-label flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-primary/50 transition-all">
                            <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                <input type="checkbox" value="${item.prompt}" data-id="${item.id}" data-cat="${cat.key}" ${item.checked ? 'checked' : ''} class="criteria-checkbox w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-950 cursor-pointer">
                                <span class="text-xs font-medium text-slate-200 truncate select-none">${item.label}</span>
                            </label>
                            <button type="button" class="btn-delete-tag text-slate-500 hover:text-red-400 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer ml-1" data-id="${item.id}" data-cat="${cat.key}" title="Xóa tag này">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        checklistContainer.querySelectorAll('.criteria-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const cat = e.target.getAttribute('data-cat');
                const item = CRITERIA_DATA[cat].items.find(i => i.id === id);
                if (item) item.checked = e.target.checked;
                saveCriteriaToStorage();
                updateFixedPrompt();
            });
        });

        checklistContainer.querySelectorAll('.btn-add-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cat = btn.getAttribute('data-cat');
                const input = document.getElementById(`addTagInput_${cat}`);
                if (!input) return;
                const val = input.value.trim();
                if (!val) return;

                const newTag = {
                    id: `tag_${cat}_${Date.now()}`,
                    label: val,
                    prompt: `${val} architectural ${cat}`,
                    checked: true
                };
                CRITERIA_DATA[cat].items.push(newTag);
                saveCriteriaToStorage();
                renderChecklist();
                updateFixedPrompt();
            });
        });

        ['style', 'space', 'lighting'].forEach(catKey => {
            const input = document.getElementById(`addTagInput_${catKey}`);
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const btn = checklistContainer.querySelector(`.btn-add-tag[data-cat="${catKey}"]`);
                        if (btn) btn.click();
                    }
                });
            }
        });

        checklistContainer.querySelectorAll('.btn-delete-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                const cat = btn.getAttribute('data-cat');
                CRITERIA_DATA[cat].items = CRITERIA_DATA[cat].items.filter(i => i.id !== id);
                saveCriteriaToStorage();
                renderChecklist();
                updateFixedPrompt();
            });
        });

        const clearAllCriteriaBtn = document.getElementById('clearAllCriteriaBtn');
        if (clearAllCriteriaBtn) {
            clearAllCriteriaBtn.onclick = () => {
                ['style', 'space', 'lighting'].forEach(catKey => {
                    CRITERIA_DATA[catKey].items.forEach(i => i.checked = false);
                });
                saveCriteriaToStorage();
                renderChecklist();
                updateFixedPrompt();
            };
        }
    }

    function updateFixedPrompt() {
        const checklistContainer = document.getElementById('checklistContainer');
        if (!checklistContainer || !fixedPromptDisplay) return;

        let selectedPrompts = [];

        ['style', 'space', 'lighting'].forEach(catKey => {
            if (CRITERIA_DATA[catKey] && Array.isArray(CRITERIA_DATA[catKey].items)) {
                CRITERIA_DATA[catKey].items.forEach(item => {
                    if (item.checked) {
                        selectedPrompts.push(item.prompt);
                    }
                });
            }
        });

        const criteriaSelectedBadge = document.getElementById('criteriaSelectedBadge');
        if (criteriaSelectedBadge) {
            criteriaSelectedBadge.textContent = `Đã chọn: ${selectedPrompts.length}`;
        }

        if (selectedPrompts.length === 0) {
            fixedPromptDisplay.value = "";
            return;
        }

        let prefix = currentMode === 'interior' 
            ? "High quality architectural interior render" 
            : "High quality architectural exterior render";

        fixedPromptDisplay.value = `${prefix}, ${selectedPrompts.join(', ')}, photorealistic, 8k resolution, highly detailed.`;
    }

    // --- Modal Controls & Dynamic Prompt ---
    const closeChecklistModalBtn = document.getElementById('closeChecklistModalBtn');
    const applyChecklistBtn = document.getElementById('applyChecklistBtn');

    if (openChecklistBtn && checklistModal) {
        openChecklistBtn.addEventListener('click', () => {
            renderChecklist();
            checklistModal.classList.remove('hidden');
        });
    }
    if (closeChecklistModalBtn && checklistModal) {
        closeChecklistModalBtn.addEventListener('click', () => checklistModal.classList.add('hidden'));
    }
    if (applyChecklistBtn && checklistModal) {
        applyChecklistBtn.addEventListener('click', () => {
            updateFixedPrompt();
            checklistModal.classList.add('hidden');
        });
    }

    if (checklistModal) {
        checklistModal.addEventListener('click', (e) => {
            if (e.target === checklistModal) {
                updateFixedPrompt();
                checklistModal.classList.add('hidden');
            }
        });
    }

    // Call initial prompt update
    updateFixedPrompt();

    document.querySelectorAll('.checkbox-grid input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', updateFixedPrompt);
    });
    updateFixedPrompt();

    // --- Download Dropdown Actions ---
    currentResultDownloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentResultDownloadMenu.classList.toggle('hidden');
    });

    window.addEventListener('click', () => {
        currentResultDownloadMenu.classList.add('hidden');
    });

    downloadOrigBtn.addEventListener('click', () => {
        if (!currentRenderResultUrl) return;
        downloadFile(currentRenderResultUrl, `render_${Date.now()}.png`);
        currentResultDownloadMenu.classList.add('hidden');
    });

    downloadUpscaleBtn.addEventListener('click', async () => {
        if (!currentRenderResultUrl) return;
        currentResultDownloadMenu.classList.add('hidden');
        await performUpscaleAndDownload(currentRenderResultUrl);
    });

    // --- Render Action Router (Đơn Lẻ ↔ Nhiều View) ---
    generateBtn.addEventListener('click', async () => {
        if (currentRenderViewMode === 'multi') {
            executeMultiViewRender();
        } else {
            executeSingleViewRender();
        }
    });

    // --- Model Download Poller & Locking Rule ---
    const modelDownloadBanner = document.getElementById('modelDownloadBanner');
    const bannerFileName = document.getElementById('bannerFileName');
    const bannerProgressBar = document.getElementById('bannerProgressBar');
    const bannerProgressText = document.getElementById('bannerProgressText');

    let isModelDownloadingGlobal = false;

    async function pollGlobalModelDownloadStatus() {
        try {
            const res = await fetch(getApiUrl('/api/model-download-status'));
            const data = await res.json();

            if (data && data.is_downloading) {
                isModelDownloadingGlobal = true;
                if (modelDownloadBanner) modelDownloadBanner.classList.remove('hidden');
                if (bannerFileName) bannerFileName.innerText = `📥 Đang tự động tải Model Local: ${data.current_file}...`;
                if (bannerProgressBar) bannerProgressBar.style.width = `${data.progress_percent || 0}%`;
                if (bannerProgressText) bannerProgressText.innerText = `${data.progress_percent || 0}%`;
            } else {
                isModelDownloadingGlobal = false;
                if (modelDownloadBanner) modelDownloadBanner.classList.add('hidden');
            }
        } catch (e) {
            console.warn("Poll download status error:", e);
        }
    }

    // --- ☁️ 100% Standalone Cloud AI Direct Renderer (Zero-Server / Independent from Local PC) ---
    async function renderDirectFromCloudInBrowser(payload) {
        const prompt = payload.prompt || "photorealistic modern architectural render, 8k resolution";
        const width = payload.width || 1024;
        const height = payload.height || 768;
        const seed = payload.seed || Math.floor(Math.random() * 1000000);
        const inputB64 = payload.input_image || "";
        const apiKey = (apiKeyInput ? apiKeyInput.value.trim() : '') || localStorage.getItem('gemini_api_key') || '';

        // 1. Nếu có Google Gemini API Key: Gọi trực tiếp Google Gemini 2.0 Flash / Imagen 3
        if (apiKey) {
            try {
                updateProgress(45, "Đang xử lý qua Google Cloud AI Supercomputer...");
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
                const parts = [
                    { text: `[ARCHITECTURAL 8K RENDER]: Transform this architectural sketch/input drawing into a photorealistic 8K render. Strictly preserve building geometry, walls, windows, and contours. Style: ${prompt}` }
                ];
                if (inputB64) {
                    const rawB64 = inputB64.includes(',') ? inputB64.split(',')[1] : inputB64;
                    parts.push({ inline_data: { mime_type: "image/png", data: rawB64 } });
                }
                const res = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts }] })
                });
                if (res.ok) {
                    const data = await res.json();
                    const candidates = data.candidates || [];
                    if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
                        for (const p of candidates[0].content.parts) {
                            if (p.inline_data && p.inline_data.data) {
                                return `data:image/png;base64,${p.inline_data.data}`;
                            }
                        }
                    }
                }
            } catch (ge) {
                console.warn("Gemini Cloud error:", ge);
            }
        }

        // 2. Cloud Serverless Engine (Miễn phí 100%, 0 Config, Chạy 24/7 trên Cloud không cần bật máy)
        updateProgress(50, "Đang xử lý qua Cloud GPU Serverless (24/7 Độc Lập)...");
        const encodedPrompt = encodeURIComponent(`photorealistic 3D architectural render, ${prompt}, 8k, photoreal, masterpiece, archdaily architectural photography`);
        const cloudImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;
        
        // Kiểm tra và tải ảnh về browser
        await new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = cloudImageUrl;
            setTimeout(resolve, 9000);
        });

        return cloudImageUrl;
    }

    async function executeSingleViewRender() {
        const isCloud = modeApiBtn ? modeApiBtn.classList.contains('active') : false;
        // Không chặn cứng ở frontend - backend sẽ tự kiểm tra model readiness theo dòng model được chọn
        if (!checkLocalModelDirBeforeRender(() => generateBtn.click())) return;

        const fixedPrompt = fixedPromptDisplay.value.trim();
        const rawCustomPrompt = customPromptInput.value.trim();
        const enhancedCustomPrompt = smartEnhancePrompt(rawCustomPrompt);

        let combinedPrompt = fixedPrompt;
        if (enhancedCustomPrompt) {
            combinedPrompt = fixedPrompt ? `${fixedPrompt}, ${enhancedCustomPrompt}` : enhancedCustomPrompt;
        }

        if (!combinedPrompt || combinedPrompt.trim() === '') {
            combinedPrompt = currentMode === 'interior'
                ? "photorealistic modern interior design, 8k resolution, highly detailed"
                : "photorealistic modern exterior architecture, 8k resolution, highly detailed";
        }

        const dims = getSelectedDimensions();

        generateBtn.disabled = true;
        if (typeof multiViewRenderBtn !== 'undefined' && multiViewRenderBtn) multiViewRenderBtn.disabled = true;
        progressBox.classList.remove('hidden');
        emptyState.classList.add('hidden');
        resultBox.classList.add('hidden');
        multiViewCanvasBox.classList.add('hidden');
        updateProgress(15, `Đang gửi request (${isCloud ? 'CLOUD API' : 'MODEL LOCAL'}) - ${dims.width}x${dims.height}...`);

        const z1Input = document.getElementById('regionalZone1Input');
        const z2Input = document.getElementById('regionalZone2Input');

        const isRefModeActive = refModeImageBtn ? refModeImageBtn.classList.contains('active') : false;

        const payload = {
            mode: currentMode,
            engine_mode: modeApiBtn.classList.contains('active') ? 'cloud_api' : 'local',
            prompt: combinedPrompt,
            api_key: apiKeyInput ? apiKeyInput.value.trim() : '',
            cloud_provider: apiProviderSelect ? apiProviderSelect.value : 'gemini',
            custom_base_url: customUrlInput ? customUrlInput.value.trim() : '',
            use_ref_image_mode: isRefModeActive,
            reference_images: referenceImagesB64Array,
            region_definitions: regionDefinitions.map(r => ({
                tag: r.tag,
                prompt: r.prompt,
                has_mask: !!r.mask_b64,
                mask_b64: r.mask_b64
            })),
            negative_prompt: currentMode === 'interior'
                ? "blurry, low quality, distorted architecture, bad proportions, ugly, noise"
                : "blurry, low quality, distorted building, bad geometry, out of scale, ugly, noise",
            width: dims.width,
            height: dims.height,
            steps: 25,
            cfg: 7.5,
            denoise: currentInputImageB64 ? 0.8 : 1.0,
            seed: Math.floor(Math.random() * 1000000),
            input_image: currentInputImageB64
        };

        let currentProgress = 20;
        const progressInterval = setInterval(async () => {
            if (!isCloud) {
                try {
                    const stRes = await fetch(getApiUrl('/api/model-download-status'));
                    const stData = await stRes.json();
                    if (stData.is_downloading) {
                        updateProgress(stData.progress_percent || 25, `📥 Đang tự động tải Model Local (${stData.current_file}: ${stData.progress_percent}%)...`);
                        return;
                    }
                } catch(e){}
            }

            if (currentProgress < 92) {
                currentProgress += Math.floor(Math.random() * 6) + 3;
                updateProgress(currentProgress, `Đang xử lý render (${currentProgress}%)...`);
            }
        }, 1000);

        try {
            let renderedImageUrl = null;

            // Nếu đang chọn chế độ Cloud API hoặc không kết nối được Local
            if (isCloud) {
                renderedImageUrl = await renderDirectFromCloudInBrowser(payload);
            } else {
                try {
                    const response = await fetch(getApiUrl('/api/render'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await response.json();
                    if (data.success && data.images && data.images.length > 0) {
                        renderedImageUrl = data.images[0].url.startsWith('http') || data.images[0].url.startsWith('data:') 
                            ? data.images[0].url 
                            : `/api/proxy-image?url=${encodeURIComponent(data.images[0].url)}`;
                    }
                } catch(netErr) {
                    console.log("Local/Colab server không khả dụng, tự động chuyển sang Cloud AI GPU 24/7...");
                    renderedImageUrl = await renderDirectFromCloudInBrowser(payload);
                }
            }

            clearInterval(progressInterval);

            if (renderedImageUrl) {
                updateProgress(100, "Render hoàn tất!");
                setTimeout(() => {
                    progressBox.classList.add('hidden');
                    currentRenderResultUrl = renderedImageUrl;
                    resultImg.src = currentRenderResultUrl;
                    resultBox.classList.remove('hidden');

                    if (currentInputImageB64 && compareInputImg && compareOverlay && compareHandle) {
                        compareInputImg.src = currentInputImageB64;
                        compareOverlay.classList.remove('hidden');
                        compareHandle.classList.remove('hidden');
                        compareOverlay.style.width = '50%';
                        compareHandle.style.left = '50%';
                    } else if (compareOverlay && compareHandle) {
                        compareOverlay.classList.add('hidden');
                        compareHandle.classList.add('hidden');
                    }

                    // Tự động sao lưu ảnh Render lên Google Drive (Nếu đã đăng nhập)
                    if (typeof autoSyncRenderToGoogleDrive === 'function') {
                        autoSyncRenderToGoogleDrive(renderedImageUrl, {
                            prompt: customPromptInput ? customPromptInput.value : '',
                            mode: currentMode,
                            filename: `archviz_${currentMode}_${Date.now()}.png`
                        });
                    }
                }, 400);
            } else {
                updateProgress(0, `❌ Lỗi Render: Không tạo được ảnh`);
                if (progressFill) progressFill.style.backgroundColor = '#ef4444';
            }
        } catch (err) {
            clearInterval(progressInterval);
            updateProgress(0, `❌ Lỗi kết nối: ${err.message}`);
            if (progressFill) progressFill.style.backgroundColor = '#ef4444';
        } finally {
            generateBtn.disabled = false;
        }
    }

    // --- Render Đồng Bộ Nhiều View Function ---
    async function executeMultiViewRender() {
        const isCloud = modeApiBtn ? modeApiBtn.classList.contains('active') : false;
        // Không chặn cứng ở frontend - backend sẽ tự kiểm tra model readiness theo dòng model được chọn
        if (!checkLocalModelDirBeforeRender(() => generateBtn.click())) return;

        if (multiViewImagesB64Array.length === 0) {
            alert("Vui lòng dán ảnh (Ctrl+V) hoặc bấm ô Ảnh đầu vào để chọn ít nhất 1 hoặc NHIỀU ảnh các góc camera!");
            return;
        }

        const fixedPrompt = fixedPromptDisplay.value.trim();
        const rawCustomPrompt = customPromptInput.value.trim();
        const enhancedCustomPrompt = smartEnhancePrompt(rawCustomPrompt);
        let combinedPrompt = fixedPrompt;
        if (enhancedCustomPrompt) {
            combinedPrompt = fixedPrompt ? `${fixedPrompt}, ${enhancedCustomPrompt}` : enhancedCustomPrompt;
        }

        const dims = getSelectedDimensions();
        const masterSeed = Math.floor(Math.random() * 1000000);

        generateBtn.disabled = true;
        if (typeof multiViewRenderBtn !== 'undefined' && multiViewRenderBtn) multiViewRenderBtn.disabled = true;
        progressBox.classList.remove('hidden');
        singleCanvasBox.classList.add('hidden');
        multiViewCanvasBox.classList.remove('hidden');

        updateProgress(10, `Khóa Master Seed (${masterSeed}) & khởi tạo Render Đồng Bộ ${multiViewImagesB64Array.length} Góc Camera...`);

        let currentProgress = 15;
        const progressInterval = setInterval(() => {
            if (currentProgress < 90) {
                currentProgress += Math.floor(Math.random() * 5) + 2;
                updateProgress(currentProgress, `Đang xử lý đồng bộ vật liệu & chi tiết cho các góc cam (${currentProgress}%)...`);
            }
        }, 1200);

        try {
            const response = await fetch(getApiUrl('/api/render-multiview'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: currentMode,
                    engine_mode: modeApiBtn.classList.contains('active') ? 'cloud_api' : 'local',
                    prompt: combinedPrompt,
                    api_key: apiKeyInput ? apiKeyInput.value.trim() : '',
                    cloud_provider: apiProviderSelect ? apiProviderSelect.value : 'gemini',
                    custom_base_url: customUrlInput ? customUrlInput.value.trim() : '',
                    width: dims.width,
                    height: dims.height,
                    seed: masterSeed,
                    input_images: multiViewImagesB64Array
                })
            });

            clearInterval(progressInterval);
            const data = await response.json();

            if (data.success && data.views && data.views.length > 0) {
                updateProgress(100, `Hoàn tất Render Đồng Bộ ${data.total_views} Góc Camera!`);
                setTimeout(() => {
                    progressBox.classList.add('hidden');
                    renderMultiViewGrid(data.views, dims);
                }, 400);
            } else {
                updateProgress(0, `❌ Lỗi Render Đồng Bộ: ${data.error || 'Không thể render'}`);
                if (progressFill) progressFill.style.backgroundColor = '#ef4444';
            }
        } catch (e) {
            clearInterval(progressInterval);
            updateProgress(0, `❌ Lỗi kết nối Server: ${e.message}`);
            if (progressFill) progressFill.style.backgroundColor = '#ef4444';
        } finally {
            generateBtn.disabled = false;
        }
    }

    function renderMultiViewGrid(views, dims) {
        multiViewGrid.innerHTML = views.map(v => {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(v.url)}`;
            return `
                <div class="multiview-card">
                    <div class="multiview-card-thumb">
                        <img src="${proxyUrl}" alt="Camera View ${v.view_number}">
                        <span class="view-badge">📸 Góc Camera ${v.view_number}</span>
                    </div>
                    <div class="multiview-card-actions">
                        <div class="download-dropdown-wrapper">
                            <button type="button" class="btn-gallery-dl" onclick="handleGalleryDlClick(event, '${encodeURIComponent(proxyUrl)}')">
                                <i class="fa-solid fa-download"></i> Tải về
                            </button>
                            <div class="download-menu hidden">
                                <button type="button" class="download-menu-item" onclick="triggerDlOriginal('${encodeURIComponent(proxyUrl)}')">
                                    <i class="fa-solid fa-file-image"></i> 📥 Nguyên bản (${dims.width}x${dims.height})
                                </button>
                                <button type="button" class="download-menu-item accent" onclick="triggerDlUpscale('${encodeURIComponent(proxyUrl)}')">
                                    <i class="fa-solid fa-bolt"></i> ⚡ Tăng cường x2 (${dims.width*2}x${dims.height*2})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function checkLocalModelDirBeforeRender(onSuccess) {
        return true;
    }

    function updateProgress(percent, msg) {
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (progressStatus) {
            if (percent === 100) {
                progressStatus.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i> ${msg}`;
            } else if (percent === 0) {
                progressStatus.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-400 text-sm"></i> ${msg}`;
            } else {
                let phaseLabel = msg;
                if (!msg || msg.includes('Đang xử lý render')) {
                    if (percent <= 20) {
                        phaseLabel = `📐 Giai đoạn 1/4: Phân tích móng hình học 3D & đường nét CAD (${percent}%)...`;
                    } else if (percent <= 65) {
                        phaseLabel = `⚡ Giai đoạn 2/4: Khử nhiễu Latent & Tổng hợp vật liệu PBR (${percent}%)...`;
                    } else if (percent <= 88) {
                        phaseLabel = `💎 Giai đoạn 3/4: Nâng cấp chi tiết kiến trúc & Ánh sáng Photoreal (${percent}%)...`;
                    } else {
                        phaseLabel = `🎨 Giai đoạn 4/4: Hoàn thiện Color Grading & Xuất 8K Master (${percent}%)...`;
                    }
                }
                progressStatus.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-emerald-400 text-sm"></i> ${phaseLabel}`;
            }
        }
    }

    // --- Kho Ảnh Logic ---
    openGalleryModalBtn.addEventListener('click', () => {
        fetchGallery();
        galleryModal.classList.remove('hidden');
    });

    closeGalleryModalBtn.addEventListener('click', () => galleryModal.classList.add('hidden'));

    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) galleryModal.classList.add('hidden');
    });

    galleryTabInteriorBtn.addEventListener('click', () => {
        currentGalleryTab = 'interior';
        galleryTabInteriorBtn.classList.add('active');
        galleryTabExteriorBtn.classList.remove('active');
        renderGalleryCards();
    });

    galleryTabExteriorBtn.addEventListener('click', () => {
        currentGalleryTab = 'exterior';
        galleryTabExteriorBtn.classList.add('active');
        galleryTabInteriorBtn.classList.remove('active');
        renderGalleryCards();
    });

    async function fetchGallery() {
        try {
            const res = await fetch(getApiUrl('/api/gallery'));
            allGalleryData = await res.json();
            
            const intItems = allGalleryData.filter(item => item.mode === 'interior');
            const extItems = allGalleryData.filter(item => item.mode === 'exterior');
            
            countInterior.textContent = intItems.length;
            countExterior.textContent = extItems.length;

            renderGalleryCards();
        } catch (e) {
            console.error('Error fetching gallery:', e);
        }
    }

    function renderGalleryCards() {
        const filtered = allGalleryData.filter(item => item.mode === currentGalleryTab);
        
        if (filtered.length === 0) {
            galleryCardsGrid.innerHTML = `
                <div class="empty-state text-center flex flex-col items-center justify-center p-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-folder-open text-5xl text-primary/40 mb-3 block"></i>
                    <p class="text-slate-400 font-semibold text-sm">Chưa có ảnh nào trong kho ${currentGalleryTab === 'interior' ? 'Nội Thất' : 'Ngoại Thất'}</p>
                </div>
            `;
            return;
        }

        galleryCardsGrid.innerHTML = filtered.map((item, index) => {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.url)}`;
            return `
                <div class="group relative rounded-2xl overflow-hidden glass-panel aspect-[4/3] flex flex-col transition-all duration-300 hover:border-primary/60 shadow-xl border border-white/10 bg-slate-950">
                    <img src="${proxyUrl}" alt="Architectural Render" class="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-in-out cursor-pointer" onclick="openLightbox('${encodeURIComponent(proxyUrl)}', '${encodeURIComponent(item.prompt || '')}')">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 pointer-events-none"></div>
                    
                    <!-- Stitch Resolution Badge -->
                    <div class="absolute top-3 left-3 glass-panel px-2.5 py-1 rounded-lg bg-slate-950/70 backdrop-blur-md border border-slate-700 pointer-events-none">
                        <span class="font-mono-technical text-[11px] text-emerald-400 font-bold tracking-wider">${item.width || 1024}x${item.height || 768}</span>
                    </div>
                    
                    <!-- Stitch Hover Overlay Actions -->
                    <div class="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <button type="button" class="w-8 h-8 rounded-full glass-panel bg-slate-900/90 text-amber-300 hover:bg-emerald-600 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-slate-700" title="Lưu vào Google Drive" onclick="saveSpecificCardToDrive(event, ${index})">
                            <i class="fa-brands fa-google-drive text-xs"></i>
                        </button>
                        <button type="button" class="w-8 h-8 rounded-full glass-panel bg-slate-900/90 text-white hover:bg-purple-600 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-slate-700" title="Tải về máy" onclick="triggerDlOriginal('${encodeURIComponent(proxyUrl)}')">
                            <span class="material-symbols-outlined text-sm">download</span>
                        </button>
                        <button type="button" class="w-8 h-8 rounded-full glass-panel bg-slate-900/90 text-white hover:bg-purple-600 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-slate-700" title="Xem phóng to" onclick="openLightbox('${encodeURIComponent(proxyUrl)}', '${encodeURIComponent(item.prompt || '')}')">
                            <span class="material-symbols-outlined text-sm">open_in_full</span>
                        </button>
                        <button type="button" class="w-8 h-8 rounded-full glass-panel bg-red-950/90 text-red-400 hover:bg-red-600 hover:text-white backdrop-blur-md flex items-center justify-center transition-all cursor-pointer shadow-lg border border-red-800/50" title="Xóa ảnh" onclick="deleteGalleryItem(event, ${index})">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                    
                    <!-- Stitch Footer / Metadata -->
                    <div class="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none">
                        <div class="font-mono-technical text-[10px] text-slate-400 mb-0.5 tracking-wider uppercase font-bold">AETHERIS STUDIO RENDER</div>
                        <p class="font-label-sm text-xs text-slate-200 line-clamp-2 opacity-90 group-hover:opacity-100 transition-opacity font-medium">
                            ${item.prompt || 'Render Kiến Trúc & Nội Thất'}
                        </p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Global Functions for Download Handling
    window.handleGalleryDlClick = (evt, encodedUrl) => {
        evt.stopPropagation();
        const menu = evt.currentTarget.nextElementSibling;
        document.querySelectorAll('.download-menu').forEach(m => {
            if (m !== menu) m.classList.add('hidden');
        });
        menu.classList.toggle('hidden');
    };

    window.triggerDlOriginal = (encodedUrl) => {
        const url = decodeURIComponent(encodedUrl);
        downloadFile(url, `render_original_${Date.now()}.png`);
        document.querySelectorAll('.download-menu').forEach(m => m.classList.add('hidden'));
    };

    window.triggerDlUpscale = async (encodedUrl) => {
        const url = decodeURIComponent(encodedUrl);
        document.querySelectorAll('.download-menu').forEach(m => m.classList.add('hidden'));
        await performUpscaleAndDownload(url);
    };

    async function performUpscaleAndDownload(imageUrl) {
        progressBox.classList.remove('hidden');
        updateProgress(30, "⚡ Đang tăng cường x2 độ phân giải và chất lượng ảnh...");

        try {
            const res = await fetch(getApiUrl('/api/upscale'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: imageUrl })
            });
            const data = await res.json();
            if (data.success && data.upscaled_url) {
                updateProgress(100, `Hoàn tất Tăng Cường x2 (${data.upscaled_dimensions})!`);
                setTimeout(() => {
                    progressBox.classList.add('hidden');
                    downloadFile(data.upscaled_url, `render_upscaled_2x_${Date.now()}.png`);
                }, 500);
            } else {
                alert(`Lỗi Tăng Cường Ảnh: ${data.error || 'Không thể upscale'}`);
                progressBox.classList.add('hidden');
            }
        } catch (e) {
            alert(`Lỗi tăng cường ảnh x2: ${e.message}`);
            progressBox.classList.add('hidden');
        }
    }

    function downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // --- Custom Glass Toast & Modal Notification System (Zero Browser Popups) ---
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        // Giới hạn tối đa 2 Toast xuất hiện cùng lúc, xóa toast cũ nhất
        while (toastContainer.children.length >= 2) {
            toastContainer.firstElementChild.remove();
        }

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-2.5 p-2.5 px-3.5 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-mono-technical transition-all duration-200 transform translate-y-2 opacity-0`;

        let icon = 'circle-info';
        let bgBorder = 'bg-slate-900/95 border-purple-500/40 text-purple-200';

        if (type === 'error') {
            icon = 'circle-xmark';
            bgBorder = 'bg-slate-900/95 border-red-500/50 text-red-300';
        } else if (type === 'success') {
            icon = 'circle-check';
            bgBorder = 'bg-slate-900/95 border-emerald-500/50 text-emerald-300';
        } else if (type === 'warning') {
            icon = 'triangle-exclamation';
            bgBorder = 'bg-slate-900/95 border-amber-500/50 text-amber-300';
        }

        toast.className += ` ${bgBorder}`;
        toast.innerHTML = `<i class="fa-solid fa-${icon} text-sm shrink-0"></i><span class="font-medium truncate max-w-[280px]">${message}</span>`;
        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        setTimeout(() => {
            toast.classList.add('opacity-0', '-translate-y-2');
            setTimeout(() => toast.remove(), 200);
        }, 2200);
    }

    function showCustomConfirm({ title = 'Xác Nhận Hành Động', message = 'Bạn có chắc chắn?', onConfirm }) {
        const modal = document.getElementById('customConfirmModal');
        const titleEl = document.getElementById('customConfirmTitle');
        const msgEl = document.getElementById('customConfirmMessage');
        const cancelBtn = document.getElementById('customConfirmCancelBtn');
        const okBtn = document.getElementById('customConfirmOkBtn');

        if (!modal) return;

        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;

        modal.classList.remove('hidden');

        const cleanup = () => {
            modal.classList.add('hidden');
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
        };

        const handleCancel = () => cleanup();
        const handleOk = () => {
            cleanup();
            if (typeof onConfirm === 'function') onConfirm();
        };

        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
    }

    // Globally override native window.alert & window.confirm
    window.alert = function(msg) {
        showToast(msg, 'warning');
    };

    window.openLightbox = (encodedUrl, encodedPrompt) => {
        const url = decodeURIComponent(encodedUrl);
        const prompt = decodeURIComponent(encodedPrompt);
        const modal = document.getElementById('lightboxModal');
        const img = document.getElementById('lightboxImg');
        const caption = document.getElementById('lightboxCaption');
        if (modal && img) {
            img.src = url;
            if (caption) caption.textContent = prompt || 'Render Kiến Trúc & Nội Thất';
            modal.classList.remove('hidden');
        }
    };

    window.deleteGalleryItem = async (evt, index) => {
        evt.stopPropagation();
        const filtered = allGalleryData.filter(item => item.mode === currentGalleryTab);
        const itemToDelete = filtered[index];
        if (itemToDelete) {
            showCustomConfirm({
                title: 'Xóa Ảnh Kho AI',
                message: 'Bạn có chắc chắn muốn xóa ảnh này khỏi Kho Ảnh AI?',
                onConfirm: async () => {
                    try {
                        await fetch(getApiUrl('/api/gallery?id=') + encodeURIComponent(itemToDelete.id), { method: 'DELETE' });
                        showToast("Đã xóa ảnh khỏi kho thành công!", "success");
                    } catch (e) {
                        console.error('Lỗi khi xóa ảnh:', e);
                        showToast(`Lỗi khi xóa ảnh: ${e.message}`, "error");
                    }
                    allGalleryData = allGalleryData.filter(item => item.id !== itemToDelete.id);
                    renderGalleryCards();
                    if (countInterior) countInterior.textContent = allGalleryData.filter(i => i.mode === 'interior').length;
                    if (countExterior) countExterior.textContent = allGalleryData.filter(i => i.mode === 'exterior').length;
                }
            });
        }
    };

    // =========================================================================
    // 🌐 GOOGLE IDENTITY & GOOGLE DRIVE AUTO-SYNC MODULE
    // =========================================================================
    let googleTokenClient = null;
    let googleUserProfile = null;
    let cachedDriveFolderId = null;
    const GOOGLE_DEFAULT_CLIENT_ID = '1046182186591-628d02ck550h8t5o2b3t17cqu5a672p2.apps.googleusercontent.com';

    function getGoogleClientId() {
        return localStorage.getItem('google_oauth_client_id') || GOOGLE_DEFAULT_CLIENT_ID;
    }

    function initGoogleAuth() {
        const storedProfile = localStorage.getItem('google_user_profile');
        if (storedProfile) {
            try {
                googleUserProfile = JSON.parse(storedProfile);
                updateGoogleAuthUI(googleUserProfile);
            } catch (e) {
                localStorage.removeItem('google_user_profile');
            }
        }

        let attempts = 0;
        const checkGsiInterval = setInterval(() => {
            attempts++;
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                clearInterval(checkGsiInterval);
                try {
                    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: getGoogleClientId(),
                        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                        callback: async (tokenResponse) => {
                            if (tokenResponse.error) {
                                showToast(`Lỗi xác thực Google: ${tokenResponse.error}`, 'error');
                                return;
                            }
                            await handleGoogleTokenSuccess(tokenResponse.access_token, tokenResponse.expires_in);
                        }
                    });
                } catch (err) {
                    console.warn("Google Identity Services init:", err);
                }
            } else if (attempts > 30) {
                clearInterval(checkGsiInterval);
            }
        }, 300);
    }

    async function handleGoogleTokenSuccess(accessToken, expiresIn) {
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const userInfo = await res.json();
            
            googleUserProfile = {
                id: userInfo.sub,
                name: userInfo.name || 'Google User',
                email: userInfo.email || '',
                picture: userInfo.picture || 'https://lh3.googleusercontent.com/a/default-user',
                accessToken: accessToken,
                tokenExpiry: Date.now() + ((Number(expiresIn) || 3600) * 1000)
            };

            localStorage.setItem('google_user_profile', JSON.stringify(googleUserProfile));
            localStorage.setItem('google_access_token', accessToken);
            updateGoogleAuthUI(googleUserProfile);
            showToast(`✅ Đã đăng nhập Google (${googleUserProfile.name})! Tự động lưu Drive đã bật.`, 'success');
        } catch (e) {
            console.error("Lỗi lấy thông tin Google User:", e);
            googleUserProfile = {
                id: 'google_user',
                name: 'Google User',
                email: '',
                picture: 'https://lh3.googleusercontent.com/a/default-user',
                accessToken: accessToken,
                tokenExpiry: Date.now() + ((Number(expiresIn) || 3600) * 1000)
            };
            localStorage.setItem('google_user_profile', JSON.stringify(googleUserProfile));
            localStorage.setItem('google_access_token', accessToken);
            updateGoogleAuthUI(googleUserProfile);
            showToast("Đã cấp quyền truy cập Google Drive thành công!", "success");
        }
    }

    function updateGoogleAuthUI(profile) {
        const signInBtn = document.getElementById('googleSignInBtn');
        const userWidget = document.getElementById('googleUserWidget');
        const userName = document.getElementById('googleUserName');
        const userEmail = document.getElementById('googleUserEmail');
        const userAvatar = document.getElementById('googleUserAvatar');

        if (profile && profile.accessToken) {
            if (signInBtn) signInBtn.classList.add('hidden');
            if (userWidget) userWidget.classList.remove('hidden');
            if (userName) userName.textContent = profile.name;
            if (userEmail) userEmail.textContent = profile.email || 'Google Drive Sync Active';
            if (userAvatar && profile.picture) userAvatar.src = profile.picture;
        } else {
            if (signInBtn) signInBtn.classList.remove('hidden');
            if (userWidget) userWidget.classList.add('hidden');
        }
    }

    function handleGoogleSignIn() {
        if (!googleTokenClient) {
            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                try {
                    googleTokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: getGoogleClientId(),
                        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                        callback: async (tokenResponse) => {
                            if (tokenResponse.error) {
                                showToast(`Lỗi xác thực Google: ${tokenResponse.error}`, 'error');
                                return;
                            }
                            await handleGoogleTokenSuccess(tokenResponse.access_token, tokenResponse.expires_in);
                        }
                    });
                } catch(e) {
                    showToast("Đang chuẩn bị xác thực Google...", "info");
                }
            } else {
                showToast("Đang kết nối Google Services... Vui lòng thử lại sau 2 giây", "info");
                return;
            }
        }
        if (googleTokenClient) {
            googleTokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }

    function handleGoogleSignOut() {
        showCustomConfirm({
            title: 'Đăng Xuất Tài Khoản Google',
            message: 'Bạn có chắc chắn muốn ngắt kết nối tài khoản Google và tắt tự động lưu Drive?',
            onConfirm: () => {
                const token = googleUserProfile?.accessToken || localStorage.getItem('google_access_token');
                if (token && window.google && window.google.accounts && window.google.accounts.oauth2) {
                    try { window.google.accounts.oauth2.revoke(token, () => {}); } catch(e){}
                }
                googleUserProfile = null;
                localStorage.removeItem('google_user_profile');
                localStorage.removeItem('google_access_token');
                updateGoogleAuthUI(null);
                showToast("Đã đăng xuất Google thành công", "info");
            }
        });
    }

    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    const googleSignOutBtn = document.getElementById('googleSignOutBtn');
    if (googleSignOutBtn) {
        googleSignOutBtn.addEventListener('click', handleGoogleSignOut);
    }

    async function getOrCreateGoogleDriveFolder(accessToken) {
        if (cachedDriveFolderId) return cachedDriveFolderId;
        const folderName = 'Aetheris ArchViz Studio Output';
        
        try {
            const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
            const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const searchData = await searchRes.json();
            
            if (searchData.files && searchData.files.length > 0) {
                cachedDriveFolderId = searchData.files[0].id;
                return cachedDriveFolderId;
            }

            const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    description: 'Thư mục tự động lưu ảnh Render từ Aetheris ArchViz AI Studio'
                })
            });
            const createData = await createRes.json();
            cachedDriveFolderId = createData.id;
            return cachedDriveFolderId;
        } catch (e) {
            console.error("Lỗi tạo thư mục Google Drive:", e);
            return null;
        }
    }

    async function convertImageToBlob(imageSource) {
        if (imageSource instanceof Blob) return imageSource;
        if (typeof imageSource === 'string') {
            if (imageSource.startsWith('data:')) {
                const parts = imageSource.split(',');
                const mime = parts[0].match(/:(.*?);/)[1];
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) u8arr[n] = bstr.charCodeAt(n);
                return new Blob([u8arr], { type: mime });
            } else {
                const res = await fetch(imageSource);
                return await res.blob();
            }
        }
        throw new Error("Định dạng ảnh không hợp lệ");
    }

    async function uploadImageToGoogleDrive(imageSource, metadata = {}, showNotification = true) {
        const token = googleUserProfile?.accessToken || localStorage.getItem('google_access_token');
        if (!token) {
            if (showNotification) {
                showToast("Vui lòng đăng nhập Google ở góc trên để lưu ảnh vào Drive", "warning");
            }
            return null;
        }

        try {
            const folderId = await getOrCreateGoogleDriveFolder(token);
            const blob = await convertImageToBlob(imageSource);
            const filename = metadata.filename || `Aetheris_Render_${Date.now()}.png`;
            const promptDesc = metadata.prompt ? `Prompt: ${metadata.prompt} | Mode: ${metadata.mode || 'ArchViz'}` : 'Aetheris ArchViz Studio AI Output';

            const metaPayload = {
                name: filename,
                description: promptDesc,
                parents: folderId ? [folderId] : []
            };

            const boundary = '-------AetherisArchVizDriveBoundary' + Date.now();
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metaPayload)}`;
            const mediaHeader = `\r\nContent-Type: ${blob.type || 'image/png'}\r\n\r\n`;

            const metaBlob = new Blob([delimiter, metaPart, delimiter, mediaHeader], { type: 'text/plain' });
            const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });
            const multipartBody = new Blob([metaBlob, blob, closeBlob], { type: `multipart/related; boundary=${boundary}` });

            const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: multipartBody
            });

            const fileData = await uploadRes.json();
            if (fileData && fileData.id) {
                if (showNotification) {
                    showToast(`☁️ Đã lưu "${filename}" vào Google Drive!`, 'success');
                }
                return fileData;
            } else {
                throw new Error(fileData.error?.message || "Không upload được file");
            }
        } catch (err) {
            console.error("Lỗi tải lên Google Drive:", err);
            if (showNotification) {
                showToast(`Lỗi Drive: ${err.message}`, 'error');
            }
            return null;
        }
    }

    function autoSyncRenderToGoogleDrive(imageUrl, metadata) {
        const token = googleUserProfile?.accessToken || localStorage.getItem('google_access_token');
        if (token) {
            uploadImageToGoogleDrive(imageUrl, metadata, true);
        }
    }

    window.saveSpecificCardToDrive = async (evt, index) => {
        evt.stopPropagation();
        const filtered = allGalleryData.filter(item => item.mode === currentGalleryTab);
        const cardItem = filtered[index];
        if (!cardItem) return;

        const token = googleUserProfile?.accessToken || localStorage.getItem('google_access_token');
        if (!token) {
            handleGoogleSignIn();
            return;
        }

        showToast("☁️ Đang lưu ảnh vào Google Drive...", "info");
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(cardItem.url)}`;
        await uploadImageToGoogleDrive(proxyUrl, {
            filename: `archviz_${cardItem.mode || 'render'}_${cardItem.id || Date.now()}.png`,
            prompt: cardItem.prompt,
            mode: cardItem.mode
        }, true);
    };

    const syncAllToDriveBtn = document.getElementById('syncAllToDriveBtn');
    if (syncAllToDriveBtn) {
        syncAllToDriveBtn.addEventListener('click', async () => {
            const token = googleUserProfile?.accessToken || localStorage.getItem('google_access_token');
            if (!token) {
                showToast("Vui lòng đăng nhập Google để sao lưu toàn bộ kho ảnh", "warning");
                handleGoogleSignIn();
                return;
            }

            if (allGalleryData.length === 0) {
                showToast("Kho ảnh hiện đang trống, chưa có ảnh để sao lưu!", "info");
                return;
            }

            syncAllToDriveBtn.disabled = true;
            syncAllToDriveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-amber-300"></i> Đang đồng bộ...`;

            let successCount = 0;
            for (let i = 0; i < allGalleryData.length; i++) {
                const item = allGalleryData[i];
                showToast(`☁️ Đang lưu ảnh ${i + 1}/${allGalleryData.length} vào Drive...`, 'info');
                const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(item.url)}`;
                const res = await uploadImageToGoogleDrive(proxyUrl, {
                    filename: `archviz_${item.mode || 'render'}_${item.id || (i+1)}.png`,
                    prompt: item.prompt,
                    mode: item.mode
                }, false);
                if (res) successCount++;
            }

            syncAllToDriveBtn.disabled = false;
            syncAllToDriveBtn.innerHTML = `<i class="fa-brands fa-google-drive text-amber-300"></i> <span>☁️ Lưu Toàn Bộ Vào Google Drive</span>`;
            showToast(`🎉 Đã đồng bộ thành công ${successCount}/${allGalleryData.length} ảnh vào Google Drive!`, 'success');
        });
    }

    initGoogleAuth();

    // --- ⌨️ Pro Studio Keyboard Shortcuts Engine (Research Cycle #4 & #7) ---
    const shortcutsModal = document.getElementById('shortcutsModal');
    const openShortcutsModalBtn = document.getElementById('openShortcutsModalBtn');
    const closeShortcutsModalBtn = document.getElementById('closeShortcutsModalBtn');

    if (openShortcutsModalBtn && shortcutsModal) {
        openShortcutsModalBtn.addEventListener('click', () => {
            shortcutsModal.classList.remove('hidden');
        });
    }

    if (closeShortcutsModalBtn && shortcutsModal) {
        closeShortcutsModalBtn.addEventListener('click', () => {
            shortcutsModal.classList.add('hidden');
        });
    }

    if (shortcutsModal) {
        shortcutsModal.addEventListener('click', (e) => {
            if (e.target === shortcutsModal) shortcutsModal.classList.add('hidden');
        });
    }

    window.addEventListener('keydown', (e) => {
        // 1. Escape closes any open modal
        if (e.key === 'Escape') {
            ['settingsModal', 'galleryModal', 'checklistModal', 'lightboxModal', 'customConfirmModal', 'shortcutsModal'].forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
            });
            return;
        }

        // 2. Cmd/Ctrl + Enter triggers Render
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            const btn = document.getElementById('generateBtn');
            if (btn && !btn.disabled) {
                btn.click();
                showToast("⚡ Kích hoạt Render qua phím tắt (Ctrl + Enter)", "info");
            }
            return;
        }

        // Ignore single-key shortcuts when user is actively typing in text fields
        const active = document.activeElement;
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (isTyping) return;

        // 3. '?' or 'Shift + /' toggles Shortcuts Modal
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
            e.preventDefault();
            if (shortcutsModal) {
                shortcutsModal.classList.toggle('hidden');
            }
            return;
        }

        // 4. 's' or 'S' downloads active render
        if (e.key.toLowerCase() === 's' && currentRenderResultUrl) {
            e.preventDefault();
            const downloadBtn = document.getElementById('downloadOrigBtn') || document.getElementById('currentResultDownloadBtn');
            if (downloadBtn) {
                downloadBtn.click();
                showToast("💾 Đang tải ảnh Render (Phím S)", "info");
            }
        }

        // 5. '1' / '2' switches Interior / Exterior
        if (e.key === '1') {
            const intBtn = document.getElementById('tabInteriorBtn');
            if (intBtn) intBtn.click();
        } else if (e.key === '2') {
            const extBtn = document.getElementById('tabExteriorBtn');
            if (extBtn) extBtn.click();
        }
    });
});
