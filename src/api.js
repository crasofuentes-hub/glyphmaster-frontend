/* src/api.js */
(function(){
  "use strict";

  const cfg = window.GLYPHMASTER_CONFIG;

  function withBase(path){
    const base = (cfg.API_BASE || "").trim();
    if (!base) return path;
    if (base.endsWith("/") && path.startsWith("/")) return base.slice(0, -1) + path;
    if (!base.endsWith("/") && !path.startsWith("/")) return base + "/" + path;
    return base + path;
  }

  function timeoutFetch(url, opts){
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), cfg.REQUEST_TIMEOUT_MS || 60000);
    return fetch(url, Object.assign({}, opts, { signal: controller.signal }))
      .finally(() => clearTimeout(t));
  }

  async function createJob({ files, language, options, apiKey }){
    const fd = new FormData();
    for (const f of files) fd.append("images[]", f, f.name);
    fd.append("language", language);
    fd.append("options", JSON.stringify(options || {}));
    if (apiKey && apiKey.trim()) fd.append("apiKey", apiKey.trim());

    const url = withBase(cfg.ENDPOINT_CREATE_JOB);
    const res = await timeoutFetch(url, { method: "POST", body: fd });

    if (!res.ok){
      const txt = await safeText(res);
      throw new Error("Backend create job failed: " + res.status + " " + txt);
    }
    return res.json();
  }

  async function getJobStatus(jobId){
    const path = cfg.ENDPOINT_JOB_STATUS.replace("{jobId}", encodeURIComponent(jobId));
    const url = withBase(path);
    const res = await timeoutFetch(url, { method: "GET" });

    if (!res.ok){
      const txt = await safeText(res);
      throw new Error("Backend job status failed: " + res.status + " " + txt);
    }
    return res.json();
  }

  async function downloadJobFont(jobId){
    const path = cfg.ENDPOINT_JOB_FONT.replace("{jobId}", encodeURIComponent(jobId));
    const url = withBase(path);
    const res = await timeoutFetch(url, { method: "GET" });

    if (!res.ok){
      const txt = await safeText(res);
      throw new Error("Backend font download failed: " + res.status + " " + txt);
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const blob = await res.blob();
    return { blob, contentType };
  }

  async function safeText(res){
    try { return (await res.text()).slice(0, 300); } catch { return ""; }
  }

  window.GlyphAPI = { createJob, getJobStatus, downloadJobFont };
})();
