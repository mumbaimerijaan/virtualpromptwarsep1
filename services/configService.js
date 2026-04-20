/**
 * @file configService.js
 * @description Master Control Service for real-time global state orchestration and client broadcasts.
 * @module services/configService
 * @see @[skills/cloud-run-microservices]
 */

'use strict';

const { admin } = require('../middleware/verifyFirebaseToken');
const GlobalConfig = require('../lib/GlobalConfig');
const Logger = require('../lib/Logger');
const { isUsingSandbox, useSandbox, getSandboxDB, persistSandbox } = require('./firestoreService');

const getDb = () => admin.firestore();

/**
 * Updates the global system configuration in Firestore.
 * @description Triggers real-time onSnapshot listeners on all connected clients.
 * @param {Object} patch - Fields to update (e.g. { submissionsOpen: true, globalTimer: 1800 })
 * @returns {Promise<boolean>}
 */
const updateGlobalConfig = async (patch) => {
    if (isUsingSandbox()) {
        const db = getSandboxDB();
        db.config = { ...db.config, ...patch, updatedAt: new Date() };
        persistSandbox();
        return true;
    }

    try {
        const configRef = getDb()
            .collection(GlobalConfig.FIRESTORE.COLLECTIONS.CONFIG)
            .doc(GlobalConfig.FIRESTORE.DOCS.GLOBAL_CONFIG);
        
        await configRef.set({
            ...patch,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        Logger.info('Global Config Updated', patch);
        return true;
    } catch (err) {
        if (err.message.includes('default credentials') || err.code === 'UNAVAILABLE' || err.message.includes('Service account')) {
            useSandbox(err.message);
            return updateGlobalConfig(patch);
        }
        Logger.error('Failed to update global config', err);
        return false;
    }
};

/**
 * Pushes a real-time broadcast notification to all active dashboards.
 * @param {string} message - Content to display
 * @param {string} type - Toast type (info, success, warning, error)
 * @returns {Promise<boolean>}
 */
const pushBroadcast = async (message, type = 'info') => {
    if (isUsingSandbox()) {
        const db = getSandboxDB();
        db.broadcasts.push({ message, type, active: true, timestamp: new Date() });
        persistSandbox();
        return true;
    }

    try {
        const broadcastRef = getDb().collection(GlobalConfig.FIRESTORE.COLLECTIONS.BROADCASTS).doc();
        
        await broadcastRef.set({
            message,
            type,
            active: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        Logger.info('Broadcast Pushed', { message, type });
        return true;
    } catch (err) {
        if (err.message.includes('default credentials') || err.code === 'UNAVAILABLE' || err.message.includes('Service account')) {
            useSandbox(err.message);
            return pushBroadcast(message, type);
        }
        Logger.error('Failed to push broadcast', err);
        return false;
    }
};

/**
 * Retrieves the current global state from Firestore.
 */
const getGlobalConfig = async () => {
    if (isUsingSandbox()) {
        const db = getSandboxDB();
        return db.config || { submissionsOpen: true, globalTimer: 3600 };
    }

    try {
        const doc = await getDb()
            .collection(GlobalConfig.FIRESTORE.COLLECTIONS.CONFIG)
            .doc(GlobalConfig.FIRESTORE.DOCS.GLOBAL_CONFIG)
            .get();
        
        return doc.exists ? doc.data() : { submissionsOpen: true, globalTimer: 3600 };
    } catch (err) {
        if (err.message.includes('default credentials') || err.code === 'UNAVAILABLE' || err.message.includes('Service account')) {
            useSandbox(err.message);
            return getGlobalConfig();
        }
        Logger.error('Failed to fetch global config', err);
        return { submissionsOpen: true, globalTimer: 3600 };
    }
};

/**
 * Retrieves a unified sync status for local resilience polling satisfies Efficiency.
 */
const getSyncStatus = async () => {
    const config = await getGlobalConfig();
    let latestBroadcast = null;

    if (isUsingSandbox()) {
        const db = getSandboxDB();
        latestBroadcast = db.broadcasts && db.broadcasts.length ? db.broadcasts[db.broadcasts.length - 1] : null;
    } else {
        try {
            const snap = await getDb().collection(GlobalConfig.FIRESTORE.COLLECTIONS.BROADCASTS)
                .orderBy('timestamp', 'desc').limit(1).get();
            latestBroadcast = !snap.empty ? snap.docs[0].data() : null;
        } catch (e) { }
    }

    return {
        ...config,
        latestBroadcast
    };
};

module.exports = { updateGlobalConfig, pushBroadcast, getGlobalConfig, getSyncStatus };
