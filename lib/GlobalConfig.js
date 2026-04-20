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
        ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET,
        TOKEN_EXPIRY: '8h',
        ROLES: {
            ADMIN: 'admin',
            USER: 'user'
        },
        FIREBASE_CLIENT: {
            apiKey: process.env.FIREBASE_API_KEY || 'ROTATION_REQUIRED',
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'smarteventconcierge.firebaseapp.com',
            projectId: process.env.FIREBASE_PROJECT_ID || 'smarteventconcierge',
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'smarteventconcierge.appspot.com',
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '428873326699',
            appId: process.env.FIREBASE_APP_ID || '1:428873326699:web:65e1008688849b38036232',
            measurementId: process.env.FIREBASE_MEASUREMENT_ID || 'G-M88HWM9Z7J'
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

// Validation mapping @[skills/zero-trust-cloud-security]
if (GlobalConfig.PROJECT.ENV === 'production') {
    const required = ['ADMIN_JWT_SECRET', 'FIREBASE_API_KEY'];
    required.forEach(key => {
        if (!process.env[key]) {
            console.error(`[SECURITY][CRITICAL] Missing required environment variable: ${key}`);
            // In high-security contexts, we might throw here, but for now we log a critical error.
        }
    });
}

module.exports = GlobalConfig;
