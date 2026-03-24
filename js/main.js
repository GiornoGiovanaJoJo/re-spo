// =====================================================
// RESPO — Main Application Script
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('RESPO Website Initialized');

    // ----- State -----
    let cartItems = [];

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
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('shadow-lg');
        } else {
            header.classList.remove('shadow-lg');
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
    }

    // =====================================================
    // "Добавить в корзину" Buttons
    // =====================================================
    const addToCartButtons = document.querySelectorAll('#catalog button');
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card = btn.closest('.bg-\\[\\#F6F6F6\\]') || btn.parentElement;
            const productName = card ? card.querySelector('h3')?.textContent?.trim() : 'Товар';
            cartItems.push(productName);
            updateCartBadge();
            showToast(`«${productName}» добавлен в корзину`, 'success');

            // Button micro-animation
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => { btn.style.transform = 'scale(1)'; }, 150);
        });
    });

    // =====================================================
    // Header "Войти" Button
    // =====================================================
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showToast('Личный кабинет скоро будет доступен', 'info');
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
            const href = card.getAttribute('href');
            const title = card.querySelector('h3')?.textContent?.trim() || '';
            
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header.offsetHeight;
                    const pos = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
                    window.scrollTo({ top: pos, behavior: 'smooth' });
                }
                showToast(`Раздел «${title}» — подробности ниже`, 'info');
            } else {
                // Let natural navigation happen, maybe show a brief toast
                showToast(`Переход в раздел «${title}»`, 'info', 1000);
            }
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
