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
            const dotsEl = document.getElementById('product-gallery-dots');
            const specsEl = document.getElementById('product-spec-list');
            const addToCartBtn = document.querySelector('[data-add-to-cart="1"]');

            const name = product.name || 'Товар';
            if (titleEl) titleEl.textContent = name;

            const gallerySources = normalizeGallerySources(product);
            setupGallery(imageEl, dotsEl, gallerySources, name);

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
