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
// Serve static assets from project root and assets dir explicitly
app.use(express.static(path.join(__dirname), {
    maxAge: '7d',
    etag: true,
}));

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

// --- SPA Fallback: serve index.html for any unknown route ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`✅ RESPO server running at http://localhost:${PORT}`);
    console.log(`   Environment: production`);
});
