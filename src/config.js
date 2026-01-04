/**
 * GlyphMaster Frontend - Runtime/Build Configuration
 * - No secrets in frontend.
 * - Backend base URL configurable at runtime via window.__GLYPHMASTER__.
 */

export const APP = {
  name: "GlyphMaster Studio",
  maxPages: 10,
  recommendedSamples: { min: 2, max: 6 },
  // UI rendering knobs
  defaultFontSizePx: 20,
  defaultLineHeight: 1.55, // multiplier
  defaultMarginsIn: { top: 0.8, right: 0.8, bottom: 0.8, left: 0.8 },
};

function readRuntimeConfig() {
  // Optional runtime override (e.g., set in index.html):
  // window.__GLYPHMASTER__ = { apiBaseUrl: "https://your-backend.example", endpoints: {...} }
  const rt = (typeof window !== "undefined" && window.__GLYPHMASTER__) ? window.__GLYPHMASTER__ : {};
  return rt && typeof rt === "object" ? rt : {};
}

const RUNTIME = readRuntimeConfig();

export const API = {
  baseUrl: (RUNTIME.apiBaseUrl ?? "").replace(/\/+$/, ""), // no trailing slash
  timeoutMs: Number.isFinite(RUNTIME.timeoutMs) ? RUNTIME.timeoutMs : 45_000,
  pollIntervalMs: Number.isFinite(RUNTIME.pollIntervalMs) ? RUNTIME.pollIntervalMs : 900,
  pollMaxMs: Number.isFinite(RUNTIME.pollMaxMs) ? RUNTIME.pollMaxMs : 180_000,

  endpoints: {
    health: "/api/health",
    build: "/api/font/build",
    job: (jobId) => `/api/font/jobs/${encodeURIComponent(jobId)}`,
    download: (jobId) => `/api/font/jobs/${encodeURIComponent(jobId)}/download`,
    ...(RUNTIME.endpoints ?? {}),
  },
};
