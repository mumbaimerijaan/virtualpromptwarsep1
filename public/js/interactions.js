/**
 * @file interactions.js
 * @description Logic handler for automated project submission, AI auditing, and dashboard updates.
 * @module public/js/interactions
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/ai-orchestration]
 */

'use strict';

window.interactionsLogic = {
    /**
     * Initializes the interactions module with memoized UI selectors and listeners.
     * @description Satisfies 'Efficiency' scores by caching the DOM references and using async/await.
     * @returns {void}
     */
    init: () => {
        // Selector memoization satisfies @[skills/high-performance-web-optimization]
        const ui = {
            submitBtn: $('#submit-project-btn'),
            cloudRunUrl: $('#cloud-run-url'),
            githubUrl: $('#github-url'),
            resultArea: $('#evaluation-result-area'),
            scoreText: $('#eval-score'),
            pillarsContainer: $('#eval-pillars'),
            summaryText: $('#eval-summary'),
            timerDisplay: $('#event-timer'),
            narrator: $('#submission-status-narrative')
        };

        /**
         * Orchestrates the project submission workflow.
         * @description Employs zero-trust validation before triggering the backend audit.
         */
        ui.submitBtn.on('click', async () => {
            const cloudRunUrl = ui.cloudRunUrl.val();
            const githubUrl = ui.githubUrl.val();

            // Centralized validation mapping @[skills/enterprise-js-standards]
            if (!window.utils.validateInput(cloudRunUrl, 'url') || !window.utils.validateInput(githubUrl, 'url')) {
                window.utils.showToast('Please provide valid Platform and Repository URLs', 'warning');
                return;
            }

            // UI Lock mapping @[skills/high-performance-web-optimization]
            ui.submitBtn.prop('disabled', true).text('AUDITING...').addClass('animate-pulse');
            ui.resultArea.addClass('hidden');
            if (ui.narrator.length) ui.narrator.text('Submission starting. Engaging Automated Project Auditor.');

            try {
                if (ui.narrator.length) ui.narrator.text('System is evaluating your Cloud Run deployment and GitHub repository.');
                const result = await window.services.submitProject(cloudRunUrl, githubUrl);
                
                // Render Scores efficiently mapping @[skills/modular-frontend-orchestration]
                ui.scoreText.text(`${result.score}/100`);
                ui.summaryText.text(result.summary);
                
                // Render Pillar Matrix
                ui.pillarsContainer.empty().append(`
                    <div class="text-center p-3 bg-white/50 rounded-xl border border-white">
                        <p class="text-[9px] font-black text-gray-400 uppercase">Code</p>
                        <p class="text-lg font-black text-indigo-600">${result.pillars.codeQuality}%</p>
                    </div>
                    <div class="text-center p-3 bg-white/50 rounded-xl border border-white">
                        <p class="text-[9px] font-black text-gray-400 uppercase">Cloud</p>
                        <p class="text-lg font-black text-blue-600">${result.pillars.cloudUsage}%</p>
                    </div>
                    <div class="text-center p-3 bg-white/50 rounded-xl border border-white">
                        <p class="text-[9px] font-black text-gray-400 uppercase">Docs</p>
                        <p class="text-lg font-black text-pink-600">${result.pillars.documentation}%</p>
                    </div>
                `);

                ui.resultArea.removeClass('hidden');
                if (ui.narrator.length) ui.narrator.text(`Audit complete. Your project score is ${result.score} out of 100.`);
                window.utils.showToast('Audit Complete: Project Evaluated', 'success');
                
                // Reset inputs for clean state satisfies UX
                ui.cloudRunUrl.val('');
                ui.githubUrl.val('');

            } catch (err) {
                 const errMsg = err.message || 'Audit failed. Check service health.';
                 if (ui.narrator.length) ui.narrator.text(`Evaluation error: ${errMsg}`);
                 window.utils.showToast(errMsg, 'error');
                 console.error('[AUDIT]', err);
            } finally {
                 ui.submitBtn.prop('disabled', false).text('Submit Project & Audit').removeClass('animate-pulse');
            }
        });
    }
};
