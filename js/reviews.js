/**
 * RE-SPO — отзывы: API, карусель до 4 страниц (по 2 отзыва), точки, модальное окно.
 */
(function () {
    const CS = window.RespoCarouselStrip;
    const MAX_SLIDES = 4;
    const PER_SLIDE = 2;
    const API = '/api/reviews';

    function bindStrip(track, dotsWrap, slideCount, theme) {
        if (!CS) {
            console.error('RespoCarouselStrip not loaded (include js/carousel-strip.js before reviews.js)');
            return { goTo() {}, syncFromScroll() {}, destroy() {} };
        }
        return CS.bind(track, dotsWrap, slideCount, theme || 'gradient', 'Страница отзывов');
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function chunkSlides(reviews) {
        const capped = (reviews || []).slice(0, MAX_SLIDES * PER_SLIDE);
        const slides = [];
        for (let i = 0; i < capped.length; i += PER_SLIDE) {
            slides.push(capped.slice(i, i + PER_SLIDE));
        }
        return slides.slice(0, MAX_SLIDES);
    }

    function cardHtml(r) {
        const t = escapeHtml(r.text || '').replace(/\n/g, '<br>');
        const a = escapeHtml(r.author || '');
        return (
            '<article class="review-card flex h-full min-h-0 min-w-0 flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 sm:p-6 md:ring-respo-blue/10">' +
            '<p class="min-w-0 flex-1 text-left text-[15px] font-sans leading-[1.65] tracking-[-0.01em] text-respo-dark/85 sm:text-[16px] sm:leading-[1.7] break-words [overflow-wrap:anywhere] [text-wrap:pretty]">' +
            '&laquo;' +
            t +
            '&raquo;' +
            '</p>' +
            '<div class="mt-4 border-t border-respo-blue/15 pt-3 text-[15px] font-medium text-respo-dark sm:mt-5 sm:text-[16px] md:mt-auto md:pt-4">' +
            a +
            '</div>' +
            '</article>'
        );
    }

    function slidesInnerHtml(slides) {
        return slides
            .map(
                (cards) =>
                    '<div class="reviews-slide box-border min-w-full max-w-full shrink-0 snap-center snap-always px-2 sm:px-3">' +
                    '<div class="grid min-w-0 w-full grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:items-stretch md:gap-6">' +
                    cards.map(cardHtml).join('') +
                    '</div></div>'
            )
            .join('');
    }

    function openModal(modal, modalTrack, modalDots, slidesHtmlStr, slideCount, currentIndex, teardownPrev) {
        if (!modal || !modalTrack) return;
        teardownPrev?.();
        modalTrack.innerHTML = slidesHtmlStr;
        modalTrack.classList.add(
            'reviews-scrollbar',
            'flex',
            'w-full',
            'overflow-x-auto',
            'snap-x',
            'snap-mandatory',
            'scroll-smooth',
            'touch-pan-x',
            'max-h-[min(70vh,520px)]'
        );
        modal.classList.remove('hidden');
        modal.classList.add('flex', 'items-center', 'justify-center');
        document.body.classList.add('overflow-hidden');

        const ctrl = bindStrip(modalTrack, modalDots, slideCount, 'light');
        requestAnimationFrame(() => {
            modalTrack.scrollLeft = currentIndex * modalTrack.clientWidth;
            ctrl.syncFromScroll();
        });
        return ctrl.destroy;
    }

    function closeModal(modal, teardown) {
        teardown?.();
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex', 'items-center', 'justify-center');
        document.body.classList.remove('overflow-hidden');
    }

    async function initSection(root) {
        const moreBtn = root.querySelector('[data-reviews-more]');
        const track = root.querySelector('[data-reviews-track]');
        const dotsWrap = root.querySelector('[data-reviews-dots]');
        const emptyEl = root.querySelector('[data-reviews-empty]');
        const modal = document.getElementById('reviews-gallery-modal');
        const modalTrack = modal ? modal.querySelector('[data-reviews-modal-track]') : null;
        const modalDots = modal ? modal.querySelector('[data-reviews-modal-dots]') : null;
        const modalClose = modal ? modal.querySelector('[data-reviews-modal-close]') : null;
        const modalBackdrop = modal ? modal.querySelector('[data-reviews-modal-backdrop]') : null;

        let slides = [];
        let slidesHtml = '';
        let modalTeardown = null;

        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error('reviews fetch');
            const data = await res.json();
            slides = chunkSlides(data.reviews || []);
        } catch (e) {
            slides = [];
        }

        if (slides.length === 0) {
            if (track) track.innerHTML = '';
            if (dotsWrap) dotsWrap.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (moreBtn) moreBtn.setAttribute('hidden', '');
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');
        if (moreBtn) moreBtn.removeAttribute('hidden');

        slidesHtml = slidesInnerHtml(slides);
        if (track) {
            track.innerHTML = slidesHtml;
            track.classList.add(
                'reviews-scrollbar',
                'flex',
                'w-full',
                'overflow-x-auto',
                'snap-x',
                'snap-mandatory',
                'scroll-smooth',
                'touch-pan-x'
            );
            bindStrip(track, dotsWrap, slides.length, 'gradient');
        }

        let lastIndex = 0;
        if (track) {
            track.addEventListener(
                'scroll',
                () => {
                    const w = track.clientWidth;
                    if (w < 1) return;
                    lastIndex = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / w)));
                },
                { passive: true }
            );
        }

        if (moreBtn && modal) {
            moreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                modalTeardown = openModal(
                    modal,
                    modalTrack,
                    modalDots,
                    slidesHtml,
                    slides.length,
                    lastIndex,
                    modalTeardown
                );
            });
        }

        const shutClean = () => {
            const t = modalTeardown;
            modalTeardown = null;
            closeModal(modal, t);
        };
        modalClose?.addEventListener('click', shutClean);
        modalBackdrop?.addEventListener('click', shutClean);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) shutClean();
        });
    }

    function boot() {
        document.querySelectorAll('[data-reviews-section]').forEach((root) => {
            initSection(root);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
