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

    /** @returns {string[]} */
    function normalizeGallerySources(product) {
        const main = (product.image && String(product.image).trim()) || PLACEHOLDER;
        if (Array.isArray(product.images) && product.images.length > 0) {
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
                'w-[7px] h-[7px] rounded-full bg-respo-blue shrink-0 cursor-pointer hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-respo-blue/40';
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
        const MAX_ZOOM = 5;
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

            const titleEl = document.getElementById('product-title');
            const imageEl = document.getElementById('product-main-image');
            const stageEl = document.getElementById('product-image-stage');
            const dotsEl = document.getElementById('product-gallery-dots');
            const specsEl = document.getElementById('product-spec-list');
            const zoomInBtn = document.getElementById('zoom-in-btn');
            const zoomOutBtn = document.getElementById('zoom-out-btn');
            const zoomResetBtn = document.getElementById('zoom-reset-btn');
            const addToCartBtn = document.querySelector('[data-add-to-cart="1"]');

            const name = product.name || 'Товар';
            if (titleEl) titleEl.textContent = name;

            const gallerySources = normalizeGallerySources(product);
            setupGallery(imageEl, dotsEl, gallerySources, name);
            setupImageZoom(stageEl, imageEl, zoomInBtn, zoomOutBtn, zoomResetBtn);

            renderSpecs(specsEl, product.specs);
            if (addToCartBtn) {
                addToCartBtn.dataset.productName = name;
            }

            document.title = `${name} - RESPO`;
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
