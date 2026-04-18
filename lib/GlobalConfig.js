/**
 * @file GlobalConfig.js
 * @description Centralized mapping of all architectural constants and environment defaults.
 * @module lib/GlobalConfig
 * @see @[skills/enterprise-js-standards]
 */

'use strict';

const GlobalConfig = {
    PROJECT: {
        NAME: 'Smart Event Companion',
        VERSION: '5.0.0-PROD',
        ENV: process.env.NODE_ENV || 'production'
    },
    FIRESTORE: {
        COLLECTIONS: {
            USERS: 'users',
            INTERACTIONS: 'interactions',
            LOGS: 'system_logs',
            CONFIG: 'system_config',
            BROADCASTS: 'broadcasts'
        },
        DOCS: {
            GLOBAL_CONFIG: 'global_state'
        }
    },
    AUTH: {
        ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'fallback_secret',
        TOKEN_EXPIRY: '8h',
        ROLES: {
            ADMIN: 'admin',
            USER: 'user'
        }
    },
    EVALUATION: {
        DEFAULT_TIMER_MINS: 60,
        TIMEOUT_MS: 5000,
        GITHUB_API: 'https://api.github.com'
    },
    SECURITY: {
        RATE_LIMIT: {
            WINDOW_MS: 15 * 60 * 1000,
            MAX_REQUESTS: 100
        }
    }
};

module.exports = GlobalConfig;
