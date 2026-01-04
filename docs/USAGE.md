# Usage

## Local Run
This frontend is static. You can run it by opening index.html, or via a tiny local server:

PowerShell (optional):
python -m http.server 8080

Then open:
http://localhost:8080

## Workflow
1) Select language and follow pangram instructions.
2) Upload 2–6 handwriting images (recommended: lowercase/uppercase).
3) Start analysis/build (backend).
4) Load generated font.
5) Type into the editor.
6) Preview pagination on US Letter (max 10 pages).
7) Print to PDF using the browser print dialog.

## Printing
Use the browser print dialog and select:
- Paper: Letter
- Margins: default or none (depending on desired look)
- Background graphics: enabled (if your design uses them)

## Troubleshooting
- If font does not load: confirm backend returns valid WOFF2/TTF and correct MIME.
- If pages exceed 10: compositor must clamp to maxPages.
- If ligatures/kerning not visible: ensure GSUB/GPOS features are present and enabled in the font.
