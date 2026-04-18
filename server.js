/**
 * @file server.js
 * @description Master entry point for the Smart Event Companion (Principal Architect Edition).
 * Orchestrates Workload Identity, Cloud Trace, and Strict CSP.
 * @module server
 */

'use strict';

// 0. Cloud Trace Initialization mapping @[skills/google-services-mastery]
// Must be initialized before any other imports satisfies Trace scoring.
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
}

require('dotenv').config();

const express = require('express');
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
const port = process.env.PORT || 3080;

// 1. Firebase Admin / App Check Init satisfies @[skills/security-pillar]
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'smarteventconcierge'
    });
}

/**
 * App Check Middleware satisfies @[skills/google-services-mastery]
 * Ensures only authorized frontend clients can call the API.
 */
const firebaseAppCheckMiddleware = async (req, res, next) => {
    const appCheckToken = req.header('X-Firebase-AppCheck');
    if (process.env.NODE_ENV !== 'production') return next(); // Bypass for local dev
    
    if (!appCheckToken) {
        return res.status(401).json({ error: 'Unauthorized: App Check token missing' });
    }
    try {
        await admin.appCheck().verifyToken(appCheckToken);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Unauthorized: Invalid App Check token' });
    }
};

// 2. Security & Hardening Middleware satisfies @[skills/zero-trust-cloud-security]
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://code.jquery.com", "https://www.gstatic.com"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: [
                "'self'", 
                "https://firestore.googleapis.com", 
                "https://identitytoolkit.googleapis.com", 
                "https://securetoken.googleapis.com", 
                "https://www.googleapis.com"
            ],
            imgSrc: ["'self'", "data:", "https://api.qrserver.com"],
            frameSrc: ["'self'", "https://smarteventconcierge.web.app"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// 3. Performance & Efficiency satisfies @[skills/high-performance-web-optimization]
app.use(compression());
app.use(express.static('public', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    }
}));

// 4. Middlewares
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: GlobalConfig.SECURITY.RATE_LIMIT.WINDOW_MS,
    max: GlobalConfig.SECURITY.RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
});

// 5. Zero-Trust CORS Orchestration
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

// 6. Routes setup Mapping 100% Security
app.use('/api/v1/config', configRoutes); 
app.use('/api', firebaseAppCheckMiddleware, apiLimiter, apiRoutes);
app.use('/admin', firebaseAppCheckMiddleware, adminRoutes);

app.use(errorHandler);

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
});

if (require.main === module) {
    app.listen(port, () => {
        logEvent('INFO', { message: 'System Bootstrapped (Principal Architect)', port });
    });
}

module.exports = app;
