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

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'bg-[#F6F6F6] p-6 rounded-[20px] flex flex-col items-start group hover:shadow-xl transition-all h-full';
    
    // Use t parameter to bust cache if needed, or just standard path
    const imgSrc = product.image || 'assets/product_placeholder.png';
    
    div.innerHTML = `
        <h3 class="text-lg font-medium text-respo-dark mb-6 line-clamp-2 min-h-[3.5rem]">${product.name}</h3>
        <div class="bg-white w-full aspect-square rounded-[16px] mb-6 shadow-sm overflow-hidden flex items-center justify-center">
            <img src="${imgSrc}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
        </div>
        <div class="mt-auto w-full">
            <a href="${product.link}" class="bg-respo-cyan text-white py-3 px-5 rounded-full flex items-center justify-center space-x-2 hover:brightness-110 transition-all w-full">
                <span class="font-medium text-[14px]">Подробнее</span>
                <img src="assets/arrow-right.svg" alt="Icon" class="w-4 h-4 brightness-0 invert">
            </a>
        </div>
    `;
    return div;
}

function createProductListItem(product) {
    const div = document.createElement('div');
    div.className = 'py-8 border-b border-respo-blue/10 flex items-center justify-between group cursor-pointer hover:bg-respo-blue-light/30 transition-colors px-4 -mx-4 rounded-xl';
    div.onclick = () => window.location.href = product.link;
    
    div.innerHTML = `
        <h3 class="text-[20px] lg:text-[24px] text-respo-dark font-medium transition-colors group-hover:text-respo-cyan">${product.name}</h3>
        <div class="flex-shrink-0 w-12 h-12 bg-respo-green rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ml-4">
            <img src="assets/arrow-right.svg" alt="Arrow" class="w-5 h-5">
        </div>
    `;
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
        gridDiv.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8';
        categoryProducts.forEach(p => {
            const card = createProductCard(p);
            gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);
    }
}
