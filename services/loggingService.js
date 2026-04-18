'use strict';

/**
 * @file loggingService.js
 * @description Master Resilience Logger. 
 * Prevents "Credential Loop" crashes by strictly gating Cloud Ops initialization.
 * @module services/loggingService
 */

const { Logging } = require('@google-cloud/logging');

let logging;
let log;

/**
 * Double-Gated Initialization satisfies local test resilience.
 * Only attempts to connect to Ops Suite if explicitly in Production with project context.
 */
try {
    if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_CLOUD_PROJECT) {
        logging = new Logging();
        log = logging.log('event-companion-architect');
    } else {
        // Silent fallback for non-production environments to prevent ADC lookup crashes
        console.log('[Logging Service] Local-Safe mode active (No Cloud Ops lookup).');
    }
} catch (error) {
    console.warn('[Logging Service] Offline Sandbox initialized (Init Failure).');
}

/**
 * Logs a structured audit event to Google Cloud Logs with Trace support.
 * Falls back to console immediately if Cloud Logs are unavailable.
 */
const logEvent = async (severity = 'INFO', metadata = {}, trace = null) => {
    const entryData = { 
        ...metadata, 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    };

    if (log) {
        try {
            const entryMetadata = { 
                severity,
                trace: trace ? `projects/${process.env.GOOGLE_CLOUD_PROJECT}/traces/${trace}` : undefined
            };
            const entry = log.entry(entryMetadata, entryData);
            await log.write(entry);
            return;
        } catch (err) {
            // Drop down to console fallback on write failure (prevents crash loops)
            console.error('[Logging Error Fallback]:', err.message);
        }
    }

    // High-visibility local audit mapping Architect standards
    console.log(`[AUDIT][${severity}][Trace: ${trace || 'none'}]:`, JSON.stringify(entryData));
};

module.exports = { logEvent };
