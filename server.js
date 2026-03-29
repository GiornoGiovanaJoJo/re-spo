// =====================================================
// RE-SPO — Express Server (production hardened)
// =====================================================

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
if (process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
}
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const assetsDir = path.join(__dirname, 'assets');
const productsFile = path.join(__dirname, 'products.json');
const certificatesFile = path.join(__dirname, 'certificates.json');
const reviewsFile = path.join(__dirname, 'reviews.json');
const homeContentFile = path.join(__dirname, 'home-content.json');
const siteTextFile = path.join(__dirname, 'site-text.json');
const adminConfigFile = path.join(__dirname, 'admin-config.json');
const adminSessionSecretFile = path.join(__dirname, '.admin-session-secret');
const DEFAULT_ADMIN_KEY = 'AlexErmakov2026';
const ADMIN_COOKIE_NAME = 'respo_admin_sess';
const ADMIN_SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const ADMIN_KEY_MAX_LEN = 400;
const IMAGE_EXT_RE = /\.(png|svg|jpe?g|gif|webp|tiff?)$/i;
const DEFAULT_SITE_URL = 'https://re-spo.com';

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

function safeImageFilename(input) {
    if (typeof input !== 'string') return null;
    const cleaned = path.basename(input).trim();
    if (!cleaned || cleaned.includes('..') || cleaned.includes('/') || cleaned.includes('\\')) return null;
    if (!IMAGE_EXT_RE.test(cleaned)) return null;
    if (!/^[a-zA-Z0-9._\-()%\s]+$/.test(cleaned)) return null;
    return cleaned;
}

/** Basename from original upload name, safe for assets/ and server validation. */
function normalizeUploadBasename(original) {
    const raw = String(original || '').trim();
    const base = path.basename(raw) || 'image.png';
    const parsedExt = path.extname(base);
    let ext = parsedExt.toLowerCase();
    if (!IMAGE_EXT_RE.test(ext)) {
        ext = '.png';
    }
    const stem = parsedExt ? path.basename(base, parsedExt) : base;
    const sanitizedStem = stem
        .replace(/[^a-zA-Z0-9._\-()%\s]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^[\s._\-()]+|[\s._\-()]+$/g, '');
    const candidate = (sanitizedStem || 'image') + ext;
    return safeImageFilename(candidate);
}

const PRODUCT_PLACEHOLDER_PATH = 'assets/product_placeholder.png';
const PRODUCT_PLACEHOLDER_BASENAME = 'product_placeholder.png';

const CATEGORY_ID_RE = /^[a-z][a-z0-9_]{0,63}$/;
const CATEGORY_CATALOG_MODES = new Set(['list', 'grid', 'carousel']);
const CATEGORY_LIST_STYLES = new Set(['accordion', 'simple']);
const CATEGORY_CARD_STYLES = new Set(['default', 'valve', 'exchanger']);
const CATEGORY_GRID_COLS = new Set([2, 3, 4]);
const CATEGORY_LABEL_KEYS = ['specsHeading', 'paramLabelCol', 'paramValueCol'];
const CATEGORY_FIELD_KEYS = ['description', 'specs', 'parameters', 'gallery'];

function validateProductsPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (!Array.isArray(payload.categories) || !Array.isArray(payload.products)) return false;

    const categoryIds = new Set();
    for (const c of payload.categories) {
        if (!c || typeof c !== 'object') return false;
        if (typeof c.id !== 'string' || !c.id.trim()) return false;
        if (!CATEGORY_ID_RE.test(c.id.trim())) return false;
        if (typeof c.name !== 'string' || !c.name.trim()) return false;
        if (c.name.length > 200) return false;
        if (c.display !== undefined) {
            if (typeof c.display !== 'string' || !['list', 'grid'].includes(c.display)) return false;
        }
        if (c.catalogMode !== undefined && !CATEGORY_CATALOG_MODES.has(c.catalogMode)) return false;
        if (c.listStyle !== undefined && !CATEGORY_LIST_STYLES.has(c.listStyle)) return false;
        if (c.cardStyle !== undefined && !CATEGORY_CARD_STYLES.has(c.cardStyle)) return false;
        if (c.gridCols !== undefined) {
            const gc = Number(c.gridCols);
            if (!Number.isInteger(gc) || !CATEGORY_GRID_COLS.has(gc)) return false;
        }
        if (c.showCounter !== undefined && typeof c.showCounter !== 'boolean') return false;
        if (c.sortOrder !== undefined) {
            if (typeof c.sortOrder !== 'number' || !Number.isFinite(c.sortOrder)) return false;
        }
        if (c.fields !== undefined) {
            if (!c.fields || typeof c.fields !== 'object' || Array.isArray(c.fields)) return false;
            for (const k of CATEGORY_FIELD_KEYS) {
                if (c.fields[k] !== undefined && typeof c.fields[k] !== 'boolean') return false;
            }
        }
        if (c.labels !== undefined) {
            if (!c.labels || typeof c.labels !== 'object' || Array.isArray(c.labels)) return false;
            for (const k of CATEGORY_LABEL_KEYS) {
                const v = c.labels[k];
                if (v !== undefined && (typeof v !== 'string' || v.length > 200)) return false;
            }
        }
        categoryIds.add(c.id);
    }

    for (const p of payload.products) {
        if (!p || typeof p !== 'object') return false;
        if (typeof p.id !== 'string' || !p.id.trim()) return false;
        if (typeof p.name !== 'string' || !p.name.trim()) return false;
        if (typeof p.category !== 'string' || !p.category.trim()) return false;
        if (typeof p.image !== 'string' || !p.image.trim()) return false;
        if (typeof p.link !== 'string' || !p.link.trim()) return false;

        const imageName = safeImageFilename(p.image.replace(/^assets\//, ''));
        if (!imageName) return false;
        if (p.images !== undefined) {
            if (!Array.isArray(p.images) || p.images.length === 0) return false;
            for (const im of p.images) {
                if (typeof im !== 'string' || !im.trim()) return false;
                const extra = safeImageFilename(im.replace(/^assets\//, ''));
                if (!extra) return false;
            }
        }
        if (p.parameters !== undefined) {
            if (!Array.isArray(p.parameters)) return false;
            for (const row of p.parameters) {
                if (!row || typeof row !== 'object') return false;
                if (typeof row.label !== 'string' || !row.label.trim()) return false;
                if (typeof row.value !== 'string' || !row.value.trim()) return false;
            }
        }
        if (payload.categories.length > 0 && !categoryIds.has(p.category)) return false;
    }
    return true;
}

function validateCertificatesPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (!Array.isArray(payload.certificates)) return false;

    for (const cert of payload.certificates) {
        if (!cert || typeof cert !== 'object') return false;
        if (typeof cert.id !== 'string' || !cert.id.trim()) return false;
        if (typeof cert.title !== 'string' || !cert.title.trim()) return false;
        if (typeof cert.description !== 'string' || !cert.description.trim()) return false;
        if (cert.image !== undefined && cert.image !== null && cert.image !== '') {
            if (typeof cert.image !== 'string') return false;
            const imageName = safeImageFilename(cert.image.replace(/^assets\//, ''));
            if (!imageName) return false;
        }
    }
    return true;
}

const REVIEW_TEXT_MAX = 8000;
const REVIEW_AUTHOR_MAX = 200;
const REVIEWS_MAX_COUNT = 8;

function validateReviewsPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (!Array.isArray(payload.reviews)) return false;
    if (payload.reviews.length > REVIEWS_MAX_COUNT) return false;

    const seen = new Set();
    for (const r of payload.reviews) {
        if (!r || typeof r !== 'object') return false;
        if (typeof r.id !== 'string' || !r.id.trim()) return false;
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        if (typeof r.text !== 'string' || !r.text.trim()) return false;
        if (typeof r.author !== 'string' || !r.author.trim()) return false;
        if (r.text.length > REVIEW_TEXT_MAX) return false;
        if (r.author.length > REVIEW_AUTHOR_MAX) return false;
    }
    return true;
}

const HOME_TECH_TILE_COUNT = 4;
const HOME_TECH_TILE_MAX_LEN = 400;

function validateHomeContentPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (!Array.isArray(payload.technologyTiles)) return false;
    if (payload.technologyTiles.length !== HOME_TECH_TILE_COUNT) return false;
    for (const t of payload.technologyTiles) {
        if (typeof t !== 'string' || !t.trim()) return false;
        if (t.length > HOME_TECH_TILE_MAX_LEN) return false;
    }
    return true;
}

const SITE_TEXT_KEY_RE = /^[a-z][a-z0-9_.-]{0,100}$/i;
const SITE_TEXT_MAX_KEYS = 900;
const SITE_TEXT_MAX_VALUE_LEN = 15000;

function validateSiteTextPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    const s = payload.strings;
    if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
    const keys = Object.keys(s);
    if (keys.length > SITE_TEXT_MAX_KEYS) return false;
    for (const k of keys) {
        if (!SITE_TEXT_KEY_RE.test(k)) return false;
        if (typeof s[k] !== 'string' || s[k].length > SITE_TEXT_MAX_VALUE_LEN) return false;
    }
    return true;
}

const CONTACT_MAIL_TO_DEFAULT = 'info@re-spo.com';
const CONTACT_NAME_MAX = 200;
const CONTACT_PHONE_MAX = 80;
const CONTACT_EMAIL_MAX = 200;
const CONTACT_RATE_WINDOW_MS = 15 * 60 * 1000;
const CONTACT_RATE_MAX = 10;
const CONTACT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactRateByIp = new Map();

function getClientIp(req) {
    const xf = req.headers['x-forwarded-for'];
    if (typeof xf === 'string' && xf.trim()) {
        return xf.split(',')[0].trim().slice(0, 64);
    }
    const raw = req.socket?.remoteAddress || '';
    return String(raw).replace(/^::ffff:/, '').slice(0, 64);
}

function contactRateAllow(ip) {
    const safeIp = ip || 'unknown';
    const now = Date.now();
    const list = contactRateByIp.get(safeIp) || [];
    const fresh = list.filter((t) => now - t < CONTACT_RATE_WINDOW_MS);
    if (fresh.length >= CONTACT_RATE_MAX) return false;
    fresh.push(now);
    contactRateByIp.set(safeIp, fresh);
    return true;
}

function escapeHtmlContact(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function verifySmartCaptcha(token, ip) {
    const secret = process.env.YANDEX_SMARTCAPTCHA_SECRET;
    if (!secret || !String(secret).trim()) {
        return { ok: true };
    }
    if (!token || !String(token).trim()) {
        return { ok: false, code: 'captcha' };
    }
    const params = new URLSearchParams({
        secret: String(secret).trim(),
        token: String(token).trim(),
        ip: ip || ''
    });
    try {
        const res = await fetch('https://smartcaptcha.yandexcloud.net/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === 'ok') return { ok: true };
        return { ok: false, code: 'captcha' };
    } catch (e) {
        return { ok: false, code: 'captcha_verify_error' };
    }
}

async function sendContactEmail({ name, phone, email }) {
    const user = process.env.CONTACT_SMTP_USER;
    const pass = process.env.CONTACT_SMTP_PASS;
    const toRaw = (process.env.CONTACT_MAIL_TO || CONTACT_MAIL_TO_DEFAULT).trim();
    if (!user || !pass) {
        return { ok: false, error: 'CONTACT_SMTP_USER / CONTACT_SMTP_PASS not set' };
    }

    const host = process.env.CONTACT_SMTP_HOST || 'smtp.yandex.ru';
    const port = Number(process.env.CONTACT_SMTP_PORT || 465);
    const secure = process.env.CONTACT_SMTP_SECURE !== 'false' && port === 465;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });

    const safeName = name.slice(0, CONTACT_NAME_MAX);
    const safePhone = phone.slice(0, CONTACT_PHONE_MAX);
    const safeEmail = email.slice(0, CONTACT_EMAIL_MAX);

    await transporter.sendMail({
        from: `"RE-SPO сайт" <${user}>`,
        to: toRaw,
        replyTo: safeEmail,
        subject: `Заявка с сайта: ${safeName}`,
        text: `Имя: ${safeName}\nТелефон: ${safePhone}\nEmail: ${safeEmail}\n`,
        html: `<p><b>Имя:</b> ${escapeHtmlContact(safeName)}</p><p><b>Телефон:</b> ${escapeHtmlContact(
            safePhone
        )}</p><p><b>Email:</b> ${escapeHtmlContact(safeEmail)}</p>`
    });
    return { ok: true };
}

function getPublicSiteUrl(req) {
    const envSiteUrl = String(process.env.SITE_URL || '').trim();
    const origin = envSiteUrl || `${req.protocol}://${req.get('host')}` || DEFAULT_SITE_URL;
    return origin.replace(/\/+$/, '');
}

function buildProductsSitemapXml(siteUrl, payload) {
    const products = Array.isArray(payload?.products) ? payload.products : [];
    const entries = products
        .filter((p) => p && typeof p.id === 'string' && p.id.trim())
        .map((p) => {
            const id = encodeURIComponent(String(p.id).trim());
            return `  <url>
    <loc>${siteUrl}/product?id=${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

function readAdminKey() {
    try {
        if (!fs.existsSync(adminConfigFile)) {
            fs.writeFileSync(
                adminConfigFile,
                JSON.stringify({ adminKey: DEFAULT_ADMIN_KEY }, null, 2),
                'utf8'
            );
            return DEFAULT_ADMIN_KEY;
        }
        const raw = JSON.parse(fs.readFileSync(adminConfigFile, 'utf8'));
        const k = typeof raw.adminKey === 'string' ? raw.adminKey : '';
        if (!k || k.length > ADMIN_KEY_MAX_LEN) {
            return DEFAULT_ADMIN_KEY;
        }
        return k;
    } catch (e) {
        return DEFAULT_ADMIN_KEY;
    }
}

function writeAdminKeyFile(newKey) {
    let base = {};
    try {
        if (fs.existsSync(adminConfigFile)) {
            base = JSON.parse(fs.readFileSync(adminConfigFile, 'utf8'));
        }
    } catch (e) {
        base = {};
    }
    base.adminKey = newKey;
    fs.writeFileSync(adminConfigFile, JSON.stringify(base, null, 2), 'utf8');
}

function getAdminSessionSecret() {
    const env = String(process.env.ADMIN_SESSION_SECRET || '').trim();
    if (env) return env;
    try {
        if (fs.existsSync(adminSessionSecretFile)) {
            return fs.readFileSync(adminSessionSecretFile, 'utf8').trim();
        }
        const s = crypto.randomBytes(32).toString('hex');
        fs.writeFileSync(adminSessionSecretFile, s, 'utf8');
        return s;
    } catch (e) {
        return 'insecure-dev-admin-session-secret-change-me';
    }
}

function parseCookieHeader(req) {
    const h = req.headers.cookie || '';
    const out = {};
    h.split(';').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return;
        const name = part.slice(0, idx).trim();
        let val = part.slice(idx + 1).trim();
        try {
            val = decodeURIComponent(val);
        } catch (e) {
            /* keep raw */
        }
        out[name] = val;
    });
    return out;
}

function signAdminSessionToken() {
    const exp = Date.now() + ADMIN_SESSION_MS;
    const payload = Buffer.from(JSON.stringify({ exp, v: 1 }), 'utf8').toString('base64url');
    const sig = crypto.createHmac('sha256', getAdminSessionSecret()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

function verifyAdminSessionCookie(req) {
    const raw = parseCookieHeader(req)[ADMIN_COOKIE_NAME];
    if (!raw || typeof raw !== 'string') return false;
    const dot = raw.lastIndexOf('.');
    if (dot <= 0) return false;
    const payloadB64 = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = crypto.createHmac('sha256', getAdminSessionSecret()).update(payloadB64).digest('base64url');
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;
    try {
        const json = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
        if (!json.exp || Date.now() > json.exp) return false;
        return true;
    } catch (e) {
        return false;
    }
}

function timingSafeAdminKeyEqual(input, stored) {
    const a = Buffer.from(String(input), 'utf8');
    const s = Buffer.from(String(stored), 'utf8');
    if (a.length !== s.length) return false;
    return crypto.timingSafeEqual(a, s);
}

function cookieSecureFlag(req) {
    if (process.env.ADMIN_COOKIE_SECURE === '0') return false;
    if (process.env.ADMIN_COOKIE_SECURE === '1') return true;
    return Boolean(req.secure);
}

function buildAdminSessionSetCookie(token, req) {
    const maxAge = Math.floor(ADMIN_SESSION_MS / 1000);
    const parts = [
        `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${maxAge}`
    ];
    if (cookieSecureFlag(req)) parts.push('Secure');
    return parts.join('; ');
}

function buildAdminSessionClearCookie(req) {
    const parts = [`${ADMIN_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
    if (cookieSecureFlag(req)) parts.push('Secure');
    return parts.join('; ');
}

function adminAuth(req, res, next) {
    if (verifyAdminSessionCookie(req)) {
        return next();
    }
    return res.status(401).json({ error: 'Требуется вход в админку', code: 'ADMIN_AUTH_REQUIRED' });
}

const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.tailwindcss.com',
        'https://mc.yandex.ru',
        'https://yastatic.net',
        'https://smartcaptcha.yandexcloud.net'
    ],
    styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://fonts.cdnfonts.com',
        'https://db.onlinewebfonts.com'
    ],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://mc.yandex.ru', 'wss://mc.yandex.ru', 'https://smartcaptcha.yandexcloud.net'],
    frameSrc: ["'self'", 'https://mc.yandex.ru', 'https://smartcaptcha.yandexcloud.net'],
    fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://fonts.cdnfonts.com',
        'https://db.onlinewebfonts.com'
    ],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"]
};

