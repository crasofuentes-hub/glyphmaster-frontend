# API Contract (Frontend <-> Backend)

The frontend expects a backend that:
- accepts handwriting images,
- returns a compiled web font (WOFF2 preferred),
- supports OpenType features (GSUB/GPOS) in the generated font.

## Base URL
Configured in src/config.js (e.g., API_BASE_URL).

## Endpoints

### POST /api/font/build
Build a font from handwriting samples.

Request:
- Content-Type: multipart/form-data
- Fields:
  - language (string): e.g., es, en
  - options (stringified JSON): backend-defined feature/build toggles
  - files[] (file[]): handwriting sample images

Response (recommended):
{
  "fontName": "MyHandwriting",
  "fontMime": "font/woff2",
  "fontBase64": "<base64-woff2>",
  "meta": {
    "features": ["calt","liga","kern","rlig"],
    "glyphCoverage": 0.92,
    "buildId": "abc123",
    "warnings": []
  }
}

Notes:
- fontBase64 should be raw base64 (no data URL prefix).
- frontend typically converts to: data:font/woff2;base64,<...>

### GET /api/font/build/:buildId (optional)
Fetch an existing build for caching/sharing.

### GET /api/health (optional)
Returns: { "status": "ok" }

## Error Format (recommended)
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "At least 2 images are required.",
    "details": {}
  }
}

## Security
- No provider/model keys in the browser.
- Backend enforces auth, rate limits, and retention policy.
