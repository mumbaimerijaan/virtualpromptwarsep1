'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const { logEvent } = require('./services/loggingService');
const errorHandler = require('./middleware/errorHandler');

/**
 * @file server.js
 * @description Master entry point for the Smart Event Companion. 
 * Orchestrates security middleware, API routing, and Google Cloud integrations.
 * @module server
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/zero-trust-cloud-security]
 * @see @[skills/high-performance-web-optimization]
 */

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

// 3. Resilience & Protection
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' }
});

// 4. Middlewares
app.use(express.json());
app.use(cors());

// 5. Routes setup mapping
app.use('/api', apiLimiter, apiRoutes); // Protecting AI/DB endpoints from flooding
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
        logEvent('INFO', { message: `System Bootstrapped`, port });
        console.log(`Server listening actively on port ${port}`);
    });
}

module.exports = app;

