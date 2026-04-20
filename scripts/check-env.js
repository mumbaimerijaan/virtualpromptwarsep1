'use strict';
require('dotenv').config();
const GlobalConfig = require('../lib/GlobalConfig');

console.log('--- Environment Validation ---');
console.log('Project Name:', GlobalConfig.PROJECT.NAME);
console.log('Environment:', GlobalConfig.PROJECT.ENV);
console.log('Firebase API Key State:', GlobalConfig.AUTH.FIREBASE_CLIENT.apiKey === 'ROTATION_REQUIRED' ? '❌ MISSING (Placeholder Active)' : '✅ LOADED (Secret detected)');
console.log('Admin JWT Secret State:', GlobalConfig.AUTH.ADMIN_JWT_SECRET ? '✅ LOADED' : '❌ MISSING');
console.log('Firebase Project ID:', GlobalConfig.AUTH.FIREBASE_CLIENT.projectId);
console.log('------------------------------');

if (GlobalConfig.AUTH.FIREBASE_CLIENT.apiKey && GlobalConfig.AUTH.FIREBASE_CLIENT.apiKey !== 'ROTATION_REQUIRED') {
    console.log('Validation COMPLETE. System is ready to initialize Firebase.');
} else {
    console.error('Validation FAILED. Please check your .env file.');
}
