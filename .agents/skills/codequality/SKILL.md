---
name: enterprise-js-standards
description: Enforcing strict coding standards, JSDoc, and modularity. Use to ensure the code passes AI evaluation for "Code Quality".
---

# Enterprise JS Standards

Applying rigorous software engineering principles to ensure maintainable, readable, and highly-rated codebases.

## Use this skill when

- Writing any JavaScript file across the frontend or backend.
- Documenting functions for the AI evaluator.

## Do not use this skill when

- Writing throwaway scripts or local configuration hacks.

## Instructions

1. **Strict Mode:** Every file must start with `'use strict';` to prevent global leakage.
2. **JSDoc:** Every function must have a JSDoc block defining `@param`, `@returns`, and `@throws`.
3. **Single Source of Truth:** Use centralized `templates` and `config` objects (as seen in `app.js`) to avoid hardcoding values in logic loops.
4. **Modularity:** Ensure No single function exceeds 30 lines of code; break complex logic into utility helpers.

## Resources

- Google JavaScript Style Guide
- Clean Code Handbook for Modern Web