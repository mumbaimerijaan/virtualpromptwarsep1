/**
 * @file Logger.js
 * @description Enterprise Logging Class wrapping standard console and cloud-ready outputs.
 * @module lib/Logger
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/zero-trust-cloud-security]
 */

'use strict';

const GlobalConfig = require('./GlobalConfig');

/**
 * Logger class for architectural-compliant logging.
 */
class Logger {
    /**
     * Standard info log for system state changes.
     * @param {string} msg - Context message
     * @param {Object} [meta] - Structured metadata mapping @[skills/resilient-data-patterns]
     */
    static info(msg, meta = {}) {
        const payload = {
            level: 'INFO',
            message: msg,
            timestamp: new Date().toISOString(),
            context: GlobalConfig.PROJECT.NAME,
            ...meta
        };
        // In local/sandbox, we still print, but in a structured format for audit scripts
        console.log(`[${payload.level}] ${payload.message}`, meta);
    }

    /**
     * Warning log for resilience fallback triggers or soft failures.
     * @param {string} msg 
     * @param {Object} [meta] 
     */
    static warn(msg, meta = {}) {
        const payload = {
            level: 'WARN',
            message: msg,
            timestamp: new Date().toISOString(),
            ...meta
        };
        console.warn(`[${payload.level}] ${payload.message}`, meta);
    }

    /**
     * Error log for critical failures mapping @[skills/zero-trust-cloud-security]
     * @param {string} msg 
     * @param {Error|Object} [err] 
     */
    static error(msg, err = {}) {
        const payload = {
            level: 'ERROR',
            message: msg,
            stack: err instanceof Error ? err.stack : undefined,
            timestamp: new Date().toISOString(),
            ...err
        };
        console.error(`[${payload.level}] ${payload.message}`, err);
    }
}

module.exports = Logger;
