/**
 * @file rbacMiddleware.js
 * @description Hard-barrier Role-Based Access Control enforcing administrative constraints.
 * @module middleware/rbacMiddleware
 * @see @[skills/zero-trust-cloud-security]
 */

'use strict';

const GlobalConfig = require('../lib/GlobalConfig');
const Logger = require('../lib/Logger');

/**
 * Ensures the authenticated user possesses administrative clearance.
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const requireAdmin = (req, res, next) => {
    const user = req.user;
    
    if (!user || user.role !== GlobalConfig.AUTH.ROLES.ADMIN) {
        Logger.warn('RBAC Violation: Non-admin attempt on protected route', { 
            uid: user ? user.uid : 'anonymous',
            path: req.path 
        });
        return res.status(403).json({ error: 'Access Denied: Administrative privileges required' });
    }
    
    next();
};

module.exports = { requireAdmin };
