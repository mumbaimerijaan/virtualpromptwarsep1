---
name: modular-frontend-orchestration
description: Structuring jQuery and Tailwind applications for high maintainability and state consistency. Use for the core app UI and interaction logic.
---

# Modular Frontend Architecture

## Use this skill when
- Building the glassmorphism UI components.
- Managing local state for QR interactions and AI responses.

## Instructions
1. **Centralized State:** Maintain a single `const state = {}` object to prevent data desync.
2. **Component Separation:** Isolate UI rendering from business logic (e.g., Gemini API calls).
3. **Optimistic UI:** Show a loading state immediately after a user inputs a note to improve perceived performance.