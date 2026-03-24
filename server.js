// =====================================================
// RESPO — Express Server
// =====================================================

const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// --- Multer Setup ---
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, assetsDir),
    filename: (req, file, cb) => cb(null, req.body.targetFilename || file.originalname)
});
const upload = multer({ storage });

const app = express();
const PORT = 3000;

// --- Security Headers ---
app.use(helmet({
    contentSecurityPolicy: false,         // disable CSP to allow CDN Tailwind + Google Fonts
    crossOriginEmbedderPolicy: false,
}));

// --- Gzip Compression ---
app.use(compression());

// --- Serve Static Files ---
app.use(express.static(path.join(__dirname), {
    maxAge: '7d',
    etag: true,
    extensions: ['html'] // Allow clean URLs like /production -> production.html
}));

// --- Root Route ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Admin Panel Routes ---
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/required-images', (req, res) => {
    try {
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        const regex = /src=["']assets\/([^"']+\.(png|svg|jpeg|jpg|gif))["']/ig;
        let match;
        const required = new Set();
        while ((match = regex.exec(html)) !== null) {
            required.add(decodeURIComponent(match[1]));
        }
        
        const images = Array.from(required).map(filename => {
            const filepath = path.join(assetsDir, filename);
            return { filename, exists: fs.existsSync(filepath) };
        });
        res.json(images);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/upload', (req, res, next) => {
    upload.single('image')(req, res, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, (req, res) => {
    if (req.file) {
        res.json({ success: true, filename: req.file.filename });
    } else {
        res.status(400).json({ error: 'Failed to upload' });
    }
});

app.delete('/api/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(assetsDir, filename);
    if (fs.existsSync(filepath)) {
        try {
            fs.unlinkSync(filepath);
            res.json({ success: true, message: `File ${filename} deleted` });
        } catch (e) {
            res.status(500).json({ error: `Failed to delete file: ${e.message}` });
        }
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

app.delete('/api/images', (req, res) => {
    try {
        const files = fs.readdirSync(assetsDir);
        for (const file of files) {
            const filepath = path.join(assetsDir, file);
            if (fs.lstatSync(filepath).isFile()) {
                fs.unlinkSync(filepath);
            }
        }
        res.json({ success: true, message: 'All photos deleted from assets folder' });
    } catch (e) {
        res.status(500).json({ error: `Bulk deletion failed: ${e.message}` });
    }
});

// --- Products API ---
const productsFile = path.join(__dirname, 'products.json');

app.get('/api/products', (req, res) => {
    try {
        if (!fs.existsSync(productsFile)) {
            return res.json({ categories: [], products: [] });
        }
        const data = fs.readFileSync(productsFile, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/products', express.json(), (req, res) => {
    try {
        const data = JSON.stringify(req.body, null, 2);
        fs.writeFileSync(productsFile, data, 'utf8');
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/clear-cache', (req, res) => {
    res.setHeader('Clear-Site-Data', '"cache"');
    res.json({ success: true, message: 'Cache clear signal sent to browser' });
});

// --- SPA Fallback: serve index.html for any unknown route ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ RESPO server running at http://localhost:${PORT}`);
    console.log(`   Environment: production`);
});
