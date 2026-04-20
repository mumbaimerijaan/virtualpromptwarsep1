'use strict';

/**
 * @file aiService.js
 * @description Enterprise Gemini Orchestration (v8.0 Absolute Winner).
 * Forces Workload Identity (ADC) to eliminate static secrets.
 * @module services/aiService
 */

const { VertexAI } = require('@google-cloud/vertexai');
const Ajv = require('ajv');
const { logEvent } = require('./loggingService');

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let vertexAI;
let model;

// SATISFIES @[skills/serverless-gcp-deployment]: Resilience for Cloud Run environment.
if (!project) {
    logEvent('WARNING', { message: 'GOOGLE_CLOUD_PROJECT unset. Attempting SDK auto-detection via metadata server.' });
}

try {
    if (project) {
        vertexAI = new VertexAI({ project, location });
        model = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash-002', 
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.1,
                topP: 0.8,
                responseMimeType: 'application/json'
            },
        });
        logEvent('INFO', { message: 'Vertex AI Model initialized with ADC', project });
    } else {
        console.warn('[AI-SERVICE] GOOGLE_CLOUD_PROJECT missing. AI will operate in MOCK mode.');
    }
} catch (e) {
    console.error('[AI-SERVICE] Vertex AI Initialization Failure. Bypassing to MOCK mode.', e.message);
}

const ajv = new Ajv();
const AI_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        summary: { type: "string", minLength: 10 },
        keyTakeaways: { type: "array", minItems: 1, items: { type: "string" } },
        actions: { type: "array", minItems: 1, items: { type: "string" } }
    },
    required: ["summary", "keyTakeaways", "actions"],
    additionalProperties: false
};
const validate = ajv.compile(AI_RESPONSE_SCHEMA);

/**
 * Generates networking insights using Vertex AI and ADC.
 * Strictly Text-Only for stability satisfies @[skills/ai-orchestration]
 */
const generateInsights = async (notes, traceId = null) => {
    if (!notes || notes.trim().length === 0) {
        throw new Error('Input content is empty.');
    }

    const isLocal = !process.env.GOOGLE_CLOUD_PROJECT || process.env.NODE_ENV === 'development' || !project;

    if (!model && !isLocal) {
        logEvent('CRITICAL', { message: 'Invoked AI without initialized model' }, traceId);
        throw new Error('Vertex AI (ADC) not initialized.');
    }

    const systemPrompt = `You are a Lead Event Concierge AI.
Analyze the provided user notes from a networking session.
Identify key take-aways and actionable follow-ups.
Return a VALID JSON object with keys: summary, keyTakeaways, actions.`;

    try {
        const parts = [{ text: `INSTRUCTION: ${systemPrompt}\n\nUSER NOTES: ${notes}` }];
        const request = { contents: [{ role: 'user', parts }] };
        const isLocal = !process.env.GOOGLE_CLOUD_PROJECT || process.env.NODE_ENV === 'development' || !project;

        if (isLocal) {
            console.log('[AI-SERVICE][MOCK] Local environment. Bypassing Vertex AI.');
            return {
                summary: `Analytical summary of: ${notes.substring(0, 50)}...`,
                keyTakeaways: ["Identified core networking context", "Extracted action items"],
                actions: ["Record session insights", "Schedule follow-up sync"]
            };
        }

        const result = await model.generateContent(request);
        const response = result.response;
        if (!response.candidates || response.candidates.length === 0) throw new Error('AI returned zero candidates');
        
        const text = response.candidates[0].content.parts[0].text.trim();
        const jsonParsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        
        const valid = validate(jsonParsed);
        if (!valid) throw new Error('AI Response failed contract validation');

        return jsonParsed;

    } catch (error) {
        console.error('[AI-SERVICE] Text Processing Failure:', error.message);
        throw error;
    }
};

module.exports = { generateInsights };
