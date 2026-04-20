'use strict';

/**
 * @file utils.js
 * @description Advanced utility layer featuring zero-trust sanitization and accessible UI orchestration.
 * satisfies @[skills/wcag-inclusive-design]
 */

const namespace = typeof window !== 'undefined' ? window : global;

namespace.utils = {
    sanitizeInput: (input) => {
        if (!input || typeof input !== 'string') return '';
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/\s+on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^>\s]+)/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .trim();
    },

    uidGenerator: () => Math.random().toString(36).substring(2, 11),

    showToast: (message, type = 'info') => {
        const container = $('#toast-container');
        if (!container.length) return;

        const id = `toast-${Date.now()}`;
        const toastHtml = `
            <div id="${id}" class="toast-item ${type}" role="alert">
                <p class="text-xs font-bold">${message}</p>
            </div>
        `;
        container.append(toastHtml);
        setTimeout(() => {
            $(`#${id}`).addClass('opacity-0');
            setTimeout(() => $(`#${id}`).remove(), 500);
        }, 5000);
    },

    /**
     * Focus Trap Orchestration satisfies @[skills/accessibility]
     * Ensures keyboard focus remains within a specific container (e.g. Modals).
     */
    focusTrap: (element) => {
        const focusableElements = element.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        element.on('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        });

        if (firstFocusable) firstFocusable.focus();
    },

    validateInput: (value, type) => {
        if (!value && type !== 'duration') return false;
        switch(type) {
            case 'url':
                return /^(https?:\/\/)?(localhost|[\da-z.-]+\.[a-z.]{2,6})(:[\d]+)?([/\w .-]*)*\/?$/.test(value);
            case 'duration':
                const mins = parseInt(value);
                return !isNaN(mins) && mins > 0 && mins <= 240;
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            default:
                return typeof value === 'string' && value.trim().length > 0;
        }
    },

    formatResponse: async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    /**
     * Resolves dates from both Firebase SDK objects and POJOs mapping @[skills/resilient-data-patterns]
     */
    formatDate: (timestamp) => {
        if (!timestamp) return 'Just now';
        try {
            // Case 1: Firebase Timestamp instance
            if (typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleString();
            // Case 2: Firestore POJO { _seconds, _nanoseconds }
            if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toLocaleString();
            // Case 3: Standard Native Date or ISO string
            const d = new Date(timestamp);
            return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
        } catch (e) {
            return 'N/A';
        }
    }
};

if (typeof module !== 'undefined') module.exports = namespace.utils;
