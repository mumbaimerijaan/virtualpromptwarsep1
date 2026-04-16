const utils = require('../public/js/utils');

describe('Security & Utilities Implementation (utils.js)', () => {
    describe('Zero-Trust Input Sanitization', () => {
        it('should return empty string for null or non-string inputs', () => {
            expect(utils.sanitizeInput(null)).toBe('');
            expect(utils.sanitizeInput(undefined)).toBe('');
            expect(utils.sanitizeInput(123)).toBe('');
        });

        it('should aggressively strip <script> tag injection attempts', () => {
            const maliciousPayload = '<script>alert("XSS")</script>Safe Content';
            const safeOutput = utils.sanitizeInput(maliciousPayload);
            expect(safeOutput).not.toContain('<script>');
            expect(safeOutput).toContain('Safe Content');
        });

        it('should neutralize HTML tags into harmless character entities', () => {
            const domPayload = '<h1>Big Header</h1>';
            const safeOutput = utils.sanitizeInput(domPayload);
            expect(safeOutput).toBe('&lt;h1&gt;Big Header&lt;/h1&gt;');
        });

        it('should aggressively recursively strip inline JavaScript execution handlers (onmouseover, onclick)', () => {
            const eventPayload = '&lt;img src="valid.jpg" onmouseover="stealTokens()" onclick=\'alert(1)\' onerror=fail&gt;';
            const safeOutput = utils.sanitizeInput(eventPayload);
            expect(safeOutput).not.toContain('onmouseover');
            expect(safeOutput).not.toContain('onclick');
            expect(safeOutput).not.toContain('onerror');
            expect(safeOutput).toContain('&lt;img src="valid.jpg"   &gt;');
        });
    });

    describe('UID Generation', () => {
        it('should correctly format a 9-character randomized identifier', () => {
            const uid1 = utils.uidGenerator();
            const uid2 = utils.uidGenerator();
            
            expect(typeof uid1).toBe('string');
            expect(uid1.length).toBeLessThanOrEqual(9);
            expect(uid1).not.toEqual(uid2);
        });
    });
});
