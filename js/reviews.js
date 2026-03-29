/**
 * RE-SPO — отзывы: карусель (2 на слайд), стрелки, точки; модалка «читалка» (1 отзыв = 1 слайд), оглавление, клавиатура.
 */
(function () {
    const CS = window.RespoCarouselStrip;
    const MAX_SLIDES = 4;
    const PER_SLIDE = 2;
    const API = '/api/reviews';

    function bindStrip(track, dotsWrap, slideCount, theme, ariaPageLabel, opts) {
        if (!CS) {
            console.error('RespoCarouselStrip not loaded (include js/carousel-strip.js before reviews.js)');
            return { goTo() {}, syncFromScroll() {}, getIndex() { return 0; }, destroy() {} };
        }
        return CS.bind(track, dotsWrap, slideCount, theme || 'gradient', ariaPageLabel, opts || null);
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function authorInitials(author) {
        const s = String(author || '').trim();
        if (!s) return '?';
        const parts = s.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const a = parts[0][0] || '';
            const b = parts[1][0] || '';
            return (a + b).toUpperCase();
        }
        return s.slice(0, 2).toUpperCase();
    }

    function chunkSlides(reviews) {
        const capped = (reviews || []).slice(0, MAX_SLIDES * PER_SLIDE);
        const slides = [];
        for (let i = 0; i < capped.length; i += PER_SLIDE) {
            slides.push(capped.slice(i, i + PER_SLIDE));
        }
        return slides.slice(0, MAX_SLIDES);
    }

    /** Карточка в блоке на странице (превью). */
    function cardHtml(r) {
        const t = escapeHtml(r.text || '').replace(/\n/g, '<br>');
        const a = escapeHtml(r.author || '');
        const ini = escapeHtml(authorInitials(r.author));
        return (
            '<article class="review-card group flex h-full min-h-0 min-w-0 flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80 transition-shadow duration-200 hover:shadow-md sm:p-6 md:ring-respo-blue/10">' +
            '<div class="flex min-h-0 min-w-0 gap-3 sm:gap-4">' +
            '<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-respo-blue-light to-cyan-100/80 text-[13px] font-bold tracking-tight text-respo-blue shadow-inner sm:h-12 sm:w-12 sm:text-sm" aria-hidden="true">' +
            ini +
            '</div>' +
            '<div class="flex min-h-0 min-w-0 flex-1 flex-col">' +
            '<p class="min-w-0 flex-1 text-left text-[15px] font-sans leading-[1.65] tracking-[-0.01em] text-respo-dark/85 sm:text-[16px] sm:leading-[1.7] break-words [overflow-wrap:anywhere] [text-wrap:pretty]">' +
            '&laquo;' +
            t +
            '&raquo;' +
            '</p>' +
            '<div class="mt-3 border-t border-respo-blue/12 pt-3 text-[15px] font-medium text-respo-dark sm:mt-4 sm:text-[16px] md:mt-auto md:pt-4">' +
            a +
            '</div>' +
            '</div></div>' +
            '</article>'
        );
    }

    function slidesInnerHtml(slides) {
        return slides
            .map(
                (cards) =>
                    '<div class="reviews-slide box-border min-w-full max-w-full shrink-0 snap-center snap-always px-1 sm:px-2">' +
                    '<div class="grid min-w-0 w-full grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:items-stretch md:gap-6">' +
                    cards.map(cardHtml).join('') +
                    '</div></div>'
            )
            .join('');
    }

    /** Один слайд в модалке — полный текст, крупная типографика. */
    function modalSlideHtml(r, index, total) {
        const t = escapeHtml(r.text || '').replace(/\n/g, '<br>');
        const a = escapeHtml(r.author || '');
        const ini = escapeHtml(authorInitials(r.author));
        const n = index + 1;
        return (
            '<div class="reviews-modal-slide box-border flex min-h-full min-w-full max-w-full shrink-0 snap-center snap-always">' +
            '<div class="flex w-full flex-col justify-center px-4 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12">' +
            '<div class="mx-auto w-full max-w-[40rem]">' +
            '<p class="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-respo-blue/60">' +
            'Отзыв ' +
            n +
            ' из ' +
            total +
            '</p>' +
            '<div class="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-respo-blue-light via-white to-cyan-50 text-lg font-bold text-respo-blue shadow-md ring-1 ring-respo-blue/10" aria-hidden="true">' +
            ini +
            '</div>' +
            '<blockquote class="m-0">' +
            '<p class="text-center text-[17px] font-sans leading-[1.75] text-respo-dark/90 sm:text-[19px] sm:leading-[1.72] md:text-[20px] break-words [overflow-wrap:anywhere] [text-wrap:pretty]">' +
            '&laquo;' +
            t +
            '&raquo;' +
            '</p>' +
            '</blockquote>' +
            '<footer class="mt-10 border-t border-respo-blue/15 pt-6 text-center text-[17px] font-medium text-respo-dark sm:text-[18px]">' +
            a +
            '</footer>' +
            '</div></div></div>'
        );
    }

    function modalTrackHtml(flat) {
        const total = flat.length;
        return flat.map((r, i) => modalSlideHtml(r, i, total)).join('');
    }

    function buildModalToc(tocRoot, flat, setActive) {
        if (!tocRoot) return;
        tocRoot.innerHTML = '';
        flat.forEach((r, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-reviews-toc-index', String(i));
            btn.setAttribute('aria-current', 'false');
            btn.className =
                'reviews-toc-item flex min-w-[min(200px,78vw)] shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors hover:bg-respo-blue-light/80 md:min-w-0 md:w-full';
            btn.innerHTML =
                '<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[11px] font-bold text-respo-blue shadow-sm ring-1 ring-respo-blue/10">' +
                escapeHtml(authorInitials(r.author)) +
                '</span>' +
                '<span class="min-w-0 flex-1 truncate font-medium text-respo-dark">' +
                escapeHtml(r.author || 'Без имени') +
                '</span>';
            btn.addEventListener('click', () => setActive(i));
            tocRoot.appendChild(btn);
        });
    }

    function updateTocActive(tocRoot, index) {
        if (!tocRoot) return;
        tocRoot.querySelectorAll('.reviews-toc-item').forEach((el, i) => {
            const on = i === index;
            el.classList.toggle('bg-respo-blue-light', on);
            el.classList.toggle('ring-1', on);
            el.classList.toggle('ring-respo-blue/25', on);
            el.setAttribute('aria-current', on ? 'true' : 'false');
        });
    }

    function openModal(opts) {
        const {
            modal,
            modalTrack,
            modalDots,
            modalProgress,
            modalToc,
            modalPrev,
            modalNext,
            flatReviews,
            startIndex,
            teardownPrev,
        } = opts;
        if (!modal || !modalTrack) return () => {};
        teardownPrev?.();

        const total = flatReviews.length;
        if (total < 1) return () => {};

        modalTrack.innerHTML = modalTrackHtml(flatReviews);
        modalTrack.className =
            'reviews-scrollbar flex h-full min-h-0 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth touch-pan-x';

        const onIdx = (idx) => {
            if (modalProgress) {
                modalProgress.textContent = 'Отзыв ' + (idx + 1) + ' из ' + total;
            }
            updateTocActive(modalToc, idx);
        };

        const ctrl = bindStrip(modalTrack, modalDots, total, 'pill', 'Отзыв', {
            arrows: modalPrev && modalNext ? { prev: modalPrev, next: modalNext } : null,
            onIndexChange: onIdx,
        });
        buildModalToc(modalToc, flatReviews, (i) => ctrl.goTo(i));

        modal.classList.remove('hidden');
        modal.classList.add('flex', 'items-center', 'justify-center');
        document.body.classList.add('overflow-hidden');

        requestAnimationFrame(() => {
            const w = modalTrack.clientWidth;
            const idx = Math.min(total - 1, Math.max(0, startIndex));
            modalTrack.scrollLeft = idx * w;
            ctrl.syncFromScroll();
            onIdx(idx);
        });

        const ac = new AbortController();
        const { signal } = ac;

        const onKey = (e) => {
            if (modal.classList.contains('hidden')) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                ctrl.goTo(ctrl.getIndex() - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                ctrl.goTo(ctrl.getIndex() + 1);
            }
        };
        document.addEventListener('keydown', onKey, { signal });

        const closeBtn = modal.querySelector('[data-reviews-modal-close]');
        closeBtn?.focus({ preventScroll: true });

        return () => {
            ac.abort();
            ctrl.destroy();
        };
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
        const wrap = root.querySelector('[data-reviews-inline-wrap]');
        const track = root.querySelector('[data-reviews-track]');
        const dotsWrap = root.querySelector('[data-reviews-dots]');
        const emptyEl = root.querySelector('[data-reviews-empty]');
        const btnPrev = root.querySelector('[data-reviews-inline-prev]');
        const btnNext = root.querySelector('[data-reviews-inline-next]');

        const modal = document.getElementById('reviews-gallery-modal');
        const modalTrack = modal ? modal.querySelector('[data-reviews-modal-track]') : null;
        const modalDots = modal ? modal.querySelector('[data-reviews-modal-dots]') : null;
        const modalProgress = modal ? modal.querySelector('[data-reviews-modal-progress]') : null;
        const modalToc = modal ? modal.querySelector('[data-reviews-modal-toc]') : null;
        const modalPrev = modal ? modal.querySelector('[data-reviews-modal-prev]') : null;
        const modalNext = modal ? modal.querySelector('[data-reviews-modal-next]') : null;
        const modalClose = modal ? modal.querySelector('[data-reviews-modal-close]') : null;
        const modalBackdrop = modal ? modal.querySelector('[data-reviews-modal-backdrop]') : null;

        let slides = [];
        let flatReviews = [];
        let slidesHtml = '';
        let modalTeardown = null;

        try {
            const res = await fetch(API);
            if (!res.ok) throw new Error('reviews fetch');
            const data = await res.json();
            flatReviews = (data.reviews || []).slice(0, MAX_SLIDES * PER_SLIDE);
            slides = chunkSlides(flatReviews);
        } catch (e) {
            slides = [];
            flatReviews = [];
        }

        if (slides.length === 0) {
            if (track) track.innerHTML = '';
            if (dotsWrap) dotsWrap.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (moreBtn) moreBtn.setAttribute('hidden', '');
            if (wrap) wrap.classList.add('hidden');
            return;
        }

        if (emptyEl) emptyEl.classList.add('hidden');
        if (moreBtn) moreBtn.removeAttribute('hidden');
        if (wrap) wrap.classList.remove('hidden');

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
            const inlineOpts =
                btnPrev && btnNext ? { arrows: { prev: btnPrev, next: btnNext } } : null;
            bindStrip(track, dotsWrap, slides.length, 'gradient', 'Страница отзывов', inlineOpts);
        }

        let lastPageIndex = 0;
        if (track) {
            track.addEventListener(
                'scroll',
                () => {
                    const w = track.clientWidth;
                    if (w < 1) return;
                    lastPageIndex = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / w)));
                },
                { passive: true }
            );
        }

        if (moreBtn && modal) {
            moreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const startReview = Math.min(flatReviews.length - 1, Math.max(0, lastPageIndex * PER_SLIDE));
                modalTeardown = openModal({
                    modal,
                    modalTrack,
                    modalDots,
                    modalProgress,
                    modalToc,
                    modalPrev,
                    modalNext,
                    flatReviews,
                    startIndex: startReview,
                    teardownPrev: modalTeardown,
                });
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
