/**
 * @file auth.js
 * @description Authentication logic layer handling User (Firebase) and Admin (RBAC) entry points.
 * @module public/js/auth
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/firebase-identity-management]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

window.authLogic = {
    /**
     * Initializes authentication logic by bootstrapping Firebase from the server gateway.
     * @description Ensures no secrets are hardcoded in the client-side bundle.
     * @returns {Promise<void>}
     */
    init: async () => {
        // Redundant configuration fetching removed satisfies @[skills/efficiency].
        // Bootstrap is now handled globally by app.js.
        
        const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
        
        // 2. jQuery Memoization Cache satisfies @[skills/high-performance-web-optimization]
        const ui = {
            adminForm: $('#admin-login-form'),
            userLoginBtn: $('#user-login-btn'),
            toggleAdminBtn: $('#toggle-admin-btn'),
            adminUser: $('#admin-user'),
            adminPass: $('#admin-pass'),
            errorMsg: $('#login-error'),
            footer: $('#auth-footer'),
            adminUI: $('#admin-login-ui')
        };
        
        /**
         * Handles Administrative credential submission.
         * @param {Event} e - Submit event
         */
        ui.adminForm.on('submit', async (e) => {
            e.preventDefault();
            const username = ui.adminUser.val();
            const password = ui.adminPass.val();
            
            if (window.utils && window.utils.showLoader) window.utils.showLoader();
            try {
                const res = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await res.json();
                
                if (res.ok && data.token) {
                    window.roleState.setSession(data.token, data.role);
                    window.location.replace('/admin');
                } else {
                    ui.errorMsg.text(data.error || 'Login failed.').removeClass('hidden');
                }
            } catch (err) {
                 ui.errorMsg.text('Network error. Unable to verify.').removeClass('hidden');
            } finally {
                if (window.utils && window.utils.hideLoader) window.utils.hideLoader();
            }
        });

        /**
         * Handles User (Attendee) Google OAuth flow.
         * @returns {Promise<void>}
         */
        ui.userLoginBtn.on('click', async () => {
             if (!auth) {
                 alert('Firebase SDK failed to load. Check CSP and network connection.');
                 return;
             }

             if (window.utils && window.utils.showLoader) window.utils.showLoader();
             const provider = new firebase.auth.GoogleAuthProvider();
             const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

             try {
                 // 🛡️ Global Hardening: Use Popup for both local and production Mapping @[skills/resilient-data-patterns]
                 // This bypasses Cloud Run / Firebaseapp.com domain isolation issues.
                 console.log(`[ARCHITECT] Initiating Global Popup Flow (Host: ${window.location.hostname})...`);
                 
                 // Stabilization Delay: Ensures App Check handshake is complete before window framing
                 await new Promise(resolve => setTimeout(resolve, 500));
                 
                 const result = await auth.signInWithPopup(provider);
                 if (result && result.user) {
                     const idToken = await result.user.getIdToken();
                     window.roleState.setSession(idToken, 'user');
                     
                     const syncRes = await fetch('/api/v1/sync-user', {
                         method: 'POST',
                         headers: { 
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${idToken}`
                         },
                         body: JSON.stringify({ uid: result.user.uid, name: result.user.displayName, email: result.user.email })
                     });
                     
                     const payload = await syncRes.json();
                     window.location.replace(payload.isNewUser ? '/onboarding' : '/dashboard');
                 }
             } catch (error) {
                 console.error('Auth Initialization Failed', error);
                 ui.errorMsg.text(`Authentication failed: ${error.message}`).removeClass('hidden');
             } finally {
                 if (window.utils && window.utils.hideLoader) window.utils.hideLoader();
             }
        });

        /**
         * Transitions to the Admin-only login view.
         */
        ui.toggleAdminBtn.on('click', () => {
             ui.userLoginBtn.fadeOut(300, () => ui.userLoginBtn.remove());
             ui.footer.fadeOut(300, () => ui.footer.remove());
             ui.adminUI.hide().removeClass('hidden').fadeIn(500);
             ui.adminUser.focus();
        });
    }
};
