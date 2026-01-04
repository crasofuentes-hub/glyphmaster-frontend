# GlyphMaster Frontend — Architecture

## Overview
This repository contains a production-grade frontend for **GlyphMaster**, a handwriting-to-font workflow that:
- uploads handwriting samples (pangram sheets),
- requests a font build to the backend (OTF/TTF/WOFF2),
- loads the resulting font in the browser,
- renders typed text into a **US Letter** document compositor with a maximum of **10 pages**.

The backend is responsible for the complex font engineering:
- contextual alternates (multiple glyph variants),
- OpenType GSUB/GPOS rules,
- ligatures,
- kerning and spacing refinement.

The frontend focuses on:
- professional UX,
- accessibility (ARIA),
- deterministic pagination (US Letter),
- font loading and preview,
- safe API usage without embedding secrets.

## Folder Structure
- **index.html**: app shell, layout, ARIA landmarks
- **assets/styles.css**: UI styling and print rules
- **src/config.js**: environment/config defaults
- **src/api.js**: backend API client (Gemini key kept empty in UI; backend handles secrets)
- **src/composer.js**: US Letter compositor + pagination (max 10 pages)
- **src/app.js**: application orchestration and UI state

## Rendering Model
1) User uploads images (handwriting samples).
2) Frontend sends files to backend to build a font package.
3) Backend returns a font binary (preferably WOFF2 for web) + metadata.
4) Frontend loads the font using FontFace API.
5) User types; compositor lays out text into US Letter pages and renders preview.
6) Print uses CSS @media print + page sizing.

## Accessibility
- ARIA live regions for status updates.
- Keyboard-focusable controls and meaningful labels.
- Drop zone supports keyboard activation.
- Contrast is validated for secondary text where feasible.
