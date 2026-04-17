/**
 * @file auth.js
 * @description Authentication logic layer handling User (Firebase) and Admin (RBAC) entry points.
 * @module public/js/auth
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/firebase-identity-management]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

const firebaseConfig = {
  apiKey: "AIzaSyAgHDOXTewR5l4Z1mpGpkikrumwbIP1smw",
  authDomain: "smarteventconcierge.firebaseapp.com",
  projectId: "smarteventconcierge",
  storageBucket: "smarteventconcierge.firebasestorage.app",
  messagingSenderId: "428873326699",
  appId: "1:428873326699:web:5f3bfd5a9f945c77fb112e",
  measurementId: "G-D76K8EZX9Y"
};

// Initialize Firebase App globally for client
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.authLogic = {
    /**
     * Initializes authentication event listeners and SDK state management.
     * @description Orchestrates the secure transition between User and Admin sessions.
     * @returns {void}
     */
    init: () => {
        const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
        
        // jQuery Memoization Cache satisfies @[skills/high-performance-web-optimization]
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
            
            try {
                const res = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await res.json();
                
                if (res.ok && data.token) {
                    window.roleState.setSession(data.token, data.role);
                    window.location.replace('/pages/admin-dashboard.html');
                } else {
                    ui.errorMsg.text(data.error || 'Login failed.').removeClass('hidden');
                }
            } catch (err) {
                 ui.errorMsg.text('Network error. Unable to verify.').removeClass('hidden');
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

             const provider = new firebase.auth.GoogleAuthProvider();
             try {
                 const result = await auth.signInWithPopup(provider);
                 const user = result.user;
                 const idToken = await user.getIdToken();

                 window.roleState.setSession(idToken, 'user');
                 
                 // Sync backend and determine new vs returning mapping
                 const res = await fetch('/api/v1/sync-user', {
                     method: 'POST',
                     headers: { 
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${idToken}`
                     },
                     body: JSON.stringify({ uid: user.uid, name: user.displayName, email: user.email })
                 });
                 
                 const payload = await res.json();
                 
                 if (payload.isNewUser) {
                      window.location.replace('/pages/onboarding.html');
                 } else {
                      window.location.replace('/pages/user-dashboard.html');
                 }
                 
             } catch (error) {
                 console.error('Google Auth Failed', error);
                 ui.errorMsg.text(`Authentication failed: ${error.message}`).removeClass('hidden');
             }
        });

        /**
         * Transitions to the Admin-only login view.
         * @description Removes User login elements to satisfy secure credential portal constraints.
         */
        ui.toggleAdminBtn.on('click', () => {
             // Hard removal of other UI elements as per Security hardening rules
             ui.userLoginBtn.fadeOut(300, () => {
                 ui.userLoginBtn.remove();
             });
             ui.footer.fadeOut(300, () => {
                 ui.footer.remove();
             });
             
             // Activate Admin Panel with clean focus
             ui.adminUI.hide().removeClass('hidden').fadeIn(500);
             ui.adminUser.focus();
        });
    }
};

