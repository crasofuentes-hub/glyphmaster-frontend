# GlyphMaster Backend API Contract (Frontend Expectations)

This document defines the minimal contract the frontend expects.

## Base URL
Configured in src/config.js (e.g. http://localhost:8080 or your deployed endpoint).

## Endpoints

### POST /api/font/build
Uploads handwriting images and requests a font build.

**Request (multipart/form-data)**
- language (string): e.g. es
- options (string JSON): build options
- iles[] (file): handwriting sample images

**Options JSON (example)**
{
  "maxPages": 10,
  "enableContextualAlternates": true,
  "enableLigatures": true,
  "enableKerning": true,
  "target": "woff2"
}

**Response (200)**
- ontName (string)
- ontMime (string) e.g. ont/woff2
- ontBase64 (string) base64 encoded font binary
- meta (object)
  - glyphCoverage (number 0..1)
  - eatures (array) e.g. ["calt","liga","kern","rlig"]
  - uildId (string)

### GET /api/font/build/{buildId}
Fetch build status / cached font package.

### POST /api/analyze
(Optional) Forensic metrics only; does not generate fonts.

## Notes on Security
- The frontend never ships a Gemini API key.
- Gemini/Vertex/OpenAI keys belong in the backend only.
- If the frontend provides an input for a key, it must remain optional and empty by default.
