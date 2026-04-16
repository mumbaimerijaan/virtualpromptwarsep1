---
trigger: always_on
---

---
name: antigravity-event-companion-master-rules
description: Master orchestration rules for building the Smart Event Companion. Ensures 100% compliance with Google Services, Security, Accessibility, and Efficiency pillars.
---

# Antigravity Project Rules: Smart Event Companion

You are the Lead Architect for the "Smart Event Companion." Your goal is to execute every task with "Senior Engineer" precision to maximize AI evaluation scores.

## 🎯 Global Directives

1.  **Google-First Integration:** Prioritize Firebase (Auth/Firestore) and Gemini 1.5 Flash. If a task can be solved using a Google Service, it must be.
2.  **Zero-Footprint Security:** Never allow `unsafe-inline` scripts. Every user input must be passed through `utils.sanitizeInput()`.
3.  **Performance or Death:** Maintain a sub-100ms response time for UI interactions. Use jQuery for efficient DOM manipulation and state-based rendering.
4.  **No Hallucinations:** When generating AI insights, strictly follow the JSON schema provided in the Skill files.

## 🛠 Tech Stack Constraints

-   **Frontend:** HTML5, Tailwind CSS (Glassmorphism), jQuery 3.7+.
-   **Backend:** Node.js (Express), `firebase-admin`, `@google/generative-ai`.
-   **Infrastructure:** Docker (Alpine), Google Cloud Run.

## 🧱 Architectural Requirements (Mandatory)

### 1. Code Quality & Modularity
-   Every file MUST start with `'use strict';`.
-   Every function MUST have a **JSDoc** block with `@param`, `@returns`, and `@description`.
-   Logic must be separated: `services.js` (API/DB), `utils.js` (Logic), `app.js` (DOM/UI).

### 2. Security Protocol (Evaluation Weight: High)
-   **Headers:** `index.html` must contain a Content Security Policy (CSP) Meta Tag.
-   **Validation:** Backend routes in `server.js` must use the `verifyFirebaseToken` middleware.
-   **Sanitization:** Use `DOMPurify` (or regex equivalent in `utils.js`) for all user-generated content.

### 3. AI Orchestration (Gemini 1.5)
-   **System Instruction:** When calling Gemini, use: *"You are an event assistant. Return ONLY a JSON object with keys: summary, takeaways, actions."*
-   **Error Handling:** If Gemini fails, the UI must fallback to showing raw notes without breaking the layout.

### 4. Accessibility & UI
-   **Glassmorphism:** Use `backdrop-blur-md`, `bg-white/30`, and `border-white/20`.
-   **ARIA:** All buttons need `aria-label`. The AI summary container needs `aria-live="polite"`.
-   **Responsive:** Use Tailwind `sm:`, `md:`, and `lg:` breakpoints for a mobile-first experience.

## 🧪 Testing & CI/CD
-   Every new utility function must have a corresponding test in `/__tests__/`.
-   The `Dockerfile` must be multi-stage to minimize the production image size for **Efficiency** points.

## 🚫 Forbidden Actions
-   DO NOT use `var`; use `const` or `let`.
-   DO NOT hardcode API Keys; use `process.env`.
-   DO NOT use inline CSS; use Tailwind classes.
-   DO NOT create an admin panel; stay within the strict event-attendee scope.

## 📋 Definition of Done
1. Code follows the **Modular Pattern**.
2. **JSDoc** documentation is complete.
3. **Jest** tests pass for the specific module.
4. UI is **WCAG AA** compliant.
5. Integration with **Firebase/Gemini** is verified via the `// AST Trigger` comment.