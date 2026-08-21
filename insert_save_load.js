const fs = require('fs');
const content = fs.readFileSync('frontend/js/app.js', 'utf8');

const codeToInsert = `
    // --- 💾 Cycle #12: Project Save/Load System ---
    const saveProjectBtn = document.getElementById('saveProjectBtn');
    const loadProjectInput = document.getElementById('loadProjectInput');

    if (saveProjectBtn) {
        saveProjectBtn.addEventListener('click', () => {
            const projectData = {
                mode: currentMode,
                customPrompt: typeof customPromptInput !== 'undefined' && customPromptInput ? customPromptInput.value : '',
                imageB64: currentInputImageB64,
                aspectRatio: document.querySelector('input[name="aspectRatio"]:checked')?.value || 'original',
                quality: document.querySelector('input[name="renderQuality"]:checked')?.value || '1k',
                viewpoint: document.querySelector('.viewpoint-btn.active')?.dataset.viewpoint || 'eye_level',
                landscapeTypology: document.querySelector('.landscape-chip.active')?.dataset.typology || 'tropical',
                landscapeDensity: document.getElementById('landscapeDensitySlider')?.value || 45,
                sunAzimuth: document.getElementById('sunAzimuthSlider')?.value || 180,
                sunElevation: document.getElementById('sunElevationSlider')?.value || 65,
                weather: document.querySelector('.weather-chip.active')?.dataset.weather || 'sunny',
                weatherIntensity: document.getElementById('weatherIntensitySlider')?.value || 60,
                focalLength: document.querySelector('.focal-chip.active')?.dataset.focal || 35,
                tiltShift: document.getElementById('tiltShiftToggle')?.checked || false,
                timestamp: new Date().toISOString()
            };

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", \`Aetheris_Project_\${Date.now()}.json\`);
            dlAnchorElem.click();
            showToast("💾 Đã lưu dự án thành công!");
        });
    }

    if (loadProjectInput) {
        loadProjectInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.mode === 'interior' && typeof tabInteriorBtn !== 'undefined' && tabInteriorBtn) tabInteriorBtn.click();
                    else if (data.mode === 'exterior' && typeof tabExteriorBtn !== 'undefined' && tabExteriorBtn) tabExteriorBtn.click();

                    if (typeof customPromptInput !== 'undefined' && customPromptInput) customPromptInput.value = data.customPrompt || '';

                    if (data.imageB64) {
                        currentInputImageB64 = data.imageB64;
                        const imgPrev = document.getElementById('imagePreview');
                        const prevCont = document.getElementById('previewContainer');
                        const uplPlace = document.getElementById('uploadPlaceholder');
                        if (imgPrev && prevCont && uplPlace) {
                            imgPrev.src = data.imageB64;
                            prevCont.classList.remove('hidden');
                            uplPlace.classList.add('hidden');
                        }
                    }

                    const ratioRadio = document.querySelector(\`input[name="aspectRatio"][value="\${data.aspectRatio}"]\`);
                    if (ratioRadio) { ratioRadio.checked = true; }

                    const qualityRadio = document.querySelector(\`input[name="renderQuality"][value="\${data.quality}"]\`);
                    if (qualityRadio) { qualityRadio.checked = true; }

                    if (data.viewpoint) {
                        const vpBtn = document.querySelector(\`.viewpoint-btn[data-viewpoint="\${data.viewpoint}"]\`);
                        if (vpBtn) vpBtn.click();
                    }
                    if (data.landscapeTypology) {
                        const lpBtn = document.querySelector(\`.landscape-chip[data-typology="\${data.landscapeTypology}"]\`);
                        if (lpBtn) lpBtn.click();
                    }
                    if (data.weather) {
                        const wBtn = document.querySelector(\`.weather-chip[data-weather="\${data.weather}"]\`);
                        if (wBtn) wBtn.click();
                    }
                    if (data.focalLength) {
                        const fBtn = document.querySelector(\`.focal-chip[data-focal="\${data.focalLength}"]\`);
                        if (fBtn) fBtn.click();
                    }

                    if (data.landscapeDensity !== undefined) {
                        const el = document.getElementById('landscapeDensitySlider');
                        if (el) { el.value = data.landscapeDensity; el.dispatchEvent(new Event('input')); }
                    }
                    if (data.sunAzimuth !== undefined) {
                        const el = document.getElementById('sunAzimuthSlider');
                        if (el) { el.value = data.sunAzimuth; el.dispatchEvent(new Event('input')); }
                    }
                    if (data.sunElevation !== undefined) {
                        const el = document.getElementById('sunElevationSlider');
                        if (el) { el.value = data.sunElevation; el.dispatchEvent(new Event('input')); }
                    }
                    if (data.weatherIntensity !== undefined) {
                        const el = document.getElementById('weatherIntensitySlider');
                        if (el) { el.value = data.weatherIntensity; el.dispatchEvent(new Event('input')); }
                    }
                    if (data.tiltShift !== undefined) {
                        const el = document.getElementById('tiltShiftToggle');
                        if (el) { el.checked = data.tiltShift; }
                    }
                    
                    if (typeof updateGuidanceRoadmap === 'function') updateGuidanceRoadmap();
                    showToast("📂 Đã tải dự án thành công!");
                } catch (err) {
                    alert("Lỗi khi đọc file Dự án: " + err.message);
                }
            };
            reader.readAsText(file);
            loadProjectInput.value = '';
        });
    }
`;

const lastIndex = content.lastIndexOf('});');
const newContent = content.substring(0, lastIndex) + codeToInsert + content.substring(lastIndex);
fs.writeFileSync('frontend/js/app.js', newContent);
