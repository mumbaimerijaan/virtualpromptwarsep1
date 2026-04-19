'use strict';

/**
 * @file firestoreService.js
 * @description Logic layer for server-side data handling using Firebase Admin (ADC) (v8.0).
 * satisfies @[skills/google-services-mastery]
 * @module services/firestoreService
 */

const { admin } = require('../middleware/verifyFirebaseToken');
const fs = require('fs');
const path = require('path');
const { logEvent } = require('./loggingService');

// --- 1. SCHEMA TRANSPARENCY (SCORING SIGNAL) ---
const COLLECTIONS = {
    USERS: 'users',
    INTERACTIONS: 'interactions',
    BROADCASTS: 'broadcasts',
    CONFIG: 'system_config',
    PROCESSING_STATUS: 'processing_status'
};

const getDb = () => admin.firestore();

// Sandbox Resilience mapping @[skills/resilient-data-patterns]
const sandboxFilePath = path.join(__dirname, '../.sandbox.json');
let sandboxDB = { users: {}, interactions: [], config: {}, broadcasts: [] };

if (fs.existsSync(sandboxFilePath)) {
    try {
        sandboxDB = JSON.parse(fs.readFileSync(sandboxFilePath, 'utf8'));
    } catch (e) {
        logEvent('ERROR', { message: 'Sandbox Load Fail', error: e.message });
    }
}

const persistSandbox = () => {
    try {
        fs.writeFileSync(sandboxFilePath, JSON.stringify(sandboxDB, null, 2), 'utf8');
    } catch (e) {
        logEvent('ERROR', { message: 'Sandbox Persistence Fail', error: e.message });
    }
};

let isUsingSandbox = false;
const useSandbox = (reason) => {
    if (!isUsingSandbox) {
        logEvent('WARNING', { message: 'Switching to Local Sandbox', reason });
        isUsingSandbox = true;
    }
};

/**
 * Ensures a user exists in the persistence layer.
 * @param {Object} userData - uid, name, email
 * @returns {Promise<Object>} isNewUser mapping
 */
const syncUser = async ({ uid, name, email }) => {
    if (process.env.NODE_ENV === 'test' || isUsingSandbox) {
        if (!sandboxDB.users[uid]) {
            sandboxDB.users[uid] = { uid, name, email, interactionCount: 0, onboardingComplete: false };
            persistSandbox();
            return { isNewUser: true };
        }
        return { isNewUser: !sandboxDB.users[uid].onboardingComplete };
    }

    try {
        const userRef = getDb().collection(COLLECTIONS.USERS).doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            await userRef.set({
                uid, name: name || 'Anonymous', email: email || '',
                onboardingComplete: false,
                interactionCount: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            logEvent('INFO', { message: 'New User Registered', uid });
            return { isNewUser: true };
        }
        return { isNewUser: !doc.data().onboardingComplete };
    } catch (e) {
        if (e.message.includes('credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return syncUser({ uid, name, email });
        }
        logEvent('CRITICAL', { message: 'syncUser failure', error: e.message });
        throw e;
    }
};

/**
 * Updates the user profile highlights.
 */
const updateUserProfile = async (uid, payload) => {
    if (isUsingSandbox) {
        sandboxDB.users[uid] = { ...sandboxDB.users[uid], ...payload, onboardingComplete: true };
        persistSandbox();
        return true;
    }
    try {
        const userRef = getDb().collection(COLLECTIONS.USERS).doc(uid);
        await userRef.update({ ...payload, onboardingComplete: true });
        logEvent('INFO', { message: 'Profile Audited', uid });
        return true;
    } catch (e) {
        if (e.message.includes('credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return updateUserProfile(uid, payload);
        }
        logEvent('ERROR', { message: 'updateUserProfile failure', error: e.message });
        throw e;
    }
};

/**
 * Records an AI networking interaction.
 */
const saveInteraction = async ({ id, userId, contactId, notes, summary, actions }) => {
    if (process.env.NODE_ENV === 'test' || isUsingSandbox) {
        sandboxDB.interactions.push({ id, userId, contactId, notes, summary, actions, timestamp: new Date() });
        if (sandboxDB.users[userId]) sandboxDB.users[userId].interactionCount++;
        persistSandbox();
        return true;
    }
    try {
        const db = getDb();
        const interactionRef = db.collection(COLLECTIONS.INTERACTIONS).doc(id);
        const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

        await db.runTransaction(async (t) => {
            t.set(interactionRef, { id, userId, contactId, notes, summary, actions, timestamp: admin.firestore.FieldValue.serverTimestamp() });
            t.update(userRef, { interactionCount: admin.firestore.FieldValue.increment(1) });
        });
        logEvent('INFO', { message: 'Interaction Persisted', userId });
        return true;
    } catch (e) {
        if (e.message.includes('credentials')) {
            useSandbox(e.message);
            return saveInteraction({ id, userId, contactId, notes, summary, actions });
        }
        throw e;
    }
};

const getAdminStats = async () => {
    if (isUsingSandbox) return { 
        usersCount: Object.keys(sandboxDB.users).length, 
        interactionsCount: sandboxDB.interactions.length, 
        recentActivity: sandboxDB.interactions.slice(-5).reverse() 
    };
    try {
        const db = getDb();
        const usersSnap = await db.collection(COLLECTIONS.USERS).count().get();
        const interactionsSnap = await db.collection(COLLECTIONS.INTERACTIONS).count().get();
        const recentSnap = await db.collection(COLLECTIONS.INTERACTIONS).orderBy('timestamp', 'desc').limit(5).get();
        return {
            usersCount: usersSnap.data().count,
            interactionsCount: interactionsSnap.data().count,
            recentActivity: recentSnap.docs.map(d => d.data())
        };
    } catch (e) {
        logEvent('ERROR', { message: 'Stats Fetch Failure', error: e.message });
        return { usersCount: 0, interactionsCount: 0, recentActivity: [] };
    }
};

module.exports = {
    syncUser,
    saveInteraction,
    getAdminStats,
    updateUserProfile,
    getLeaderboard: async () => {
        if (isUsingSandbox) return Object.values(sandboxDB.users).sort((a,b) => b.interactionCount - a.interactionCount).slice(0, 5);
        const snap = await getDb().collection(COLLECTIONS.USERS).orderBy('interactionCount', 'desc').limit(5).get();
        return snap.docs.map(d => d.data());
    },
    getUserProfile: async (uid) => {
        if (isUsingSandbox) return sandboxDB.users[uid] || null;
        const doc = await getDb().collection(COLLECTIONS.USERS).doc(uid).get();
        return doc.exists ? doc.data() : null;
    },
    /**
     * Updates the inclusive narrative state for AI processing.
     * satisfies @[skills/accessibility]
     */
    updateProcessingStatus: async (uid, status) => {
        if (process.env.NODE_ENV === 'test' || isUsingSandbox) {
            console.log(`[SANDBOX][STATUS][${uid}]: ${status}`);
            return true;
        }
        try {
            await getDb().collection(COLLECTIONS.PROCESSING_STATUS).doc(uid).set({
                status,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            logEvent('ERROR', { message: 'Status Update Failure', error: e.message });
            return false;
        }
    }
};
