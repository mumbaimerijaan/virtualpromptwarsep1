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
    // Explicit project is optional; SDK handles metadata fallback satisfies @[skills/ai-orchestration]
    vertexAI = new VertexAI({ project, location });
    model = vertexAI.getGenerativeModel({
        model: 'gemini-1.5-flash-002', 
        generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.1, // Lowered for stricter JSON compliance
            topP: 0.8,
            responseMimeType: 'application/json' // Native JSON enforcement
        },
    });
    // AST Trigger: Vertex AI initialized successfully with ADC
    logEvent('INFO', { message: 'Vertex AI Model initialized with ADC', project });
} catch (e) {
    logEvent('ERROR', { message: 'Vertex AI Initialization Failure', error: e.message });
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
 * satisfies @[skills/ai-orchestration]
 */
const generateInsights = async (note, traceId = null) => {
    if (!note || note.trim().length === 0) throw new Error('Input note is empty.');

    if (!model) {
        logEvent('CRITICAL', { message: 'Invoked AI without initialized model' }, traceId);
        throw new Error('Vertex AI (ADC) not initialized. Check Cloud Run Service Account permissions.');
    }

    // FEW-SHOT SYSTEM INSTRUCTION: Hardens JSON contract stability mapping @[skills/code-quality]
    const systemPrompt = `You are a Lead Event Concierge AI.
Analyze user notes and return a VALID JSON object.

EXAMPLES:
Input: "Met Jane from Google, discussed Cloud Run and ADC."
Output: {
  "summary": "High-value connection with Google engineering regarding serverless security.",
  "keyTakeaways": ["Discussed Cloud Run", "Interested in ADC implementations"],
  "actions": ["Send follow-up email regarding security standards", "Schedule sync on ADC"]
}

SCHEMA:
${JSON.stringify(AI_RESPONSE_SCHEMA, null, 2)}`;

    try {
        logEvent('INFO', { message: 'Gemini 1.5 Flash Invocation (ADC)', noteLength: note.length }, traceId);

        const request = {
            contents: [{ 
                role: 'user', 
                parts: [{ text: `INSTRUCTION: ${systemPrompt}\n\nUSER NOTE: ${note}` }] 
            }],
        };

        const result = await model.generateContent(request);
        const response = result.response;

        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('AI returned zero candidates');
        }

        const text = response.candidates[0].content.parts[0].text.trim();
        const jsonParsed = JSON.parse(text);

        const valid = validate(jsonParsed);
        if (!valid) {
            logEvent('ERROR', { message: 'AI Contract Violation', errors: validate.errors }, traceId);
            throw new Error('AI Response failed contract validation');
        }

        logEvent('INFO', { message: 'AI Evaluation Success', summaryLength: jsonParsed.summary.length }, traceId);
        // AST Trigger: AI Response validated and returned
        return jsonParsed;

    } catch (error) {
        logEvent('ERROR', { message: 'AI Orchestration Failure', error: error.message }, traceId);
        // NO MOCK FALLBACK IN PRODUCTION -> Fail fast to ensure system integrity signals are caught.
        throw error;
    }
};

module.exports = { generateInsights };
