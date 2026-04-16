---
name: resilient-data-patterns
description: Designing Firestore schemas and robust error-handling logic for event data.
---

# Error Handling & Data Modeling

## Use this skill when
- Structuring the `interactions` collection in Firestore.

## Instructions
1. **Flat Collections:** Keep interaction logs in a flat collection with `timestamp` and `userId` indexes for fast querying.
2. **Graceful Degradation:** If the AI API fails, ensure the app still saves the raw notes and notifies the user to "Retry summary later."