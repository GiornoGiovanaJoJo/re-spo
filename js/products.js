/**
 * RE-SPO - Dynamic Product Rendering
 */

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        return await res.json();
    } catch (err) {
        console.error('Error loading products:', err);
        return { categories: [], products: [] };
    }
}

async function fetchCertificates() {
    try {
        const res = await fetch('/api/certificates');
        if (!res.ok) throw new Error('Failed to fetch certificates');
        return await res.json();
    } catch (err) {
        console.error('Error loading certificates:', err);
        return { certificates: [] };
    }
}

function escapeHtml(input) {
    return String(input ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Defaults for category-driven catalog / product UI (admin + site). */
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

function catalogCounterStripHtml() {
    return (
        '<div class="bg-[#E9F5FF] rounded-[6px] py-2.5 px-6 flex flex-col md:flex-row items-center justify-between gap-6 mt-6">' +
        '<span class="text-[14px] lg:text-[16px] text-respo-dark/80 font-normal whitespace-nowrap" data-site-text="production.counter_label">Счетчик установленных клапанов</span>' +
        '<span class="text-[14px] lg:text-[16px] text-respo-dark/40 font-normal">-</span>' +
        '<span class="text-[14px] lg:text-[16px] text-respo-dark font-normal tabular-nums tracking-wide">10 000 000</span>' +
        '</div>'
    );
}

function getProductHref(product) {
    let raw = String(product.link || '/product').trim();
    if (/^product\.html(\?|$)/i.test(raw)) {
        raw = '/product' + raw.slice('product.html'.length);
    }
    if (/^\/product(?:\?|$)/.test(raw) && !/[?&]id=/.test(raw)) {
        const sep = raw.includes('?') ? '&' : '?';
        return `${raw}${sep}id=${encodeURIComponent(product.id)}`;
    }
    return raw;
}

function getNormalizedCategory(product) {
    const sourceCategory = String(product?.category || '').trim();
    if (sourceCategory === 'valves' || sourceCategory === 'heat_exchangers') {
        return sourceCategory;
    }

    const name = String(product?.name || '').toLowerCase();
    if (name.includes('клапан')) return 'valves';
    if (name.includes('теплообмен')) return 'heat_exchangers';
    return sourceCategory || 'equipment';
}

function formatExchangerTitle(name) {
    const raw = String(name ?? '').trim();
    const sizeMatch = raw.match(/^(.*?)(\s*\((?:Размер|размер)[^)]+\))$/);

    if (!sizeMatch) {
        return escapeHtml(raw);
    }

    const baseName = escapeHtml(sizeMatch[1].trim());
    const sizePart = escapeHtml(sizeMatch[2].trim());
    return `${baseName}<br><span class="text-respo-dark/70">${sizePart}</span>`;
}

function createProductCard(product, categoryConfig) {
    const cfg = categoryConfig || mergeCategoryConfig({});
    const div = document.createElement('div');
    const isValve = cfg.cardStyle === 'valve';
    const isExchanger = cfg.cardStyle === 'exchanger';
    const cardSizeClass = isValve ? 'w-full max-w-[420px]' : (isExchanger ? 'w-full max-w-[320px]' : 'w-full');
    /* min-w-0: во flex-ряду карусели иначе min-width:auto не даёт сужаться — текст не переносится и режется */
    div.className = isExchanger
        ? `bg-[#F8F9FA] p-6 rounded-[20px] flex flex-col items-start h-full min-w-0 w-full ${cardSizeClass}`
        : `bg-[#F8F9FA] p-6 lg:p-8 rounded-[20px] flex flex-col items-start group hover:shadow-xl transition-all h-full min-w-0 w-full ${cardSizeClass}`;
    
    const rawName = String(product.name ?? '').trim();
    const safeName = escapeHtml(rawName);
    const exchangerTitle = formatExchangerTitle(rawName);
    const href = getProductHref(product);
    const safeHref = escapeHtml(href);
    const safeDescription = escapeHtml(product.description || '');
    const showDescription = cfg.fields.description !== false && Boolean(String(product.description || '').trim());

    // Use t parameter to bust cache if needed, or just standard path
    const imgSrc = product.image || 'assets/product_placeholder.png';
    
    const mediaAspectClass = 'aspect-[4/5]';

    if (isExchanger) {
        div.innerHTML = `
            <h3 class="text-[14px] text-respo-dark/80 font-medium mb-4 leading-[1.45] break-words line-clamp-5">${exchangerTitle}</h3>
            <div class="bg-white w-full ${mediaAspectClass} rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center p-4">
                <img src="${imgSrc}" alt="${safeName}" class="max-h-full max-w-[92%] w-auto h-auto object-contain">
            </div>
            <div class="mt-auto w-full">
                <a href="${safeHref}" class="bg-respo-cyan text-white py-2.5 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full text-[12px]">
                    <span class="font-medium">Подробнее</span>
                    <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
                </a>
            </div>
        `;
        return div;
    }

    div.innerHTML = `
        <h3 class="${isValve ? 'text-[14px]' : 'text-lg'} font-medium text-respo-dark mb-4 w-full min-w-0 break-words leading-snug line-clamp-4 lg:line-clamp-3">${safeName}</h3>
        ${showDescription ? `<p class="text-[12px] text-respo-dark/60 mb-4 w-full min-w-0 break-words leading-relaxed line-clamp-4 lg:line-clamp-2">${safeDescription}</p>` : ''}
        <div class="bg-white w-full ${mediaAspectClass} rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center p-4">
            <img src="${imgSrc}" alt="${safeName}" class="max-h-full max-w-[92%] w-auto h-auto object-contain group-hover:scale-105 transition-transform">
        </div>
        <div class="mt-auto w-full">
            <a href="${safeHref}" class="bg-respo-cyan text-white py-2.5 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full text-[12px]">
                <span class="font-medium">Подробнее</span>
                <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
            </a>
        </div>
    `;
    return div;
}

function createProductListItem(product, categoryConfig) {
    const cfg = categoryConfig || mergeCategoryConfig({});
    const div = document.createElement('div');
    div.className = 'border-b border-respo-blue/10';
    const href = getProductHref(product);
    const safeHref = escapeHtml(href);
    const safeName = escapeHtml(product.name);
    
    if (cfg.listStyle === 'accordion') {
        const equipImg = escapeHtml(product.image || 'assets/product_placeholder.png');
        div.innerHTML = `
            <div class="py-8 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl accordion-header">
                <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">${safeName}</h3>
                <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-all group-hover:scale-110 ml-4 arrow-container">
                    <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5 transition-transform duration-300">
                </div>
            </div>
            <div class="accordion-content hidden">
                <div class="pb-10 pt-3">
                    <div class="rounded-[8px] overflow-hidden bg-[#F5F5F5] w-full max-w-[1322px] mx-auto">
                        <div class="w-full aspect-[4/3] sm:aspect-[12/5] max-h-[531px] flex items-center justify-center">
                            <img src="${equipImg}" alt="${safeName}" class="w-full h-full object-cover">
                        </div>
                    </div>
                    <div class="mt-6 flex justify-start">
                        <a href="${safeHref}" class="bg-respo-cyan text-white py-2.5 px-6 rounded-full inline-flex items-center justify-center space-x-2 hover:brightness-110 transition-all text-[13px]">
                            <span class="font-medium">Подробнее</span>
                            <img src="assets/arrow-right.svg" alt="Arrow" class="w-4 h-4 brightness-0 invert">
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        const header = div.querySelector('.accordion-header');
        const content = div.querySelector('.accordion-content');
        const arrow = div.querySelector('.arrow-container img');
        
        header.addEventListener('click', () => {
            content.classList.toggle('hidden');
            arrow.classList.toggle('rotate-90');
            header.classList.toggle('bg-respo-blue-light/20');
        });
    } else {
        // Standard item (link style)
        div.innerHTML = `
            <div class="py-8 px-4 -mx-4 rounded-xl hover:bg-respo-blue-light/30 transition-colors">
                <div class="flex items-center justify-between gap-4">
                    <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium">${safeName}</h3>
                    <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center">
                        <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5">
                    </div>
                </div>
                <div class="mt-5">
                    <a href="${safeHref}" class="bg-respo-cyan text-white py-2.5 px-6 rounded-full inline-flex items-center justify-center space-x-2 hover:brightness-110 transition-all text-[13px]">
                        <span class="font-medium">Подробнее</span>
                        <img src="assets/arrow-right.svg" alt="Arrow" class="w-4 h-4 brightness-0 invert">
                    </a>
                </div>
            </div>
        `;
    }
    
    return div;
}

function getSlidesPerView(context, categoryConfig) {
    const width = window.innerWidth || 1280;
    /* ~1 слайд на очень узких экранах — больше ширина под перенос длинных названий */
    if (width <= 390) return 1;
    if (width <= 720) return 1.12;
    if (width <= 1024) return 2.12;

    if (context === 'home') return 3.1;
    const cfg = categoryConfig || mergeCategoryConfig({});
    if (cfg.cardStyle === 'exchanger') return 3.1;
    if (cfg.cardStyle === 'valve') return 2.8;
    return 2.4;
}

function createHorizontalProductsCarousel(products, options = {}) {
    const { context = 'catalog', categoryId = 'catalog', categoryConfig } = options;
    const cfg = categoryConfig || mergeCategoryConfig({});

    const root = document.createElement('div');
    root.className = 'relative';

    const track = document.createElement('div');
    track.className = 'flex gap-4 lg:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2';
    track.style.scrollbarWidth = 'thin';
    track.style.webkitOverflowScrolling = 'touch';
    track.setAttribute('aria-label', 'Горизонтальная лента товаров');

    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-respo-blue/20 items-center justify-center shadow-sm text-respo-blue hover:bg-respo-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    btnPrev.setAttribute('aria-label', 'Прокрутить товары влево');
    btnPrev.innerHTML = '&#8592;';

    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-respo-blue/20 items-center justify-center shadow-sm text-respo-blue hover:bg-respo-blue-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
    btnNext.setAttribute('aria-label', 'Прокрутить товары вправо');
    btnNext.innerHTML = '&#8594;';

    products.forEach((product) => {
        const slide = document.createElement('div');
        slide.className = 'snap-center shrink-0 min-w-0';
        slide.style.minWidth = '0';

        const card = createProductCard(product, cfg);
        card.classList.add('h-full');
        card.style.maxWidth = 'none';
        card.style.width = '100%';

        slide.appendChild(card);
        track.appendChild(slide);
    });

    const updateSlideWidths = () => {
        if (!track.isConnected) return;
        if (track.clientWidth === 0) return;
        const perView = getSlidesPerView(context, cfg);
        const basis = `${100 / perView}%`;
        Array.from(track.children).forEach((slide) => {
            slide.style.flex = `0 0 ${basis}`;
        });
        updateButtons();
        const overflows = track.scrollWidth > track.clientWidth + 6;
        track.classList.toggle('justify-center', !overflows);
        if (!overflows) {
            track.scrollLeft = 0;
        }
    };

    const updateButtons = () => {
        const canScroll = track.scrollWidth > track.clientWidth + 6;
        const atStart = track.scrollLeft <= 4;
        const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        btnPrev.disabled = !canScroll || atStart;
        btnNext.disabled = !canScroll || atEnd;
    };

    const scrollByPage = (direction) => {
        const delta = Math.max(track.clientWidth * 0.86, 260) * direction;
        track.scrollBy({ left: delta, behavior: 'smooth' });
    };

    btnPrev.addEventListener('click', () => scrollByPage(-1));
    btnNext.addEventListener('click', () => scrollByPage(1));
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateSlideWidths);

    // Important for hidden accordion panels: recalc when container becomes visible.
    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => updateSlideWidths());
        observer.observe(root);
    }

    root.appendChild(btnPrev);
    root.appendChild(track);
    root.appendChild(btnNext);
    updateSlideWidths();
    setTimeout(updateSlideWidths, 0);
    setTimeout(updateSlideWidths, 120);

    return root;
}

/**
 * Render featured products on the Home page
 */
async function initCatalogPreview(containerId, limit = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="text-respo-dark/60">Загрузка товаров...</p>';
    const data = await fetchProducts();
    container.innerHTML = '';
    
    // Take first N products as featured
    const featured = data.products.slice(0, limit);

    if (featured.length === 0) {
        container.innerHTML = '<p class="text-respo-dark/60">Товары пока не добавлены.</p>';
        container.setAttribute('aria-busy', 'false');
        return;
    }

    container.className = '';
    container.appendChild(createHorizontalProductsCarousel(featured, { context: 'home', categoryId: 'home', categoryConfig: mergeCategoryConfig({ cardStyle: 'default' }) }));
    container.setAttribute('aria-busy', 'false');
}

/**
 * Render products by category on the Production page
 * @param {string} categoryId
 * @param {string} containerId
 * @param {'list'|'grid'|'carousel'} displayType
 * @param {object} [categoryConfig] merged config; if omitted, loaded from preloadedData / API
 * @param {object} [preloadedData] full { categories, products } to avoid duplicate fetch
 */
async function initCategoryRender(categoryId, containerId, displayType = 'grid', categoryConfig, preloadedData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="text-respo-dark/60 py-6">Загрузка категории...</p>';
    const data = preloadedData || await fetchProducts();
    container.innerHTML = '';

    const rawCat = (data.categories || []).find((c) => c.id === categoryId);
    const cfg = categoryConfig || mergeCategoryConfig(rawCat || { id: categoryId, name: categoryId });

    const categoryProducts = data.products.filter((p) => getNormalizedCategory(p) === categoryId);

    if (categoryProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-400 py-10">В данной категории товаров пока нет.</p>';
        container.setAttribute('aria-busy', 'false');
        return;
    }

    if (displayType === 'list') {
        const listDiv = document.createElement('div');
        listDiv.className = 'border-t border-respo-blue/10';
        categoryProducts.forEach((p) => {
            listDiv.appendChild(createProductListItem(p, cfg));
        });
        container.appendChild(listDiv);
    } else if (displayType === 'carousel') {
        container.appendChild(createHorizontalProductsCarousel(categoryProducts, { context: 'catalog', categoryId, categoryConfig: cfg }));
    } else {
        const gridDiv = document.createElement('div');
        const cols = Number(cfg.gridCols) || 4;
        const gridClassMap = {
            2: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 justify-items-center',
            3: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 justify-items-center',
            4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'
        };
        gridDiv.className = gridClassMap[cols] || gridClassMap[4];
        categoryProducts.forEach((p) => {
            gridDiv.appendChild(createProductCard(p, cfg));
        });
        container.appendChild(gridDiv);
    }
    container.setAttribute('aria-busy', 'false');
}

/**
 * Build catalog accordion sections from products.json categories (sortOrder) and render each block.
 */
async function initProductionCatalogSections(rootId) {
    const root = document.getElementById(rootId);
    if (!root) return;

    const data = await fetchProducts();
    const categories = Array.isArray(data.categories) ? [...data.categories] : [];
    categories.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

    root.innerHTML = '';
    for (const raw of categories) {
        const cfg = mergeCategoryConfig(raw);
        const panelId = `catalog-panel-${cfg.id}`;
        const containerId = `catalog-container-${cfg.id}`;
        const wrap = document.createElement('div');
        wrap.innerHTML =
            '<div>' +
            '<button type="button" class="catalog-toggle w-full flex items-center justify-between gap-4 text-left bg-respo-blue-light border-2 border-respo-cyan/40 rounded-2xl px-6 py-5 lg:px-8 lg:py-6 hover:border-respo-blue transition-colors" data-accordion-target="' +
            panelId +
            '" aria-expanded="false" aria-controls="' +
            panelId +
            '">' +
            '<h2 class="text-[32px] lg:text-[44px] text-respo-blue font-medium leading-[1.1]">' +
            escapeHtml(cfg.name) +
            '</h2>' +
            '<span class="catalog-toggle-icon text-respo-blue text-[22px] leading-none transition-transform duration-200" aria-hidden="true">+</span>' +
            '</button>' +
            '<div id="' +
            panelId +
            '" class="hidden">' +
            '<div id="' +
            containerId +
            '"><p class="text-respo-dark/60 py-6">Загрузка...</p></div>' +
            (cfg.showCounter ? catalogCounterStripHtml() : '') +
            '</div>' +
            '</div>';
        root.appendChild(wrap.firstElementChild);
    }

    for (const raw of categories) {
        const cfg = mergeCategoryConfig(raw);
        const mode = cfg.catalogMode || 'carousel';
        await initCategoryRender(cfg.id, `catalog-container-${cfg.id}`, mode, cfg, data);
    }
}

/**
 * Render certificates on Production page
 */
async function initCertificatesRender(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="text-respo-dark/60 py-6">Загрузка сертификатов...</p>';
    const data = await fetchCertificates();
    const certificates = Array.isArray(data.certificates) ? data.certificates : [];

    if (certificates.length === 0) {
        container.innerHTML = '<p class="text-gray-400 py-10">Сертификаты пока не добавлены.</p>';
        container.setAttribute('aria-busy', 'false');
        return;
    }

    const PER_SLIDE = 2;
    const slides = [];
    for (let i = 0; i < certificates.length; i += PER_SLIDE) {
        slides.push(certificates.slice(i, i + PER_SLIDE));
    }

    function certCardInnerHtml(cert) {
        const title = escapeHtml(cert.title || '');
        const description = escapeHtml(cert.description || '').replace(/\n/g, '<br>');
        const imagePath = String(cert.image || '').trim();
        const imageSrc = imagePath || '';
        const media =
            imageSrc
                ? `<img src="${escapeHtml(imageSrc)}" alt="${title}" class="max-h-full max-w-full object-contain" loading="lazy" decoding="async">`
                : '<span class="text-gray-400 text-xs text-center leading-normal px-2">Нет изображения</span>';
        return (
            '<article class="certificate-card flex min-h-0 min-w-0 flex-col h-full">' +
            '<div class="certificate-card-thumb mx-auto flex h-[500px] w-[150px] max-w-full shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#F7F7F7] shadow-sm p-2 sm:p-3">' +
            media +
            '</div>' +
            '<div class="flex min-h-0 flex-1 flex-col gap-3 pt-4 md:pt-5">' +
            `<h4 class="text-[17px] font-medium text-respo-dark leading-snug break-words sm:text-[18px]">${title}</h4>` +
            `<div class="certificate-card-desc text-[12px] text-respo-blue font-sans leading-relaxed break-words [overflow-wrap:anywhere] sm:text-[13px] sm:leading-relaxed flex-1">${description}</div>` +
            '</div>' +
            '</article>'
        );
    }

    const slidesHtml = slides
        .map(
            (cards) =>
                '<div class="min-w-full shrink-0 snap-center snap-always px-1 sm:px-2">' +
                '<div class="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">' +
                cards.map(certCardInnerHtml).join('') +
                '</div></div>'
        )
        .join('');

    const wrap = document.createElement('div');
    wrap.className = 'certificates-carousel';

    const frame = document.createElement('div');
    frame.className = 'relative px-10 sm:px-12 md:px-14';

    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className =
        'certificate-carousel-btn certificate-carousel-btn-prev flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-respo-blue/25 items-center justify-center shadow-md text-respo-blue text-lg leading-none hover:bg-respo-blue-light transition-colors disabled:opacity-35 disabled:cursor-not-allowed';
    btnPrev.setAttribute('aria-label', 'Предыдущая страница сертификатов');
    btnPrev.innerHTML = '&#8592;';

    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className =
        'certificate-carousel-btn certificate-carousel-btn-next flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border border-respo-blue/25 items-center justify-center shadow-md text-respo-blue text-lg leading-none hover:bg-respo-blue-light transition-colors disabled:opacity-35 disabled:cursor-not-allowed';
    btnNext.setAttribute('aria-label', 'Следующая страница сертификатов');
    btnNext.innerHTML = '&#8594;';

    const viewport = document.createElement('div');
    viewport.className = 'overflow-hidden';

    const track = document.createElement('div');
    track.className =
        'reviews-scrollbar flex w-full items-start overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x';
    track.setAttribute('aria-label', 'Сертификаты, горизонтальная прокрутка');
    track.innerHTML = slidesHtml;

    viewport.appendChild(track);
    frame.appendChild(btnPrev);
    frame.appendChild(btnNext);
    frame.appendChild(viewport);
    wrap.appendChild(frame);

    if (slides.length <= 1) {
        btnPrev.classList.add('hidden');
        btnNext.classList.add('hidden');
        frame.classList.remove('px-10', 'sm:px-12', 'md:px-14');
    }

    container.innerHTML = '';
    container.appendChild(wrap);
    container.setAttribute('aria-busy', 'false');

    const CS = window.RespoCarouselStrip;
    if (CS) {
        CS.bind(track, null, slides.length, 'light', 'Сертификаты', {
            arrows: { prev: btnPrev, next: btnNext },
        });
    } else {
        console.error('RespoCarouselStrip not loaded (include js/carousel-strip.js before products.js)');
    }
}
