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
            '<div class="bg-white rounded-[10px] p-6 lg:p-6 flex flex-col min-h-[200px] md:min-h-[267px]">' +
            '<p class="text-[16px] text-respo-dark/80 font-sans leading-[24px] mb-8 text-longform">"' +
            t +
            '"</p>' +
            '<div class="mt-auto font-medium text-[18px] text-respo-dark">' +
            a +
            '</div></div>'
        );
    }

    function slidesInnerHtml(slides) {
        return slides
            .map(
                (cards) =>
                    '<div class="reviews-slide min-w-full shrink-0 snap-center snap-always px-2">' +
                    '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' +
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
