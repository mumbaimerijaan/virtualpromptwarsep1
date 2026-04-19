'use strict';

/**
 * @file services.js
 * @description Centralized API abstraction layer for event companion logic.
 * @module public/js/services
 * @see @[skills/api-design-for-google-cloud]
 */

/**
 * Utility function for resilient network calls with Exponential Backoff and Jitter.
 * @description Satisfies 'Resilience & Stability' requirements by handling network/5xx failures.
 * @param {string} url 
 * @param {Object} options 
 * @param {number} [retries=3] 
 * @param {number} [backoff=500] 
 * @returns {Promise<Response>}
 */
async function robustFetch(url, options, retries = 3, backoff = 500) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            
            // Retry only on 5xx or network errors satisfies @[skills/resilient-data-patterns]
            if (!response.ok && response.status >= 500 && i < retries) {
                const delay = backoff * Math.pow(2, i) + Math.random() * 100;
                console.warn(`[RETRY] Attempt ${i + 1} for ${url} failed with ${response.status}. Retrying in ${Math.round(delay)}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            return response;
        } catch (err) {
            if (i < retries) {
                const delay = backoff * Math.pow(2, i) + Math.random() * 100;
                console.warn(`[RETRY] Network error on attempt ${i + 1}. Retrying in ${Math.round(delay)}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw err;
        }
    }
}

let bootstrapPromise = null;

window.services = {

    /**
     * Globally bootstraps the Firebase environment satisfies @[skills/google-services-mastery].
     * @description Ensures the '[DEFAULT]' app is created exactly once before any secondary service calls.
     * @returns {Promise<void>}
     */
    bootstrap: async () => {
        if (bootstrapPromise) return bootstrapPromise;

        bootstrapPromise = (async () => {
            try {
                const configRes = await fetch('/api/v1/config');
                if (!configRes.ok) throw new Error('Bootstrap Failure: Network');
                const firebaseConfig = await configRes.json();

                if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    console.log('[ARCHITECT] Global Bootstrap Successful for:', firebaseConfig.projectId);
                }
            } catch (err) {
                console.error('[ARCHITECT] Critical Bootstrap Failure:', err.message);
                throw err;
            }
        })();

        return bootstrapPromise;
    },

    /**
     * Executes the Automated Project Audit payload.
     * @param {string} cloudRunUrl 
     * @param {string} githubUrl 
     * @returns {Promise<Object>}
     */
    submitProject: async (cloudRunUrl, githubUrl) => {
        const { token } = window.roleState.getSession();
        
        const response = await robustFetch('/api/v1/submit-project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                cloudRunUrl: window.utils.sanitizeInput(cloudRunUrl), 
                githubUrl: window.utils.sanitizeInput(githubUrl) 
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `Submission failed: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Executes the generative payload network call.
     * @param {string} rawNotes - HTML un-sanitized string 
     * @param {string} contactId - Potential QR contact identifier
     * @returns {Promise<Object>}
     */
    generateInsights: async (rawNotes, contactId) => {
        const { token } = window.roleState.getSession();
        const safeNotes = window.utils.sanitizeInput(rawNotes);

        const response = await robustFetch('/api/v1/generate-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notes: safeNotes, contactId: window.utils.sanitizeInput(contactId) })
        });

        if (!response.ok) {
            throw new Error(`Failed insights calculation: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Retrieves the top 3 networkers globally.
     */
    fetchLeaderboard: async () => {
        const { token } = window.roleState.getSession();
        
        const response = await robustFetch('/api/v1/leaderboard', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load leaderboard: ${response.status}`);
        }

        return await response.json();
    },

    /**
     * Retrieves robust dashboard aggregations for admin overviews.
     */
    fetchAdminStats: async () => {
        const { token } = window.roleState.getSession();
        
        const response = await robustFetch('/admin/dashboard-stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load admin stats: ${response.status}`);
        }
    
        return await response.json();
    },

    /**
     * Retrieves the user profile for the authorized attendee.
     * @returns {Promise<Object>}
     */
    fetchProfile: async () => {
        const { token } = window.roleState.getSession();
        
        const response = await robustFetch('/api/v1/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load profile: ${response.status}`);
        }

        return await response.json();
    }
};
