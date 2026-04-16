---
name: firebase-identity-management
description: Implementing Zero-Trust authentication using Firebase Auth and Google Identity Services. Use for secure attendee login and QR identification.
---

# Firebase Identity Management

Securely manage attendee identities and protect API routes using Google’s enterprise-grade authentication.

## Use this skill when

- Implementing "Login with Google" for event attendees.
- Protecting the backend routes using Firebase ID Token verification.
- Associating QR codes with unique User IDs (UIDs).

## Do not use this skill when

- Handling public event data that does not require user-specific privacy.

## Instructions

1. **Token Verification:** Every backend request must pass a `Bearer <Firebase_ID_Token>` in the Authorization header. Use `firebase-admin` to verify tokens on every call.
2. **State Sync:** Sync the `onAuthStateChanged` observer in `app.js` with a central state object to prevent UI flickering.
3. **QR Scoping:** Ensure QR codes only contain a signed UID or a reference, never raw PII (Personally Identifiable Information).

## Resources

- Firebase Authentication Security Best Practices
- Google Identity Services for Web