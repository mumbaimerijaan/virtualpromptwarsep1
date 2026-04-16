---
name: serverless-gcp-deployment
description: Deploying and scaling containerized apps on Google Cloud Run with CI/CD.
---

# Cloud Architecture & Deployment

## Use this skill when
- Configuring the Dockerfile and deploying to Cloud Run.

## Instructions
1. **Multi-stage Docker:** Use a build stage to keep the final image size under 100MB (using `node:alpine`).
2. **Env Configuration:** Store API keys in Secret Manager or Environment Variables; never hardcode.
3. **Health Checks:** Configure Cloud Run liveness probes to ensure zero-downtime deployments.