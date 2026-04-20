'use strict';
require('dotenv').config();
const jwt = require('jsonwebtoken');
const GlobalConfig = require('../lib/GlobalConfig');

console.log('--- Admin Login Logic Debug ---');
console.log('Admin Secret:', GlobalConfig.AUTH.ADMIN_JWT_SECRET ? '✅ EXISTS' : '❌ MISSING');
console.log('Token Expiry:', GlobalConfig.AUTH.TOKEN_EXPIRY);
console.log('Admin Role:', GlobalConfig.AUTH.ROLES.ADMIN);

try {
    const payload = { role: GlobalConfig.AUTH.ROLES.ADMIN, uid: 'admin-root' };
    const secret = GlobalConfig.AUTH.ADMIN_JWT_SECRET;
    
    console.log('Attempting JWT signing...');
    const token = jwt.sign(payload, secret, { expiresIn: GlobalConfig.AUTH.TOKEN_EXPIRY });
    console.log('✅ JWT Signing Successful');
    console.log('Generated Token Starts With:', token.substring(0, 10));
} catch (err) {
    console.error('❌ JWT Signing FAILED:', err.message);
}
console.log('-------------------------------');
