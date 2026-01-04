# Architecture (Frontend)

This repository contains a **static, modular Vanilla JS** frontend for:
1) collecting handwriting samples,
2) invoking a backend font-build pipeline, and
3) rendering typed text into **US Letter pages** (hard cap: **10 pages**), print-ready.

The backend is the system of record for:
- OpenType engineering (GSUB/GPOS: calt/liga/rlig/kern, contextual alternates, ligatures, kerning),
- font compilation/optimization (WOFF2 preferred for web),
- secure model/provider integration and any sensitive keys.

## High-Level Flow
1. User selects language, uploads handwriting images, types text.
2. Frontend sends images/options to the backend.
3. Backend returns a font payload (WOFF2) + metadata.
4. Frontend registers it via the FontFace API.
5. Composer paginates into US Letter pages (max 10) and enables OT features via CSS.

## Modules (src/)
- config.js: env + defaults (API base URL, max pages, flags).
- api.js: backend client (timeouts, abort, error shaping).
- composer.js: US Letter layout + deterministic pagination (max 10).
- app.js: UI wiring + state machine + debounced composition + ARIA status.

## Composition Model
- Paper: US Letter (8.5 x 11 in)
- Print CSS: @page { size: letter; margin: ... }
- Determinism: fixed font-size/line-height/margins; stop at 10 pages.

## Typographic Features (Frontend Scope)
The frontend never generates GSUB/GPOS. It only toggles features:
- font-kerning: normal;
- font-feature-settings: "liga" 1, "calt" 1, "kern" 1, "rlig" 1;

Actual behavior depends on backend-built OpenType tables.

## Error Handling
- Fail-fast on invalid responses.
- Maintain readable fallback font stack.
- Use ARIA live region for status + errors.

## Future Enhancements
- IndexedDB caching by buildId/options.
- Worker-based composition for long documents.
- Server-side PDF export for pixel-perfect output.
- Playwright QA for print layout stability.
