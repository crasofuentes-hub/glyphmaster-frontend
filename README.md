# GlyphMaster Frontend

Professional web frontend for generating a personalized font from handwriting samples and composing typed text into **US Letter** pages (**max 10 pages**).

This repository contains the **frontend only**. The backend is responsible for font engineering (GSUB/GPOS, contextual alternates, ligatures, kerning) and secure model/API usage.

## Live Demo (GitHub Pages)
After enabling GitHub Pages (Settings -> Pages -> Deploy from a branch -> main / root), your demo will be available at:

https://crasofuentes-hub.github.io/glyphmaster-frontend/

## Key Features
- Handwriting sample upload (2-6 images recommended).
- Font build workflow via backend API (no secrets embedded in frontend).
- Font loading via FontFace for in-browser preview.
- US Letter compositor with deterministic pagination (hard cap: 10 pages).
- Print-ready layout (@media print).
- Accessibility: ARIA live status, keyboard-friendly drop zone and controls.
- Performance: debounced rendering for long text input.

## Tech Stack
- HTML5 / CSS3
- Vanilla JavaScript (modular)
- FontFace API
- Print CSS (@page, @media print)

## Project Structure
.
├─ index.html
├─ assets/
│  └─ styles.css
└─ src/
   ├─ config.js      # environment + defaults
   ├─ api.js         # backend API client
   ├─ composer.js    # US Letter layout + pagination (max 10)
   └─ app.js         # UI orchestration/state

## Backend API Contract (Expected)
The frontend expects a backend that can:
- accept handwriting images,
- build and return a font package (preferably WOFF2 for web),
- optionally return build metadata (features, coverage, buildId).

Suggested minimal endpoint:

POST /api/font/build (multipart/form-data)
Fields:
- language: string (e.g. es)
- options: JSON string (feature toggles, target format, etc.)
- files[]: image files

Response (example):
{
  "fontName": "MyHandwriting",
  "fontMime": "font/woff2",
  "fontBase64": "<base64>",
  "meta": {
    "features": ["calt","liga","kern","rlig"],
    "glyphCoverage": 0.92,
    "buildId": "abc123"
  }
}

## Security Notes
- The Gemini API key input (if present) must remain empty by default.
- No model/provider keys should be shipped to the browser.
- All secrets belong in the backend (tokens, signing, storage, rate limits).

## Run Locally
This is a static frontend. You can open index.html directly, or serve it:

python -m http.server 8080

Open:
http://localhost:8080

## Printing
Use the browser print dialog and select:
- Paper: Letter
- Background graphics: enabled (if required by styling)

## License
Portfolio / showcase project.
