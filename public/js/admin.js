/**
 * @file admin.js
 * @description Admin dashboard orchestration mapping global stats and audit feeds.
 * @module public/js/admin
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

window.adminLogic = {
    /**
     * Initializes the admin console with memoized UI selectors.
     * @description Ensures high efficiency during global activity rendering.
     * @returns {Promise<void>}
     */
    init: async () => {
        // Memoization Cache satisfies @[skills/high-performance-web-optimization]
        const ui = {
            statUsers: $('#stat-users'),
            statInteractions: $('#stat-interactions'),
            feed: $('#admin-feed-container')
        };

        try {
            const data = await window.services.fetchAdminStats();
            
            ui.statUsers.text(data.usersCount);
            ui.statInteractions.text(data.interactionsCount);

            if (data.recentActivity && data.recentActivity.length > 0) {
                 ui.feed.empty();
                 data.recentActivity.forEach(activity => {
                      const article = document.createElement('div');
                      article.className = 'p-4 bg-white/40 rounded-xl mb-3 border border-white/20 animate-in fade-in slide-in-from-top-2';
                      
                      const summaryTrunc = window.utils.sanitizeInput(activity.summary).substring(0, 80) + '...';
                      article.innerHTML = `
                          <div class="flex justify-between items-center mb-1">
                              <span class="text-xs font-bold text-gray-500 uppercase">Interaction Hash: ${window.utils.sanitizeInput(activity.id)}</span>
                          </div>
                           <p class="text-sm text-gray-800">${summaryTrunc}</p>
                       `;
                       ui.feed.append(article);
                  });
             } else {
                  ui.feed.html('<p class="text-sm text-gray-500">No activity logged globally yet.</p>');
             }

        } catch (err) {
            console.error('Failed to parse admin statistics', err);
            ui.statUsers.text('ERR');
            ui.statInteractions.text('ERR');
        }
    }
}

