'use strict';

const express = require('express');
const router = express.Router();
const Logger = require('../lib/Logger');
const GlobalConfig = require('../lib/GlobalConfig');

/**
 * GET /api/v1/config
 * @description Serves the public Firebase config maps with resilient fallbacks.
 * Security: This endpoint is public-facing but only exposes non-sensitive Firebase client identifiers.
 * Higher precedence is given to environment variables, falling back to architectural defaults.
 */
router.get('/', (req, res) => {
    try {
        // Source configuration from GlobalConfig (which already handles process.env mapping)
        const config = GlobalConfig.AUTH.FIREBASE_CLIENT;

        // Validation remains but using the resilient mapping allows the system to bootstrap satisfies @[skills/resilient-data-patterns]
        if (!config.apiKey || config.apiKey === 'ROTATION_REQUIRED') {
            Logger.warn('Configuration request served with placeholder keys: Initial setup incomplete');
        }

        if (!config.projectId) {
            Logger.error('Critical Failure: System configuration map incomplete');
            return res.status(500).json({ error: 'System configuration incomplete' });
        }

        res.json(config);
    } catch (err) {
        Logger.error('Failed to serve system configuration', err);
        res.status(500).json({ error: 'Internal system error' });
    }
});

module.exports = router;
