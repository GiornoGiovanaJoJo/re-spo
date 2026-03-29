/**
 * Форма обратной связи → POST /api/contact (JSON).
 * Опционально: Yandex SmartCaptcha — задайте на <form> атрибут data-yandex-smartcaptcha-sitekey="ваш_ключ_клиента".
 */
(function () {
    const ENDPOINT = '/api/contact';

    function getSiteKey(form) {
        const raw = form.getAttribute('data-yandex-smartcaptcha-sitekey');
        return raw && String(raw).trim() ? String(raw).trim() : '';
    }

    function setStatus(form, type, message) {
        const el = form.querySelector('[data-contact-status]');
        if (!el) return;
        el.textContent = message || '';
        el.classList.remove('hidden', 'text-emerald-700', 'text-red-600', 'text-amber-800');
        if (!message) {
            el.classList.add('hidden');
            return;
        }
        el.classList.remove('hidden');
        if (type === 'success') el.classList.add('text-emerald-700');
        else if (type === 'error') el.classList.add('text-red-600');
        else el.classList.add('text-amber-800');
    }

    function setSubmitting(form, btn, loading) {
        if (!btn) return;
        btn.disabled = loading;
        btn.setAttribute('aria-busy', loading ? 'true' : 'false');
        if (loading) {
            if (!btn.dataset.contactLabelOriginal) btn.dataset.contactLabelOriginal = btn.textContent.trim();
            btn.textContent = 'Отправка…';
        } else if (btn.dataset.contactLabelOriginal) {
            btn.textContent = btn.dataset.contactLabelOriginal;
        }
    }

    function loadCaptchaScript() {
        if (document.querySelector('script[data-yandex-smartcaptcha-sdk]')) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://smartcaptcha.yandexcloud.net/captcha.js?render=onload&onload=__respoSmartCaptchaOnLoad';
            s.async = true;
            s.defer = true;
            s.setAttribute('data-yandex-smartcaptcha-sdk', '1');
            s.onerror = () => reject(new Error('captcha script'));
            window.__respoSmartCaptchaOnLoad = function () {
                resolve();
            };
            document.head.appendChild(s);
        });
    }

    async function ensureWidget(form, siteKey) {
        const host = form.querySelector('[data-contact-captcha-host]');
        if (!host) return null;
        host.classList.remove('hidden');
        await loadCaptchaScript();
        if (typeof window.smartCaptcha === 'undefined' || !window.smartCaptcha.render) {
            console.warn('SmartCaptcha SDK не загрузился');
            return null;
        }
        if (host.dataset.rendered === '1') return host;
        const id = window.smartCaptcha.render(host, {
            sitekey: siteKey,
            hl: 'ru'
        });
        host.dataset.widgetId = String(id);
        host.dataset.rendered = '1';
        return host;
    }

    function getCaptchaToken(form, siteKey) {
        if (!siteKey) return '';
        const host = form.querySelector('[data-contact-captcha-host]');
        if (!host || host.dataset.rendered !== '1') return '';
        const wid = Number(host.dataset.widgetId);
        if (!wid || typeof window.smartCaptcha === 'undefined') return '';
        try {
            return window.smartCaptcha.getResponse(wid) || '';
        } catch (e) {
            return '';
        }
    }

    async function handleSubmit(form, ev) {
        ev.preventDefault();
        const btn = form.querySelector('[data-contact-submit]');
        const siteKey = getSiteKey(form);

        const honeypot = form.querySelector('input[name="website"]');
        if (honeypot && honeypot.value && honeypot.value.trim()) {
            setStatus(form, 'success', 'Спасибо! Мы свяжемся с вами.');
            form.reset();
            return;
        }

        const name = (form.querySelector('[name="name"]') || {}).value;
        const phone = (form.querySelector('[name="phone"]') || {}).value;
        const email = (form.querySelector('[name="email"]') || {}).value;

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        setStatus(form, '', '');
        setSubmitting(form, btn, true);

        try {
            if (siteKey) {
                await ensureWidget(form, siteKey);
            }
            const smartToken = getCaptchaToken(form, siteKey);
            if (siteKey && !smartToken) {
                setStatus(form, 'error', 'Подтвердите, что вы не робот.');
                setSubmitting(form, btn, false);
                return;
            }

            const res = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    name: String(name || '').trim(),
                    phone: String(phone || '').trim(),
                    email: String(email || '').trim(),
                    smartToken: smartToken || undefined
                })
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                setStatus(form, 'success', data.message || 'Спасибо! Заявка отправлена.');
                form.reset();
                if (siteKey && typeof window.smartCaptcha !== 'undefined') {
                    const host = form.querySelector('[data-contact-captcha-host]');
                    if (host && host.dataset.widgetId) {
                        try {
                            window.smartCaptcha.reset(Number(host.dataset.widgetId));
                        } catch (e) { /* ignore */ }
                    }
                }
            } else {
                setStatus(form, 'error', data.error || 'Не удалось отправить. Попробуйте позже или позвоните нам.');
            }
        } catch (e) {
            setStatus(form, 'error', 'Ошибка сети. Проверьте подключение или позвоните нам.');
        } finally {
            setSubmitting(form, btn, false);
        }
    }

    function bindForm(form) {
        if (form.dataset.contactBound === '1') return;
        form.dataset.contactBound = '1';
        form.addEventListener('submit', (ev) => handleSubmit(form, ev));
        const siteKey = getSiteKey(form);
        if (siteKey) {
            loadCaptchaScript().catch(() => {});
        }
    }

    function init() {
        document.querySelectorAll('form[data-contact-form]').forEach(bindForm);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
