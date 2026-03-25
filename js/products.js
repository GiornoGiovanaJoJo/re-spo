/**
 * RESPO - Dynamic Product Rendering
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

function createProductCard(product) {
    const div = document.createElement('div');
    const isValve = product.category === 'valves';
    const isExchanger = product.category === 'heat_exchangers';
    div.className = isExchanger
        ? 'bg-[#F8F9FA] p-6 rounded-[20px] flex flex-col items-start h-full'
        : 'bg-[#F8F9FA] p-6 lg:p-8 rounded-[20px] flex flex-col items-start group hover:shadow-xl transition-all h-full';
    
    const safeName = escapeHtml(product.name);
    const href = getProductHref(product);
    const safeHref = escapeHtml(href);
    const safeDescription = escapeHtml(product.description || '');

    // Use t parameter to bust cache if needed, or just standard path
    const imgSrc = product.image || 'assets/product_placeholder.png';
    
    if (isExchanger) {
        div.innerHTML = `
            <div class="bg-white w-full aspect-square rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center p-5">
                <img src="${imgSrc}" alt="${safeName}" class="w-[82%] h-[82%] object-contain">
            </div>
            <h3 class="text-[14px] text-respo-dark/80 font-medium mt-auto">${safeName}</h3>
        `;
        return div;
    }

    div.innerHTML = `
        <h3 class="${isValve ? 'text-[14px]' : 'text-lg'} font-medium text-respo-dark mb-4 line-clamp-2 min-h-[3.5rem]">${safeName}</h3>
        ${safeDescription ? `<p class="text-[12px] text-respo-dark/60 mb-4 line-clamp-2 w-full">${safeDescription}</p>` : ''}
        <div class="bg-white w-full aspect-square rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center p-5">
            <img src="${imgSrc}" alt="${safeName}" class="w-[82%] h-[82%] object-contain group-hover:scale-105 transition-transform">
        </div>
        <div class="mt-auto w-full">
            ${isValve
                ? `<button data-add-to-cart="1" data-product-name="${safeName}" class="bg-respo-cyan text-white py-2.5 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full text-[12px]">
                    <span class="font-medium">добавить в корзину</span>
                    <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
                </button>`
                : `<a href="${safeHref}" class="bg-respo-cyan text-white py-2.5 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full text-[12px]">
                    <span class="font-medium">Подробнее</span>
                    <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
                </a>`
            }
        </div>
    `;
    return div;
}

function createProductListItem(product) {
    const div = document.createElement('div');
    div.className = 'border-b border-respo-blue/10';
    
    // Check if it's an equipment item (accordion style)
    if (product.category === 'equipment') {
        div.innerHTML = `
            <div class="py-8 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl accordion-header">
                <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">${escapeHtml(product.name)}</h3>
                <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-all group-hover:scale-110 ml-4 arrow-container">
                    <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5 transition-transform duration-300">
                </div>
            </div>
            <div class="accordion-content hidden">
                <div class="pb-12 pt-4">
                    <div class="rounded-[32px] overflow-hidden bg-gray-50 border border-respo-blue/5 shadow-inner flex items-center justify-center p-6 lg:p-10">
                        <img src="${product.image}" alt="${escapeHtml(product.name)}" class="w-[64%] max-w-xl h-auto object-contain">
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
            <div class="py-8 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl">
                <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">${escapeHtml(product.name)}</h3>
                <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ml-4">
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

    const data = await fetchProducts();
    container.innerHTML = '';
    
    // Take first N products as featured
    const featured = data.products.slice(0, limit);
    
    featured.forEach(p => {
        const card = createProductCard(p);
        container.appendChild(card);
    });
}

/**
 * Render products by category on the Production page
 */
async function initCategoryRender(categoryId, containerId, displayType = 'grid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await fetchProducts();
    container.innerHTML = '';
    
    const categoryProducts = data.products.filter(p => p.category === categoryId);
    
    if (categoryProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-400 py-10">В данной категории товаров пока нет.</p>';
        return;
    }

    if (displayType === 'list') {
        const listDiv = document.createElement('div');
        listDiv.className = 'border-t border-respo-blue/10';
        categoryProducts.forEach(p => {
            listDiv.appendChild(createProductListItem(p));
        });
        container.appendChild(listDiv);
    } else {
        const gridDiv = document.createElement('div');
        if (categoryId === 'valves') {
            gridDiv.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 mb-12';
        } else if (categoryId === 'heat_exchangers') {
            gridDiv.className = 'grid grid-cols-1 md:grid-cols-3 gap-8 mb-12';
        } else {
            gridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8';
        }
        categoryProducts.forEach(p => {
            const card = createProductCard(p);
            gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);
    }
}
