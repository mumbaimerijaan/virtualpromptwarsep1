/**
 * @file evalService.js
 * @description Hybrid Evaluation Engine for automated stack auditing and AI scoring.
 * @module services/evalService
 * @see @[skills/api-design-for-google-cloud]
 */

'use strict';

const https = require('https');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const GlobalConfig = require('../lib/GlobalConfig');
const Logger = require('../lib/Logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GITHUB_PAT = process.env.GITHUB_PAT;

/**
 * Pings a Cloud Run URL to verify 200 OK status.
 * @param {string} url - Target service URL
 * @returns {Promise<boolean>}
 */
const pingService = (url) => {
    return new Promise((resolve) => {
        try {
            const req = https.get(url, { timeout: GlobalConfig.EVALUATION.TIMEOUT_MS }, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        } catch (e) {
            resolve(false);
        }
    });
};

/**
 * Fetches package.json from a GitHub repository to analyze stack maturity.
 * @param {string} repoUrl - GitHub Repository URL
 * @returns {Promise<Object|null>}
 */
const fetchGithubMetadata = async (repoUrl) => {
    try {
        // Sanitize URL to extract owner/repo
        const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) return null;
        const [_, owner, repo] = match;
        
        const apiUrl = `${GlobalConfig.EVALUATION.GITHUB_API}/repos/${owner}/${repo.replace('.git', '')}/contents/package.json`;
        
        return new Promise((resolve) => {
            const options = {
                headers: {
                    'User-Agent': 'Antigravity-Eval-Engine',
                    'Authorization': GITHUB_PAT ? `token ${GITHUB_PAT}` : undefined
                }
            };
            
            https.get(apiUrl, options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.content) {
                            const content = Buffer.from(json.content, 'base64').toString();
                            resolve(JSON.parse(content));
                        } else {
                            resolve(null);
                        }
                    } catch (e) { resolve(null); }
                });
            }).on('error', () => resolve(null));
        });
    } catch (e) {
        Logger.error('GitHub Metadata Fetch Error', e);
        return null;
    }
};

/**
 * Orchestrates a complete Hybrid Evaluation with Gemini AI Scoring.
 * @param {string} cloudRunUrl 
 * @param {string} githubUrl 
 * @returns {Promise<Object>} Parameterized scores
 */
const performHybridEvaluation = async (cloudRunUrl, githubUrl) => {
    Logger.info('Starting Hybrid Evaluation', { cloudRunUrl, githubUrl });

    const [isLive, packageJson] = await Promise.all([
        pingService(cloudRunUrl),
        fetchGithubMetadata(githubUrl)
    ]);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
            Analyze this project stack and live status:
            - Live Status: ${isLive ? '200 OK (Deployment Active)' : 'Inactive (Possible failure)'}
            - package.json Metadata: ${packageJson ? JSON.stringify(packageJson) : 'Unavailable'}

            Generate a comprehensive score object. Return ONLY JSON.
            JSON Schema: {
                "score": 0-100,
                "pillars": {
                    "codeQuality": 0-100,
                    "cloudUsage": 0-100,
                    "documentation": 0-100
                },
                "summary": "Short 2 sentence feedback",
                "actions": ["Task 1", "Task 2"]
            }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanedJson = responseText.replace(/```json|```/g, '').trim();
        
        return JSON.parse(cleanedJson);
    } catch (e) {
        Logger.warn('AI Evaluation fallback triggered', { error: e.message });
        return {
            score: isLive ? 85 : 40,
            pillars: { codeQuality: 80, cloudUsage: isLive ? 90 : 20, documentation: 70 },
            summary: "Manual Review Pending. AI scoring engine reached circuit breaker limits.",
            actions: ["Verify Cloud Run logs manually", "Check GitHub API health"]
        };
    }
};

module.exports = { performHybridEvaluation };
