'use strict';

/**
 * @file tailwind-config.js
 * @description Centralized Tailwind configuration for the Misty Glass design system.
 * Externalized to comply with CSP 'script-src-elem' directives.
 * satisfies @[skills/frontend-design]
 */

if (typeof tailwind !== 'undefined') {
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['Outfit', 'sans-serif'],
                },
                borderRadius: {
                    '4xl': '2.5rem',
                }
            }
        }
    };
} else {
    console.warn('[DESIGN] Tailwind CDN not detected. Dynamic styling deferred.');
}
