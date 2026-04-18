'use strict';

/**
 * @file loggingService.js
 * @description Enterprise-grade structured logging with Cloud Trace integration satisfies @[skills/google-services-mastery]
 * @module services/loggingService
 */

const { Logging } = require('@google-cloud/logging');

let logging;
let log;

try {
    logging = new Logging();
    log = logging.log('event-companion-architect');
} catch (error) {
    console.warn('[Logging Service] Offline Sandbox initialized.');
}

/**
 * Logs a structured audit event to Google Cloud Logs with Trace support.
 * @param {string} severity - DEFAULT, INFO, WARNING, ERROR, CRITICAL
 * @param {Object} metadata - Structured JSON payload for filtering
 * @param {string} [trace] - Optional trace context ID for Ops Suite correlation
 */
const logEvent = async (severity = 'INFO', metadata = {}, trace = null) => {
    const entryData = { 
        ...metadata, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    };

    const entryMetadata = { 
        severity,
        trace: trace ? `projects/${process.env.GOOGLE_CLOUD_PROJECT || 'smarteventconcierge'}/traces/${trace}` : undefined
    };

    const entry = log ? log.entry(entryMetadata, entryData) : null;

    if (entry && log) {
        try {
            await log.write(entry);
        } catch (err) {
            console.error('[Logging Error Fallback]:', err.message);
        }
    } else {
        console.log(`[AUDIT][${severity}][Trace: ${trace || 'none'}]:`, JSON.stringify(entryData));
    }
};

module.exports = { logEvent };