app.use(helmet({
    contentSecurityPolicy: { directives: cspDirectives },
    crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use('/api', (req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    next();
});

app.get('/api/admin/session', (req, res) => {
    res.json({ authenticated: verifyAdminSessionCookie(req) });
});

app.post('/api/admin/login', (req, res) => {
    const key = req.body && typeof req.body.key === 'string' ? req.body.key : '';
    if (!timingSafeAdminKeyEqual(key, readAdminKey())) {
        return res.status(401).json({ error: 'Неверный ключ' });
    }
    const token = signAdminSessionToken();
    res.setHeader('Set-Cookie', buildAdminSessionSetCookie(token, req));
    return res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
    res.setHeader('Set-Cookie', buildAdminSessionClearCookie(req));
    res.json({ ok: true });
});

app.post('/api/admin/change-key', adminAuth, (req, res) => {
    const newKey = req.body && typeof req.body.newKey === 'string' ? req.body.newKey.trim() : '';
    if (newKey.length < 6 || newKey.length > ADMIN_KEY_MAX_LEN) {
        return res.status(400).json({ error: 'Ключ: от 6 до 400 символов' });
    }
    try {
        writeAdminKeyFile(newKey);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/assets/product_placeholder.png', (req, res, next) => {
    const filepath = path.join(assetsDir, 'product_placeholder.png');
    if (fs.existsSync(filepath)) return next();

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <rect width="1200" height="1200" fill="#F3F4F6"/>
  <rect x="120" y="120" width="960" height="960" fill="none" stroke="#D1D5DB" stroke-width="8"/>
  <g fill="#9CA3AF">
    <circle cx="460" cy="460" r="56"/>
    <path d="M240 900l240-260 180 200 120-140 180 200H240z"/>
  </g>
</svg>`.trim();

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(svg);
});

app.use('/assets', express.static(assetsDir, {
    maxAge: '7d',
    etag: true,
    setHeaders: (res, filePath) => {
        if (/\.(png|svg|jpe?g|gif|webp|tiff?)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }
    }
}));
app.use('/css', express.static(path.join(__dirname, 'css'), {
    maxAge: '7d',
    etag: true,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
}));
app.use('/js', express.static(path.join(__dirname, 'js'), {
    maxAge: '7d',
    etag: true,
    setHeaders: (res) => res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
}));
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '7d', etag: true }));

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, assetsDir),
        filename: (req, file, cb) => {
            const bodyTf = typeof req.body?.targetFilename === 'string' ? req.body.targetFilename.trim() : '';
            let requested = bodyTf ? safeImageFilename(bodyTf) : null;
            if (!requested) {
                requested = normalizeUploadBasename(file.originalname);
            }
            if (!requested) return cb(new Error('Invalid target filename'));
            const fp = path.join(assetsDir, requested);
            try {
                if (fs.existsSync(fp) && fs.lstatSync(fp).isFile()) {
                    fs.unlinkSync(fp);
                }
            } catch (e) {
                return cb(e);
            }
            cb(null, requested);
        }
    }),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const byMime = /^image\/(png|jpeg|jpg|gif|svg\+xml|webp|tiff)$/i.test(file.mimetype);
        const byExt = IMAGE_EXT_RE.test(file.originalname);
        cb(null, byMime && byExt);
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/production', (req, res) => res.sendFile(path.join(__dirname, 'production.html')));
app.get('/product', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));
app.get('/privacy-policy', (req, res) => res.sendFile(path.join(__dirname, 'privacy-policy.html')));
app.get('/admin', (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.sendFile(path.join(__dirname, 'admin.html'));
});
app.get('/robots.txt', (req, res) => res.sendFile(path.join(__dirname, 'robots.txt')));
app.get('/sitemap.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap.xml')));
app.get('/sitemap-static.xml', (req, res) => res.sendFile(path.join(__dirname, 'sitemap-static.xml')));
app.get('/sitemap-products.xml', (req, res) => {
    try {
        const siteUrl = getPublicSiteUrl(req);
        const raw = fs.existsSync(productsFile) ? fs.readFileSync(productsFile, 'utf8') : '{"products":[]}';
        const parsed = JSON.parse(raw);
        if (!validateProductsPayload(parsed)) {
            return res.status(500).send('Invalid products payload for sitemap');
        }
        const xml = buildProductsSitemapXml(siteUrl, parsed);
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    } catch (e) {
        res.status(500).send('Failed to generate products sitemap');
    }
});

function redirectToCanonicalPath(req, res, targetPath) {
    const q = req.url.indexOf('?');
    const search = q >= 0 ? req.url.slice(q) : '';
    res.redirect(301, targetPath + search);
}

app.get('/index.html', (req, res) => redirectToCanonicalPath(req, res, '/'));
app.get('/production.html', (req, res) => redirectToCanonicalPath(req, res, '/production'));
app.get('/product.html', (req, res) => redirectToCanonicalPath(req, res, '/product'));
app.get('/privacy-policy.html', (req, res) => redirectToCanonicalPath(req, res, '/privacy-policy'));
app.get('/favicon.ico', (req, res) => {
    const icoPath = path.join(assetsDir, 'favicon.ico');
    const svgPath = path.join(assetsDir, 'favicon.svg');
    if (fs.existsSync(icoPath)) {
        res.setHeader('Content-Type', 'image/x-icon');
        return res.sendFile(icoPath);
    }
    if (fs.existsSync(svgPath)) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.sendFile(svgPath);
    }
    const legacyPath = path.join(assetsDir, 'logo.png');
    if (fs.existsSync(legacyPath)) {
        res.setHeader('Content-Type', 'image/png');
        return res.sendFile(legacyPath);
    }
    return res.status(204).end();
});

app.get('/api/products', (req, res) => {
    try {
        if (!fs.existsSync(productsFile)) {
            return res.json({ categories: [], products: [] });
        }
        const data = fs.readFileSync(productsFile, 'utf8');
        const parsed = JSON.parse(data);
        if (!validateProductsPayload(parsed)) {
            return res.status(500).json({ error: 'products.json has invalid structure' });
        }
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/products', adminAuth, (req, res) => {
    try {
        if (!validateProductsPayload(req.body)) {
            return res.status(400).json({ error: 'Invalid products payload schema' });
        }
        const data = JSON.stringify(req.body, null, 2);
        fs.writeFileSync(productsFile, data, 'utf8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/certificates', (req, res) => {
    try {
        if (!fs.existsSync(certificatesFile)) {
            return res.json({ certificates: [] });
        }
        const data = fs.readFileSync(certificatesFile, 'utf8');
        const parsed = JSON.parse(data);
        if (!validateCertificatesPayload(parsed)) {
            return res.status(500).json({ error: 'certificates.json has invalid structure' });
        }
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/certificates', adminAuth, (req, res) => {
    try {
        if (!validateCertificatesPayload(req.body)) {
            return res.status(400).json({ error: 'Invalid certificates payload schema' });
        }
        const data = JSON.stringify(req.body, null, 2);
        fs.writeFileSync(certificatesFile, data, 'utf8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/reviews', (req, res) => {
    try {
        if (!fs.existsSync(reviewsFile)) {
            return res.json({ reviews: [] });
        }
        const data = fs.readFileSync(reviewsFile, 'utf8');
        const parsed = JSON.parse(data);
        if (!validateReviewsPayload(parsed)) {
            return res.status(500).json({ error: 'reviews.json has invalid structure' });
        }
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/reviews', adminAuth, (req, res) => {
    try {
        if (!validateReviewsPayload(req.body)) {
            return res.status(400).json({
                error: `Invalid reviews payload (max ${REVIEWS_MAX_COUNT} отзывов, текст до ${REVIEW_TEXT_MAX} символов).`,
            });
        }
        const data = JSON.stringify(req.body, null, 2);
        fs.writeFileSync(reviewsFile, data, 'utf8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/home-content', (req, res) => {
    try {
        if (!fs.existsSync(homeContentFile)) {
            return res.json({
                technologyTiles: [
                    'Молочные линии',
                    'Асептический разлив',
                    'СИП-станции',
                    'Модернизация цехов'
                ]
            });
        }
        const data = fs.readFileSync(homeContentFile, 'utf8');
        const parsed = JSON.parse(data);
        if (!validateHomeContentPayload(parsed)) {
            return res.status(500).json({ error: 'home-content.json has invalid structure' });
        }
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/home-content', adminAuth, (req, res) => {
    try {
        if (!validateHomeContentPayload(req.body)) {
            return res.status(400).json({
                error: `Invalid home content: need exactly ${HOME_TECH_TILE_COUNT} non-empty texts (max ${HOME_TECH_TILE_MAX_LEN} chars each)`
            });
        }
        const data = JSON.stringify(req.body, null, 2);
        fs.writeFileSync(homeContentFile, data, 'utf8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/site-text', (req, res) => {
    try {
        if (!fs.existsSync(siteTextFile)) {
            return res.json({ strings: {} });
        }
        const raw = fs.readFileSync(siteTextFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (!validateSiteTextPayload(parsed)) {
            return res.status(500).json({ error: 'site-text.json has invalid structure' });
        }
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/site-text', adminAuth, (req, res) => {
    try {
        if (!validateSiteTextPayload(req.body)) {
            return res.status(400).json({
                error: 'Invalid site-text: need { strings: { key: "value", ... } }, safe keys, max value length'
            });
        }
        fs.writeFileSync(siteTextFile, JSON.stringify(req.body, null, 2), 'utf8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/required-images', adminAuth, (req, res) => {
    try {
        const pages = ['index.html', 'production.html', 'product.html', 'admin.html']
            .map(name => path.join(__dirname, name))
            .filter(fp => fs.existsSync(fp));

        const required = new Set();
        const regex = /src=["']assets\/([^"']+\.(png|svg|jpe?g|gif|webp|tiff?))["']/ig;

        for (const page of pages) {
            const html = fs.readFileSync(page, 'utf8');
            let match;
            while ((match = regex.exec(html)) !== null) {
                const cleaned = safeImageFilename(decodeURIComponent(match[1]));
                if (cleaned) required.add(cleaned);
            }
        }

        const images = Array.from(required).map((filename) => {
            const filepath = path.join(assetsDir, filename);
            return { filename, exists: fs.existsSync(filepath) };
        });

        res.json(images);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/upload', adminAuth, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Failed to upload' });
    res.json({ success: true, filename: req.file.filename });
});

app.post('/api/clear-section-images', adminAuth, (req, res) => {
    try {
        const section = req.body?.section;
        if (section === 'products') {
            if (!fs.existsSync(productsFile)) {
                return res.status(404).json({ error: 'products.json not found' });
            }
            const raw = fs.readFileSync(productsFile, 'utf8');
            const parsed = JSON.parse(raw);
            if (!validateProductsPayload(parsed)) {
                return res.status(500).json({ error: 'Invalid products.json' });
            }
            const toDelete = new Set();
            for (const p of parsed.products) {
                const main = safeImageFilename(String(p.image || '').replace(/^assets\//, ''));
                if (main && main !== PRODUCT_PLACEHOLDER_BASENAME) toDelete.add(main);
                if (Array.isArray(p.images)) {
                    for (const im of p.images) {
                        const bn = safeImageFilename(String(im).replace(/^assets\//, ''));
                        if (bn && bn !== PRODUCT_PLACEHOLDER_BASENAME) toDelete.add(bn);
                    }
                }
            }
            for (const fn of toDelete) {
                const fp = path.join(assetsDir, fn);
                if (fs.existsSync(fp) && fs.lstatSync(fp).isFile()) fs.unlinkSync(fp);
            }
            for (const p of parsed.products) {
                p.image = PRODUCT_PLACEHOLDER_PATH;
                delete p.images;
            }
            fs.writeFileSync(productsFile, JSON.stringify(parsed, null, 2), 'utf8');
            return res.json({ success: true, deletedFiles: toDelete.size });
        }
        if (section === 'certificates') {
            if (!fs.existsSync(certificatesFile)) {
                return res.status(404).json({ error: 'certificates.json not found' });
            }
            const raw = fs.readFileSync(certificatesFile, 'utf8');
            const parsed = JSON.parse(raw);
            if (!validateCertificatesPayload(parsed)) {
                return res.status(500).json({ error: 'Invalid certificates.json' });
            }
            const toDelete = new Set();
            for (const c of parsed.certificates) {
                if (!c.image) continue;
                const bn = safeImageFilename(String(c.image).replace(/^assets\//, ''));
                if (bn) toDelete.add(bn);
            }
            for (const fn of toDelete) {
                const fp = path.join(assetsDir, fn);
                if (fs.existsSync(fp) && fs.lstatSync(fp).isFile()) fs.unlinkSync(fp);
            }
            for (const c of parsed.certificates) {
                c.image = '';
            }
            fs.writeFileSync(certificatesFile, JSON.stringify(parsed, null, 2), 'utf8');
            return res.json({ success: true, deletedFiles: toDelete.size });
        }
        if (section === 'media') {
            const files = fs.readdirSync(assetsDir);
            let n = 0;
            for (const file of files) {
                const filename = safeImageFilename(file);
                if (!filename) continue;
                const filepath = path.join(assetsDir, filename);
                if (fs.lstatSync(filepath).isFile()) {
                    fs.unlinkSync(filepath);
                    n += 1;
                }
            }
            return res.json({ success: true, deletedFiles: n });
        }
        return res.status(400).json({ error: 'Invalid section' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/images/:filename', adminAuth, (req, res) => {
    const filename = safeImageFilename(req.params.filename);
    if (!filename) return res.status(400).json({ error: 'Invalid filename' });

    const filepath = path.join(assetsDir, filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found' });

    try {
        fs.unlinkSync(filepath);
        res.json({ success: true, message: `File ${filename} deleted` });
    } catch (e) {
        res.status(500).json({ error: `Failed to delete file: ${e.message}` });
    }
});

app.delete('/api/images', adminAuth, (req, res) => {
    try {
        const files = fs.readdirSync(assetsDir);
        for (const file of files) {
            const filename = safeImageFilename(file);
            if (!filename) continue;
            const filepath = path.join(assetsDir, filename);
            if (fs.lstatSync(filepath).isFile()) fs.unlinkSync(filepath);
        }
        res.json({ success: true, message: 'All images deleted from assets folder' });
    } catch (e) {
        res.status(500).json({ error: `Bulk deletion failed: ${e.message}` });
    }
});

app.post('/api/clear-cache', adminAuth, (req, res) => {
    res.setHeader('Clear-Site-Data', '"cache"');
    res.json({ success: true, message: 'Cache clear signal sent to browser' });
});

app.post('/api/contact', async (req, res) => {
    try {
        const ip = getClientIp(req);
        if (!contactRateAllow(ip)) {
            return res.status(429).json({ error: 'Слишком много заявок. Попробуйте позже.' });
        }

        const body = req.body || {};
        if (body.website && String(body.website).trim()) {
            return res.json({ success: true, message: 'Спасибо!' });
        }

        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();
        const email = String(body.email || '').trim();
        const smartToken = body.smartToken != null ? String(body.smartToken).trim() : '';

        if (!name || name.length > CONTACT_NAME_MAX) {
            return res.status(400).json({ error: 'Укажите имя.' });
        }
        if (!phone || phone.length > CONTACT_PHONE_MAX) {
            return res.status(400).json({ error: 'Укажите телефон.' });
        }
        if (!email || email.length > CONTACT_EMAIL_MAX || !CONTACT_EMAIL_RE.test(email)) {
            return res.status(400).json({ error: 'Укажите корректный email.' });
        }

        const cap = await verifySmartCaptcha(smartToken, ip);
        if (!cap.ok) {
            return res.status(400).json({
                error: 'Проверка SmartCaptcha не пройдена. Обновите страницу и попробуйте снова.'
            });
        }

        const mail = await sendContactEmail({ name, phone, email });
        if (!mail.ok) {
            console.error('[contact]', mail.error);
            return res.status(503).json({
                error: 'Отправка почты временно недоступна. Напишите на info@re-spo.com или позвоните.',
                code: 'MAIL_NOT_CONFIGURED'
            });
        }

        res.json({ success: true, message: 'Спасибо! Заявка отправлена.' });
    } catch (e) {
        console.error('[contact]', e);
        res.status(500).json({ error: 'Не удалось отправить заявку.' });
    }
});

app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`RE-SPO server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
