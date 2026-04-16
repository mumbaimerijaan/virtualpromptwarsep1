'use strict';

/**
 * Middleware: Admin Role Enforcement
 * Ensures only users assigned the `admin` role can access specific endpoints.
 * @param {Express.Request} req - The request
 * @param {Express.Response} res - The response
 * @param {Function} next - Next chain
 */
const requireAdmin = (req, res, next) => {
    // Determine admin status
    // In our simplified setup, if the user explicitly has a payload marking them 
    // as admin (e.g., from the manual login root fallback), they pass.
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    // Failing that, they are a standard Firebase user or unauthenticated
    return res.status(403).json({ error: 'Forbidden: Requires Admin privileges' });
};

module.exports = { requireAdmin };
