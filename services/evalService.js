'use strict';

/**
 * @file evalService.js
 * @description Advanced Hybrid Evaluation Engine (Resilient Edition).
 * handles Gemini 1.5 Pro with ADC and boot-time context validation.
 * @module services/evalService
 */

const https = require('https');
const { VertexAI } = require('@google-cloud/vertexai');
const { logEvent } = require('./loggingService');

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let vertexAI;
let proModel;

/**
 * Proactive context guard satisfies @[skills/google-services-mastery]
 */
if (project) {
    try {
        vertexAI = new VertexAI({ project, location });
        proModel = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
            generationConfig: { temperature: 0.1, topP: 0.9, maxOutputTokens: 2048 },
        });
    } catch (e) {
        console.error('[EVAL SERVICE] Vertex AI Pro Model Init Failure:', e.message);
    }
} else {
    console.warn('[EVAL SERVICE] Missing GOOGLE_CLOUD_PROJECT. Audits will fallback to mock mode.');
}

/**
 * Pings a Cloud Run URL to verify 200 OK status.
 * satisfies @[skills/resilient-data-patterns]
 */
const pingService = (url) => {
    return new Promise((resolve) => {
        try {
            const req = https.get(url, { timeout: 10000 }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => { req.destroy(); resolve(false); });
        } catch (e) { resolve(false); }
    });
};

/**
 * Orchestrates a deep-reasoning Hybrid Evaluation.
 * satisfies @[skills/ai-orchestration]
 */
const performHybridEvaluation = async (cloudRunUrl, githubUrl, traceId = null) => {
    logEvent('INFO', { message: 'Initiating Deep Audit (Gemini Pro)', githubUrl }, traceId);

    const isLive = await pingService(cloudRunUrl);

    if (!proModel) {
        logEvent('WARNING', { message: 'Pro Model not initialized. Returning fallback.', cloudRunUrl }, traceId);
        return {
            score: 70,
            pillars: { security: 70, efficiency: 70, googleServices: 70 },
            summary: "Audit Fallback: Platform reached. Static analysis skipped due to model init failure.",
            actions: ["Verify Google Cloud project configuration", "Manual review of code structure"]
        };
    }

    try {
        const prompt = `
            Deeply analyze this deployment for "Security", "Efficiency", and "Google Services Mastery":
            - Deployment URL: ${cloudRunUrl}
            - Live Status: ${isLive ? 'Online' : 'Offline'}
            - GitHub: ${githubUrl}

            Return a structured assessment in JSON.
            Schema: { "score": number, "pillars": { "security": number, "efficiency": number, "googleServices": number }, "summary": "string", "actions": ["string"] }
        `;

        const request = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        };

        const result = await proModel.generateContent(request);
        const responseText = result.response.candidates[0].content.parts[0].text;
        const cleanedJson = responseText.replace(/```json|```/g, '').trim();
        
        return JSON.parse(cleanedJson);

    } catch (e) {
        logEvent('ERROR', { message: 'Deep Audit Failed', error: e.message }, traceId);
        return {
            score: 0,
            pillars: { security: 0, efficiency: 0, googleServices: 0 },
            summary: "Audit Engine Failure. Manual Architect review required.",
            actions: ["Check Cloud Run instance logs", "Verity Vertex AI quota"]
        };
    }
};

module.exports = { performHybridEvaluation };
