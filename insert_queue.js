const fs = require('fs');
const content = fs.readFileSync('frontend/js/app.js', 'utf8');

const codeToInsert = `
    // --- 🚀 Cycle #13: Smart Batch Queue Render ---
    const openQueueModalBtn = document.getElementById('openQueueModalBtn');
    const queueModal = document.getElementById('queueModal');
    const closeQueueModalBtn = document.getElementById('closeQueueModalBtn');
    const addToQueueBtn = document.getElementById('addToQueueBtn');
    const queueListContainer = document.getElementById('queueListContainer');
    const emptyQueueMsg = document.getElementById('emptyQueueMsg');
    const queueCountBadge = document.getElementById('queueCountBadge');
    const clearQueueBtn = document.getElementById('clearQueueBtn');
    const startBatchRenderBtn = document.getElementById('startBatchRenderBtn');

    let renderQueue = [];
    let isBatchRendering = false;

    if (openQueueModalBtn && queueModal) {
        openQueueModalBtn.addEventListener('click', () => {
            renderQueueUI();
            queueModal.classList.remove('hidden');
        });
    }

    if (closeQueueModalBtn && queueModal) {
        closeQueueModalBtn.addEventListener('click', () => {
            queueModal.classList.add('hidden');
        });
    }

    if (clearQueueBtn) {
        clearQueueBtn.addEventListener('click', () => {
            renderQueue = [];
            renderQueueUI();
        });
    }

    if (addToQueueBtn) {
        addToQueueBtn.addEventListener('click', () => {
            const jobData = {
                id: Date.now().toString(),
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
                status: 'pending' // pending, processing, completed, error
            };
            
            renderQueue.push(jobData);
            renderQueueUI();
            showToast("📥 Đã thêm job vào Hàng đợi!");
        });
    }

    function renderQueueUI() {
        if (!queueListContainer || !emptyQueueMsg || !queueCountBadge) return;
        
        queueCountBadge.innerText = renderQueue.length;
        
        if (renderQueue.length === 0) {
            emptyQueueMsg.classList.remove('hidden');
            document.querySelectorAll('.queue-item-card').forEach(e => e.remove());
            return;
        }
        
        emptyQueueMsg.classList.add('hidden');
        document.querySelectorAll('.queue-item-card').forEach(e => e.remove());

        renderQueue.forEach((job, index) => {
            const card = document.createElement('div');
            card.className = "queue-item-card bg-slate-800 border border-slate-700 rounded-xl p-3 flex justify-between items-center";
            
            let statusBadge = '';
            if (job.status === 'pending') statusBadge = '<span class="text-amber-400 text-[10px] font-bold">⏳ Chờ xử lý</span>';
            else if (job.status === 'processing') statusBadge = '<span class="text-emerald-400 text-[10px] font-bold"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang Render...</span>';
            else if (job.status === 'completed') statusBadge = '<span class="text-primary text-[10px] font-bold">✅ Hoàn thành</span>';
            
            card.innerHTML = \`
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-slate-900 border border-slate-600 flex items-center justify-center text-xl overflow-hidden">
                        \${job.imageB64 ? \`<img src="\${job.imageB64}" class="w-full h-full object-cover">\` : (job.mode==='interior' ? '🛋️' : '🏛️')}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-white">\${job.mode === 'interior' ? 'Nội Thất' : 'Ngoại Thất'} | \${job.aspectRatio} | \${job.quality}</span>
                        <span class="text-[10px] text-slate-400 truncate w-64" title="\${job.customPrompt}">\${job.customPrompt || '(Không có prompt)'}</span>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    \${statusBadge}
                    \${job.status === 'pending' ? \`<button type="button" class="text-red-400 hover:text-red-300 remove-job-btn" data-id="\${job.id}"><i class="fa-solid fa-xmark"></i></button>\` : ''}
                </div>
            \`;
            queueListContainer.appendChild(card);
        });

        document.querySelectorAll('.remove-job-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                renderQueue = renderQueue.filter(j => j.id !== id);
                renderQueueUI();
            });
        });
    }

    async function applyJobSettingsToUI(job) {
        if (job.mode === 'interior' && typeof tabInteriorBtn !== 'undefined' && tabInteriorBtn) tabInteriorBtn.click();
        else if (job.mode === 'exterior' && typeof tabExteriorBtn !== 'undefined' && tabExteriorBtn) tabExteriorBtn.click();

        if (typeof customPromptInput !== 'undefined' && customPromptInput) customPromptInput.value = job.customPrompt || '';

        if (job.imageB64) {
            currentInputImageB64 = job.imageB64;
            const imgPrev = document.getElementById('imagePreview');
            const prevCont = document.getElementById('previewContainer');
            const uplPlace = document.getElementById('uploadPlaceholder');
            if (imgPrev && prevCont && uplPlace) {
                imgPrev.src = job.imageB64;
                prevCont.classList.remove('hidden');
                uplPlace.classList.add('hidden');
            }
        } else {
            currentInputImageB64 = null;
        }

        const ratioRadio = document.querySelector(\`input[name="aspectRatio"][value="\${job.aspectRatio}"]\`);
        if (ratioRadio) { ratioRadio.checked = true; }

        const qualityRadio = document.querySelector(\`input[name="renderQuality"][value="\${job.quality}"]\`);
        if (qualityRadio) { qualityRadio.checked = true; }

        if (job.viewpoint) {
            const vpBtn = document.querySelector(\`.viewpoint-btn[data-viewpoint="\${job.viewpoint}"]\`);
            if (vpBtn) vpBtn.click();
        }
        if (job.landscapeTypology) {
            const lpBtn = document.querySelector(\`.landscape-chip[data-typology="\${job.landscapeTypology}"]\`);
            if (lpBtn) lpBtn.click();
        }
        if (job.weather) {
            const wBtn = document.querySelector(\`.weather-chip[data-weather="\${job.weather}"]\`);
            if (wBtn) wBtn.click();
        }
        if (job.focalLength) {
            const fBtn = document.querySelector(\`.focal-chip[data-focal="\${job.focalLength}"]\`);
            if (fBtn) fBtn.click();
        }
        
        // Let UI settle for a moment
        await new Promise(r => setTimeout(r, 100));
    }

    if (startBatchRenderBtn) {
        startBatchRenderBtn.addEventListener('click', async () => {
            const pendingJobs = renderQueue.filter(j => j.status === 'pending');
            if (pendingJobs.length === 0) {
                alert("Không có job nào đang chờ render!");
                return;
            }

            if (isBatchRendering) return;
            isBatchRendering = true;
            
            queueModal.classList.add('hidden'); // Hide modal during render
            
            for (let i = 0; i < renderQueue.length; i++) {
                if (renderQueue[i].status !== 'pending') continue;
                
                renderQueue[i].status = 'processing';
                renderQueueUI();
                
                showToast(\`🚀 Bắt đầu Batch Job \${i+1}/\${renderQueue.length}\`);
                
                // Áp dụng settings
                await applyJobSettingsToUI(renderQueue[i]);
                
                // Kích hoạt render
                if (typeof generateBtn !== 'undefined' && generateBtn) {
                    generateBtn.click();
                }
                
                // Đợi cho đến khi render xong (khi resultBox hiển thị ảnh mới và progress hidden)
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        const progBox = document.getElementById('progressBox');
                        if (progBox && progBox.classList.contains('hidden')) {
                            // Xong!
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 1000);
                });
                
                renderQueue[i].status = 'completed';
                renderQueueUI();
                
                // Nghỉ ngơi 1 giây giữa các job
                await new Promise(r => setTimeout(r, 1000));
            }
            
            isBatchRendering = false;
            showToast("✅ Đã hoàn thành toàn bộ Batch Render Queue!");
        });
    }

`;

const lastIndex = content.lastIndexOf('});');
const newContent = content.substring(0, lastIndex) + codeToInsert + content.substring(lastIndex);
fs.writeFileSync('frontend/js/app.js', newContent);
