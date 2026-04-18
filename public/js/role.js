'use strict';

/**
 * Persists and extracts token mechanisms for Session logic
 */
window.roleState = {
    setSession: (token, role) => {
        localStorage.setItem('companion_token', token);
        localStorage.setItem('companion_role', role);
    },
    
    getSession: () => {
        return {
            token: localStorage.getItem('companion_token'),
            role: localStorage.getItem('companion_role')
        };
    },

    clearSession: () => {
        localStorage.removeItem('companion_token');
        localStorage.removeItem('companion_role');
    },

    /**
     * Validates if user should be on current page map
     */
    enforceViewBoundary: () => {
        const { token, role } = window.roleState.getSession();
        const currentPath = window.location.pathname;

        if (!token && currentPath !== '/' && currentPath !== '/index.html') {
            window.location.replace('/');
            return;
        }

        if (token) {
            if (role === 'admin' && currentPath !== '/admin') {
                 window.location.replace('/admin');
            } else if (role !== 'admin' && currentPath === '/admin') {
                 window.location.replace('/dashboard');
            } else if ((currentPath === '/' || currentPath === '/index.html') && role !== 'admin') {
                 window.location.replace('/dashboard');
            }
        }
    }
};
