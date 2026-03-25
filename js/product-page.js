/**
 * Product page dynamic binding by ?id=
 */
(function initProductPage() {
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
            const specsEl = document.getElementById('product-spec-list');
            const addToCartBtn = document.querySelector('[data-add-to-cart="1"]');

            if (titleEl) titleEl.textContent = product.name || 'Товар';
            if (imageEl) {
                imageEl.src = product.image || 'assets/product_placeholder.png';
                imageEl.alt = product.name || 'Product';
                imageEl.onerror = () => {
                    imageEl.src = 'assets/product_placeholder.png';
                };
            }
            renderSpecs(specsEl, product.specs);
            if (addToCartBtn) {
                addToCartBtn.dataset.productName = product.name || 'Товар';
            }

            document.title = `${product.name || 'Товар'} - RESPO`;
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
