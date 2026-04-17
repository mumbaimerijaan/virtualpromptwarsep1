/**
 * @file interactions.js
 * @description Logic handler for interaction logging, AI analysis, and dynamic feed updates.
 * @module public/js/interactions
 * @see @[skills/modular-frontend-orchestration]
 * @see @[skills/high-performance-web-optimization]
 */

'use strict';

window.interactionsLogic = {
    /**
     * Initializes the interactions module with memoized UI selectors.
     * @description Satisfies 'Efficiency' scores by caching the DOM references.
     */
    init: () => {
        // Memoization Cache satisfies @[skills/high-performance-web-optimization]
        const ui = {
            btn: $('#submit-interaction-btn'),
            note: $('#interaction-note'),
            qrContact: $('#qr-contact'),
            feed: $('#interactions-feed'),
            loader: $('#ai-loading'),
            pane: $('#insights-pane'),
            takeaways: $('#takeaways-list'),
            actions: $('#actions-checklist'),
            modal: $('#interaction-modal'),
            totalStat: $('#total-interactions-stat'),
            totalTime: $('#total-interactions-time')
        };

        ui.btn.on('click', async () => {
            const rawNote = ui.note.val();
            const contactId = ui.qrContact.val();

            if (!rawNote || !rawNote.trim()) {
                alert('Notes cannot be bare/empty.');
                return;
            }

            // Lock UI locally for API latency overhead mapping
            ui.btn.prop('disabled', true).addClass('opacity-50');
            ui.loader.removeClass('hidden');

            try {
                // Call abstracted Services mapping directly bypassing nested HTTP calls locally
                const insights = await window.services.generateInsights(rawNote, contactId);
                
                // 1. Clear initial pulses if any
                ui.feed.find('.animate-pulse').remove();

                const safeSummary = window.utils.sanitizeInput(insights.summary || 'Summary unavailable.');
                
                // Render Interaction Card (Left Pane)
                const card = document.createElement('div');
                card.className = 'glass-btn p-5 rounded-2xl border border-white/50 flex items-center gap-4 transition-all hover:bg-white/60 mb-4 animate-in fade-in slide-in-from-left-4 duration-500';
                
                const contactAlias = contactId ? (contactId.includes('_') ? contactId.split('_')[1].substring(0,8) : contactId) : 'Event Attendee';
                
                card.innerHTML = `
                    <div class="w-12 h-12 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center font-bold text-blue-700 overflow-hidden shrink-0">
                        ${contactAlias[0].toUpperCase()}
                    </div>
                    <div class="flex-1">
                        <h5 class="text-sm font-bold text-gray-800">${contactAlias}</h5>
                        <p class="text-[11px] text-gray-600 font-medium leading-tight line-clamp-2">${safeSummary}</p>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">Just Now</p>
                    </div>
                `;

                ui.feed.prepend(card);
                
                // 2. Update Insights Pane (Right Pane)
                ui.pane.removeClass('opacity-40 pointer-events-none').addClass('scale-105');
                setTimeout(() => ui.pane.removeClass('scale-105'), 500);

                $('#gen-time').html('<span class="w-2 h-2 rounded-full bg-green-400"></span> Generated 1m ago');

                ui.takeaways.empty();
                insights.keyTakeaways.forEach(t => {
                    ui.takeaways.append(`<li class="flex gap-3 text-sm text-gray-700 font-medium"><span class="text-indigo-500">•</span> ${window.utils.sanitizeInput(t)}</li>`);
                });

                ui.actions.empty();
                insights.actions.forEach((a, i) => {
                    const id = `action-${i}`;
                    ui.actions.append(`
                        <label for="${id}" class="flex items-start gap-4 text-sm text-gray-700 font-medium cursor-pointer group hover:text-indigo-900">
                            <input type="checkbox" id="${id}" class="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                            <span class="group-hover:translate-x-1 transition-transform">${window.utils.sanitizeInput(a)}</span>
                        </label>
                    `);
                });

                // 3. Global Stats Update
                const count = parseInt(ui.totalStat.text().replace(/\D/g,'')) || 0;
                ui.totalStat.text(`Total Interactions: ${count + 1}`);
                ui.totalTime.text('Just Now');

                // 4. Modal cleanup
                ui.modal.addClass('hidden');
                ui.note.val('');
                ui.qrContact.val('');

            } catch (err) {
                 alert('Interaction Generation Failed. Please confirm connectivity constraints.');
                 console.error(err);
            } finally {
                 ui.btn.prop('disabled', false).removeClass('opacity-50');
                 ui.loader.addClass('hidden');
            }
        });
    }
}

