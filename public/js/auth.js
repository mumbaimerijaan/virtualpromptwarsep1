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
    init: () => {
        const auth = typeof firebase !== 'undefined' ? firebase.auth() : null;
        
        $('#admin-login-form').on('submit', async (e) => {
            e.preventDefault();
            const username = $('#admin-user').val();
            const password = $('#admin-pass').val();
            
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
                    $('#login-error').text(data.error || 'Login failed.').removeClass('hidden');
                }
            } catch (err) {
                 $('#login-error').text('Network error. Unable to verify.').removeClass('hidden');
            }
        });

        $('#user-login-btn').on('click', async () => {
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
                 $('#login-error').text(`Authentication failed: ${error.message}`).removeClass('hidden');
             }
        });

        // Toggle Admin Panel
        $('#toggle-admin-btn').on('click', () => {
             $('#admin-login-form').toggleClass('hidden');
             $('#admin-divider').toggleClass('hidden');
        });
    }
};
