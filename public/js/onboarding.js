'use strict';

window.onboardingLogic = {
    init: () => {
        // Handle custom styles for hidden selected checkboxes (Tailwind doesn't natively map peer checks nicely without deep config sometimes)
        $('input[type="checkbox"]').on('change', function() {
             if ($(this).is(':checked')) {
                 $(this).parent().addClass('selected-tag');
             } else {
                 $(this).parent().removeClass('selected-tag');
             }
        });

        // Hardware & UX Guardrail satisfying @[skills/accessibility]
        const checkHardwareCompatibility = () => {
            const $btn = $('#ob-submit-btn');
            const isTooSmall = window.innerWidth < 1024;
            
            if (isTooSmall) {
                // Disable button and add Tailwind tooltip satisfies UI/UX
                $btn.prop('disabled', true)
                    .addClass('opacity-50 cursor-not-allowed group relative')
                    .append(`
                        <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Deep Architectural Audits require desktop-grade processing (min 1024px).
                        </span>
                    `);
            } else {
                $btn.prop('disabled', false).removeClass('opacity-50 cursor-not-allowed group relative').find('span.absolute').remove();
            }
        };

        checkHardwareCompatibility();
        $(window).on('resize', checkHardwareCompatibility);

        $('#onboarding-form').on('submit', async (e) => {
            e.preventDefault();
            
            const $btn = $('#ob-submit-btn');
            const $err = $('#ob-error');
            
            $btn.prop('disabled', true).addClass('opacity-50');
            $err.addClass('hidden');

            try {
                // Bundle elements 
                const intentMap = [];
                $('input[name="intent"]:checked').each(function() { intentMap.push($(this).val()); });

                const interestsMap = [];
                $('input[name="interests"]:checked').each(function() { interestsMap.push($(this).val()); });

                // Construct flat payload securely
                const payload = {
                    company: window.utils.sanitizeInput($('#ob-company').val()),
                    jobRole: window.utils.sanitizeInput($('#ob-role').val()),
                    domain: window.utils.sanitizeInput($('#ob-domain').val()),
                    experience: window.utils.sanitizeInput($('#ob-experience').val()),
                    intents: intentMap,
                    interests: interestsMap,
                    gainObjective: window.utils.sanitizeInput($('#ob-optional').val() || '')
                };

                const { token } = window.roleState.getSession();

                // Post directly to onboarding completion endpoint
                const response = await fetch('/api/v1/complete-onboarding', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/json',
                         'Authorization': `Bearer ${token}`
                     },
                     body: JSON.stringify({ payload })
                });

                if (!response.ok) {
                     throw new Error('Server rejected onboarding data.');
                }

                // Push to dashboard
                window.location.replace('/pages/user-dashboard.html');

            } catch (error) {
                console.error(error);
                $err.text('Failed to save profile. Ensure network connection.').removeClass('hidden');
            } finally {
                $btn.prop('disabled', false).removeClass('opacity-50');
            }
        });
    }
};

$(document).ready(() => {
    if (window.onboardingLogic && typeof window.onboardingLogic.init === 'function') {
        window.onboardingLogic.init();
        console.log("Onboarding logic initialized.");
    }
});
