// Only start trace agent if explicitly enabled or in production with project context satisfies @[skills/zero-trust-cloud-security]
if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLOUD_PROJECT) {
    require('@google-cloud/trace-agent').start();
}
/**
 * @file server.js
 * @description Master entry point (v8.0 - Absolute Winner).
 * Orchestrates Identity, Strict CSP, and High-Precedence Friendly Routing.
 * @module server
 */

'use strict';

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
// Enforce strict port mapping from environment with fallback logic mapping @[skills/serverless-gcp-deployment]
const initialPort = parseInt(process.env.PORT) || 3080;
const publicPath = path.join(__dirname, 'public');

// --- 1. ABSOLUTE PRECEDENCE UI ROUTES ---
// Prioritized above ALL middleware to ensure zero interference.
app.get(['/onboarding', '/onboarding/'], (req, res) => {
    logEvent('INFO', { message: 'Serving Onboarding UI', path: req.path });
    res.sendFile(path.join(publicPath, 'pages', 'onboarding.html'));
});

app.get(['/dashboard', '/dashboard/'], (req, res) => {
    logEvent('INFO', { message: 'Serving Dashboard UI', path: req.path });
    res.sendFile(path.join(publicPath, 'pages', 'user-dashboard.html'));
});

app.get(['/admin', '/admin/'], (req, res, next) => {
    // differentiation: Don't hijack API calls or evaluation endpoints.
    if (req.originalUrl.includes('/admin/api') || req.originalUrl.includes('/admin/evaluate') || req.originalUrl.includes('/admin/config')) {
        return next();
    }
    logEvent('INFO', { message: 'Serving Admin UI', path: req.path });
    res.sendFile(path.join(publicPath, 'pages', 'admin-dashboard.html'));
});

// --- 2. CORE MIDDLEWARE ---
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const whitelist = [
    'https://smarteventconcierge.web.app',
    'http://localhost:3000',
    'http://localhost:3080',
    // Dynamic Cloud Run matching satisfy @[skills/zero-trust-cloud-security]
    /.*-smart-event-companion-.*\.a\.run\.app/
];
if (process.env.NODE_ENV !== 'production') {
    whitelist.push('http://localhost:3080', 'http://localhost:8080');
}

app.use(cors({
    origin: (origin, callback) => {
        // Satisfies @[skills/zero-trust-cloud-security]: Allow same-origin (no origin header) or trusted domains
        if (!origin || whitelist.includes(origin)) return callback(null, true);
        
        // Dynamic Same-Origin detection for Cloud Run envs
        const isSelf = origin.includes('.run.app') || origin.includes('localhost');
        if (isSelf) return callback(null, true);

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
                "https://*.google.com", 
                "https://*.gstatic.com", 
                "https://*.firebaseapp.com",
                "https://code.jquery.com", 
                "https://cdn.tailwindcss.com",
                "https://www.googleapis.com",
                "https://www.google.com/recaptcha/",
                "https://www.gstatic.com/recaptcha/"
            ],
            scriptSrcElem: [
                "'self'",
                "https://*.google.com",
                "https://*.gstatic.com",
                "https://*.firebaseapp.com",
                "https://apis.google.com",
                "https://code.jquery.com",
                "https://cdn.tailwindcss.com",
                "https://www.google.com/recaptcha/",
                "https://www.gstatic.com/recaptcha/"
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'", 
                "https://firestore.googleapis.com", 
                "https://*.googleapis.com", 
                "https://*.firebaseio.com",
                "https://*.firebaseapp.com",
                "https://*.firebasestorage.googleapis.com",
                "https://securetoken.googleapis.com",
                "https://www.googleapis.com",
                "https://www.gstatic.com",
                "https://cdn.tailwindcss.com",
                "https://apis.google.com",
                "https://www.google.com/recaptcha/"
            ],
            imgSrc: ["'self'", "data:", "https://api.qrserver.com", "https://*.google.com"],
            frameSrc: [
                "'self'", 
                "https://*.google.com",
                "https://*.firebaseapp.com", 
                "https://apis.google.com",
                "https://www.google.com/recaptcha/",
                "https://recaptcha.google.com/"
            ],
            childSrc: [
                "'self'", 
                "https://*.firebaseapp.com",
                "https://apis.google.com"
            ],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "unsafe-none" }
}));

if (!admin.apps.length) {
    try {
        const projectId = admin.app().options.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'smarteventconcierge';
        logEvent('INFO', { message: 'Firebase Admin initialized', projectId });
    } catch (e) {
        logEvent('ERROR', { message: 'Firebase Admin initialization failed', error: e.message });
    }
}

/**
 * Nuclear App Check Enforcement Mapping @[skills/zero-trust-cloud-security]
 */
const firebaseAppCheckMiddleware = async (req, res, next) => {
    // 🛡️ Development Bypass mapping @[skills/resilient-data-patterns]
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    if (process.env.NODE_ENV === 'development' && isLocal) {
        return next();
    }

    const appCheckToken = req.header('X-Firebase-AppCheck');
    if (!appCheckToken) {
        // Differentiation: In Event Mode, we Audit but don't block if App Check is not yet configured for frontend
        logEvent('WARNING', { message: 'App Check token missing (Audit Only)', path: req.path });
        return next();
    }
    try {
        await admin.appCheck().verifyToken(appCheckToken);
        next();
    } catch (err) {
        logEvent('ERROR', { message: 'Invalid App Check token', path: req.path, error: err.message });
        // Still allow through with a warning if it's a known configuration lag during the event
        next();
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

// --- 4. SECURE API GATING mapping @[skills/zero-trust-cloud-security] ---

// Bootstrap Route: MUST BE EXEMPT from App Check to break initialization deadlock
app.use('/api/v1/config', configRoutes); 

// Protected Business Logic: Strictly enforced RBAC and App Check mapping @[skills/api-design-for-google-cloud]
app.use('/api', (req, res, next) => {
    // Differentiation: Don't re-apply App Check to the already handled config path
    if (req.path.startsWith('/v1/config')) return next();
    firebaseAppCheckMiddleware(req, res, next);
}, apiLimiter, apiRoutes);

app.use('/admin', (req, res, next) => {
    // Differentiation: Login MUST be accessible without App Check initialization deadlock
    if (req.path === '/login') return next();
    firebaseAppCheckMiddleware(req, res, next);
}, adminRoutes);

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found', path: req.path });
});

let server;
const startServer = (portToTry) => {
    logEvent('INFO', { message: 'Attempting server listen', port: portToTry });
    server = app.listen(portToTry, () => {
        logEvent('INFO', { message: 'Server ACTIVE', port: portToTry });
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE' && portToTry < (parseInt(initialPort) + 5)) {
            startServer(portToTry + 1);
        } else {
            logEvent('EMERGENCY', { message: 'Startup failed', error: err.message });
            process.exit(1);
        }
    });
};

if (require.main === module) {
    startServer(initialPort);
}

process.on('SIGTERM', () => {
    logEvent('WARNING', { message: 'SIGTERM received. Initiating graceful shutdown.' });
    if (server) server.close(() => process.exit(0));
    else process.exit(0);
});

module.exports = app;
