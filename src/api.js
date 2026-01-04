import { API } from "./config.js";

function joinUrl(baseUrl, path) {
  if (!baseUrl) return path; // same-origin
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API.timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function readJsonSafe(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) return await res.json();
  const text = await res.text().catch(() => "");
  return { _nonJson: true, text };
}

function httpError(message, details = {}) {
  const err = new Error(message);
  err.details = details;
  return err;
}

export async function apiHealth() {
  const url = joinUrl(API.baseUrl, API.endpoints.health);
  const res = await fetchWithTimeout(url, { method: "GET" });
  if (!res.ok) throw httpError("Health check failed", { status: res.status, body: await readJsonSafe(res) });
  return await readJsonSafe(res);
}

/**
 * POST /api/font/build (multipart)
 * - images[]: File(s)
 * - options: JSON part
 */
export async function startFontBuild({ images, options }) {
  if (!Array.isArray(images) || images.length === 0) {
    throw httpError("No handwriting samples provided.", { code: "NO_SAMPLES" });
  }

  const fd = new FormData();
  for (const f of images) fd.append("images[]", f, f.name);

  const optionsJson = JSON.stringify(options ?? {}, null, 0);
  fd.append("options", new Blob([optionsJson], { type: "application/json" }), "options.json");

  const url = joinUrl(API.baseUrl, API.endpoints.build);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    body: fd,
    headers: {
      "X-Client": "glyphmaster-frontend",
    },
  });

  const body = await readJsonSafe(res);
  if (!res.ok) throw httpError("Font build request failed.", { status: res.status, body });

  if (!body || typeof body.jobId !== "string") {
    throw httpError("Backend did not return a jobId.", { body });
  }
  return body; // { jobId, warnings? }
}

/**
 * GET /api/font/jobs/{jobId}
 * Expected: { status: queued|running|done|error, progress:0..1, message?, result? }
 */
export async function getFontJob(jobId) {
  const url = joinUrl(API.baseUrl, API.endpoints.job(jobId));
  const res = await fetchWithTimeout(url, { method: "GET" });
  const body = await readJsonSafe(res);
  if (!res.ok) throw httpError("Failed to read job status.", { status: res.status, body });
  return body;
}

/**
 * Poll job until done/error or timeout.
 */
export async function waitForFontJob(jobId, { onTick } = {}) {
  const t0 = Date.now();

  while (true) {
    const job = await getFontJob(jobId);

    if (typeof onTick === "function") onTick(job);

    if (job?.status === "done") return job;
    if (job?.status === "error") throw httpError(job?.message || "Font build failed.", { job });

    if (Date.now() - t0 > API.pollMaxMs) {
      throw httpError("Timed out waiting for font build.", { jobId, last: job });
    }

    await new Promise((r) => setTimeout(r, API.pollIntervalMs));
  }
}

/**
 * Download built font bytes.
 * - If job.result.downloadUrl exists, it is used.
 * - Else uses /api/font/jobs/{jobId}/download
 */
export async function downloadFont(job) {
  const jobId = job?.jobId || job?.id || job?.result?.jobId;
  const directUrl = job?.result?.downloadUrl;

  const url = joinUrl(API.baseUrl, directUrl || API.endpoints.download(jobId));
  const res = await fetchWithTimeout(url, { method: "GET" }, API.timeoutMs);

  if (!res.ok) throw httpError("Failed to download font.", { status: res.status, body: await readJsonSafe(res) });

  const blob = await res.blob();
  const ct = (res.headers.get("content-type") || "").toLowerCase();

  // Infer extension from content-type as best-effort
  let ext = "woff2";
  if (ct.includes("font/ttf") || ct.includes("application/x-font-ttf")) ext = "ttf";
  else if (ct.includes("font/otf") || ct.includes("application/x-font-opentype")) ext = "otf";
  else if (ct.includes("woff2")) ext = "woff2";
  else if (ct.includes("woff")) ext = "woff";

  const filename = `glyphmaster-${jobId || "font"}.${ext}`;
  return { blob, filename, contentType: ct || "application/octet-stream" };
}
