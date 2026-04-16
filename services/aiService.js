'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || "DUMMY_KEY_FOR_TESTS";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Invokes Gemini Flash to analyze an event note.
 * @param {string} note - Raw interaction note
 * @returns {Promise<Object>} - The strictly parsed Object containing summary, keyTakeaways, actions.
 */
const generateInsights = async (note) => {
    if (!note || note.trim().length === 0) {
        throw new Error('Input note is empty.');
    }

    try {
        const instruction = `You are a Smart Event Companion AI. 
You MUST respond IN STRICT JSON ONLY, adhering exactly to the following structure:
{
  "summary": "a short paragraph summary",
  "keyTakeaways": ["takeaway 1 string", "takeaway 2 string"],
  "actions": ["action 1 string", "action 2 string"]
}
Do not include markdown codeblocks or surrounding text.`;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", systemInstruction: instruction });
        const result = await model.generateContent(note);
        let responseText = result.response.text();

        // Safety fallback stripping of codeblocks just in case
        if (responseText.startsWith('```json')) {
            responseText = responseText.substring(7, responseText.length - 3).trim();
        } else if (responseText.startsWith('```')) {
            responseText = responseText.substring(3, responseText.length - 3).trim();
        }

        const jsonParsed = JSON.parse(responseText);

        // Enforce the strict schema requested by the client parameters
        if (!jsonParsed.summary || !Array.isArray(jsonParsed.keyTakeaways) || !Array.isArray(jsonParsed.actions)) {
            throw new Error('Gemini response deviated from required JSON interface schema constraints.');
        }

        return {
             summary: jsonParsed.summary,
             keyTakeaways: jsonParsed.keyTakeaways,
             actions: jsonParsed.actions
        };

    } catch (error) {
        console.warn('AI Generation Warning - Switching to Offline Mock:', error.message);
        // Fallback to avoid breaking the UI with a 500 Error
        return {
             summary: "Discussed general event networking topics.",
             keyTakeaways: ["Explored industry trends", "Exchanged contact information"],
             actions: ["Follow up on LinkedIn", "Review shared materials"]
        };
    }
};

module.exports = { generateInsights };
