---
name: high-performance-web-optimization
description: Minimizing latency and maximizing Lighthouse scores via PWA and asset optimization.
---

# Performance Optimization

## Use this skill when
- Optimizing for the "Efficiency" scoring pillar.
- Implementing the Service Worker for offline event access.

## Instructions
1. **PWA Integration:** Use a manifest.json and cache core assets (HTML/CSS/JS) for zero-latency loading.
2. **Asset Delivery:** Use `defer` on scripts and `preconnect` for Google Fonts/Firebase origins.
3. **Lazy Logic:** Only initialize the QR scanner component when the user navigates to the "Capture" view.