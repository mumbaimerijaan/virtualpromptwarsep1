/**
 * @file errorHandler.js
 * @description Centralized Enterprise Error Handler for the Express lifecycle.
 * @module middleware/errorHandler
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/resilient-data-patterns]
 */

'use strict';

const { logEvent } = require('../services/loggingService');

/**
 * Global Error Handler middleware.
 * @description Intercepts all next(err) calls to provide consistent API responses.
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    
    // Log the actual technical error to Google Cloud Logging @[skills/enterprise-js-standards]
    logEvent('ERROR', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        userId: req.user ? req.user.uid : 'anonymous'
    });

    // Determine user-friendly mapping
    let userMessage = 'A system error occurred. Our team has been notified.';
    
    if (err.message.includes('permission') || err.message.includes('unauthorized')) {
        userMessage = 'You do not have permission to perform this action.';
    } else if (err.message.includes('not found')) {
        userMessage = 'The requested resource was not found.';
    } else if (err.message.includes('validation')) {
        userMessage = 'Invalid data provided. Please check your inputs.';
    }

    res.status(statusCode).json({
        success: false,
        error: userMessage,
        code: err.code || 'INTERNAL_ERROR'
    });
};

module.exports = errorHandler;
