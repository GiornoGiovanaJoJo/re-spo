/**
 * Product page dynamic binding by ?id=
 */
(function initProductPage() {
    const PLACEHOLDER = 'assets/product_placeholder.png';

    function getIdFromQuery() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function escapeHtml(input) {
        return String(input ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function mergeCategoryConfig(raw) {
        const defaults = {
            id: '',
            name: '',
            sortOrder: 0,
            catalogMode: 'carousel',
            listStyle: 'simple',
            cardStyle: 'default',
            gridCols: 4,
            showCounter: false,
            fields: { description: true, specs: true, parameters: true, gallery: true },
            labels: { specsHeading: '', paramLabelCol: '', paramValueCol: '' }
        };
        const base = { ...defaults, fields: { ...defaults.fields }, labels: { ...defaults.labels } };
        if (!raw || typeof raw !== 'object') return base;
        const fields = { ...base.fields, ...(raw.fields && typeof raw.fields === 'object' ? raw.fields : {}) };
        const labels = { ...base.labels, ...(raw.labels && typeof raw.labels === 'object' ? raw.labels : {}) };
        let catalogMode = raw.catalogMode;
        if (!catalogMode && raw.display === 'list') catalogMode = 'list';
        if (!catalogMode && raw.display === 'grid') catalogMode = 'grid';
        return {
            ...base,
            ...raw,
            catalogMode: catalogMode || base.catalogMode,
            fields,
            labels
        };
    }

    /** @returns {string[]} */
    function normalizeGallerySources(product, categoryConfig) {
        const cfg = categoryConfig || mergeCategoryConfig({});
        const main = (product.image && String(product.image).trim()) || PLACEHOLDER;
        if (cfg.fields.gallery !== false && Array.isArray(product.images) && product.images.length > 0) {
            const cleaned = product.images.map((s) => String(s).trim()).filter(Boolean);
            if (cleaned.length) return cleaned;
        }
        return [main];
    }

    function renderSpecs(listEl, specs) {
        if (!listEl) return;
        const items = Array.isArray(specs) && specs.length > 0
            ? specs
            : [
                'Технические характеристики уточняются',
                'Материалы и исполнение по запросу',
                'Подбор под ваш технологический процесс'
            ];
        listEl.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }

    /**
     * @param {HTMLElement | null} tableBodyEl
     * @param {HTMLElement | null} tableWrapEl
     * @param {Array<{label: string, value: string}>} parameters
     */
    function renderParametersTable(tableBodyEl, tableWrapEl, parameters) {
        if (!tableBodyEl || !tableWrapEl) return;
        const rows = Array.isArray(parameters)
            ? parameters.filter((row) => row && String(row.label || '').trim() && String(row.value || '').trim())
            : [];

        if (!rows.length) {
            tableBodyEl.innerHTML = '';
            tableWrapEl.classList.add('hidden');
            return;
        }

        tableBodyEl.innerHTML = rows.map((row) => `
            <tr>
                <td class="border border-RE-SPO-dark/80 py-2 px-4 text-center text-[16px] md:text-[22px]">${escapeHtml(row.label)}</td>
                <td class="border border-RE-SPO-dark/80 py-2 px-4 text-center text-[16px] md:text-[22px]">${escapeHtml(row.value)}</td>
            </tr>
        `).join('');
        tableWrapEl.classList.remove('hidden');
    }

    /**
     * @param {HTMLImageElement | null} imageEl
     * @param {HTMLElement | null} dotsEl
     * @param {string[]} sources
     * @param {string} productName
     */
    function setupGallery(imageEl, dotsEl, sources, productName) {
        if (!imageEl) return;

        const list = sources.length ? sources : [PLACEHOLDER];
        let index = 0;

        function applyDotStyles() {
            if (!dotsEl) return;
            const buttons = dotsEl.querySelectorAll('button[data-gallery-dot]');
            buttons.forEach((btn, i) => {
                const active = i === index;
                btn.classList.toggle('opacity-100', active);
                btn.classList.toggle('opacity-35', !active);
                btn.setAttribute('aria-selected', active ? 'true' : 'false');
            });
        }

        function show(i) {
            const next = Math.max(0, Math.min(i, list.length - 1));
            index = next;
            imageEl.src = list[index];
            imageEl.alt = productName || 'Product';
            imageEl.onerror = () => {
                imageEl.src = PLACEHOLDER;
            };
            imageEl.dispatchEvent(new CustomEvent('product-image-changed'));
            applyDotStyles();
        }

        if (!dotsEl || list.length <= 1) {
            if (dotsEl) {
                dotsEl.className = 'hidden mt-[18px]';
                dotsEl.innerHTML = '';
            }
            show(0);
            return;
        }

        dotsEl.className = 'flex justify-center mt-[18px] gap-2 flex-wrap items-center';
        dotsEl.innerHTML = '';
        list.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.dataset.galleryDot = '1';
            btn.className =
                'w-[7px] h-[7px] rounded-full bg-RE-SPO-blue shrink-0 cursor-pointer hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-RE-SPO-blue/40';
            btn.setAttribute('aria-label', `Фото ${i + 1} из ${list.length}`);
            btn.setAttribute('role', 'tab');
            btn.addEventListener('click', () => show(i));
            dotsEl.appendChild(btn);
        });
        show(0);
    }

    /**
     * @param {HTMLElement | null} stageEl
     * @param {HTMLImageElement | null} imageEl
     * @param {HTMLElement | null} zoomInBtn
     * @param {HTMLElement | null} zoomOutBtn
     * @param {HTMLElement | null} zoomResetBtn
     */
    function setupImageZoom(stageEl, imageEl, zoomInBtn, zoomOutBtn, zoomResetBtn) {
        if (!stageEl || !imageEl) return;

        const MIN_ZOOM = 1;
        const MAX_ZOOM = 8;
        const ZOOM_STEP = 0.25;
        let scale = 1;
        let tx = 0;
        let ty = 0;
        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let startTx = 0;
        let startTy = 0;

        function clamp(value, min, max) {
            return Math.max(min, Math.min(value, max));
        }

        function getBoundsForScale(nextScale) {
            const maxX = Math.max(0, (stageEl.clientWidth * (nextScale - 1)) / 2);
            const maxY = Math.max(0, (stageEl.clientHeight * (nextScale - 1)) / 2);
            return { maxX, maxY };
        }

        function applyTransform() {
            const { maxX, maxY } = getBoundsForScale(scale);
            tx = clamp(tx, -maxX, maxX);
            ty = clamp(ty, -maxY, maxY);
            imageEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
            stageEl.classList.toggle('cursor-grab', scale > 1 && !isDragging);
            stageEl.classList.toggle('cursor-grabbing', isDragging);
            stageEl.classList.toggle('cursor-zoom-in', scale === 1);
            if (zoomResetBtn) {
                zoomResetBtn.textContent = `${Math.round(scale * 100)}%`;
            }
            if (zoomInBtn) {
                zoomInBtn.disabled = scale >= MAX_ZOOM;
                zoomInBtn.classList.toggle('opacity-50', zoomInBtn.disabled);
                zoomInBtn.classList.toggle('cursor-not-allowed', zoomInBtn.disabled);
            }
            if (zoomOutBtn) {
                zoomOutBtn.disabled = scale <= MIN_ZOOM;
                zoomOutBtn.classList.toggle('opacity-50', zoomOutBtn.disabled);
                zoomOutBtn.classList.toggle('cursor-not-allowed', zoomOutBtn.disabled);
            }
        }

        function setScale(nextScale) {
            scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
            if (scale === 1) {
                tx = 0;
                ty = 0;
            }
            applyTransform();
        }

        function resetZoom() {
            scale = 1;
            tx = 0;
            ty = 0;
            isDragging = false;
            applyTransform();
        }

        function blockStagePointerHandling(event) {
            event.stopPropagation();
        }

        [zoomInBtn, zoomOutBtn, zoomResetBtn].forEach((btn) => {
            if (!btn) return;
            // Prevent drag/pointer-capture from hijacking zoom control clicks.
            btn.addEventListener('pointerdown', blockStagePointerHandling);
            btn.addEventListener('pointerup', blockStagePointerHandling);
            btn.addEventListener('click', blockStagePointerHandling);
        });

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => setScale(scale + ZOOM_STEP));
        }
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => setScale(scale - ZOOM_STEP));
        }
        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', resetZoom);
        }

        stageEl.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            setScale(scale + delta);
        }, { passive: false });

        stageEl.addEventListener('pointerdown', (event) => {
            if (event.target instanceof Element && event.target.closest('button')) return;
            if (scale <= 1) return;
            isDragging = true;
            dragStartX = event.clientX;
            dragStartY = event.clientY;
            startTx = tx;
            startTy = ty;
            stageEl.setPointerCapture(event.pointerId);
            applyTransform();
        });

        stageEl.addEventListener('pointermove', (event) => {
            if (!isDragging) return;
            tx = startTx + (event.clientX - dragStartX);
            ty = startTy + (event.clientY - dragStartY);
            applyTransform();
        });

        function endDrag(event) {
            if (!isDragging) return;
            isDragging = false;
            if (stageEl.hasPointerCapture(event.pointerId)) {
                stageEl.releasePointerCapture(event.pointerId);
            }
            applyTransform();
        }

        stageEl.addEventListener('pointerup', endDrag);
        stageEl.addEventListener('pointercancel', endDrag);
        stageEl.addEventListener('pointerleave', (event) => {
            if (!isDragging) return;
            endDrag(event);
        });

        imageEl.addEventListener('product-image-changed', resetZoom);
        resetZoom();
    }

    async function loadProductData() {
        const id = getIdFromQuery();
        if (!id) return;

        try {
            const response = await fetch('/api/products');
            if (!response.ok) throw new Error('Failed to load products');
            const data = await response.json();
            const product = (data.products || []).find((p) => String(p.id) === String(id));
            if (!product) return;

            const rawCat = (data.categories || []).find((c) => c.id === product.category);
            const cfg = mergeCategoryConfig(rawCat || {});

            const titleEl = document.getElementById('product-title');
            const imageEl = document.getElementById('product-main-image');
            const stageEl = document.getElementById('product-image-stage');
            const dotsEl = document.getElementById('product-gallery-dots');
            const specsBlock = document.getElementById('product-specs-block');
            const specsTitle = document.getElementById('product-specs-title');
            const specsEl = document.getElementById('product-spec-list');
            const paramsWrapEl = document.getElementById('product-params-wrap');
            const paramsBodyEl = document.getElementById('product-params-table-body');
            const paramLabelTh = document.getElementById('product-param-label-th');
            const paramValueTh = document.getElementById('product-param-value-th');
            const zoomInBtn = document.getElementById('zoom-in-btn');
            const zoomOutBtn = document.getElementById('zoom-out-btn');
            const zoomResetBtn = document.getElementById('zoom-reset-btn');

            const name = product.name || 'Товар';
            if (titleEl) titleEl.textContent = name;

            const gallerySources = normalizeGallerySources(product, cfg);
            setupGallery(imageEl, dotsEl, gallerySources, name);
            setupImageZoom(stageEl, imageEl, zoomInBtn, zoomOutBtn, zoomResetBtn);

            if (cfg.fields.specs === false) {
                if (specsBlock) specsBlock.classList.add('hidden');
            } else {
                if (specsBlock) specsBlock.classList.remove('hidden');
                const sh = String(cfg.labels.specsHeading || '').trim();
                if (specsTitle) {
                    if (sh) {
                        specsTitle.textContent = sh;
                        specsTitle.classList.remove('hidden');
                    } else {
                        specsTitle.textContent = '';
                        specsTitle.classList.add('hidden');
                    }
                }
                renderSpecs(specsEl, product.specs);
            }

            const plc = String(cfg.labels.paramLabelCol || '').trim();
            const pvc = String(cfg.labels.paramValueCol || '').trim();
            if (paramLabelTh && plc) paramLabelTh.textContent = plc;
            if (paramValueTh && pvc) paramValueTh.textContent = pvc;

            if (cfg.fields.parameters === false) {
                if (paramsWrapEl) paramsWrapEl.classList.add('hidden');
            } else {
                renderParametersTable(paramsBodyEl, paramsWrapEl, product.parameters);
            }

            document.title = `${name} - RE-SPO`;
        } catch (error) {
            console.error('Product page load error:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadProductData);
    } else {
        loadProductData();
    }
})();
