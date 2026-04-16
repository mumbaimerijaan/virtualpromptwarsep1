---
name: zero-trust-cloud-security
description: Securing the cloud backend against XSS, Injection, and unauthorized access. Use to ensure a 100% "Security" pillar score.
---

# Zero-Trust Cloud Security

Implementing a multi-layered security strategy for cloud-native applications.

## Use this skill when

- Configuring Express middleware for headers and sanitization.
- Validating Firestore security rules.

## Do not use this skill when

- Running local-only development environments.

## Instructions

1. **CSP Implementation:** Define a strict Content-Security-Policy (CSP) that explicitly bans `unsafe-inline` and restricts `connect-src` to Google APIs.
2. **Input Sanitization:** Use regex utilities to strip HTML/Script tags from user notes before they reach the Gemini API or Firestore.
3. **Error Masking:** Ensure the API never returns stack traces; use a centralized error handler to log errors to Cloud Logging while returning generic `500` messages to the user.

## Resources

- OWASP Top Ten for Node.js
- Google Cloud Security Foundations