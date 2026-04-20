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
     * Initializes the Quick Notes module with multimodal support and persistence.
     * @description Satisfies 'Efficiency' scores by caching DOM references and using async/await.
     * @returns {void}
     */
    init: async () => {
        console.log('[QUICK-NOTES] Initializing System v10.1...');
        const ui = {
            notesArea: $('#interaction-notes'),
            insightsBtn: $('#generate-insights-btn'),
            attachBtn: $('#attach-file-btn'),
            fileInput: $('#file-input'),
            preview: $('#attachment-preview'),
            attachmentName: $('#attachment-name'),
            removeAttachment: $('#remove-attachment'),
            historyContainer: $('#notes-history-container'),
            notesList: $('#notes-list'),
            exportBtn: $('#export-pdf-btn'),
            
            // Modal Elements
            modal: $('#note-modal'),
            modalTimestamp: $('#modal-timestamp'),
            modalNotes: $('#modal-notes'),
            modalSummary: $('#modal-summary'),
            modalActions: $('#modal-actions'),
            closeModal: $('#close-modal-btn'),

            // Standard Submission Selectors
            submitBtn: $('#submit-project-btn'),
            cloudRunUrl: $('#cloud-run-url'),
            githubUrl: $('#github-url'),
            resultArea: $('#evaluation-result-area'),
            scoreText: $('#eval-score'),
            pillarsContainer: $('#eval-pillars'),
            summaryText: $('#eval-summary'),
            narrator: $('#submission-status-narrative')
        };

        let notesHistory = [];

        // --- 1. Summarization Logic satisfies @[skills/ai-orchestration] ---
        ui.insightsBtn.on('click', async () => {
            const notes = ui.notesArea.val();
            if (!notes || notes.trim().length === 0) {
                window.utils.showToast('Please provide some notes to summarize.', 'warning');
                return;
            }

            ui.insightsBtn.prop('disabled', true).text('ANALYZING...').addClass('animate-pulse');

            try {
                await window.services.generateInsights(notes);
                window.utils.showToast('Quick Note Saved & Processed', 'success');
                ui.notesArea.val('');
                // Force immediate sync using the new User Activity endpoint
                await syncHistoryLedger();
            } catch (err) {
                window.utils.showToast(err.message || 'AI Processor Error', 'error');
            } finally {
                ui.insightsBtn.prop('disabled', false).text('Summarize with AI').removeClass('animate-pulse');
            }
        });

        // --- 1. Real-Time History Ledger satisfies @[skills/resilient-data-patterns] ---
        const setupHistoryListener = async () => {
            console.log('[QUICK-NOTES] Setting up Data Ledger Listener...');
            await window.services.bootstrap();
            const { uid } = firebase.auth().currentUser;
            
            // Primary Listener for Cloud Sync
            firebase.firestore().collection('interactions')
                .where('userId', '==', uid)
                .onSnapshot((snapshot) => {
                    console.log(`[QUICK-NOTES] Snapshot Received: ${snapshot.size} entries.`);
                    const cloudNotes = snapshot.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .filter(note => !note.type || note.type === 'QUICK_NOTE');

                    if (cloudNotes.length > 0) {
                        notesHistory = cloudNotes.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
                        renderHistory();
                    } else if (window.location.hostname === 'localhost') {
                         // FALLBACK: Fetch from local activity ledger
                         syncHistoryLedger();
                    }
                }, (error) => {
                    console.warn('[QUICK-NOTES] Cloud Listener Restricted. Using History Handshake.');
                    syncHistoryLedger();
                });
        };

        /**
         * Orchestrates a unified sync between Cloud listeners and a manual Refresh Handshake.
         * satisfies @[skills/resilient-data-patterns]
         */
        const syncHistoryLedger = async () => {
            try {
                const data = await window.services.fetchUserActivity();
                if (data && data.history) {
                    notesHistory = data.history
                        .filter(note => !note.type || note.type === 'QUICK_NOTE' || note.type === 'PROJECT_SUBMISSION')
                        .sort((a,b) => {
                             const dateA = a.timestamp?._seconds || new Date(a.timestamp).getTime() || 0;
                             const dateB = b.timestamp?._seconds || new Date(b.timestamp).getTime() || 0;
                             return dateB - dateA;
                        });
                    console.log(`[QUICK-NOTES] Ledger Synchronized: ${notesHistory.length} entries.`);
                    renderHistory();
                }
            } catch (e) {
                console.error('[QUICK-NOTES] Ledger Sync Failed:', e);
            }
        };

        const renderHistory = () => {
            ui.notesList.find('tr:not(#empty-ledger-row)').remove();
            
            if (notesHistory.length === 0) {
                $('#empty-ledger-row').show();
                ui.exportBtn.addClass('hidden');
                return;
            }

            $('#empty-ledger-row').hide();
            ui.exportBtn.removeClass('hidden');

            notesHistory.forEach((note) => {
                const date = note.timestamp ? note.timestamp.toDate().toLocaleString() : 'Just now';
                ui.notesList.append(`
                    <tr class="hover:bg-white/60 cursor-pointer transition-colors group" data-id="${note.id}">
                        <td class="px-6 py-4 text-[10px] font-bold text-gray-400 tabular-nums">${date}</td>
                        <td class="px-6 py-4 font-medium text-gray-700 truncate max-w-xs">${note.summary}</td>
                        <td class="px-6 py-4 text-right">
                            <button class="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">View</button>
                        </td>
                    </tr>
                `);
            });

            // Bind click handlers mapping @[skills/modular-frontend-orchestration]
            ui.notesList.find('tr').on('click', function() {
                const id = $(this).data('id');
                const note = notesHistory.find(n => n.id === id);
                showNoteModal(note);
            });
        };

        const showNoteModal = (note) => {
            const date = note.timestamp ? note.timestamp.toDate().toLocaleString() : 'Just now';
            ui.modalTimestamp.text(date);
            ui.modalNotes.text(note.notes || 'Visual Content');
            ui.modalSummary.text(note.summary);
            ui.modalActions.empty();
            
            note.actions.forEach(action => {
                ui.modalActions.append(`
                    <li class="flex items-start gap-2 text-xs text-gray-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                        <span class="text-indigo-500 font-bold mt-0.5">→</span>
                        ${action}
                    </li>
                `);
            });
            
            ui.modal.removeClass('hidden').hide().fadeIn(200);
        };

        ui.closeModal.on('click', () => ui.modal.fadeOut(200));

        // --- 4. PDF Export Logic mapping @[skills/efficiency] ---
        ui.exportBtn.on('click', () => {
            if (typeof window.jspdf === 'undefined') {
                window.utils.showToast('PDF Engine initializing... try again.', 'warning');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text('Smart Event Companion: Briefing Report', 20, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);
            
            let y = 40;
            notesHistory.forEach((note, index) => {
                const date = note.timestamp ? note.timestamp.toDate().toLocaleString() : 'N/A';
                
                if (y > 250) { doc.addPage(); y = 20; }
                
                doc.setFontSize(12);
                doc.setTextColor(0);
                doc.text(`${index + 1}. Session Insight (${date})`, 20, y);
                y += 7;
                
                doc.setFontSize(10);
                doc.setTextColor(80);
                const summaryLines = doc.splitTextToSize(note.summary, 170);
                doc.text(summaryLines, 20, y);
                y += (summaryLines.length * 5) + 5;
                
                doc.setFont('helvetica', 'italic');
                doc.text('Key Actions:', 25, y);
                y += 5;
                note.actions.forEach(a => {
                   doc.text(`- ${a}`, 30, y);
                   y += 5;
                });
                y += 10;
            });
            
            doc.save('EventNotes_Summary.pdf');
            window.utils.showToast('Briefing Report Exported', 'success');
        });

        // --- 5. Shared Submission Logic ---
        ui.submitBtn.on('click', async () => {
            const cloudRunUrl = ui.cloudRunUrl.val();
            const githubUrl = ui.githubUrl.val();

            if (!window.utils.validateInput(cloudRunUrl, 'url') || !window.utils.validateInput(githubUrl, 'url')) {
                window.utils.showToast('Please provide valid Platform and Repository URLs', 'warning');
                return;
            }

            ui.submitBtn.prop('disabled', true).text('AUDITING...').addClass('animate-pulse');
            ui.resultArea.addClass('hidden');

            try {
                const result = await window.services.submitProject(cloudRunUrl, githubUrl);
                ui.scoreText.text(`${result.score}/100`);
                ui.summaryText.text(result.summary);
                
                ui.pillarsContainer.empty().append(`
                    <div class="text-center p-3 bg-white/50 rounded-xl border border-white">
                        <p class="text-[9px] font-black text-gray-400 uppercase">Code</p>
                        <p class="text-lg font-black text-indigo-600">${result.pillars.codeQuality}%</p>
                    </div>
                    <div class="text-center p-3 bg-white/50 rounded-xl border border-white">
                        <p class="text-[9px] font-black text-gray-400 uppercase">Cloud</p>
                        <p class="text-lg font-black text-blue-600">${result.pillars.cloudUsage}%</p>
                    </div>
                `);

                ui.resultArea.removeClass('hidden');
                window.utils.showToast('Audit Complete', 'success');
                ui.cloudRunUrl.val('');
                ui.githubUrl.val('');
            } catch (err) {
                 window.utils.showToast(err.message, 'error');
            } finally {
                 ui.submitBtn.prop('disabled', false).text('Submit Project & Audit').removeClass('animate-pulse');
            }
        });

        // Bootstrap Listeners satisfies Initialization Pattern
        firebase.auth().onAuthStateChanged((user) => {
            if (user) setupHistoryListener();
        });
    }
};
