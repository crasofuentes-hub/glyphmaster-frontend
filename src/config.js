/**
 * Runtime configuration:
 * - Default: no backend (demo UI only)
 * - User can enable backend by setting localStorage glyphmaster.apiBaseUrl
 * - Optional: querystring override ?api=https://...
 */
export function getRuntimeConfig() {
  const globalCfg = (window.__GLYPHMASTER__ || {});
  const qs = new URLSearchParams(window.location.search);
  const qsApi = (qs.get("api") || "").trim();

  const lsApi = (localStorage.getItem("glyphmaster.apiBaseUrl") || "").trim();
  const cfgApi = (globalCfg.apiBaseUrl || "").trim();

  const apiBaseUrl = (qsApi || lsApi || cfgApi || "").replace(/\/+$/, "");

  return {
    apiBaseUrl,
    maxPages: Number.isFinite(globalCfg.maxPages) ? globalCfg.maxPages : 10
  };
}

export function setApiBaseUrl(nextUrl) {
  const v = (nextUrl || "").trim().replace(/\/+$/, "");
  if (!v) localStorage.removeItem("glyphmaster.apiBaseUrl");
  else localStorage.setItem("glyphmaster.apiBaseUrl", v);
  return v;
}
