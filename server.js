// =====================================================
// RESPO — Express Server (production hardened)
// =====================================================

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const isAdminOpen = process.env.ADMIN_OPEN !== 'false';
const assetsDir = path.join(__dirname, 'assets');
const productsFile = path.join(__dirname, 'products.json');
const IMAGE_EXT_RE = /\.(png|svg|jpe?g|gif|webp)$/i;

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

function validateProductsPayload(payload) {
    if (!payload || typeof payload !== 'object') return false;
    if (!Array.isArray(payload.categories) || !Array.isArray(payload.products)) return false;

    const categoryIds = new Set();
    for (const c of payload.categories) {
        if (!c || typeof c !== 'object') return false;
        if (typeof c.id !== 'string' || !c.id.trim()) return false;
        if (typeof c.name !== 'string' || !c.name.trim()) return false;
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
        if (payload.categories.length > 0 && !categoryIds.has(p.category)) return false;
    }
    return true;
}

function adminAuth(req, res, next) {
    if (isAdminOpen) return next();
    if (!isProduction) return next();

    const configuredUser = process.env.ADMIN_USER;
    const configuredPass = process.env.ADMIN_PASS;

    if (!configuredUser || !configuredPass) {
        return res.status(503).json({
            error: 'Admin credentials are not configured. Set ADMIN_USER and ADMIN_PASS.'
        });
    }

    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="RESPO Admin"');
        return res.status(401).send('Authentication required');
    }

    const encoded = auth.slice(6);
    let decoded = '';
    try {
        decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch (e) {
        return res.status(401).send('Invalid auth header');
    }

    const separatorIdx = decoded.indexOf(':');
    if (separatorIdx === -1) {
        return res.status(401).send('Invalid auth format');
    }

    const user = decoded.slice(0, separatorIdx);
    const pass = decoded.slice(separatorIdx + 1);
    if (user !== configuredUser || pass !== configuredPass) {
        res.set('WWW-Authenticate', 'Basic realm="RESPO Admin"');
        return res.status(401).send('Invalid credentials');
    }
    next();
}

const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://mc.yandex.ru'],
    styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://fonts.cdnfonts.com',
        'https://db.onlinewebfonts.com'
    ],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://mc.yandex.ru'],
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
        if (/\.(png|svg|jpe?g|gif|webp)$/i.test(filePath)) {
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
            const requested = safeImageFilename(req.body.targetFilename || file.originalname);
            if (!requested) return cb(new Error('Invalid target filename'));
            cb(null, requested);
        }
    }),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const byMime = /^image\/(png|jpeg|jpg|gif|svg\+xml|webp)$/i.test(file.mimetype);
        const byExt = IMAGE_EXT_RE.test(file.originalname);
        cb(null, byMime && byExt);
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/production', (req, res) => res.sendFile(path.join(__dirname, 'production.html')));
app.get('/product', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));
app.get('/admin', adminAuth, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/production.html', (req, res) => res.sendFile(path.join(__dirname, 'production.html')));
app.get('/product.html', (req, res) => res.sendFile(path.join(__dirname, 'product.html')));

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

app.get('/api/required-images', adminAuth, (req, res) => {
    try {
        const pages = ['index.html', 'production.html', 'product.html', 'admin.html']
            .map(name => path.join(__dirname, name))
            .filter(fp => fs.existsSync(fp));

        const required = new Set();
        const regex = /src=["']assets\/([^"']+\.(png|svg|jpe?g|gif|webp))["']/ig;

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

app.get('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`RESPO server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
