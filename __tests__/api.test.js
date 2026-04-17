'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');

jest.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockImplementation((input) => {
                 if (input === '{"INVALID_JSON') return Promise.resolve({ response: { text: () => '{"INVALID_JSON"' } });
                 return Promise.resolve({
                     response: {
                        text: () => '```json\n{"summary": "Test Summary.", "keyTakeaways": ["T1"], "actions": ["A1"], "networkingStrategy": "S1"}\n```'
                     }
                 });
            })
        })
    }))
}));

jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: jest.fn(),
    credential: { applicationDefault: jest.fn() },
    auth: jest.fn().mockReturnValue({
        verifyIdToken: jest.fn().mockImplementation(token => {
            if(token === 'firebase-valid') return Promise.resolve({ uid: 'usr123' });
            return Promise.reject(new Error('Invalid token'));
        })
    }),
    firestore: Object.assign(jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ exists: false }),
        set: jest.fn().mockResolvedValue(true),
        count: jest.fn().mockReturnThis()
    }), { FieldValue: { serverTimestamp: jest.fn() } })
}));

describe('Smart Event Companion - Jest Test Matrix', () => {

    describe('1. Endpoint Integrity & Middlewares', () => {
        const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback_development_secret';
        const validAdminJwt = jwt.sign({ role: 'admin', uid: 'admin-root' }, ADMIN_SECRET);

        test('Auth Middleware Rejects (401)', async () => {
            const res = await request(app).post('/api/v1/generate-insights').send({ notes: 'abc' });
            expect(res.status).toBe(401);
        });

        test('RBAC Middleware Blocks User from Admin (403)', async () => {
             const res = await request(app)
                 .get('/admin/dashboard-stats')
                 .set('Authorization', 'Bearer test-token-usr');  // Test auth token without admin role mapped
             expect(res.status).toBe(403);
        });

        test('RBAC Middleware Allows Admin (200)', async () => {
            const res = await request(app)
                .get('/admin/dashboard-stats')
                .set('Authorization', `Bearer ${validAdminJwt}`);
            expect(res.status).toBe(200);
        });

        test('Firebase Validations Works (200)', async () => {
             const res = await request(app)
                .post('/api/v1/sync-user')
                .set('Authorization', 'Bearer firebase-valid')
                .send({ uid: 'usr123', name: 'Bob' });
             expect(res.status).toBe(200);
        });
    });

    describe('2. Gemini AI Inputs & JSON Safety', () => {
        test('Empty Input Handling Rejects (400) or throws internally', async () => {
            const res = await request(app)
                .post('/api/v1/generate-insights')
                .set('Authorization', 'Bearer test-token')
                .send({ notes: '' });
            // Should be blocked by api.js `if (!notes)` return 400
            expect(res.status).toBe(400);
        });

        test('Invalid Input/AI Formatting triggers Mock Fallback Resilience (200)', async () => {
             const res = await request(app)
                .post('/api/v1/generate-insights')
                .set('Authorization', 'Bearer test-token')
                .send({ notes: '{"INVALID_JSON' });
             // Service layer detects bad parse schema output, suppresses crash, and returns resilient mock offline data.
             expect(res.status).toBe(200); 
             expect(res.body.summary).toBe('Discussed general event networking topics.');
        });

        test('AI JSON Parsing correctly extracts variables (200 schema pass)', async () => {
             const res = await request(app)
                .post('/api/v1/generate-insights')
                .set('Authorization', 'Bearer test-token')
                .send({ notes: 'Real Note Content' });
             expect(res.status).toBe(200);
             expect(res.body.summary).toBe('Test Summary.');
             expect(res.body.keyTakeaways).toBeInstanceOf(Array);
        });
    });

    describe('3. XSS and Frontend Boundary Rules', () => {
        const { sanitizeInput } = require('../public/js/utils.js'); // Assuming we will dump this locally next
        
        test('XSS payload rejection using sanitizeInput boundaries', () => {
             const payload = 'Normal <script>fetch("steal")</script> <b>text</b>';
             const clean = sanitizeInput(payload);
             expect(clean).not.toContain('<script>');
             expect(clean).toBe('Normal  &lt;b&gt;text&lt;/b&gt;');
        });
    });
});
