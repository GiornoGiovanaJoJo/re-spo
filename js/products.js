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

function getProductHref(product) {
    const raw = String(product.link || 'product.html').trim();
    if (/^product\.html(?:\?|$)/i.test(raw) && !/[?&]id=/.test(raw)) {
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

function createProductCard(product) {
    const div = document.createElement('div');
    const isValve = product.category === 'valves';
    const isExchanger = product.category === 'heat_exchangers';
    const cardSizeClass = isValve ? 'w-full max-w-[420px]' : (isExchanger ? 'w-full max-w-[320px]' : 'w-full');
    div.className = isExchanger
        ? `bg-[#F8F9FA] p-6 rounded-[20px] flex flex-col items-start h-full ${cardSizeClass}`
        : `bg-[#F8F9FA] p-6 lg:p-8 rounded-[20px] flex flex-col items-start group hover:shadow-xl transition-all h-full ${cardSizeClass}`;
    
    const rawName = String(product.name ?? '').trim();
    const safeName = escapeHtml(rawName);
    const exchangerTitle = formatExchangerTitle(rawName);
    const href = getProductHref(product);
    const safeHref = escapeHtml(href);
    const safeDescription = escapeHtml(product.description || '');

    // Use t parameter to bust cache if needed, or just standard path
    const imgSrc = product.image || 'assets/product_placeholder.png';
    
    const mediaAspectClass = 'aspect-[4/5]';

    if (isExchanger) {
        div.innerHTML = `
            <h3 class="text-[14px] text-respo-dark/80 font-medium mb-4 leading-[1.45] min-h-[2.8rem]">${exchangerTitle}</h3>
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
        <h3 class="${isValve ? 'text-[14px]' : 'text-lg'} font-medium text-respo-dark mb-4 line-clamp-2 min-h-[3.5rem]">${safeName}</h3>
        ${safeDescription ? `<p class="text-[12px] text-respo-dark/60 mb-4 line-clamp-2 w-full">${safeDescription}</p>` : ''}
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

function createProductListItem(product) {
    const div = document.createElement('div');
    div.className = 'border-b border-respo-blue/10';
    const href = getProductHref(product);
    const safeHref = escapeHtml(href);
    const safeName = escapeHtml(product.name);
    
    // Check if it's an equipment item (accordion style)
    if (product.category === 'equipment') {
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

function getSlidesPerView(context, categoryId) {
    const width = window.innerWidth || 1280;
    if (width <= 390) return 1.08;
    if (width <= 720) return 1.16;
    if (width <= 1024) return 2.12;

    if (context === 'home') return 3.1;
    if (categoryId === 'equipment') return 2.4;
    if (categoryId === 'heat_exchangers') return 3.1;
    return 2.8;
}

function createHorizontalProductsCarousel(products, options = {}) {
    const { context = 'catalog', categoryId = 'catalog' } = options;

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
        slide.className = 'snap-start';
        slide.style.minWidth = '0';

        const card = createProductCard(product);
        card.classList.add('h-full');
        card.style.maxWidth = 'none';
        card.style.width = '100%';

        slide.appendChild(card);
        track.appendChild(slide);
    });

    const updateSlideWidths = () => {
        if (!track.isConnected) return;
        if (track.clientWidth === 0) return;
        const perView = getSlidesPerView(context, categoryId);
        const basis = `${100 / perView}%`;
        Array.from(track.children).forEach((slide) => {
            slide.style.flex = `0 0 ${basis}`;
        });
        updateButtons();
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
    container.appendChild(createHorizontalProductsCarousel(featured, { context: 'home', categoryId: 'home' }));
    container.setAttribute('aria-busy', 'false');
}

/**
 * Render products by category on the Production page
 */
async function initCategoryRender(categoryId, containerId, displayType = 'grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="text-respo-dark/60 py-6">Загрузка категории...</p>';
    const data = await fetchProducts();
    container.innerHTML = '';
    
    const categoryProducts = data.products.filter((p) => getNormalizedCategory(p) === categoryId);
    
    if (categoryProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-400 py-10">В данной категории товаров пока нет.</p>';
        container.setAttribute('aria-busy', 'false');
        return;
    }

    if (displayType === 'list') {
        const listDiv = document.createElement('div');
        listDiv.className = 'border-t border-respo-blue/10';
        categoryProducts.forEach(p => {
            listDiv.appendChild(createProductListItem(p));
        });
        container.appendChild(listDiv);
    } else if (displayType === 'carousel') {
        container.appendChild(createHorizontalProductsCarousel(categoryProducts, { context: 'catalog', categoryId }));
    } else {
        const gridDiv = document.createElement('div');
        if (categoryId === 'valves') {
            gridDiv.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 justify-items-center';
        } else if (categoryId === 'heat_exchangers') {
            gridDiv.className = 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 justify-items-center';
        } else {
            gridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';
        }
        categoryProducts.forEach(p => {
            const card = createProductCard(p);
            gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);
    }
    container.setAttribute('aria-busy', 'false');
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

    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid grid-cols-1 md:grid-cols-3 gap-8';

    certificates.forEach((cert) => {
        const title = escapeHtml(cert.title || '');
        const description = escapeHtml(cert.description || '').replace(/\n/g, '<br>');
        const imagePath = String(cert.image || '').trim();
        const imageSrc = imagePath || '';

        const card = document.createElement('div');
        card.innerHTML = `
            <div class="w-full aspect-[3/4] bg-[#F7F7F7] mb-6 shadow-sm overflow-hidden flex items-center justify-center">
                ${imageSrc
                    ? `<img src="${escapeHtml(imageSrc)}" alt="${title}" class="w-full h-full object-contain">`
                    : '<span class="text-gray-400 text-xs">Нет изображения</span>'}
            </div>
            <h4 class="text-[18px] font-medium text-respo-dark mb-4 pr-4">${title}</h4>
            <p class="text-[12px] text-respo-blue font-sans leading-[1.6]">${description}</p>
        `;
        gridDiv.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(gridDiv);
    container.setAttribute('aria-busy', 'false');
}
