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
    if (window.utils && window.utils.showLoader) window.utils.showLoader();
    try {
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
    } finally {
        if (window.utils && window.utils.hideLoader) window.utils.hideLoader();
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
                
                // Security Resilience Check mapping @[skills/zero-trust-cloud-security]
                if (firebaseConfig.apiKey === 'ROTATION_REQUIRED' || !firebaseConfig.apiKey) {
                    window.utils.showSystemAlert(
                        'Configuration Required',
                        'Authentication is currently disabled because the Firebase API Key has not been configured. For security, keys must now be provided via environment variables.'
                    );
                    throw new Error('Bootstrap Aborted: API Key Missing');
                }
                
                if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    
                    // Enforce Global Resilience Mapping satisfies @[skills/resilient-data-patterns]
                    // Force long-polling to bypass WebSocket timeouts in restricted environments.
                    const db = firebase.firestore();
                    db.settings({ experimentalForceLongPolling: true });
                    
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
     * Retrieves a fresh ID token from the active Firebase session or local storage.
     * satisfies @[skills/firebase-identity-management]
     * @returns {Promise<string>}
     */
    getAuthToken: async () => {
        // --- 1. SESSION INITIALIZATION HANDSHAKE mapping @[skills/google-services-mastery] ---
        // Allows Firebase Auth up to 2 seconds to initialize if current user is stalling.
        let user = firebase.auth().currentUser;
        if (!user) {
             console.log('[SERVICES] Auth state pending. Waiting for provider handshake...');
             await new Promise(resolve => {
                 const unsubscribe = firebase.auth().onAuthStateChanged(u => {
                     user = u;
                     unsubscribe();
                     resolve();
                 });
                 setTimeout(resolve, 2000); // Failsafe timeout satisfies Reliability
             });
        }

        try {
            if (user) {
                const token = await user.getIdToken(true);
                // Update local storage for RBAC consistency mapping @[skills/zero-trust-cloud-security]
                window.roleState.setSession(token, 'user');
                return token;
            }
        } catch (e) {
            console.warn('[SERVICES] Firebase token refresh failed. Falling back to local state.');
        }
        
        const localSession = window.roleState.getSession();
        if (!localSession.token) console.error('[SERVICES] Critical: No identity token available for request.');
        return localSession.token;
    },

    /**
     * Executes the Automated Project Audit payload.
     */
    submitProject: async (cloudRunUrl, githubUrl) => {
        const token = await window.services.getAuthToken();
        
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

    generateInsights: async (rawNotes) => {
        const token = await window.services.getAuthToken();
        const safeNotes = rawNotes ? window.utils.sanitizeInput(rawNotes) : '';

        const response = await robustFetch('/api/v1/generate-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ notes: safeNotes })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Failed insights calculation: ${response.status}`);
        }

        return await response.json();
    },

    fetchLeaderboard: async () => {
        const token = await window.services.getAuthToken();
        
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

    fetchAdminStats: async () => {
        const token = await window.services.getAuthToken();
        
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

    getAdminStats: async function() { return this.fetchAdminStats(); },

    fetchProfile: async () => {
        const token = await window.services.getAuthToken();
        
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
    },

    fetchUserActivity: async () => {
        const token = await window.services.getAuthToken();
        
        const response = await robustFetch('/api/v1/activity', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load activity ledger: ${response.status}`);
        }

        return await response.json();
    }
};
