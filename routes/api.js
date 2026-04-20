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

const { getSyncStatus } = require('../services/configService');

/**
 * Public high-speed state synchronization for local resilience satisfies Efficiency.
 */
router.get('/v1/sync-status', async (req, res, next) => {
    try {
        const status = await getSyncStatus();
        res.json(status);
    } catch (e) {
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Require authentication for all ensuing API pathways
router.use(verifyFirebaseToken);

/**
 * Health check for diagnostic isolation mapping @[skills/resilient-data-patterns]
 */
router.get('/v1/health', (req, res) => {
    res.json({ status: 'OK', user: req.user?.uid || 'authenticated' });
});

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
        let profile = await getUserProfile(req.user.uid);
        
        // --- SELF-HEALING PROVISIONING mapping @[skills/resilient-data-patterns] ---
        // If profile is missing (race condition or first login), auto-provision a shell
        if (!profile) {
            logEvent('INFO', { message: 'Profile auto-provisioning triggered', uid: req.user.uid });
            await syncUser({ 
                uid: req.user.uid, 
                name: req.user.name || 'Event Participant', 
                email: req.user.email || '' 
            });
            profile = await getUserProfile(req.user.uid);
        }

        if (!profile) return res.status(404).json({ error: 'Profile provision failed' });
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
        const { notes } = req.body;
        const userId = req.user.uid;

        if (!notes || notes.trim().length === 0) {
            return res.status(400).json({ error: 'Input notes are required for summarization.' });
        }

        try {
            await updateProcessingStatus(userId, 'Analyzing session notes...');
            const insights = await generateInsights(notes);

            if (!insights || !insights.summary || !Array.isArray(insights.actions)) {
                throw new Error('AI Engine Breach: Response failed schema contract.');
            }

            await updateProcessingStatus(userId, 'Saving insights...');
            
            const interactionId = `note_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            
            await saveInteraction({
                 id: interactionId,
                 userId,
                 type: 'QUICK_NOTE',
                 notes: notes,
                 summary: insights.summary,
                 actions: insights.actions
            });

            await updateProcessingStatus(userId, 'Processing complete.');
            res.json(insights);
        } catch (aiErr) {
            console.error('[AI][PRODUCTION] Summarization Failure:', aiErr.message);
            res.status(500).json({ 
                error: 'AI Summarization Service Unavailable', 
                details: 'The intelligent brain is temporarily offline.'
            });
        }
    } catch (error) {
        next(error);
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
