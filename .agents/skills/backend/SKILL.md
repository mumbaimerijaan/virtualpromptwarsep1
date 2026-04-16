---
name: cloud-run-microservices
description: Building modular Node.js backends optimized for Google Cloud Run and high concurrency. Use to manage the event's data flow.
---

# Cloud Run Microservices Architecture

Architecting backends that are lightweight, containerized, and optimized for the unique constraints of a physical event (high-burst traffic).

## Use this skill when

- Setting up the Node.js/Express server structure.
- Designing the interaction between the API, Gemini AI, and Firestore.
- Configuring the Docker multi-stage build.

## Do not use this skill when

- Writing client-side only single-page logic.

## Instructions

1. **Modular Routing:** Separate concerns into `/routes` (express), `/services` (AI/DB), and `/middleware` (Auth/Security).
2. **Graceful Shutdown:** Implement handlers for `SIGTERM` to ensure Cloud Run instances close connections properly during scale-down.
3. **Minimal Image Footprint:** Use `node:alpine` as the base image in the Dockerfile to maximize "Efficiency" scores.

## Resources

- Google Cloud Run Production Checklist
- Node.js Best Practices (Modular Design)