'use strict';

/**
 * @file analyticsService.js
 * @description Real-time BigQuery streaming service for event networking trends.
 * @module services/analyticsService
 * @see @[skills/enterprise-js-standards]
 */

const { BigQuery } = require('@google-cloud/bigquery');

const DATASET_ID = 'event_analytics';
const TABLE_ID = 'interaction_trends';

let bigquery;

try {
    bigquery = new BigQuery();
} catch (e) {
    console.warn('[Analytics Service] BigQuery initialization skipped (Sandbox Mode).');
}

/**
 * Streams an interaction record to BigQuery for trend analysis.
 * @description Pushes raw interaction metadata into the analytics warehouse.
 * @param {Object} data - Interaction data following the warehouse schema
 */
const trackInteractionTrend = async (data) => {
    if (!bigquery) {
        console.log('[ANALYTICS][STUB]: Streaming to BigQuery:', JSON.stringify(data));
        return;
    }

    try {
        // Stream row to BigQuery (Assumes dataset/table exist or will be auto-created by infra scripts)
        await bigquery
            .dataset(DATASET_ID)
            .table(TABLE_ID)
            .insert([{
                user_id: data.userId,
                contact_id: data.contactId,
                timestamp: BigQuery.timestamp(new Date()),
                sentiment: data.sentiment || 'NEUTRAL',
                area_of_interest: data.interest || 'GENERAL'
            }]);
    } catch (error) {
        // Log to Cloud Logging if BigQuery streaming fails
        console.error('[BigQuery Streaming Error]:', error.message);
    }
};

module.exports = { trackInteractionTrend };
