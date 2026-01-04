/**
 * Ajusta aquí los endpoints de tu backend.
 * No hay API keys hardcodeadas. El input apiKey es opcional y se envía solo si el usuario lo escribe.
 */
window.GLYPHMASTER_CONFIG = {
  API_BASE: "",

  // 1) Crear job de generación de fuente
  // POST {API_BASE}/api/font/jobs
  // FormData:
  // - images[] (files)
  // - language (string)
  // - options (json string)
  // - apiKey (optional string)
  ENDPOINT_CREATE_JOB: "/api/font/jobs",

  // 2) Consultar estado del job
  // GET {API_BASE}/api/font/jobs/{jobId}
  // Response: { status: "queued"|"running"|"done"|"error", progress: 0..100, message, result?: {...} }
  ENDPOINT_JOB_STATUS: "/api/font/jobs/{jobId}",

  // 3) Descargar fuente generada
  // GET {API_BASE}/api/font/jobs/{jobId}/font
  // Response: binary font file (woff2/otf/ttf). Content-Type: font/woff2 etc.
  ENDPOINT_JOB_FONT: "/api/font/jobs/{jobId}/font",

  // Timeout/red y polling
  POLL_INTERVAL_MS: 1100,
  REQUEST_TIMEOUT_MS: 60000
};
