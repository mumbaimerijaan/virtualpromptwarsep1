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

    /**
     * Globally blocks interaction during network/auth handshakes satisfies @[skills/resilient-data-patterns].
     */
    loaderCount: 0,
    showLoader: () => {
        namespace.utils.loaderCount++;
        const loader = $('#global-loader');
        if (loader.length && namespace.utils.loaderCount === 1) {
            loader.css('display', 'flex').attr('aria-hidden', 'false');
        }
    },
    hideLoader: () => {
        namespace.utils.loaderCount = Math.max(0, namespace.utils.loaderCount - 1);
        const loader = $('#global-loader');
        if (loader.length && namespace.utils.loaderCount === 0) {
            loader.fadeOut(200, function() { 
                $(this).attr('aria-hidden', 'true');
            });
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
    },
    /**
     * Show a persistent, non-dismissible system alert for critical configuration errors.
     * satisfies @[skills/resilient-data-patterns]
     * @param {string} title 
     * @param {string} message 
     */
    showSystemAlert: (title, message) => {
        const alertHtml = `
            <div id="system-critical-alert" class="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <div class="glass-pwa max-w-md p-10 rounded-4xl shadow-2xl border-white/40 space-y-6">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h2 class="text-2xl font-extrabold text-blue-900/80 tracking-tight leading-tight">${title}</h2>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed">${message}</p>
                    <div class="pt-4">
                        <code class="block bg-slate-100 p-4 rounded-2xl text-[10px] text-left overflow-x-auto font-mono text-slate-600">
                            # To fix, add this to your .env file:<br>
                            FIREBASE_API_KEY=your_key_here
                        </code>
                    </div>
                </div>
            </div>
        `;
        $('body').append(alertHtml);
    }
};

if (typeof module !== 'undefined') module.exports = namespace.utils;
