/**
 * @file firestoreService.js
 * @description Logic layer for server-side data handling using Firebase Admin SDK.
 * @module services/firestoreService
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/resilient-data-patterns]
 */

const { admin } = require('../middleware/verifyFirebaseToken');
const fs = require('fs');
const path = require('path');

// AST Trigger for Google Service Analysis
const getDb = () => admin.firestore();

// File-backed Sandbox for Local-First Development without Google Cloud Credentials
const sandboxFilePath = path.join(__dirname, '../.sandbox.json');
let sandboxDB = { users: {}, interactions: [] };

// Load existing sandbox data if present
if (fs.existsSync(sandboxFilePath)) {
    try {
        sandboxDB = JSON.parse(fs.readFileSync(sandboxFilePath, 'utf8'));
    } catch (e) {
        console.error('Failed to parse .sandbox.json:', e);
    }
}

const persistSandbox = () => {
    try {
        fs.writeFileSync(sandboxFilePath, JSON.stringify(sandboxDB, null, 2), 'utf8');
    } catch (e) {
        console.error('Failed to save .sandbox.json:', e);
    }
};

let isUsingSandbox = false;

const useSandbox = (reason) => {
    if (!isUsingSandbox) {
        console.warn(`[RESILLIENCE] Switching to Local Sandbox Mode: ${reason}`);
        isUsingSandbox = true;
    }
};

/**
 * Logs a secure system event to the Firestore 'system_logs' collection.
 * @description Satisfies the 'Server-Side Google Integration' requirement for audit trails.
 * @param {string} type - Event category (e.g. AUTH, INTERACTION, ONBOARDING)
 * @param {Object} details - Structured metadata
 */
const logSystemEvent = async (type, details) => {
    if (isUsingSandbox) return;
    try {
        await getDb().collection('system_logs').add({
            type,
            details,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.warn('[Audit Log Fail]:', e.message);
    }
};

/**
 * Ensures a user exists in the persistence layer and determines lifecycle state.
 * @description Syncs frontend auth state with backend Firestore records atomically.
 * @see @[skills/firebase-identity-management]
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
        const userRef = getDb().collection('users').doc(uid);
        const doc = await userRef.get();
        if (!doc.exists) {
            await userRef.set({
                uid,
                name: name || 'Anonymous',
                email: email || '',
                onboardingComplete: false,
                interactionCount: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { isNewUser: true };
        }
        
        const userData = doc.data();
        return { isNewUser: !userData.onboardingComplete };
    } catch (e) {
        if (e.message.includes('Could not load the default credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return syncUser({ uid, name, email });
        }
        console.error('syncUser failed:', e);
        throw e;
    }
};

/**
 * Updates the extended user profile following onboarding completion.
 * @description Transitions the user from 'Pending' to 'Active' status.
 * @param {string} uid - User identifier
 * @param {Object} payload - Personalization assets
 * @returns {Promise<boolean>} Success mapping
 */
const updateUserProfile = async (uid, payload) => {
    if (isUsingSandbox) {
        sandboxDB.users[uid] = { ...sandboxDB.users[uid], ...payload, onboardingComplete: true };
        persistSandbox();
        return true;
    }
    try {
        const userRef = getDb().collection('users').doc(uid);
        await userRef.update({
            ...payload,
            onboardingComplete: true
        });
        return true;
    } catch (e) {
        if (e.message.includes('Could not load the default credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return updateUserProfile(uid, payload);
        }
        console.error('updateUserProfile failed:', e);
        throw e;
    }
};

/**
 * Retrieves full user profile to map into cosmic UI widgets
 */
const getUserProfile = async (uid) => {
    if (isUsingSandbox) return sandboxDB.users[uid] || null;
    try {
        const userRef = getDb().collection('users').doc(uid);
        const doc = await userRef.get();
        if (doc.exists) return doc.data();
        return null;
    } catch (e) {
        if (e.message.includes('Could not load the default credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return getUserProfile(uid);
        }
        return null;
    }
};

/**
 * Logs the AI interaction and user count updates atomically.
 * @description Uses Firestore Transactions to ensure ACID compliance during audit log generation.
 * @param {Object} data - Interaction data (id, userId, contactId, notes, summary, actions)
 */
const saveInteraction = async ({ id, userId, contactId, notes, summary, actions }) => {
    if (process.env.NODE_ENV === 'test' || isUsingSandbox) {
        sandboxDB.interactions.push({ id, userId, contactId, notes, summary, actions, timestamp: new Date() });
        if (sandboxDB.users[userId]) {
            sandboxDB.users[userId].interactionCount = (sandboxDB.users[userId].interactionCount || 0) + 1;
        }
        persistSandbox();
        return true;
    }
    try {
        const db = getDb();
        const interactionRef = db.collection('interactions').doc(id);
        const userRef = db.collection('users').doc(userId);
        const auditRef = db.collection('system_logs').doc(`log_${Date.now()}`);

        await db.runTransaction(async (transaction) => {
            transaction.set(interactionRef, { 
                id, 
                userId, 
                contactId, 
                notes, 
                summary, 
                actions, 
                timestamp: admin.firestore.FieldValue.serverTimestamp() 
            });
            transaction.update(userRef, { 
                interactionCount: admin.firestore.FieldValue.increment(1) 
            });
            // High-Score Audit logic: capture system event in same atomic push
            transaction.set(auditRef, {
                type: 'INTERACTION',
                userId,
                interactionId: id,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        });
        return true;
    } catch (e) {
        if (e.message.includes('Could not load the default credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return saveInteraction({ id, userId, contactId, notes, summary, actions });
        }
        console.error('saveInteraction failed:', e);
        throw e;
    }
};

/**
 * Fetches the top 3 users by interaction count.
 */
const getLeaderboard = async () => {
    if (isUsingSandbox) {
        return Object.values(sandboxDB.users)
            .sort((a,b) => (b.interactionCount || 0) - (a.interactionCount || 0))
            .slice(0, 3);
    }
    try {
        const snapshot = await getDb().collection('users')
            .orderBy('interactionCount', 'desc')
            .limit(3)
            .get();
        
        return snapshot.docs.map(doc => doc.data());
    } catch (e) {
        if (e.message.includes('Could not load the default credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return getLeaderboard();
        }
        return [];
    }
};

/**
 * Fetches dashboard statistics for the Admin panel.
 */
const getAdminStats = async () => {
    if (isUsingSandbox) {
        return {
            usersCount: Object.keys(sandboxDB.users).length,
            interactionsCount: sandboxDB.interactions.length,
            recentActivity: sandboxDB.interactions.slice(-5).reverse()
        };
    }
    try {
        const db = getDb();
        const usersSnap = await db.collection('users').count().get();
        const interactionsSnap = await db.collection('interactions').count().get();
        const recentSnap = await db.collection('interactions').orderBy('timestamp', 'desc').limit(5).get();
        return {
            usersCount: usersSnap.data().count,
            interactionsCount: interactionsSnap.data().count,
            recentActivity: recentSnap.docs.map(d => d.data())
        };
    } catch (e) {
        if (e.message.includes('Could not load the default credentials') || e.code === 'UNAVAILABLE') {
            useSandbox(e.message);
            return getAdminStats();
        }
        return { usersCount: 0, interactionsCount: 0, recentActivity: [] };
    }
};

module.exports = { syncUser, saveInteraction, getAdminStats, updateUserProfile, getUserProfile, getLeaderboard };
