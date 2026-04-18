/**
 * @file validation.test.js
 * @description Unit tests for frontend utilities satisfying @[skills/robust-verification-jest]
 */

const utils = require('../public/js/utils');

describe('Universal Utility Layer', () => {
    describe('validateInput', () => {
        test('validates URLs correctly', () => {
            expect(utils.validateInput('https://google.com', 'url')).toBe(true);
            expect(utils.validateInput('http://localhost:3000', 'url')).toBe(true);
            expect(utils.validateInput('not-a-url', 'url')).toBe(false);
        });

        test('validates event duration range', () => {
            expect(utils.validateInput('30', 'duration')).toBe(true);
            expect(utils.validateInput('300', 'duration')).toBe(false); // Max 240
            expect(utils.validateInput('-1', 'duration')).toBe(false);
        });

        test('validates plain text', () => {
            expect(utils.validateInput('Valid Text', 'text')).toBe(true);
            expect(utils.validateInput('', 'text')).toBe(false);
            expect(utils.validateInput('   ', 'text')).toBe(false);
        });
    });

    describe('formatResponse', () => {
        test('resolves data on success', async () => {
            const mockRes = {
                ok: true,
                json: async () => ({ success: true })
            };
            const result = await utils.formatResponse(mockRes);
            expect(result.success).toBe(true);
        });

        test('throws error on 4xx/5xx', async () => {
            const mockRes = {
                ok: false,
                status: 403,
                json: async () => ({ error: 'Forbidden' })
            };
            await expect(utils.formatResponse(mockRes)).rejects.toThrow('Forbidden');
        });
    });
});
