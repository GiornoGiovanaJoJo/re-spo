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
    return `${baseName}<br><span class="text-RE-SPO-dark/70">${sizePart}</span>`;
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
            <h3 class="text-[14px] text-RE-SPO-dark/80 font-medium mb-4 leading-[1.45] min-h-[2.8rem]">${exchangerTitle}</h3>
            <div class="bg-white w-full ${mediaAspectClass} rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center p-4">
                <img src="${imgSrc}" alt="${safeName}" class="max-h-full max-w-[92%] w-auto h-auto object-contain">
            </div>
            <div class="mt-auto w-full">
                <a href="${safeHref}" class="bg-RE-SPO-cyan text-white py-2.5 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full text-[12px]">
                    <span class="font-medium">Подробнее</span>
                    <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
                </a>
            </div>
        `;
        return div;
    }

    div.innerHTML = `
        <h3 class="${isValve ? 'text-[14px]' : 'text-lg'} font-medium text-RE-SPO-dark mb-4 line-clamp-2 min-h-[3.5rem]">${safeName}</h3>
        ${safeDescription ? `<p class="text-[12px] text-RE-SPO-dark/60 mb-4 line-clamp-2 w-full">${safeDescription}</p>` : ''}
        <div class="bg-white w-full ${mediaAspectClass} rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center p-4">
            <img src="${imgSrc}" alt="${safeName}" class="max-h-full max-w-[92%] w-auto h-auto object-contain group-hover:scale-105 transition-transform">
        </div>
        <div class="mt-auto w-full">
            <a href="${safeHref}" class="bg-RE-SPO-cyan text-white py-2.5 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full text-[12px]">
                <span class="font-medium">Подробнее</span>
                <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
            </a>
        </div>
    `;
    return div;
}

function createProductListItem(product) {
    const div = document.createElement('div');
    div.className = 'border-b border-RE-SPO-blue/10';
    
    // Check if it's an equipment item (accordion style)
    if (product.category === 'equipment') {
        const equipImg = escapeHtml(product.image || 'assets/product_placeholder.png');
        div.innerHTML = `
            <div class="py-8 flex items-center justify-between group cursor-pointer hover:bg-RE-SPO-blue-light/30 transition-colors px-4 -mx-4 rounded-xl accordion-header">
                <h3 class="text-[20px] lg:text-[24px] text-RE-SPO-dark font-medium transition-colors group-hover:text-RE-SPO-cyan">${escapeHtml(product.name)}</h3>
                <div class="flex-shrink-0 w-12 h-12 bg-RE-SPO-green rounded-full flex items-center justify-center transition-all group-hover:scale-110 ml-4 arrow-container">
                    <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5 transition-transform duration-300">
                </div>
            </div>
            <div class="accordion-content hidden">
                <div class="pb-10 pt-3">
                    <div class="rounded-[8px] overflow-hidden bg-[#F5F5F5] w-full max-w-[1322px] mx-auto">
                        <div class="w-full aspect-[4/3] sm:aspect-[12/5] max-h-[531px] flex items-center justify-center">
                            <img src="${equipImg}" alt="${escapeHtml(product.name)}" class="w-full h-full object-cover">
                        </div>
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
            header.classList.toggle('bg-RE-SPO-blue-light/20');
        });
    } else {
        // Standard item (link style)
        div.innerHTML = `
            <div class="py-8 flex items-center justify-between group cursor-pointer hover:bg-RE-SPO-blue-light/30 transition-colors px-4 -mx-4 rounded-xl">
                <h3 class="text-[20px] lg:text-[24px] text-RE-SPO-dark font-medium transition-colors group-hover:text-RE-SPO-cyan">${escapeHtml(product.name)}</h3>
                <div class="flex-shrink-0 w-12 h-12 bg-RE-SPO-green rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ml-4">
                    <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5">
                </div>
            </div>
        `;
        div.addEventListener('click', () => {
            window.location.href = getProductHref(product);
        });
    }
    
    return div;
}

/**
 * Render featured products on the Home page
 */
async function initCatalogPreview(containerId, limit = 4) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="text-RE-SPO-dark/60">Загрузка товаров...</p>';
    const data = await fetchProducts();
    container.innerHTML = '';
    
    // Take first N products as featured
    const featured = data.products.slice(0, limit);
    
    featured.forEach(p => {
        const card = createProductCard(p);
        container.appendChild(card);
    });
    container.setAttribute('aria-busy', 'false');
}

/**
 * Render products by category on the Production page
 */
async function initCategoryRender(categoryId, containerId, displayType = 'grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.setAttribute('aria-busy', 'true');
    container.innerHTML = '<p class="text-RE-SPO-dark/60 py-6">Загрузка категории...</p>';
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
        listDiv.className = 'border-t border-RE-SPO-blue/10';
        categoryProducts.forEach(p => {
            listDiv.appendChild(createProductListItem(p));
        });
        container.appendChild(listDiv);
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
    container.innerHTML = '<p class="text-RE-SPO-dark/60 py-6">Загрузка сертификатов...</p>';
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
            <h4 class="text-[18px] font-medium text-RE-SPO-dark mb-4 pr-4">${title}</h4>
            <p class="text-[12px] text-RE-SPO-blue font-sans leading-[1.6]">${description}</p>
        `;
        gridDiv.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(gridDiv);
    container.setAttribute('aria-busy', 'false');
}
