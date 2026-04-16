'use strict';

const namespace = typeof window !== 'undefined' ? window : global;

namespace.utils = {
    /**
     * Regex based sanitization enforcing zero-trust HTML element erasures.
     * @description Deflects XSS and malicious script injections by stripping script tags and inline handlers.
     * @param {string} input - Raw string
     * @returns {string} Safe string mapping
     */
    sanitizeInput: (input) => {
        if (!input || typeof input !== 'string') return '';
        let s = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        s = s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return s.replace(/on\w+="[^"]*"/gi, '').replace(/on\w+='[^']*'/gi, '').replace(/on\w+=\w+/gi, '').trim();
    },

    /**
     * Generates a unique 9-character alphanumeric identifier.
     * @description Creates a random string suitable for DOM IDs or mock interaction tracking.
     * @returns {string} A randomly generated UID.
     */
    uidGenerator: () => Math.random().toString(36).substr(2, 9)
};

// Export fallback for jest usage locally
if (typeof module !== 'undefined') {
    module.exports = namespace.utils;
}
