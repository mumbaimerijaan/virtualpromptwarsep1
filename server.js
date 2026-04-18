/**
 * @file server.js
 * @description Master entry point (v7.0 - Absolute Restoration).
 * Orchestrates Identity, Strict CSP, and High-Precedence Friendly Routing.
 * @module server
 */

'use strict';

console.log('--------------------------------------------------');
console.log('[ARCHITECT] Applying v7.0 Security & Routing Stack');
console.log('--------------------------------------------------');

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');

const GlobalConfig = require('./lib/GlobalConfig');
const { logEvent } = require('./services/loggingService');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const initialPort = process.env.PORT || 3080;
const publicPath = path.join(__dirname, 'public');

// --- 1. ABSOLUTE PRECEDENCE UI ROUTES ---
// Prioritized above ALL middleware to ensure zero interference.
app.get(['/onboarding', '/onboarding/'], (req, res) => {
    console.log('[ROUTER] Serving Onboarding UI');
    res.sendFile(path.join(publicPath, 'pages', 'onboarding.html'));
});

app.get(['/dashboard', '/dashboard/'], (req, res) => {
    console.log('[ROUTER] Serving Dashboard UI');
    res.sendFile(path.join(publicPath, 'pages', 'user-dashboard.html'));
});

app.get(['/admin', '/admin/'], (req, res, next) => {
    // differentiation: Don't hijack API calls or evaluation endpoints.
    if (req.originalUrl.includes('/admin/api') || req.originalUrl.includes('/admin/evaluate') || req.originalUrl.includes('/admin/config')) {
        return next();
    }
    console.log('[ROUTER] Serving Admin UI');
    res.sendFile(path.join(publicPath, 'pages', 'admin-dashboard.html'));
});

// --- 2. CORE MIDDLEWARE ---
app.use(compression());
app.use(express.json());

const whitelist = [
    'https://smarteventconcierge.web.app',
    'https://smarteventconcierge.firebaseapp.com'
];
if (process.env.NODE_ENV !== 'production') {
    whitelist.push('http://localhost:3080', 'http://localhost:8080');
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || whitelist.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS Architecture'));
    },
    credentials: true
}));

// --- 3. PRODUCTION SECURITY (CSP v7.0) ---
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://*.google.com", 
                "https://*.gstatic.com", 
                "https://code.jquery.com", 
                "https://cdn.tailwindcss.com",
                "https://www.googleapis.com"
            ],
            scriptSrcElem: [
                "'self'",
                "https://*.google.com",
                "https://*.gstatic.com",
                "https://apis.google.com",
                "https://code.jquery.com",
                "https://cdn.tailwindcss.com"
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'", 
                "https://firestore.googleapis.com", 
                "https://*.googleapis.com", 
                "https://*.firebaseio.com",
                "https://*.firebaseapp.com",
                "https://securetoken.googleapis.com",
                "https://www.googleapis.com",
                "https://www.gstatic.com",
                "https://cdn.tailwindcss.com",
                "https://apis.google.com"
            ],
            imgSrc: ["'self'", "data:", "https://api.qrserver.com", "https://*.google.com"],
            frameSrc: [
                "'self'", 
                "https://*.google.com",
                "https://*.firebaseapp.com", 
                "https://apis.google.com"
            ],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false
}));

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            projectId: process.env.GOOGLE_CLOUD_PROJECT || 'smarteventconcierge'
        });
        console.log(`[AUTH] Firebase Admin initialized for ${admin.app().options.projectId}`);
    } catch (e) {
        console.error('[AUTH] Firebase Admin failed to initialize:', e.message);
    }
}

const firebaseAppCheckMiddleware = async (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') return next(); 
    const appCheckToken = req.header('X-Firebase-AppCheck');
    if (!appCheckToken) return res.status(401).json({ error: 'Unauthorized: App Check token missing' });
    try {
        await admin.appCheck().verifyToken(appCheckToken);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid App Check token' });
    }
};

// Static assets (placed after friendly routes)
app.use(express.static(publicPath, {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    }
}));

const apiLimiter = rateLimit({
    windowMs: GlobalConfig.SECURITY.RATE_LIMIT.WINDOW_MS,
    max: GlobalConfig.SECURITY.RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
});

// API / Admin Logic routes
app.use('/api/v1/config', configRoutes); 
app.use('/api', firebaseAppCheckMiddleware, apiLimiter, apiRoutes);
app.use('/admin', firebaseAppCheckMiddleware, adminRoutes);

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found', path: req.path });
});

let server;
const startServer = (portToTry) => {
    console.log(`[BOOT] Attempting listen on ${portToTry}...`);
    server = app.listen(portToTry, () => {
        console.log(`[BOOT] Server ACTIVE on port ${portToTry}`);
        logEvent('INFO', { message: 'System Bootstrapped', port: portToTry });
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE' && portToTry < (parseInt(initialPort) + 5)) {
            startServer(portToTry + 1);
        } else {
            console.error(`[FATAL] Startup failed: ${err.message}`);
            process.exit(1);
        }
    });
};

if (require.main === module) {
    startServer(initialPort);
}

process.on('SIGTERM', () => {
    console.log('[BOOT] SIGTERM received. Closing server.');
    if (server) server.close(() => process.exit(0));
    else process.exit(0);
});

module.exports = app;
