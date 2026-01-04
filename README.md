# GlyphMaster Frontend

Professional frontend for a handwriting-to-font workflow:
- Upload handwriting samples (pangram sheets)
- Request font build from backend (GSUB/GPOS, contextual alternates, ligatures, kerning)
- Load the generated font in-browser
- Compose typed text into **US Letter** pages (max **10**) for printing/export

## Live Demo
(Enable GitHub Pages: Settings → Pages → main / root)
Demo URL: https://crasofuentes-hub.github.io/glyphmaster-frontend/

## Project Structure
- index.html
- assets/styles.css
- src/config.js
- src/api.js
- src/app.js
- src/composer.js

## Docs
- docs/ARCHITECTURE.md
- docs/API.md
- docs/USAGE.md

## Run Locally
Open index.html, or:

python -m http.server 8080

Then open:
http://localhost:8080
