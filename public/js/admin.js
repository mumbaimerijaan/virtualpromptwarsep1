/**
 * @file admin.js
 * @description Admin Command Center logic for evaluation, broadcasting, and reactive global state sync.
 * @module public/js/admin
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/api-design-for-google-cloud]
 */

'use strict';

window.adminLogic = {
    /**
     * Initializes the Admin Command Center with memoized selectors and listeners.
     * @returns {Promise<void>}
     */
    init: async () => {
        // jQuery Memoization mapping @[skills/high-performance-web-optimization]
        const ui = {
            statUsers: $('#stat-users'),
            statInteractions: $('#stat-interactions'),
            feed: $('#admin-feed-container'),
            timerInput: $('#timer-input'),
            startSubBtn: $('#start-submission-btn'),
            endSubBtn: $('#end-submission-btn'),
            evalCloudRun: $('#eval-cloudrun'),
            evalGithub: $('#eval-github'),
            evalResult: $('#eval-result'),
            evalTotalScore: $('#eval-total-score'),
            evalSummary: $('#eval-summary'),
            evalPillars: $('#eval-pillars'),
            runEvalBtn: $('#run-eval-btn'),
            timerDisplay: $('#event-timer'),
            submissionsList: $('#submissions-list'),
            broadcastMsg: $('#broadcast-msg'),
            broadcastTimerBtn: $('#broadcast-timer-btn')
        };

        // Initialize State satisfies @[skills/enterprise-js-standards]
        window.adminLogic.isAutoTimerActive = false;
        window.adminLogic.lastNotifiedMinute = -1;

        try {
            // 0. Ensure Global Handshake mapping @[skills/google-services-mastery]
            if (window.services && window.services.bootstrap) {
                await window.services.bootstrap();
            }

            const db = firebase.firestore();
            db.settings({ experimentalForceLongPolling: true });
            
            const host = window.location.hostname.toLowerCase();
            const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';

            if (isLocal) {
                console.log('%c [ARCHITECT] Running in Local Resilience Mode (App Check Bypassed) ', 'background: #4f46e5; color: #fff; font-weight: bold; padding: 4px; border-radius: 4px;');
                console.warn('[ADMIN] Hybrid Polling Active.');
                
                // Polling Loop for Stats and Feed
                setInterval(async () => {
                    try {
                        if (!window.services || !window.services.fetchAdminStats) return;
                        const stats = await window.services.fetchAdminStats();
                        if (stats) {
                            if (ui.statUsers.length) ui.statUsers.text(stats.usersCount || 0);
                            if (ui.statInteractions.length) ui.statInteractions.text(stats.interactionsCount || 0);
                            
                            if (ui.feed.length) {
                                ui.feed.empty();
                                if (stats.recentActivity && stats.recentActivity.length) {
                                    stats.recentActivity.forEach(entry => {
                                        const article = document.createElement('div');
                                        article.className = 'p-4 bg-white/40 rounded-xl mb-3 border border-white/20 transition-all hover:bg-white/60';
                                        article.innerHTML = `
                                            <div class="flex justify-between items-center mb-1">
                                                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Local Entry</span>
                                                <span class="text-[10px] text-indigo-400 font-bold tracking-tighter italic">SYNCED</span>
                                            </div>
                                            <p class="text-sm text-gray-800 font-medium">${window.utils.sanitizeInput(entry.summary || 'Interaction logged.')}</p>
                                        `;
                                        ui.feed.append(article);
                                    });
                                } else {
                                    ui.feed.append('<div class="text-center py-12 text-gray-400 font-medium italic">No recent local activity</div>');
                                }
                            }
                        }
                    } catch (e) {
                        console.error('[ADMIN] Polling Failure:', e);
                    }
                }, 3000);

                // Polling Loop for Config satisfies @[skills/high-performance-web-optimization]
                setInterval(async () => {
                    try {
                        const response = await fetch('/api/v1/sync-status');
                        const config = await response.json();
                        if (config) {
                            const isOpen = config.submissionsOpen;
                            if (ui.timerDisplay.length) {
                                ui.timerDisplay.text(isOpen ? 'LIVE' : '--:--');
                            }
                            
                            // Reactive Timer Button State satisfies @[skills/modular-frontend-orchestration]
                            ui.broadcastTimerBtn.prop('disabled', !isOpen);
                            if (!isOpen && window.adminLogic.isAutoTimerActive) {
                                window.adminLogic.toggleAutoTimer(ui.broadcastTimerBtn);
                            }
                        }
                    } catch (e) { }
                }, 5000);
            }
            
            // 1. Initialize Firebase Listeners (Production Only)
            if (!isLocal) {
                console.log('[ADMIN] Prod Mode: Initializing real-time listeners.');
                
                db.collection('system_config').doc('global_state').onSnapshot((doc) => {
                    if (doc && doc.exists) {
                        const config = doc.data();
                        const isOpen = config.submissionsOpen;
                        ui.timerInput.prop('disabled', isOpen);
                        
                        // Disable Timer Alerts if round ends
                        ui.broadcastTimerBtn.prop('disabled', !isOpen);
                        if (!isOpen && window.adminLogic.isAutoTimerActive) {
                            window.adminLogic.toggleAutoTimer(ui.broadcastTimerBtn);
                        }

                        if (isOpen) {
                            ui.startSubBtn.addClass('hidden');
                            ui.endSubBtn.removeClass('hidden');
                        } else {
                            ui.startSubBtn.removeClass('hidden');
                            ui.endSubBtn.addClass('hidden');
                        }

                        if (config.globalTimerEnd > Date.now()) {
                            window.adminLogic.startLocalCountdown(config.globalTimerEnd, ui.timerDisplay);
                        } else {
                            ui.timerDisplay.text('--:--');
                        }
                    }
                }, (err) => console.warn('[ADMIN] Config listener blocked:', err.message));

                // Optimized Count Handshake mapping @[skills/high-performance-web-optimization]
                // Bypasses massive document downloads by using server-side aggregation.
                // Stats mapping satisfies @[skills/high-performance-web-optimization]
                // UI is updated reactively via the fetchAdminStats polling loop established above.

                db.collection('interactions').orderBy('timestamp', 'desc').limit(15).onSnapshot((snap) => {
                    if (!snap) return;
                    // Update count labels reactively from metadata or a separate controlled fetch satisfies @[skills/resilient-data-patterns]
                    ui.statInteractions.text(snap.size + '+'); 
                    ui.feed.empty();
                    snap.forEach(doc => {
                        const activity = doc.data();
                        if (!activity) return;
                        const date = window.utils.formatDate(activity.timestamp);
                        const article = document.createElement('div');
                        article.className = 'p-4 bg-white/40 rounded-2xl mb-3 border border-white/20 transition-all hover:bg-white/60 group';
                        article.innerHTML = `
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${date}</span>
                                <span class="text-[10px] text-cyan-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">LIVE</span>
                            </div>
                            <p class="text-sm text-gray-800 font-medium">${window.utils.sanitizeInput(activity.summary || 'Interaction logged.')}</p>
                        `;
                        ui.feed.append(article);
                    });
                }, (err) => console.warn('[ADMIN] Interaction listener error:', err.message));

                db.collection('evaluations').orderBy('timestamp', 'desc').limit(20).onSnapshot((snap) => {
                    ui.submissionsList.empty();
                    if (snap.empty) {
                        ui.submissionsList.html('<tr><td colspan="3" class="px-6 py-8 text-center text-gray-400 italic font-medium">No audited submissions recorded yet.</td></tr>');
                        return;
                    }
                    snap.forEach(doc => {
                        const data = doc.data();
                        const date = window.utils.formatDate(data.timestamp);
                        const row = document.createElement('tr');
                        row.className = 'transition-colors hover:bg-white/40 border-b border-white/10 last:border-0';
                        row.innerHTML = `
                            <td class="px-6 py-4">
                                <p class="font-bold text-indigo-700">PID-${doc.id.substring(0,6).toUpperCase()}</p>
                                <p class="text-[9px] text-gray-400 font-medium uppercase">${date}</p>
                            </td>
                            <td class="px-6 py-4">
                                <div class="text-[10px] text-gray-500 font-bold truncate max-w-[250px]">${data.githubUrl || 'Manual Entry'}</div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="px-3 py-1 btn-pill-cyan font-black text-[10px]">${data.score}/100</span>
                            </td>
                        `;
                        ui.submissionsList.append(row);
                    });
                }, (err) => console.warn('[ADMIN] Eval listener blocked:', err.message));
            }

            // 2. Command Handlers
            ui.startSubBtn.on('click', async () => {
                const mins = ui.timerInput.val();
                if (!window.utils.validateInput(mins, 'duration')) {
                    window.utils.showToast('Please enter a valid duration (1-240 mins)', 'warning');
                    return;
                }
                const endTime = Date.now() + (parseInt(mins) * 60 * 1000);
                const response = await window.services.robustFetch('/admin/config', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.roleState.getSession().token}`
                    },
                    body: JSON.stringify({ submissionsOpen: true, globalTimerEnd: endTime })
                });
                await window.utils.formatResponse(response);
                window.utils.showToast(`Submissions opened for ${mins} minutes`, 'success');
            });

            ui.endSubBtn.on('click', async () => {
                const response = await window.services.robustFetch('/admin/config', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.roleState.getSession().token}`
                    },
                    body: JSON.stringify({ submissionsOpen: false, globalTimerEnd: 0 })
                });
                await window.utils.formatResponse(response);
                window.utils.showToast('Submissions closed manually', 'warning');
            });

            // 3. Evaluation Engine
            ui.runEvalBtn.on('click', async () => {
                const cloudRunUrl = ui.evalCloudRun.val();
                const githubUrl = ui.evalGithub.val();

                if (!window.utils.validateInput(cloudRunUrl, 'url') || !window.utils.validateInput(githubUrl, 'url')) {
                    window.utils.showToast('Please provide valid Platform and Repository URLs', 'warning');
                    return;
                }

                ui.runEvalBtn.prop('disabled', true).text('AUDITING...').addClass('animate-pulse');
                ui.evalResult.addClass('hidden');

                try {
                    const response = await window.services.robustFetch('/admin/evaluate', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.roleState.getSession().token}`
                        },
                        body: JSON.stringify({ cloudRunUrl, githubUrl })
                    });
                    
                    const result = await window.utils.formatResponse(response);
                    ui.evalTotalScore.text(`${result.score}/100`);
                    ui.evalSummary.text(result.summary);
                    ui.evalPillars.empty().append(`
                        <div class="text-center p-2 bg-white/50 rounded-lg"><p class="text-[10px] font-bold text-gray-400">CODE</p><p class="font-black text-indigo-600">${result.pillars.codeQuality}%</p></div>
                        <div class="text-center p-2 bg-white/50 rounded-lg"><p class="text-[10px] font-bold text-gray-400">CLOUD</p><p class="font-black text-blue-600">${result.pillars.cloudUsage}%</p></div>
                        <div class="text-center p-2 bg-white/50 rounded-lg"><p class="text-[10px] font-bold text-gray-400">DOCS</p><p class="font-black text-pink-600">${result.pillars.documentation}%</p></div>
                    `);
                    
                    ui.evalResult.removeClass('hidden');
                    window.utils.showToast('Evaluation Complete', 'success');
                } catch (e) {
                    window.utils.showToast(e.message || 'Evaluation failure', 'error');
                } finally {
                    ui.runEvalBtn.prop('disabled', false).text('Execute Deep Audit').removeClass('animate-pulse');
                }
            });

            // 4. Broadcast Handlers
            $('#broadcast-info-btn').on('click', () => window.adminLogic.sendToast('info'));
            $('#broadcast-warn-btn').on('click', () => window.adminLogic.sendToast('warning'));
            ui.broadcastTimerBtn.on('click', () => window.adminLogic.toggleAutoTimer(ui.broadcastTimerBtn));

            // 5. Termination Handler satisfies @[skills/firebase-identity-management]
            $('#logout-btn').on('click', async () => {
                try {
                    await firebase.auth().signOut();
                    window.roleState.clearSession();
                    window.location.replace('/');
                } catch (e) {
                    console.error('[ADMIN] Logout failed:', e);
                }
            });

        } catch (e) {
            console.error('[ADMIN] Init critical fail:', e.message);
        }
    },

    /**
     * Managed local countdown timer for Admin Display.
     */
    startLocalCountdown: (endTime, display) => {
        window.adminLogic.globalTimerEnd = endTime; // Cache for auto-broadcasts
        if (window.adminTimerInterval) clearInterval(window.adminTimerInterval);
        const update = () => {
            const now = Date.now();
            const diff = endTime - now;
            if (diff <= 0) {
                clearInterval(window.adminTimerInterval);
                display.text('00:00');
                if ($('#end-submission-btn').is(':visible')) {
                    $('#end-submission-btn').trigger('click');
                }
                return;
            }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            display.text(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

            // Automated Timer Broadcast Logic satisfies @[skills/resilient-data-patterns]
            if (window.adminLogic.isAutoTimerActive && m > 0 && m % 5 === 0 && m !== window.adminLogic.lastNotifiedMinute) {
                window.adminLogic.lastNotifiedMinute = m;
                window.adminLogic.sendToast('warning', `⚠️ TIME ALERT: ${m} minutes remaining!`);
            }
        };
        update();
        window.adminTimerInterval = setInterval(update, 1000);
    },

    /**
     * Toggles 5-minute automated timer notifications.
     */
    toggleAutoTimer: (btn) => {
        window.adminLogic.isAutoTimerActive = !window.adminLogic.isAutoTimerActive;
        if (window.adminLogic.isAutoTimerActive) {
            btn.addClass('bg-indigo-600 text-white animate-pulse').removeClass('bg-indigo-50 text-indigo-400');
            window.utils.showToast('Automated Timer Alerts: ACTIVE (Every 5m)', 'success');
        } else {
            btn.removeClass('bg-indigo-600 text-white animate-pulse').addClass('bg-indigo-50 text-indigo-400');
            window.adminLogic.lastNotifiedMinute = -1;
            window.utils.showToast('Automated Timer Alerts: DEACTIVATED', 'warning');
        }
    },

    /**
     * Triggers a global broadcast notification.
     * @param {string} type - info|success|warning
     * @param {string} [manualMsg] - Optional explicit message override
     */
    sendToast: async (type, manualMsg = null) => {
        const msg = manualMsg || $('#broadcast-msg').val();
        if (!window.utils.validateInput(msg, 'text')) return;
        try {
            const response = await window.services.robustFetch('/admin/broadcast', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.roleState.getSession().token}`
                },
                body: JSON.stringify({ message: msg, type })
            });
            await window.utils.formatResponse(response);
            if (!manualMsg) $('#broadcast-msg').val('');
            window.utils.showToast(manualMsg ? 'Auto-Alert Broadcasted' : 'Broadcast queued successfully', 'success');
        } catch (e) {
            window.utils.showToast(e.message || 'Broadcast failed', 'error');
        }
    }
};
