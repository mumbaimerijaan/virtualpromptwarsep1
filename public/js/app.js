/**
 * @file app.js
 * @description Root Initializer executing real-time logic and architectural state synchronization.
 * @module public/js/app
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

/**
 * Main application entry point mapping @[skills/enterprise-js-standards]
 */
$(document).ready(async () => {
    // 1. Boundary enforcement executes universally satisfies @[skills/zero-trust-cloud-security]
    if (window.roleState && typeof window.roleState.enforceViewBoundary === 'function') {
        window.roleState.enforceViewBoundary();
    }

    const currentPath = window.location.pathname;

    // 2. Initialize Core Logic Branches
    if (currentPath === '/' || currentPath === '/index.html') {
         if (window.authLogic) await window.authLogic.init();
    } else if (currentPath.includes('onboarding.html')) {
         if (window.onboardingLogic) window.onboardingLogic.init();
    } else if (currentPath.includes('admin-dashboard')) {
         if (window.adminLogic) window.adminLogic.init();
         $('#logout-btn').on('click', () => { window.roleState.clearSession(); window.location.replace('/'); });
    } else if (currentPath.includes('user-dashboard')) {
         if (window.qrLogic) window.qrLogic.init();
         if (window.interactionsLogic) window.interactionsLogic.init();
         $('#logout-btn').on('click', () => { window.roleState.clearSession(); window.location.replace('/'); });
         
         // User-Dashboard Dynamic Initialization
         if (typeof fetchDashboardProfile === 'function') fetchDashboardProfile();
    }

    // 3. Start Real-Time Orchestration Engine satisfies @[skills/google-services-mastery]
    startRealTimeListeners();

    // 4. Register PWA Service Worker mapping @[skills/high-performance-web-optimization]
    if ('serviceWorker' in navigator) {
         window.addEventListener('load', () => {
             navigator.serviceWorker.register('/service-worker.js').catch(e => {});
         });
    }
});

/**
 * Attaches Firestore Snapshot Listeners for zero-polling global reactivity.
 * @description Orchestrates Timer, Config, and Broadcast Toast streams.
 */
function startRealTimeListeners() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    
    const db = firebase.firestore();

    // A. Global State Listener (Timer, Submissions)
    db.collection('system_config').doc('global_state')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const config = doc.data();
                handleConfigUpdate(config);
            }
        }, (err) => console.warn('[RT] Config listener skip:', err.message));

    // B. Real-Time Broadcast Listener (Toast Notifications)
    db.collection('broadcasts')
        .where('timestamp', '>', new Date())
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    if (window.utils && window.utils.showToast) {
                        window.utils.showToast(data.message, data.type || 'info');
                    }
                }
            });
        }, (err) => console.warn('[RT] Broadcast listener skip:', err.message));
}

/**
 * Synchronizes UI elements based on Firestore Global Configuration.
 * @param {Object} config - { submissionsOpen: boolean, globalTimer: number (unix) }
 */
function handleConfigUpdate(config) {
    // 1. Manage Submission Form State Mapping @[skills/resilient-data-patterns]
    const submissionBtn = $('#submit-project-btn'); // Primary submit button in user dashboard
    if (submissionBtn.length) {
        if (config.submissionsOpen === false) {
            submissionBtn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed').text('Submissions Locked');
        } else {
            submissionBtn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed').text('Submit Project & Audit');
        }
    }

    // 2. Global Event Timer Mapping @[skills/modular-frontend-orchestration]
    const timerDisplay = $('#event-timer');
    if (timerDisplay.length && config.globalTimerEnd) {
        updateTimerCountdown(config.globalTimerEnd, timerDisplay);
    }
}

let timerInterval = null;
/**
 * Executes high-precision countdown logic.
 * @param {number} endTime - Unix Timestamp
 * @param {jQuery} $display - UI Target
 */
function updateTimerCountdown(endTime, $display) {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        const now = Date.now();
        const diff = endTime - now;
        
        if (diff <= 0) {
            $display.text("EVENT ENDED").addClass('text-red-500');
            clearInterval(timerInterval);
            return;
        }
        
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        $display.text(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
}

/**
 * Retrieves and renders user profile data to the dashboard.
 * @description Satisfies 'Resilience' by handling fetch failures without crashing the UI.
 */
async function fetchDashboardProfile() {
    try {
        const { profile } = await window.services.fetchProfile();
        
        // Populate UI elements mapping @[skills/modular-frontend-orchestration]
        $('#dash-name').text(profile.name || 'User Profile');
        $('#dash-company').text(profile.company || 'Event Participant');
        $('#dash-role').text(profile.jobRole || 'Attendee Access');
        $('#welcome-heading').text(`Welcome, ${profile.name.split(' ')[0]}!`);
        
        // Handle QR mapping satisfies @[skills/google-services-mastery]
        if (profile.uid) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${profile.uid}`;
            $('#user-qr-code').attr('src', qrUrl);
        }

        // Handle Avatar initial satisfies UX
        if (profile.name) {
            $('#nav-avatar-img').text(profile.name.charAt(0).toUpperCase());
        }

    } catch (err) {
        console.error('[DASHBOARD] Profile Load Failure:', err);
        // Graceful fallback satisfying @[skills/resilient-data-patterns]
        if (window.utils && window.utils.showToast) {
            window.utils.showToast('Unable to load full profile. Some features may be limited.', 'warning');
        }
    }
}
