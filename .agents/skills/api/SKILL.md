---
name: api-design-for-google-cloud
description: Designing high-performance REST APIs for Cloud Run and Gemini AI orchestration. Use when building endpoints for session insights and networking.
---

# API Design for Google Cloud

Master the creation of stateless, scalable endpoints optimized for Google Cloud Run and asynchronous AI processing.

## Use this skill when

- Designing the `/generate-insights` and `/sync-interactions` endpoints.
- Structuring JSON payloads for Gemini 1.5 Flash model consumption.
- Implementing real-time event updates via Firestore-backed REST routes.

## Do not use this skill when

- Designing internal-only utility functions that do not cross the network boundary.

## Instructions

1. **Schema Enforcement:** Always define a strict JSON schema for AI responses. Ensure the endpoint expects the structure: `{"summary": "", "takeaways": [], "actions": []}`.
2. **Statelessness:** Ensure all endpoints are compatible with Cloud Run's auto-scaling by keeping logic stateless and using Firestore for persistence.
3. **Versioning:** Prefix all routes with `/api/v1/` to demonstrate enterprise-grade code quality.
4. **Header Management:** Include `Content-Type: application/json` and implement custom headers for event-specific telemetry.

## Resources

- Google Cloud API Design Guide
- Gemini API Documentation for Structured Outputs