'use strict';

const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { generateInsights } = require('../services/aiService');
const { saveInteraction, syncUser, updateUserProfile, getUserProfile, getLeaderboard } = require('../services/firestoreService');

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

        // Isolate AI mapping
        const insights = await generateInsights(notes);

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

        res.json(insights);

    } catch (error) {
        next(error); // Express global mask handler catches
    }
});

module.exports = router;
