'use strict';

window.adminLogic = {
    init: async () => {
        try {
            const data = await window.services.fetchAdminStats();
            
            $('#stat-users').text(data.usersCount);
            $('#stat-interactions').text(data.interactionsCount);

            const $feed = $('#admin-feed-container');
            
            if (data.recentActivity && data.recentActivity.length > 0) {
                 data.recentActivity.forEach(activity => {
                      const article = document.createElement('div');
                      article.className = 'p-4 bg-white/40 rounded-xl mb-3 border border-white/20';
                      
                      const summaryTrunc = window.utils.sanitizeInput(activity.summary).substring(0, 80) + '...';
                      article.innerHTML = `
                          <div class="flex justify-between items-center mb-1">
                              <span class="text-xs font-bold text-gray-500 uppercase">Interaction Hash: ${window.utils.sanitizeInput(activity.id)}</span>
                          </div>
                          <p class="text-sm text-gray-800">${summaryTrunc}</p>
                      `;
                      $feed.append(article);
                 });
            } else {
                 $feed.append('<p class="text-sm text-gray-500">No activity logged globally yet.</p>');
            }

        } catch (err) {
            console.error('Failed to parse admin statistics', err);
            $('#stat-users').text('ERR');
            $('#stat-interactions').text('ERR');
        }
    }
}
