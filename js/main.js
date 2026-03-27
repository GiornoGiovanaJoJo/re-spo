// =====================================================
// RESPO — Main Application Script
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('RESPO Website Initialized');

    // ----- State -----
    let cartItems = [];
    const CART_STORAGE_KEY = 'respo_cart_v1';
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) cartItems = parsed;
        }
    } catch (e) {
        console.warn('Failed to restore cart from storage', e);
    }

    // =====================================================
    // Toast Notification System
    // =====================================================
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
    document.body.appendChild(toastContainer);

    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        const colors = {
            success: 'background:#B2CD50;color:#fff;',
            info: 'background:#4AAEF2;color:#fff;',
            warning: 'background:#F59E0B;color:#fff;',
            error: 'background:#EF4444;color:#fff;',
        };
        toast.style.cssText = `
            ${colors[type] || colors.info}
            padding:14px 24px;border-radius:16px;font-family:Inter,sans-serif;font-size:15px;font-weight:500;
            box-shadow:0 8px 32px rgba(0,0,0,0.18);pointer-events:auto;
            transform:translateX(120%);transition:transform .35s cubic-bezier(.4,0,.2,1),opacity .35s;opacity:0;
            max-width:360px;line-height:1.4;
        `;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // =====================================================
    // Sticky Header
    // =====================================================
    const header = document.querySelector('header');
    const isTransparentHeader = header?.classList.contains('bg-transparent');
    window.addEventListener('scroll', () => {
        if (!header) return;
        if (window.scrollY > 50) {
            header.classList.add('shadow-lg');
            if (isTransparentHeader) {
                header.classList.add('bg-white/90', 'backdrop-blur-md');
                header.classList.remove('bg-transparent');
            }
        } else {
            header.classList.remove('shadow-lg');
            if (isTransparentHeader) {
                header.classList.remove('bg-white/90', 'backdrop-blur-md');
                header.classList.add('bg-transparent');
            }
        }
    });

    // =====================================================
    // Active Navigation Highlight on Scroll
    // =====================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a.nav-link, #mobile-menu a.nav-link');

    function updateActiveNav() {
        const scrollY = window.scrollY + 120; // offset for header
        let currentSection = '';

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollY >= top && scrollY < top + height) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + currentSection) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveNav);
    updateActiveNav();

    // =====================================================
    // Smooth Scroll with Header Offset
    // =====================================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return; // If target is not on this page, let it navigate naturally (if needed) or just don't scroll

            e.preventDefault();
            const headerHeight = header.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // =====================================================
    // Mobile Menu Toggle
    // =====================================================
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // =====================================================
    // Cart Badge Update
    // =====================================================
    const cartCountEl = document.getElementById('cart-count');

    function updateCartBadge() {
        if (!cartCountEl) return;
        if (cartItems.length > 0) {
            cartCountEl.textContent = cartItems.length;
            cartCountEl.classList.remove('hidden');
        } else {
            cartCountEl.classList.add('hidden');
        }
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
        } catch (e) {
            console.warn('Failed to persist cart', e);
        }
    }

    // =====================================================
    // "Добавить в корзину" Buttons
    // =====================================================
    function attachAddToCartHandlers() {
        // Product page button
        const productPageBtn = document.querySelector('main button');
        if (productPageBtn && !productPageBtn.dataset.cartBound) {
            productPageBtn.dataset.cartBound = '1';
            productPageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const name = document.querySelector('main h1')?.textContent?.trim() || 'Товар';
                cartItems.push(name);
                updateCartBadge();
                showToast(`«${name}» добавлен в корзину`, 'success');
            });
        }

        // Dynamic catalog buttons
        document.querySelectorAll('[data-add-to-cart="1"]').forEach((btn) => {
            if (btn.dataset.cartBound) return;
            btn.dataset.cartBound = '1';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const name = btn.dataset.productName || 'Товар';
                cartItems.push(name);
                updateCartBadge();
                showToast(`«${name}» добавлен в корзину`, 'success');
            });
        });
    }

    // =====================================================
    // Header "Корзина" Button
    // =====================================================
    const cartBtn = document.getElementById('btn-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (cartItems.length === 0) {
                showToast('Корзина пуста', 'info');
            } else {
                showToast(`В корзине: ${cartItems.length} товар(ов)`, 'success');
            }
        });
    }

    // =====================================================
    // "Перейти в каталог" Links
    // =====================================================
    // Removed forced redirection to #catalog to allow natural navigation to production.html

    // =====================================================
    // Category Cards — scroll to audit section
    // =====================================================
    const categoryCards = document.querySelectorAll('#services .grid a.group');
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();
            const goToSection = (id) => {
                const el = document.getElementById(id);
                if (!el) return;
                const headerHeight = header ? header.offsetHeight : 0;
                const pos = el.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                window.scrollTo({ top: pos, behavior: 'smooth' });
            };

            if (title.includes('аудит')) {
                goToSection('audit');
                showToast('Переход к технологическому аудиту', 'info');
                return;
            }
            if (title.includes('сервисное')) {
                goToSection('optimization');
                showToast('Переход к сервисному обслуживанию', 'info');
                return;
            }
            window.location.href = 'production.html';
        });
    });

    // =====================================================
    // "Почему мы?" Cards — hover interaction
    // =====================================================
    const whyUsCards = document.querySelectorAll('section:not([id]) .grid .group');

    // =====================================================
    // Contact Form Handling
    // =====================================================
    const contactForm = document.querySelector('#contacts form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = contactForm.querySelector('input[type="text"]');
            const phoneInput = contactForm.querySelector('input[type="tel"]');
            const emailInput = contactForm.querySelector('input[type="email"]');

            const name = nameInput?.value?.trim();
            const phone = phoneInput?.value?.trim();
            const email = emailInput?.value?.trim();

            // Validation
            if (!name) {
                showToast('Пожалуйста, введите ваше имя', 'warning');
                nameInput?.focus();
                return;
            }
            if (!phone) {
                showToast('Пожалуйста, введите номер телефона', 'warning');
                phoneInput?.focus();
                return;
            }
            if (!email || !email.includes('@')) {
                showToast('Пожалуйста, введите корректный email', 'warning');
                emailInput?.focus();
                return;
            }

            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Отправка...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';

            setTimeout(() => {
                showToast('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.', 'success', 5000);
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }, 1200);
        });
    }

    // =====================================================
    // Interactive Cow Logic
    // =====================================================
    function initInteractiveCow() {
        const cow = document.getElementById('interactive-cow');
        const cowArea = document.getElementById('interactive-cow-area');
        if (!cow || !cowArea) return;

        const cowSpeech = cow.querySelector('.cow-speech');
        const cowSpriteContainer = cow.querySelector('.cow-container');
        const legacySvg = cow.querySelector('.cow-svg');
        if (legacySvg) legacySvg.style.display = 'none';

        // Build sprite node once and use it for all animation states.
        let cowImg = cow.querySelector('.cow-sprite');
        if (!cowImg && cowSpriteContainer) {
            cowImg = document.createElement('div');
            cowImg.className = 'cow-sprite';
            cowImg.setAttribute('aria-hidden', 'true');
            cowSpriteContainer.prepend(cowImg);
        }
        
        console.log('Cow elements found:', { cow, cowArea, cowSpriteContainer });

        // Use the actual container width
        const getBounds = () => cowArea.offsetWidth;
        
        let currentX = getBounds() / 2;
        let targetX = currentX;
        let isEating = false;
        let isFleeing = false;
        let speed = 1.2;
        let direction = 1;

        // Initialize position
        cow.style.left = `${currentX}px`;

        // Subtle breathing/idle effect
        function animateIdle() {
            if (cowSpriteContainer && !isEating && !cow.classList.contains('cow-walking')) {
                cowSpriteContainer.style.transform = `scale(${1 + Math.sin(Date.now() / 1000) * 0.02})`;
            }
            requestAnimationFrame(animateIdle);
        }
        animateIdle();

        function update() {
            if (isEating || isFleeing) {
                requestAnimationFrame(update);
                return;
            }

            // Occasional grazing
            if (Math.random() < 0.003) {
                startEating();
                requestAnimationFrame(update);
                return;
            }

            // Movement logic
            const dx = targetX - currentX;
            if (Math.abs(dx) < 10) {
                // Pick new target
                const margin = 100;
                const bounds = getBounds();
                const centerWidth = bounds * 0.6;
                const offset = (bounds - centerWidth) / 2;
                targetX = offset + Math.random() * centerWidth;
                cow.classList.remove('cow-walking');
                // Wait a bit before moving again
                setTimeout(() => {
                    // This is handled by the next frames if not eating
                }, 1000);
            } else {
                direction = dx > 0 ? 1 : -1;
                currentX += direction * speed;
                cow.style.left = `${currentX}px`;
                if (cowImg) cowImg.style.transform = `scaleX(${direction})`;
                cow.classList.add('cow-walking');
            }

            requestAnimationFrame(update);
        }

        function startEating() {
            if (isEating) return;
            isEating = true;
            cow.classList.remove('cow-walking');
            cow.classList.add('cow-munching');
            cowSpeech.classList.remove('hidden');
            
            // Spawn some grass bits
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    if (!isEating) return;
                    createGrassBit();
                }, i * 300);
            }

            // Random munching duration
            setTimeout(() => {
                cowSpeech.classList.add('hidden');
                cow.classList.remove('cow-munching');
                isEating = false;
            }, 4000 + Math.random() * 2000);
        }

        function createGrassBit() {
            const bit = document.createElement('div');
            bit.className = 'grass-bit';
            const rect = cow.getBoundingClientRect();
            const areaRect = cowArea.getBoundingClientRect();
            
            // Position relative to cowArea
            const x = currentX + (direction === 1 ? 40 : -40); // Near mouth
            const y = areaRect.height - 20;
            
            bit.style.left = `${x}px`;
            bit.style.top = `${y}px`;
            
            // Random trajectory
            const tx = (Math.random() - 0.5) * 60;
            const ty = -30 - Math.random() * 40;
            const tr = (Math.random() - 0.5) * 360;
            
            bit.style.setProperty('--tx', `${tx}px`);
            bit.style.setProperty('--ty', `${ty}px`);
            bit.style.setProperty('--tr', `${tr}deg`);
            
            cowArea.appendChild(bit);
            setTimeout(() => bit.remove(), 800);
        }

        function flee(e) {
            if (isFleeing) return;
            
            isFleeing = true;
            isEating = false;
            cowSpeech.classList.add('hidden');
            cow.classList.add('cow-walking');
            
            // Determine escape direction (away from mouse)
            const mouseX = e.clientX;
            const escapeDir = currentX > mouseX ? 1 : -1;
            
            // Escape distance
            const escapeDist = 250 + Math.random() * 250;
            let newX = currentX + escapeDir * escapeDist;
            
            // Contain within bounds
            const bounds = getBounds();
            newX = Math.max(80, Math.min(bounds - 80, newX));
            
            // Apply fast movement
            cow.style.transition = 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
            cow.style.left = `${newX}px`;
            currentX = newX;
            targetX = newX; // Stop wandering for a bit
            
            if (cowImg) cowImg.style.transform = `scaleX(${escapeDir})`;

            setTimeout(() => {
                cow.style.transition = '';
                isFleeing = false;
            }, 1000);
        }

        cow.addEventListener('mouseenter', flee);
        // Also flee on click for mobile/fun
        cow.addEventListener('click', flee);
        
        requestAnimationFrame(update);
    }

    initInteractiveCow();
    attachAddToCartHandlers();
    updateCartBadge();

    // =====================================================
    // "Узнать больше" Button
    // =====================================================
    const learnMoreBtn = document.querySelector('a[href="#about"]');
    // Already handled by smooth scroll above

    // =====================================================
    // Logo Click — scroll to top
    // =====================================================
    const logo = document.querySelector('header a[href="/"], header a[href="index.html"]');
    if (logo) {
        logo.addEventListener('click', (e) => {
            const isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '';
            if (isHomePage && window.location.hash === '') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            // else let it navigate naturally
        });
    }
});
