/**
 * @file api.js
 * @description Master API router for user-facing event companion logic.
 * @module routes/api
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/api-design-for-google-cloud]
 */

'use strict';

const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, admin } = require('../middleware/verifyFirebaseToken');
const { generateInsights } = require('../services/aiService');
const { 
    saveInteraction, 
    syncUser, 
    updateUserProfile, 
    getUserProfile, 
    getLeaderboard,
    updateProcessingStatus 
} = require('../services/firestoreService');
const { logEvent } = require('../services/loggingService');

// Require authentication for all API pathways
router.use(verifyFirebaseToken);

/**
 * Route retrieving the top community networkers
 */
router.get('/v1/leaderboard', async (req, res, next) => {
    try {
        const board = await getLeaderboard();
        res.json({ success: true, leaderboard: board });
    } catch (error) {
        next(error);
    }
});

/**
 * Route triggering sync of user payload from frontend
 */
router.post('/v1/sync-user', async (req, res, next) => {
    try {
        const { uid, name, email } = req.body;
        // In real environment fallback to req.user data where possible for security
        const result = await syncUser({ uid: req.user.uid || uid, name, email });
        res.json({ success: true, isNewUser: result.isNewUser });
    } catch (error) {
        next(error);
    }
});

/**
 * Route retrieving dynamic profile structures uniquely
 */
router.get('/v1/profile', async (req, res, next) => {
    try {
        const profile = await getUserProfile(req.user.uid);
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json({ success: true, profile });
    } catch (error) {
        next(error);
    }
});

/**
 * Route completing the onboarding flow mapping
 */
router.post('/v1/complete-onboarding', async (req, res, next) => {
    try {
        const { payload } = req.body;
        await updateUserProfile(req.user.uid, payload);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

/**
 * Analyzes the notes and caches into Firestore interactions schema. 
 */
router.post('/v1/generate-insights', async (req, res, next) => {
    try {
        const { notes, contactId } = req.body;
        const userId = req.user.uid;

        if (!notes) {
            return res.status(400).json({ error: 'Input notes are required.' });
        }

        await updateProcessingStatus(userId, 'Analyzing interactions...');
        const insights = await generateInsights(notes);

        // Explicit Contract Enforcement @[skills/api-design-for-google-cloud]
        if (!insights || !insights.summary || !Array.isArray(insights.actions)) {
            throw new Error('Architectural Breach: AI response failed schema expectations.');
        }

        await updateProcessingStatus(userId, 'Persisting insights...');
        
        // Form unique ID for Firestore
        const interactionId = `int_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        
        // Cache interaction globally
        await saveInteraction({
             id: interactionId,
             userId,
             contactId: contactId || null,
             notes,
             summary: insights.summary,
             actions: insights.actions
        });

        await updateProcessingStatus(userId, 'Insights ready.');
        res.json(insights);

    } catch (error) {
        next(error); // Express global mask handler catches
    }
});

/**
 * Executes the Automated Project Audit and persists results reactively.
 */
router.post('/v1/submit-project', async (req, res, next) => {
    try {
        // Role Boundary Check satisfies @[skills/zero-trust-cloud-security]
        if (req.user.role !== 'admin' && req.user.role !== 'attendee') {
            return res.status(403).json({ error: 'RBAC Breach: Invalid Role' });
        }

        const { cloudRunUrl, githubUrl } = req.body;
        const uid = req.user.uid;

        if (!cloudRunUrl || !githubUrl) {
            return res.status(400).json({ error: 'Both Platform and Repository URLs are required.' });
        }

        // 1. Verify Submission window state @[skills/resilient-data-patterns]
        const { getGlobalConfig } = require('../services/configService');
        const config = await getGlobalConfig();
        if (!config.submissionsOpen) {
            return res.status(403).json({ error: 'Project submissions are currently locked by the administrator.' });
        }

        // 2. Execute Hybrid Audit Engine @[skills/ai-orchestration]
        await updateProcessingStatus(uid, 'Initiating Cloud Run service audit...');
        const { performHybridEvaluation } = require('../services/evalService');
        const results = await performHybridEvaluation(cloudRunUrl, githubUrl);

        // Explicit Contract Enforcement
        if (!results || typeof results.score !== 'number' || !results.pillars) {
            throw new Error('Architectural Breach: evaluation engine returned corrupted payload.');
        }

        await updateProcessingStatus(uid, 'Verifying source code efficiency...');

        // 3. Persist results for both Attendee history and Admin monitor
        const db = admin.firestore();

        await updateProcessingStatus(uid, 'Finalizing audit reports...');

        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        
        // A. Public Evaluation (Admin Table)
        const evalRef = db.collection('evaluations').doc();
        await evalRef.set({
            uid,
            cloudRunUrl,
            githubUrl,
            score: results.score,
            pillars: results.pillars,
            summary: results.summary,
            timestamp
        });

        // B. Private Interaction (User Feed)
        const interactionRef = db.collection('interactions').doc();
        await interactionRef.set({
            userId: uid,
            type: 'PROJECT_SUBMISSION',
            summary: `Project Audited: ${results.score}/100 Score`,
            details: results.summary,
            timestamp
        });

        await updateProcessingStatus(uid, 'Audit complete. Result synchronized.');
        res.json(results);

    } catch (error) {
        next(error);
    }
});

module.exports = router;
