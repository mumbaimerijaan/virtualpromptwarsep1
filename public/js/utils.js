'use strict';

window.utils = {
    /**
     * Regex based sanitization enforcing zero-trust HTML element erasures.
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
     * Formats ID markers dynamically.
     */
    uidGenerator: () => Math.random().toString(36).substr(2, 9)
};

// Export fallback for jest usage locally
if (typeof module !== 'undefined') {
    module.exports = window.utils;
}
