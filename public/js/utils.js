/**
 * @file utils.js
 * @description Core utility library providing zero-trust sanitization and identifier generation.
 * @module public/js/utils
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/zero-trust-cloud-security]
 */

'use strict';

const namespace = typeof window !== 'undefined' ? window : global;

namespace.utils = {
    /**
     * Regex based sanitization enforcing zero-trust HTML element erasures.
     * @description Deflects XSS and malicious script injections by stripping script tags, handlers, and dangerous attributes.
     * @param {string} input - Raw user-generated string
     * @returns {string} Sanitized safe string mapping
     */
    sanitizeInput: (input) => {
        if (!input || typeof input !== 'string') return '';
        
        let s = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // Remove styles
            .replace(/on\w+="[^"]*"/gi, '')   // Remove event handlers
            .replace(/on\w+='[^']*'/gi, '')
            .replace(/on\w+=\w+/gi, '')
            .replace(/javascript:/gi, '')     // Prevent javascript: URLs
            .replace(/data:/gi, '')           // Prevent data: URLs
            .replace(/</g, '&lt;')            // Escape HTML
            .replace(/>/g, '&gt;')
            .trim();
        
        return s;
    },

    /**
     * Generates a unique 9-character alphanumeric identifier.
     * @description Creates a cryptographic-like random string suitable for DOM IDs or mock interaction tracking.
     * @returns {string} A randomly generated UID.
     */
    uidGenerator: () => Math.random().toString(36).substring(2, 11)
};

// Export fallback for jest usage locally satisfying @[skills/robust-verification-jest]
if (typeof module !== 'undefined') {
    module.exports = namespace.utils;
}

