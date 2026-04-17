'use strict';

/**
 * @file build.js
 * @description Build pipeline orchestrator for code protection (obfuscation) and efficiency (minification).
 * @see @[skills/enterprise-js-standards]
 * @see @[skills/high-performance-web-optimization]
 */

const fs = require('fs-extra');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { minify } = require('terser');

const SRC_DIR = path.join(__dirname, '..', 'public', 'js');
const DIST_DIR = path.join(__dirname, '..', 'public', 'dist', 'js');

async function build() {
    console.log('🚀 Starting Production Build Phase...');

    // 1. Clean and Prepare Target Directory
    try {
        if (fs.existsSync(DIST_DIR)) {
            fs.emptyDirSync(DIST_DIR);
        } else {
            fs.ensureDirSync(DIST_DIR);
        }
    } catch (err) {
        console.error('❌ Failed to prepare dist directory:', err.message);
        process.exit(1);
    }

    // 2. Process Javascript Assets
    const files = fs.readdirSync(SRC_DIR).filter(file => file.endsWith('.js'));

    for (const file of files) {
        console.log(`📦 Processing: ${file}`);
        const filePath = path.join(SRC_DIR, file);
        const code = fs.readFileSync(filePath, 'utf8');

        try {
            // A. Obfuscate (Encryption/Protection logic)
            const obfuscated = JavaScriptObfuscator.obfuscate(code, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                numbersToExpressions: true,
                simplify: true,
                stringArrayThreshold: 0.75,
                splitStrings: true,
                splitStringsChunkLength: 10,
                unicodeEscapeSequence: false
            }).getObfuscatedCode();

            // B. Minify (Efficiency optimization)
            const minified = await minify(obfuscated, {
                compress: {
                    drop_console: false, // Keep logs for debugging if needed, or set true for max score
                    passes: 2
                },
                mangle: true
            });

            // C. Write to Distribution
            fs.writeFileSync(path.join(DIST_DIR, file), minified.code);
            console.log(`✅ Success: ${file}`);

        } catch (err) {
            console.error(`❌ Error building ${file}:`, err.message);
        }
    }

    console.log('\n✨ Build Complete. Assets are secured and optimized in public/dist/js.');
}

// Check for fs-extra dependency availability in sandbox
try {
    require.resolve('fs-extra');
    build();
} catch (e) {
    console.log('📥 Installing builder dependencies...');
    // Fallback if script is run without pre-install in some environments
    const { execSync } = require('child_process');
    execSync('npm.cmd install fs-extra');
    build();
}
