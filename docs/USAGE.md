# Usage

## Local Run
Static frontend. Recommended local server:
python -m http.server 8080

Open: http://localhost:8080

## Workflow
1. Select language.
2. Upload 2–6 handwriting images (lowercase + uppercase recommended).
3. Click build/generate font.
4. When loaded, type text.
5. Composer paginates to US Letter pages (max 10).
6. Print via browser dialog.

## Limits
- Max pages: 10
- Max images: 6 (typical)
- Long text: rendering should be debounced to avoid per-keystroke full pagination.

## Troubleshooting
- Font not applied: verify backend returned valid WOFF2 base64 + correct MIME.
- Pagination inconsistent: fix font-size/line-height and use local server (not file://).
- Upload fails: check size/type + backend CORS.
