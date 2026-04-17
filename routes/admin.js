/**
 * @file admin.js
 * @description Admin-only API routes for global event statistics and audit monitoring.
 * @module routes/admin
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/api-design-for-google-cloud]
 */

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { requireAdmin } = require('../middleware/roleMiddleware');
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { getAdminStats } = require('../services/firestoreService');

// Used exclusively for generating Admin JWTs independently of Firebase identities.
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback_development_secret';

/**
 * Manual Login flow defined precisely for 'root' / 'admin@123'.
 */
router.post('/login', (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        if (username === 'root' && password === 'admin@123') {
            // Issuing a specific Admin token. The authMiddleware recognizes JWTs under Firebase token format natively
            // But we will intercept it.
            const token = jwt.sign({ role: 'admin', uid: 'admin-root' }, ADMIN_JWT_SECRET, { expiresIn: '8h' });
            return res.json({ token, role: 'admin' });
        }
        
        return res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
        next(err);
    }
});

/**
 * Protect all ensuing admin paths through our two verification barriers.
 */
router.use(verifyFirebaseToken); 
router.use(requireAdmin);

/**
 * Fetches dashboard details. Read-only impact.
 */
router.get('/dashboard-stats', async (req, res, next) => {
    try {
        const stats = await getAdminStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
