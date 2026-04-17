'use strict';

/**
 * @file loggingService.js
 * @description Enterprise-grade structured logging for Google Cloud Operations.
 * @module services/loggingService
 * @see @[skills/enterprise-js-standards]
 */

const { Logging } = require('@google-cloud/logging');

// Initialize with Sandbox fallback logic
let logging;
let log;

try {
    // Attempt local-first credentials or environment-based auth for Cloud Run
    logging = new Logging();
    log = logging.log('event-companion-audit');
} catch (error) {
    console.warn('[Logging Service] Offline Sandbox initialized (Cloud Logging suppressed).');
}

/**
 * Logs a structured audit event to Google Cloud Logs.
 * @description Captures interaction metadata and performance metrics for broader service adoption scoring.
 * @param {string} severity - DEFAULT, INFO, WARNING, ERROR, CRITICAL
 * @param {Object} metadata - Structured JSON payload for filtering
 */
const logEvent = async (severity = 'INFO', metadata = {}) => {
    const entry = log ? log.entry({ severity }, { 
        ...metadata, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    }) : null;

    if (entry && log) {
        try {
            await log.write(entry);
        } catch (err) {
            // Suppress writing errors in sandbox/offline to prevent app crashes
            console.error('[Logging Error Fallback]:', err.message);
        }
    } else {
        // Local console fallback for development/sandbox visibility
        console.log(`[AUDIT][${severity}]:`, JSON.stringify(metadata));
    }
};

module.exports = { logEvent };
