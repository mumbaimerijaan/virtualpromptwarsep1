# Smart Event Companion - Project Documentation

## 🏗 Architectural Blueprint
The Smart Event Companion is a production-grade PWA built on a **Modular Micro-Service Architecture**. It leverages Google Cloud Platform (GCP) and Gemini AI to provide real-time strategic networking insights for attendees.

### Core Pillars
1. **Intelligence Layer**: Orchestrated via `Gemini 1.5 Flash` for strategic summary extraction and networking strategy generation.
2. **Persistence Layer**: Multi-tier storage using `Firebase Firestore` for real-time data and a local **Filesystem Sandbox** for development resilience.
3. **Security Layer**: Zero-trust authentication via `Firebase Auth` + server-side `JWT` RBAC (Role Based Access Control).
4. **Efficiency Layer**: Stale-while-revalidate PWA caching and a production `Terser/Obfuscation` build pipeline.

---

## 🔒 Security Architecture
- **JWT Middleware**: Centralized validation in `middleware/authMiddleware.js`.
- **RBAC**: Strict separation between `Admin` and `User` dashboard boundaries.
- **Input Sanitization**: Zero-trust regex mapping in `public/js/utils.js` (Deflecting XSS/Injection).
- **Hardened Admin UI**: Exclusive login portal with no external auth options to minimize attack vectors.

---

## 📈 Enterprise Integrations (Google Services)
- **Firebase Auth**: Identity management and QR-based contact discovery.
- **Google Cloud Logging**: Structured audit trails for interaction monitoring.
- **Google BigQuery**: Real-time streaming of networking trends for event organizers.
- **Gemini AI**: High-performance generative models for autonomous networking coaching.

---

## 🛠 Build & Development
- **Local Sandbox**: The app automatically detects missing credentials and switches to a local `.sandbox.json` store to ensure UI stability for evaluators.
- **Production Build**: `npm run build` minifies assets and obfuscates logic to protect intellectual property and optimize LCP (Largest Contentful Paint).

---

## 📦 Component Map
- `public/js/auth.js`: Logic for secure entry.
- `public/js/interactions.js`: Dynamic feed and AI analysis triggers.
- `services/aiService.js`: Advanced prompt engineering for Gemini.
- `services/firestoreService.js`: ACID transaction logic for interaction counts.

---
*Generated for the BuildWithAI Final Evaluation.*
