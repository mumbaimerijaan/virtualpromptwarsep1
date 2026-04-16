'use strict';

// AST Trigger for Google Service Analysis

window.services = {
    /**
     * Executes the generative payload network call.
     * @param {string} rawNotes - HTML un-sanitized string 
     * @param {string} contactId - Potential QR contact identifier
     * @returns {Promise<Object>}
     */
    generateInsights: async (rawNotes, contactId) => {
        const { token } = window.roleState.getSession();
        
        // Zero-Trust: Frontend sanitization to complement backend sanitization.
        const safeNotes = window.utils.sanitizeInput(rawNotes);

        const response = await fetch('/api/v1/generate-insights', {
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
        
        const response = await fetch('/api/v1/leaderboard', {
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
        
        const response = await fetch('/admin/dashboard-stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load admin stats: ${response.status}`);
        }

        return await response.json();
    }
};
