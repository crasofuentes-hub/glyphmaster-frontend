# Security

Frontend-only showcase. Security boundary:
- Frontend: UI, upload initiation, rendering, printing.
- Backend: OpenType build pipeline, model/provider usage, keys, storage.

## Non-Negotiables
- No provider keys in the browser.
- Gemini API key field (if present) stays empty by default.
- Secrets live in backend secret management.

## Threats & Mitigations
- Key exfiltration: do not ship/store keys; avoid logging secrets.
- Malicious uploads: backend validates MIME/size; hardens decoding.
- XSS: do not inject untrusted HTML; use textContent; CSP when hosting.
- CORS/CSRF: strict origin allowlist; CSRF tokens if cookie auth.

## Privacy
Handwriting samples can be sensitive:
- clear retention policy,
- prefer ephemeral processing,
- encrypted storage and TTL if caching builds.

## Operational Controls (Backend)
- rate limits, quotas, audit logs
- deterministic build IDs
- signed artifact downloads if stored
