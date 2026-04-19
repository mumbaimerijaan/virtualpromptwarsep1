'use strict';

/**
 * @file integration.test.js
 * @description Master Lifecycle Integration (v8.0 Absolute Winner).
 */

// 1. Set environment immediately to satisfy architectural guards
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.NODE_ENV = 'test';

// 2. Mock Global Services before any imports mapping @[skills/robust-verification-jest]
jest.mock('@google-cloud/vertexai', () => ({
    VertexAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockImplementation(({ model }) => ({
            generateContent: jest.fn().mockImplementation(() => {
                const text = model.includes('pro') 
                    ? '{"summary": "Integrated Summary", "score": 90, "pillars": {"security": 95, "efficiency": 90, "googleServices": 90}, "actions": ["A1"], "keyTakeaways": ["T1"]}'
                    : '{"summary": "Integrated Summary", "keyTakeaways": ["T1"], "actions": ["A1"]}';
                return Promise.resolve({
                    response: {
                        candidates: [{
                            content: {
                                parts: [{ text }]
                            }
                        }]
                    }
                });
            })
        }))
    }))
}));

jest.mock('firebase-admin', () => {
    const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockImplementation(() => Promise.resolve({
            exists: true,
            data: () => ({ name: 'Test User', count: 10 }),
            docs: []
        })),
        set: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue(true),
        add: jest.fn().mockResolvedValue({ id: 'new-id' }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
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

describe('Smart Event Concierge - Master Integration Lifecycle', () => {

    test('Full Lifecycle: Auth -> Onboarding -> AI Generation -> Persistence (200)', async () => {
        const authHeader = 'Bearer valid-token';
        const appCheckHeader = 'valid-app-check';

        // 1. Onboarding
        const onboardingRes = await request(app)
            .post('/api/v1/complete-onboarding')
            .set('Authorization', authHeader)
            .set('X-Firebase-AppCheck', appCheckHeader)
            .send({ payload: { company: 'Google', jobRole: 'Architect' } });
        expect(onboardingRes.status).toBe(200);

        // 2. AI Persistence & Processing Status
        const insightsRes = await request(app)
            .post('/api/v1/generate-insights')
            .set('Authorization', authHeader)
            .set('X-Firebase-AppCheck', appCheckHeader)
            .send({ notes: 'Collaborated with the Architect on ADC.' });
        
        expect(insightsRes.status).toBe(200);
        expect(insightsRes.body.summary).toBe('Integrated Summary');
    });

    test('Zero-Trust Infrastructure: Nuclear App Check Enforcement', async () => {
         const res = await request(app)
            .get('/api/v1/leaderboard')
            .set('Authorization', 'Bearer valid-token');
         expect(res.status).toBe(401);
         expect(res.body.error).toContain('App Check token missing');
    });
});
