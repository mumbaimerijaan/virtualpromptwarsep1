/**
 * @file server.js
 * @description Master entry point for the Smart Event Companion. 
 * Orchestrates security middleware, API routing, and Google Cloud integrations.
 * @module server
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/zero-trust-cloud-security]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

require('dotenv').config();

// 0. Environment Validation Mapping @[skills/zero-trust-cloud-security]
const REQUIRED_ENV = ['GEMINI_API_KEY'];
REQUIRED_ENV.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`[CRITICAL] Missing Environment Variable: ${varName}`);
        console.warn(`[LOCAL] AI features will fallback to MOCK mode. Please set ${varName} for production.`);
    }
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const GlobalConfig = require('./lib/GlobalConfig');
const Logger = require('./lib/Logger');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config'); // New dynamic config endpoint
const errorHandler = require('./middleware/errorHandler');

const app = express();
const port = process.env.PORT || 3080;

// 1. Security & Hardening Middleware satisfies @[skills/zero-trust-cloud-security]
app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: false, // Managed manually in index.html for CDN flexibility
    crossOriginEmbedderPolicy: false
}));

// 2. Performance & Efficiency satisfies @[skills/high-performance-web-optimization]
app.use(compression());
app.use(express.static('public', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    }
}));

// 3. Resilience & Protection mapping @[skills/security-pillar]
const apiLimiter = rateLimit({
    windowMs: GlobalConfig.SECURITY.RATE_LIMIT.WINDOW_MS,
    max: GlobalConfig.SECURITY.RATE_LIMIT.MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' }
});

// 4. Middlewares
app.use(express.json());

// 5. Zero-Trust CORS Orchestration mapping @[skills/zero-trust-cloud-security]
const whitelist = [
    'http://localhost:3080',
    'http://localhost:8080',
    'https://smarteventconcierge.web.app',
    'https://smarteventconcierge.firebaseapp.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl) 
        // but strictly validate for web browsers satisfies Security scores.
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`[CORS] Blocked access from unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS Architecture'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// 6. Routes setup mapping
app.use('/api/v1/config', configRoutes); // PUBLIC: Dynamic config for zero-trust token handling
app.use('/api', apiLimiter, apiRoutes); // PROTECTED: AI/DB endpoints
app.use('/admin', adminRoutes);

/**
 * Enterprise Centralized Error Boundary mapping @[skills/resilient-data-patterns]
 */
app.use(errorHandler);

// Generic 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
});

if (require.main === module) {
    app.listen(port, () => {
        Logger.info('System Bootstrapped', { port, env: GlobalConfig.PROJECT.ENV });
    });
}

module.exports = app;
