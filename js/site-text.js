/**
 * Подставляет тексты с сервера в элементы [data-site-text] и [data-site-text-placeholder].
 * Ключи и значения — в site-text.json (API /api/site-text).
 */
(function () {
    function metaKeysForPath() {
        const raw = (location.pathname || '/').replace(/\/+$/, '') || '/';
        const p = raw.toLowerCase();
        const last = p.split('/').pop() || '';
        if (p.endsWith('/production') || last === 'production' || last === 'production.html')
            return { title: 'page.production.title', desc: 'page.production.description' };
        if (p.endsWith('/product') || last === 'product' || last === 'product.html')
            return { title: 'page.product.title', desc: 'page.product.description' };
        if (p.includes('privacy-policy') || last === 'privacy-policy.html')
            return { title: 'page.privacy.title', desc: 'page.privacy.description' };
        return { title: 'meta.title', desc: 'meta.description' };
    }

    function applyMeta(strings) {
        if (!strings || typeof strings !== 'object') return;
        const { title: tk, desc: dk } = metaKeysForPath();
        const title = strings[tk] || strings['meta.title'];
        if (title) document.title = title;
        const desc = strings[dk] || strings['meta.description'];
        const meta = document.querySelector('meta[name="description"]');
        if (desc && meta) meta.setAttribute('content', desc);
    }

    function applyStrings(strings) {
        if (!strings || typeof strings !== 'object') return;
        document.querySelectorAll('[data-site-text]').forEach((el) => {
            const key = el.getAttribute('data-site-text');
            if (!key || !Object.prototype.hasOwnProperty.call(strings, key)) return;
            el.textContent = strings[key];
        });
        document.querySelectorAll('[data-site-text-placeholder]').forEach((el) => {
            const key = el.getAttribute('data-site-text-placeholder');
            if (!key || !Object.prototype.hasOwnProperty.call(strings, key)) return;
            el.setAttribute('placeholder', strings[key]);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        fetch('/api/site-text')
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const strings = data && data.strings;
                if (!strings || typeof strings !== 'object') return;
                applyMeta(strings);
                applyStrings(strings);
            })
            .catch(() => {});
    });
})();
