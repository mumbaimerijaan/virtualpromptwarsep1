/**
 * @file app.js
 * @description Root Initializer executing logic depending safely on routing boundaries.
 * @module public/js/app
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

/**
 * Main application entry point.
 * @returns {void}
 */
$(document).ready(() => {
    // 1. Boundary enforcement executes universally.
    if (window.roleState && typeof window.roleState.enforceViewBoundary === 'function') {
        window.roleState.enforceViewBoundary();
    }

    const currentPath = window.location.pathname;

    // 2. Map route bounds strictly to internal logic execution wrappers
    if (currentPath === '/' || currentPath === '/index.html') {
         if (window.authLogic) window.authLogic.init();
    } else if (currentPath.includes('onboarding.html')) {
         if (window.onboardingLogic) window.onboardingLogic.init();
    } else if (currentPath.includes('admin-dashboard')) {
         if (window.adminLogic) window.adminLogic.init();
         $('#logout-btn').on('click', () => { window.roleState.clearSession(); window.location.replace('/'); });
    } else if (currentPath.includes('user-dashboard')) {
         // jQuery Memoization Cache satisfies @[skills/high-performance-web-optimization]
         const ui = {
             qrCode: $('#user-qr-code'),
             dashName: $('#dash-name'),
             welcomeHeading: $('#welcome-heading'),
             navAvatar: $('#nav-avatar-img'),
             dashCompany: $('#dash-company'),
             dashRole: $('#dash-role'),
             logoutBtn: $('#logout-btn'),
             col1: $('#board-col-1'),
             col2: $('#board-col-2'),
             leaderboardContainer: $('#leaderboard-container')
         };

         if (window.qrLogic) window.qrLogic.init();
         if (window.interactionsLogic) window.interactionsLogic.init();
         
         ui.logoutBtn.on('click', () => { 
             window.roleState.clearSession(); 
             window.location.replace('/'); 
         });

         /**
          * Logic mapping concurrent profile and leaderboard fetches.
          * @description Optimized via memoized UI selectors.
          */
         const fetchDashboardProfile = async () => {
             try {
                 const { token } = window.roleState.getSession();
                 if (!token) return;

                 const payload = JSON.parse(atob(token.split('.')[1]));
                 const uid = payload.user_id || 'unknown';
                 
                 // Initial UI state setup from token if profile fetch lags
                 ui.qrCode.attr('src', `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=contact_${uid}&color=2563eb`);
                 if (payload.name) {
                      ui.dashName.text(payload.name);
                      ui.welcomeHeading.text(`Welcome, ${payload.name.split(' ')[0]}!`);
                      ui.navAvatar.text(payload.name[0].toUpperCase());
                 }

                 // Parallel Fetch for Profile and Leaderboard
                 const [profileRes, leaderboardRes] = await Promise.all([
                     fetch('/api/v1/profile', { headers: { 'Authorization': `Bearer ${token}` }}),
                     window.services.fetchLeaderboard()
                 ]);

                 if (profileRes.ok) {
                      const data = await profileRes.json();
                      const p = data.profile;
                      if (p) {
                           ui.dashName.text(p.name);
                           ui.welcomeHeading.text(`Welcome, ${p.name.split(' ')[0]}!`);
                           ui.dashCompany.text(p.company || 'Private Participant');
                           ui.dashRole.text(p.jobRole || 'Event Attendee');
                           ui.navAvatar.text(p.name[0].toUpperCase());
                      }
                 }

                 if (leaderboardRes.success) {
                      renderLeaderboard(leaderboardRes.leaderboard);
                 }
             } catch (e) {
                 console.error("Dashboard initialization failed", e);
             }
         };

         /**
          * Renders the networking leaderboard into the memoized grid layout.
          * @param {Array} board - Ranked users list
          */
         const renderLeaderboard = (board) => {
             ui.col1.empty();
             // Removing pulses efficiently
             ui.leaderboardContainer.find('.animate-pulse').remove();

             board.forEach((user, index) => {
                  const rank = index + 1;
                  const itemHtml = `
                      <div class="glass-btn p-4 rounded-2xl border border-white/50 flex items-center justify-between transition-all hover:bg-white/60">
                          <div class="flex items-center gap-4">
                              <span class="text-xl font-black text-indigo-300 italic w-6">${rank}</span>
                              <div class="w-12 h-12 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center font-bold text-indigo-700 overflow-hidden">
                                  ${user.name[0].toUpperCase()}
                              </div>
                              <div>
                                  <h5 class="text-sm font-bold text-gray-800">${user.name}${rank === 1 ? ' 🏆' : ''}</h5>
                                  <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">${user.interactionCount || 0} connections</p>
                              </div>
                          </div>
                          <div class="flex items-center gap-1.5">
                              <span class="text-lg font-black text-gray-700">${user.interactionCount || 0}</span>
                              <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                          </div>
                      </div>
                  `;
                  
                  if (rank <= 2) {
                      ui.col1.append(itemHtml);
                  } else {
                      ui.col2.prepend(itemHtml);
                  }
             });
         };
         
         fetchDashboardProfile();
    }

    // Register Service Worker enabling offline capabilities PWA maps
    if ('serviceWorker' in navigator) {
         window.addEventListener('load', () => {
             navigator.serviceWorker.register('/service-worker.js').then(() => {
                 // Suppressed registration notifications internally 
             }, (error) => {
                 console.log("Service Worker rejection maps skipped:", error);
             });
         });
    }
});
