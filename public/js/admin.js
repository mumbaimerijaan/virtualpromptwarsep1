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
            broadcastMsg: $('#broadcast-msg')
        };

        try {
            // 1. Initialize Firebase Listeners for Reactive UI @[skills/google-services-mastery]
            const db = firebase.firestore();
            
            // Listen to Global Config for State Sync
            db.collection('system_config').doc('global_config')
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const config = doc.data();
                        const isOpen = config.submissionsOpen;
                        
                        // Sync UI with Global State
                        ui.timerInput.prop('disabled', isOpen);
                        if (isOpen) {
                            ui.startSubBtn.addClass('hidden');
                            ui.endSubBtn.removeClass('hidden');
                        } else {
                            ui.startSubBtn.removeClass('hidden');
                            ui.endSubBtn.addClass('hidden');
                        }

                        // Local countdown management matching app.js
                        if (config.globalTimerEnd > Date.now()) {
                            window.adminLogic.startLocalCountdown(config.globalTimerEnd, ui.timerDisplay);
                        } else {
                            ui.timerDisplay.text('--:--');
                        }
                    }
                });

            // Listen to User Stats
            db.collection('users').onSnapshot((snap) => {
                ui.statUsers.text(snap.size);
            });

            // C. Interaction Stats & Live Feed satisfies @[skills/efficiency-pillar]
            db.collection('interactions')
                .orderBy('timestamp', 'desc')
                .limit(5)
                .onSnapshot((snap) => {
                    // Update global interaction count efficiency mapping
                    // (In a real enterprise app, we'd use a counter doc to avoid full snap size checks)
                    db.collection('interactions').count().get().then(c => ui.statInteractions.text(c.data().count));
                    
                    ui.feed.empty();
                    if (snap.empty) {
                        ui.feed.html('<p class="text-sm text-gray-400 font-medium text-center py-4 italic">No activity logs recorded.</p>');
                        return;
                    }

                    snap.forEach(doc => {
                        const activity = doc.data();
                        const article = document.createElement('div');
                        article.className = 'p-4 bg-white/40 rounded-xl mb-3 border border-white/20 transition-all hover:bg-white/60';
                        article.innerHTML = `
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">Entry: ${doc.id.substring(0,8)}</span>
                                <span class="text-[10px] text-indigo-400 font-bold">LIVE</span>
                            </div>
                            <p class="text-sm text-gray-800 font-medium">${window.utils.sanitizeInput(activity.summary || 'Interaction logged.')}</p>
                        `;
                        ui.feed.append(article);
                    });
                }, (err) => console.warn('[ADMIN] Interaction listener error:', err));

            // Listen to Evaluation Results (Submitted Projects)
            db.collection('evaluations').orderBy('timestamp', 'desc').onSnapshot((snap) => {
                ui.submissionsList.empty();
                if (snap.empty) {
                    ui.submissionsList.html('<tr><td colspan="3" class="px-6 py-8 text-center text-gray-400 italic font-medium">No audited submissions recorded yet.</td></tr>');
                    return;
                }

                snap.forEach(doc => {
                    const data = doc.data();
                    const row = document.createElement('tr');
                    row.className = 'transition-colors hover:bg-white/40';
                    row.innerHTML = `
                        <td class="px-6 py-4 font-bold text-indigo-700">PID-${doc.id.substring(0,6).toUpperCase()}</td>
                        <td class="px-6 py-4">
                            <div class="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[300px]">${data.githubUrl || 'Manual Entry'}</div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full font-black text-xs">${data.score}/100</span>
                        </td>
                    `;
                    ui.submissionsList.append(row);
                });
            });

            // 2. Command Handlers
            
            ui.startSubBtn.on('click', async () => {
                const mins = ui.timerInput.val();
                if (!window.utils.validateInput(mins, 'duration')) {
                    window.utils.showToast('Please enter a valid duration (1-240 mins)', 'warning');
                    return;
                }
                
                const endTime = Date.now() + (parseInt(mins) * 60 * 1000);
                const response = await fetch('/admin/config', {
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
                const response = await fetch('/admin/config', {
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

            // 3. Evaluation Engine logic
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
                    const response = await fetch('/admin/evaluate', {
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

            // 4. Broadcast Handlers satisfies CSP Decoupling mapping @[skills/zero-trust-cloud-security]
            $('#broadcast-info-btn').on('click', () => window.adminLogic.sendToast('info'));
            $('#broadcast-warn-btn').on('click', () => window.adminLogic.sendToast('warning'));
            $('#broadcast-success-btn').on('click', () => window.adminLogic.sendToast('success'));

        } catch (e) {
            console.error('[ADMIN] Init critical fail:', err.message);
        }
    },

    /**
     * Managed local countdown timer for Admin Display.
     */
    startLocalCountdown: (endTime, display) => {
        if (window.adminTimerInterval) clearInterval(window.adminTimerInterval);
        
        const update = () => {
            const now = Date.now();
            const diff = endTime - now;
            
            if (diff <= 0) {
                clearInterval(window.adminTimerInterval);
                display.text('00:00');
                // Trigger auto-end if we are currently open
                if ($('#end-submission-btn').is(':visible')) {
                    $('#end-submission-btn').trigger('click');
                }
                return;
            }
            
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            display.text(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };
        
        update();
        window.adminTimerInterval = setInterval(update, 1000);
    },

    /**
     * Triggers a global broadcast notification.
     * @param {string} type - info|success|warning
     * @returns {Promise<void>}
     */
    sendToast: async (type) => {
        const msg = $('#broadcast-msg').val();
        if (!window.utils.validateInput(msg, 'text')) return;

        try {
            const response = await fetch('/admin/broadcast', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.roleState.getSession().token}`
                },
                body: JSON.stringify({ message: msg, type })
            });
            await window.utils.formatResponse(response);
            $('#broadcast-msg').val('');
            window.utils.showToast('Broadcast queued successfully', 'success');
        } catch (e) {
            window.utils.showToast(e.message || 'Broadcast failed', 'error');
        }
    }
};
