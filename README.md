# InkReplica Studio (GlyphMaster Frontend)

Professional frontend for:
- Uploading handwriting samples (images)
- Calling a backend that generates a personal font with GSUB/GPOS (OpenType)
- Loading the generated font in-browser (FontFace API)
- Composing typed text into US Letter pages (max 10 pages)
- Enabling OpenType features in frontend (liga/calt/kern + optional dlig/hlig/salt + ss01..ss20)

## Backend contract (edit in src/config.js)
Expected endpoints:
- POST /api/font/jobs
- GET  /api/font/jobs/{jobId}
- GET  /api/font/jobs/{jobId}/font

If your backend uses different routes, update them in src/config.js.

## Run
Open index.html in a browser, or serve locally:
- python -m http.server 8080
- then open http://localhost:8080/

## Notes
This repo intentionally keeps the Gemini API key empty by default and does not persist it.
