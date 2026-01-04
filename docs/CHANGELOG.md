# Changelog

All notable changes to this project are documented in this file.

Format: Keep it concise, recruiter-friendly, and focused on shipped capabilities.

## [0.1.0] - 2026-01-03
### Added
- Recruiter-ready documentation set: Architecture, API contract, Usage, Security.
- Professional frontend workflow: handwriting sample upload, backend font build invocation, and in-browser font loading (FontFace).
- US Letter compositor with deterministic pagination and hard cap of 10 pages.
- Print-ready layout with @page and @media print.
- Accessibility baseline: ARIA live status patterns and keyboard-friendly controls.
- Performance safeguards: debounced rendering for long text input.

### Notes
- OpenType engineering (GSUB/GPOS, contextual alternates, ligatures, kerning) is intentionally delegated to the backend.
- No provider/model secrets are embedded in the frontend.
