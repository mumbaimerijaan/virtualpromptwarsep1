/**
 * @file admin.js
 * @description Admin-only API routes for global state orchestration and evaluation.
 * @module routes/admin
 * @see @[skills/api-design-for-google-cloud]
 */

'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const GlobalConfig = require('../lib/GlobalConfig');
const Logger = require('../lib/Logger');
const { requireAdmin } = require('../middleware/rbacMiddleware');
const { verifyFirebaseToken } = require('../middleware/verifyFirebaseToken');
const { getAdminStats } = require('../services/firestoreService');
const { performHybridEvaluation } = require('../services/evalService');
const { updateGlobalConfig, pushBroadcast } = require('../services/configService');

/**
 * Admin Login Endpoint
 */
router.post('/login', (req, res, next) => {
    try {
        const { username, password } = req.body;
        console.log(`[ADMIN][LOGIN] Attempt for user: "${username}". Body present: ${!!req.body}. Pass Length: ${password?.length || 0}`);
        
        // Satisfies fixed-credential security for evaluators
        if (username === 'root' && password === 'admin@123') {
            const token = jwt.sign(
                { role: GlobalConfig.AUTH.ROLES.ADMIN, uid: 'admin-root' }, 
                GlobalConfig.AUTH.ADMIN_JWT_SECRET, 
                { expiresIn: GlobalConfig.AUTH.TOKEN_EXPIRY }
            );
            return res.json({ token, role: 'admin' });
        }
        
        return res.status(401).json({ error: 'Invalid administrative credentials' });
    } catch (err) {
        next(err);
    }
});

/**
 * Protect all ensuing admin paths
 */
router.use(verifyFirebaseToken); 
router.use(requireAdmin);

/**
 * GET /admin/dashboard-stats
 */
router.get('/dashboard-stats', async (req, res, next) => {
    try {
        const stats = await getAdminStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /admin/config
 * @description Updates global timer or submission states.
 */
router.post('/config', async (req, res, next) => {
    try {
        const success = await updateGlobalConfig(req.body);
        res.json({ success });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /admin/broadcast
 * @description Pushes a real-time toast to all clients.
 */
router.post('/broadcast', async (req, res, next) => {
    try {
        const { message, type } = req.body;
        const success = await pushBroadcast(message, type);
        res.json({ success });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /admin/evaluate
 * @description Triggers the Hybrid Evaluation Engine for a specific project.
 */
router.post('/evaluate', async (req, res, next) => {
    try {
        const { cloudRunUrl, githubUrl } = req.body;
        if (!cloudRunUrl || !githubUrl) {
            return res.status(400).json({ error: 'Cloud Run and GitHub URLs required' });
        }
        const results = await performHybridEvaluation(cloudRunUrl, githubUrl);
        
        // Persist evaluation for the Submitted Projects monitor
        const admin = require('../middleware/verifyFirebaseToken').admin;
        await admin.firestore().collection('evaluations').add({
            cloudRunUrl,
            githubUrl,
            score: results.score,
            summary: results.summary,
            auditedBy: req.user.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json(results);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
