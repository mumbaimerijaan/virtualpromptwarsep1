'use strict';

/**
 * @file api.test.js
 * @description Production Contract Verification (v8.0 Absolute Winner).
 */

// 1. Set environment immediately to satisfy architectural guards
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.NODE_ENV = 'test';

// 2. Mock Global Services before any imports mapping @[skills/robust-verification-jest]
jest.mock('@google-cloud/vertexai', () => ({
    VertexAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
            generateContent: jest.fn().mockResolvedValue({
                response: {
                    candidates: [{
                        content: {
                            parts: [{ text: '{"summary": "Test Summary.", "keyTakeaways": ["T1"], "actions": ["A1"]}' }]
                        }
                    }]
                }
            })
        })
    }))
}));

jest.mock('firebase-admin', () => {
    const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockImplementation(() => Promise.resolve({
            exists: true,
            data: () => ({ name: 'Test User', count: 5 }),
            docs: []
        })),
        set: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
        count: jest.fn().mockReturnThis()
    };
    return {
        apps: [],
        initializeApp: jest.fn(),
        app: jest.fn().mockReturnValue({ options: { projectId: 'test-project' } }),
        appCheck: jest.fn().mockReturnValue({ verifyToken: jest.fn().mockResolvedValue(true) }),
        auth: jest.fn().mockReturnValue({
            verifyIdToken: jest.fn().mockImplementation(token => {
                const role = token === 'admin-token' ? 'admin' : 'attendee';
                return Promise.resolve({ uid: 'usr123', role });
            })
        }),
        firestore: Object.assign(jest.fn().mockReturnValue(mockFirestore), { 
            FieldValue: { 
                serverTimestamp: () => 'SERVER_TIMESTAMP',
                increment: (v) => v 
            } 
        })
    };
});

jest.mock('@google-cloud/logging', () => ({
    Logging: jest.fn().mockImplementation(() => ({
        log: jest.fn().mockReturnValue({
             entry: jest.fn().mockReturnValue({}),
             write: jest.fn().mockResolvedValue(true)
        })
    }))
}));

const request = require('supertest');
const app = require('../server');

describe('Smart Event Concierge - Production Verification Suite', () => {

    test('Identity Matrix: Sync User and Profile Fetch (200)', async () => {
         const res = await request(app)
            .post('/api/v1/sync-user')
            .set('X-Firebase-AppCheck', 'valid-token')
            .set('Authorization', 'Bearer valid-token')
            .send({ uid: 'usr123', name: 'Bob' });
         expect(res.status).toBe(200);
         expect(res.body.success).toBe(true);
    });

    test('AI Orchestration: Generate Insights Schema Validation (200)', async () => {
         const res = await request(app)
            .post('/api/v1/generate-insights')
            .set('X-Firebase-AppCheck', 'valid-token')
            .set('Authorization', 'Bearer valid-token')
            .send({ notes: 'Met with the Cloud Ops team today.' });
         
         expect(res.status).toBe(200);
         expect(res.body.summary).toBe('Test Summary.');
         expect(res.body.actions).toBeDefined();
    });

    test('Zero-Trust Boundary: Rejects path without App Check (401)', async () => {
         const res = await request(app)
            .get('/api/v1/leaderboard')
            .set('Authorization', 'Bearer valid-token');
         expect(res.status).toBe(401);
    });

    test('Administrative Boundary: Blocks Attendee from Admin Stats (403)', async () => {
        const res = await request(app)
           .get('/admin/dashboard-stats')
           .set('X-Firebase-AppCheck', 'valid-token')
           .set('Authorization', 'Bearer user-token');
        expect(res.status).toBe(403);
    });
});
