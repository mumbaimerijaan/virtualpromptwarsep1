# Firebase Configuration & Security Guide

This guide details how to securely provide a valid Firebase API Key to the **Smart Event Companion** to restore authentication.

## 🛑 Why is this required?
For security compliance, hardcoded API keys have been removed from the source code. The application now expects these values to be provided via environment variables.

---

## 1. Retrieve your API Key
You can find your API key in the **Firebase Console**:
1.  Go to the **[Firebase Console](https://console.firebase.google.com/)**.
2.  Select the project: `smarteventconcierge`.
3.  Click **Project Settings** (gear icon) -> **General**.
4.  Copy the **"Web API Key"** (starts with `AIzaSy...`).

---

## 2. Local Environment Setup
To enable authentication locally:
1.  Create a file named `.env` in the project root.
2.  Add the following:
    ```bash
    FIREBASE_API_KEY=your_copied_api_key_here
    ```
3.  **Restart the server** (`npm run dev`) so the changes are picked up.

> [!IMPORTANT]
> **Git Security**: The `.env` file is included in `.gitignore` and must **never** be committed to the repository.

---

## 3. Production Environment (Google Cloud Run)
To enable authentication in your deployed Cloud Run service:
1.  Go to the **[Cloud Run Console](https://console.cloud.google.com/run)**.
2.  Select your service.
3.  Click **Edit & Deploy New Revision**.
4.  Under **Variables & Secrets**, add a new variable:
    - **Name**: `FIREBASE_API_KEY`
    - **Value**: Your API key.
5.  Click **Deploy**.

---

## 🛠️ Verification
You can verify your configuration by running:
```bash
node scripts/check-env.js
```
If configured correctly, you will see `Firebase API Key State: ✅ LOADED`.
