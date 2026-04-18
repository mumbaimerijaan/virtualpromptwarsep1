/**
 * @file utils.js
 * @description Core utility library providing zero-trust sanitization and master UI orchestration.
 * @module public/js/utils
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/zero-trust-cloud-security]
 */

'use strict';

const namespace = typeof window !== 'undefined' ? window : global;

namespace.utils = {
    /**
     * Regex based sanitization enforcing zero-trust HTML element erasures.
     * @description Deflects XSS and malicious script injections mapping @[skills/security-pillar]
     * @param {string} input - Raw user-generated string
     * @returns {string} Sanitized safe string mapping
     */
    sanitizeInput: (input) => {
        if (!input || typeof input !== 'string') return '';
        
        return input
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
    },

    /**
     * Generates a unique 9-character alphanumeric identifier.
     * @returns {string} A randomly generated UID mapping @[skills/resilient-data-patterns]
     */
    uidGenerator: () => Math.random().toString(36).substring(2, 11),

    /**
     * Master Toast Orchestration mapping @[skills/modular-frontend-orchestration]
     * @description Displays a real-time notification with automated dismissal.
     * @param {string} message - Content
     * @param {string} type - 'info' | 'success' | 'warning' | 'error'
     */
    showToast: (message, type = 'info') => {
        const container = $('#toast-container');
        if (!container.length) return;

        const id = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${id}" class="toast-item ${type}">
                <div class="flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <p class="text-sm font-bold text-gray-800">${message}</p>
            </div>
        `;

        container.append(toastHtml);

        // Auto-dismissal logic mapping @[skills/high-performance-web-optimization]
        setTimeout(() => {
            $(`#${id}`).css('animation', 'toast-out 0.5s ease forwards');
            setTimeout(() => {
                $(`#${id}`).remove();
            }, 500);
        }, 5000);
    },

    /**
     * Centralized input validation mapping @[skills/enterprise-js-standards]
     * @param {string|number} value - Input content
     * @param {string} type - 'text' | 'url' | 'duration' | 'email'
     * @returns {boolean}
     */
    validateInput: (value, type) => {
        if (!value && type !== 'duration') return false;
        
        switch(type) {
            case 'url':
                // Refined regex supporting localhost and standard TLDs satisfies @[skills/efficiency-pillar]
                return /^(https?:\/\/)?(localhost|[\da-z.-]+\.[a-z.]{2,6})(:[\d]+)?([/\w .-]*)*\/?$/.test(value);
            case 'duration':
                const mins = parseInt(value);
                return !isNaN(mins) && mins > 0 && mins <= 240;
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'text':
            default:
                return typeof value === 'string' && value.trim().length > 0;
        }
    },

    /**
     * Standardizes API response handling with unified error mapping.
     * @param {Response} response - Native Fetch Response
     * @returns {Promise<Object>}
     */
    formatResponse: async (response) => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }
        return data;
    }
};

// Export fallback for jest usage locally satisfying @[skills/robust-verification-jest]
if (typeof module !== 'undefined') {
    module.exports = namespace.utils;
}
