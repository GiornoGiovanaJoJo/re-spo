/**
 * RE-SPO — горизонтальная карусель со snap и точками (отзывы, сертификаты).
 */
(function (w) {
    const DOT_ATTR = 'data-carousel-dot';

    function inactiveDotClasses(theme) {
        return theme === 'light'
            ? 'bg-respo-blue/25 opacity-90 hover:opacity-100'
            : 'bg-white opacity-60 hover:opacity-100';
    }

    function setDotsActive(dotsWrap, index, count, theme) {
        if (!dotsWrap) return;
        const t = theme || 'gradient';
        const buttons = dotsWrap.querySelectorAll('button[' + DOT_ATTR + ']');
        buttons.forEach((btn, i) => {
            const on = i === index;
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
            btn.className =
                'w-2.5 h-2.5 rounded-full transition-opacity cursor-pointer shrink-0 ' +
                (on ? 'bg-respo-blue opacity-100' : inactiveDotClasses(t));
        });
    }

    function buildDots(dotsWrap, count, goTo, theme, ariaPageLabel) {
        if (!dotsWrap || count < 1) return;
        const t = theme || 'gradient';
        const label = ariaPageLabel || 'Страница';
        dotsWrap.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute(DOT_ATTR, String(i));
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-label', label + ' ' + (i + 1));
            btn.className =
                'w-2.5 h-2.5 rounded-full transition-opacity cursor-pointer shrink-0 ' +
                (i === 0 ? 'bg-respo-blue opacity-100' : inactiveDotClasses(t));
            btn.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(btn);
        }
    }

    /**
     * @param {HTMLElement} track
     * @param {HTMLElement|null} dotsWrap
     * @param {number} slideCount
     * @param {'light'|'gradient'} [dotsTheme]
     * @param {string} [ariaPageLabel]
     * @param {{ arrows?: { prev: HTMLElement, next: HTMLElement } }|null} [opts]
     */
    function bind(track, dotsWrap, slideCount, dotsTheme, ariaPageLabel, opts) {
        if (!track || slideCount < 1) {
            return {
                goTo() {},
                syncFromScroll() {},
                destroy() {},
            };
        }

        const ac = new AbortController();
        const signal = ac.signal;
        let scrollRaf = null;
        const theme = dotsTheme || 'gradient';
        const arrows = opts && opts.arrows;

        function currentIndex() {
            const cw = track.clientWidth;
            if (cw < 1) return 0;
            return Math.min(slideCount - 1, Math.max(0, Math.round(track.scrollLeft / cw)));
        }

        function updateArrows(idx) {
            if (!arrows) return;
            if (arrows.prev) {
                const dis = idx <= 0;
                arrows.prev.disabled = dis;
                arrows.prev.setAttribute('aria-disabled', dis ? 'true' : 'false');
            }
            if (arrows.next) {
                const dis = idx >= slideCount - 1;
                arrows.next.disabled = dis;
                arrows.next.setAttribute('aria-disabled', dis ? 'true' : 'false');
            }
        }

        const syncFromScroll = () => {
            const cw = track.clientWidth;
            if (cw < 1) return;
            const idx = Math.min(slideCount - 1, Math.max(0, Math.round(track.scrollLeft / cw)));
            setDotsActive(dotsWrap, idx, slideCount, theme);
            updateArrows(idx);
        };

        const onScroll = () => {
            if (scrollRaf) cancelAnimationFrame(scrollRaf);
            scrollRaf = requestAnimationFrame(syncFromScroll);
        };

        track.addEventListener('scroll', onScroll, { passive: true, signal });

        function goTo(i) {
            const cw = track.clientWidth;
            const idx = Math.min(slideCount - 1, Math.max(0, i));
            track.scrollTo({ left: idx * cw, behavior: 'smooth' });
            setDotsActive(dotsWrap, idx, slideCount, theme);
            updateArrows(idx);
        }

        buildDots(dotsWrap, slideCount, goTo, theme, ariaPageLabel);
        syncFromScroll();

        if (arrows && arrows.prev) {
            arrows.prev.addEventListener(
                'click',
                () => {
                    goTo(currentIndex() - 1);
                },
                { signal }
            );
        }
        if (arrows && arrows.next) {
            arrows.next.addEventListener(
                'click',
                () => {
                    goTo(currentIndex() + 1);
                },
                { signal }
            );
        }

        const onResize = () => {
            const cw = track.clientWidth;
            if (cw < 1) return;
            const idx = Math.min(slideCount - 1, Math.max(0, Math.round(track.scrollLeft / cw)));
            track.scrollLeft = idx * cw;
            syncFromScroll();
        };
        window.addEventListener('resize', onResize, { signal });

        return {
            goTo,
            syncFromScroll,
            destroy() {
                ac.abort();
            },
        };
    }

    w.RespoCarouselStrip = { bind, setDotsActive, inactiveDotClasses };
})(typeof window !== 'undefined' ? window : globalThis);
