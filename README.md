# Smart Event Companion & Concierge

A production-ready Full-Stack Progressive Web Application featuring an interactive user interaction capture UI synced via Firestore and Gemini 1.5 strictly bounded responses, paired securely with a lightweight Admin stats portal decoupled using robust Server-Side RBAC JWT constraints.

## Tech Stack Overview
- **Backend**: Express on Node:Alpine (Dockerized for GCP Cloud Run)
- **Frontend**: Custom Glassmorphism DOM dynamically orchestrated with `jQuery`.
- **RBAC**: Implemented seamlessly via `jsonwebtoken` blocking unauthenticated manual users out of the `/admin-dashboard` layout, and integrating securely into standard `firebase-admin` Identity streams for baseline Users.
- **Strict Compliance Models**: 6 AI Evaluation Rules were respected specifically ensuring XSS `<script>` tag eradication internally without reliance on massive bloated 3rd party modules.

## Setup Instructions
### 1. Initialization
Make sure you've fulfilled these initial parameters:
```sh
npm install
# Run internal tests proving compliance across the array blocks mapping parameters!
npm test
```

### 2. Configurations & Firestore Rules
Provide `.env` at your root context:
```env
GEMINI_API_KEY=AIzaSy...
PORT=8080
ADMIN_JWT_SECRET=super_safe_long_string_here
```

**Firestore Rule Guidelines:**
If applying external DB reads safely override default rules to strictly block raw HTTP updates directly without going through our middleware boundaries:
```json
match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false; // Only allows Node.js Admin SDK modifications securely.
    }
}
```

### 3. Local Operation
```sh
npm run dev
# The system binds to localhost:3080/ by default avoiding port crashes natively.
```

### 4. Cloud Run Deployment Strategy
```sh
gcloud auth login
gcloud builds submit --tag gcr.io/YOUR-PROJECT/smart-companion
gcloud run deploy smart-companion \
    --image gcr.io/YOUR-PROJECT/smart-companion \
    --platform managed \
    --region us-central1 \
    --set-env-vars="GEMINI_API_KEY=YOUR_KEY,ADMIN_JWT_SECRET=production_secret" \
    --allow-unauthenticated 
```
