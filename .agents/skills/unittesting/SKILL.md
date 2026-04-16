---
name: robust-verification-jest
description: Implementing a high-coverage test suite using Jest to validate AI outputs and security logic.
---

# Unit Testing & Automation

## Use this skill when
- Writing tests for the `/generate-insights` endpoint and input sanitizers.

## Instructions
1. **Mocking External APIs:** Always mock the `@google/generative-ai` SDK response to test the app's JSON parsing resilience.
2. **Security Injection Tests:** Write test cases specifically designed to fail if XSS strings are not properly stripped.
3. **Async Testing:** Use `async/await` in Jest to validate real-time Firestore triggers.