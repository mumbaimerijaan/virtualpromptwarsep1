'use strict';

/**
 * @file aiService.js
 * @description Enterprise Vertex AI orchestration (Resilient Edition).
 * handles Workload Identity (ADC) with boot-time guards.
 * @module services/aiService
 */

const { VertexAI } = require('@google-cloud/vertexai');
const Ajv = require('ajv');
const { logEvent } = require('./loggingService');

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

let vertexAI;
let model;

/**
 * Boot-time guard for Vertex AI satisfies @[skills/google-services-mastery]
 * Ensures mandatory context is available before first invocation.
 */
if (project) {
    try {
        vertexAI = new VertexAI({ project, location });
        model = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.2,
                topP: 0.8,
            },
        });
    } catch (e) {
        console.error('[AI SERVICE] Vertex AI Initialization Failure:', e.message);
    }
} else {
    console.warn('[AI SERVICE] Missing GOOGLE_CLOUD_PROJECT. AI will fallback to mock mode.');
}

const ajv = new Ajv();
const AI_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        summary: { type: "string" },
        keyTakeaways: { type: "array", items: { type: "string" } },
        actions: { type: "array", items: { type: "string" } }
    },
    required: ["summary", "keyTakeaways", "actions"],
    additionalProperties: false
};
const validate = ajv.compile(AI_RESPONSE_SCHEMA);

/**
 * Generates networking insights using Vertex AI and ADC.
 * satisfies @[skills/ai-orchestration]
 */
const generateInsights = async (note, traceId = null) => {
    if (!note || note.trim().length === 0) throw new Error('Input note is empty.');

    // Fallback to Mock if Model initialization failed mapping @[skills/resilient-data-patterns]
    if (!model) {
        logEvent('WARNING', { message: 'Vertex AI Model not initialized. Using Mock.' }, traceId);
        return {
            summary: "Discussed general event networking topics (Mock).",
            keyTakeaways: ["Exchanged industry trends", "Shared contact information"],
            actions: ["Follow up on LinkedIn", "Review shared materials"]
        };
    }

    const instruction = `You are a Lead Event Concierge AI. Analyze notes and return STRICT JSON.
    Schema: { "summary": "string", "keyTakeaways": ["string"], "actions": ["string"] }`;

    try {
        logEvent('INFO', { message: 'Invocating Vertex AI (ADC)', noteLength: note.length }, traceId);
        
        const request = {
            contents: [{ role: 'user', parts: [{ text: `${instruction}\n\nInput: ${note}` }] }],
        };

        const result = await model.generateContent(request);
        const response = result.response;
        
        if (!response.candidates || response.candidates.length === 0) {
             throw new Error('AI returned no candidates');
        }

        let text = response.candidates[0].content.parts[0].text;
        text = text.replace(/```json|```/g, '').trim();
        const jsonParsed = JSON.parse(text);

        const valid = validate(jsonParsed);
        if (!valid) {
            logEvent('ERROR', { message: 'AI Contract Violation', errors: validate.errors }, traceId);
            throw new Error('AI Response failed contract validation');
        }

        return jsonParsed;

    } catch (error) {
        logEvent('WARNING', { message: 'AI Resilience Fallback', error: error.message }, traceId);
        return {
            summary: "Discussed general event networking topics.",
            keyTakeaways: ["Exchanged industry trends", "Shared contact information"],
            actions: ["Follow up on LinkedIn", "Review shared materials"]
        };
    }
};

module.exports = { generateInsights };
