/* src/app.js */
(function(){
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    files: [],
    currentFontFamily: "ui-serif, Georgia, 'Times New Roman', serif",
    currentFontName: "Fallback",
    features: { liga:true, calt:true, kern:true, dlig:false, hlig:false, salt:false, ss:"" },
    maxPages: 10,
    fontSizePt: 18,
    lineHeight: 1.55,
    marginIn: 0.85,
    rafToken: null,
    lastComposedText: null
  };

  const el = {
    dropzone: $("dropzone"),
    fileInput: $("fileInput"),
    fileList: $("fileList"),
    btnGenerate: $("btnGenerate"),
    btnLoadLocalFont: $("btnLoadLocalFont"),
    localFontInput: $("localFontInput"),
    apiKeyInput: $("apiKeyInput"),
    languageSelect: $("languageSelect"),
    status: $("status"),
    progressBar: $("progressBar"),
    progressText: $("progressText"),
    pages: $("pages"),
    inputText: $("inputText"),
    maxPages: $("maxPages"),
    fontSize: $("fontSize"),
    lineHeight: $("lineHeight"),
    pageMargin: $("pageMargin"),
    btnPrint: $("btnPrint"),
    btnExportHTML: $("btnExportHTML"),
    btnClearText: $("btnClearText"),
    pillFontStatus: $("pillFontStatus"),
    fontStatusText: $("fontStatusText"),
    activeFontName: $("activeFontName"),
    activeFeatures: $("activeFeatures"),
    pageInfo: $("pageInfo"),
    a11yAlert: $("a11yAlert"),

    featLiga: $("featLiga"),
    featCalt: $("featCalt"),
    featKern: $("featKern"),
    featDlig: $("featDlig"),
    featHlig: $("featHlig"),
    featSalt: $("featSalt"),
    featSS: $("featSS")
  };

  function setStatus(msg, kind){
    el.status.textContent = msg || "";
    el.status.className = "status" + (kind ? (" status--" + kind) : "");
  }
  function setProgress(pct, msg){
    const v = Math.max(0, Math.min(100, Number(pct) || 0));
    el.progressBar.style.width = v + "%";
    el.progressText.textContent = msg || (v ? ("Progreso: " + v + "%") : "Listo.");
  }

  function fmtBytes(n){
    const v = Number(n) || 0;
    if (v < 1024) return v + " B";
    if (v < 1024*1024) return (v/1024).toFixed(1) + " KB";
    return (v/(1024*1024)).toFixed(2) + " MB";
  }

  function updateFileUI(){
    el.fileList.innerHTML = "";
    for (let i=0; i<state.files.length; i++){
      const f = state.files[i];
      const item = document.createElement("div");
      item.className = "fileitem";
      item.innerHTML =
        '<div>' +
          '<div class="fileitem__name">' + escapeHtml(f.name) + '</div>' +
          '<div class="fileitem__meta">' + escapeHtml(f.type || "image") + " · " + fmtBytes(f.size) + "</div>" +
        '</div>' +
        '<button class="fileitem__btn" type="button" aria-label="Eliminar archivo">Eliminar</button>';

      item.querySelector("button").addEventListener("click", () => {
        state.files.splice(i, 1);
        updateFileUI();
        updateGenerateEnabled();
        announce("Archivo eliminado.");
      });

      el.fileList.appendChild(item);
    }
  }

  function updateGenerateEnabled(){
    el.btnGenerate.disabled = state.files.length === 0;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[c]));
  }

  function setupDropzone(){
    const dz = el.dropzone;

    function openPicker(){ el.fileInput.click(); }

    dz.addEventListener("click", openPicker);
    dz.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        openPicker();
      }
    });

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
      dz.classList.add("dropzone--drag");
    });
    dz.addEventListener("dragleave", () => dz.classList.remove("dropzone--drag"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("dropzone--drag");
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    el.fileInput.addEventListener("change", (e) => {
      if (e.target && e.target.files) addFiles(e.target.files);
      el.fileInput.value = "";
    });
  }

  function addFiles(fileList){
    const incoming = Array.from(fileList || []);
    const valid = incoming
      .filter(f => (f.type || "").startsWith("image/"))
      .filter(f => (f.size || 0) <= 5*1024*1024)
      .slice(0, 6);

    // Max 6 total
    for (const f of valid){
      if (state.files.length >= 6) break;
      state.files.push(f);
    }

    updateFileUI();
    updateGenerateEnabled();

    if (valid.length === 0){
      setStatus("No se agregaron archivos. Verifica formato imagen y tamaño (≤5MB).", "warn");
      announce("No se agregaron archivos válidos.");
    } else {
      setStatus("Archivos listos. Puedes generar la fuente.", "ok");
      announce("Archivos agregados.");
    }
  }

  async function loadFontFromBlob(blob, suggestedName){
    // Intentar usar un nombre estable
    const fontName = suggestedName || ("InkReplica-" + Date.now().toString(36));
    const url = URL.createObjectURL(blob);

    const ff = new FontFace(fontName, `url(${url})`, { style: "normal", weight: "400" });
    await ff.load();
    document.fonts.add(ff);

    // Importante: mantener URL viva mientras se use la fuente.
    // (En demo, no revocamos inmediatamente para evitar fallback)
    state.currentFontFamily = `'${fontName}', ui-serif, Georgia, 'Times New Roman', serif`;
    state.currentFontName = fontName;

    el.fontStatusText.textContent = "Cargada";
    el.activeFontName.textContent = fontName;
    announce("Fuente cargada.");

    scheduleCompose(true);
    return fontName;
  }

  function readFeaturesFromUI(){
    state.features.liga = !!el.featLiga.checked;
    state.features.calt = !!el.featCalt.checked;
    state.features.kern = !!el.featKern.checked;
    state.features.dlig = !!el.featDlig.checked;
    state.features.hlig = !!el.featHlig.checked;
    state.features.salt = !!el.featSalt.checked;
    state.features.ss = (el.featSS.value || "").trim();
    el.activeFeatures.textContent = featuresLabel(state.features);
  }

  function featuresLabel(f){
    const tags = [];
    if (f.liga) tags.push("liga");
    if (f.calt) tags.push("calt");
    if (f.kern) tags.push("kern");
    if (f.dlig) tags.push("dlig");
    if (f.hlig) tags.push("hlig");
    if (f.salt) tags.push("salt");
    if (f.ss) tags.push(f.ss);
    return tags.join(",") || "(none)";
  }

  function scheduleCompose(force){
    const text = el.inputText.value || "";
    if (!force && text === state.lastComposedText) return;

    if (state.rafToken) cancelAnimationFrame(state.rafToken);
    state.rafToken = requestAnimationFrame(() => {
      state.rafToken = null;
      composeNow();
    });
  }

  function composeNow(){
    readFeaturesFromUI();

    const text = el.inputText.value || "";
    state.lastComposedText = text;

    const maxPages = clampInt(Number(el.maxPages.value || 10), 1, 10);
    state.maxPages = maxPages;

    state.fontSizePt = clampInt(Number(el.fontSize.value || 18), 10, 40);
    state.lineHeight = clampFloat(Number(el.lineHeight.value || 1.55), 1.1, 2.2);
    state.marginIn = clampFloat(Number(el.pageMargin.value || 0.85), 0.3, 1.5);

    const out = window.GlyphComposer.composePages({
      text,
      fontFamily: state.currentFontFamily,
      fontSizePt: state.fontSizePt,
      lineHeight: state.lineHeight,
      marginIn: state.marginIn,
      maxPages: state.maxPages,
      features: state.features
    });

    renderPages(out.pages, out.pageCss.padPx);
    const info = "Páginas: " + out.pages.length + " / " + state.maxPages + (out.truncated ? " (texto truncado por límite)" : "");
    el.pageInfo.textContent = info;

    if (out.truncated){
      setStatus("Se alcanzó el máximo de páginas. Aumenta el límite (hasta 10) o reduce tamaño/interlineado.", "warn");
      announce("Se alcanzó el máximo de páginas.");
    } else {
      if (text.trim().length){
        setStatus("Composición actualizada.", "ok");
      } else {
        setStatus("Listo. Escribe para componer.", "");
      }
    }
  }

  function renderPages(pages, padPx){
    el.pages.innerHTML = "";
    const pad = Math.round(padPx || 82);

    // Variable CSS para padding
    el.pages.style.setProperty("--page-pad", pad + "px");

    pages.forEach((content, idx) => {
      const page = document.createElement("div");
      page.className = "page";
      page.setAttribute("aria-label", "Página " + (idx + 1));

      const c = document.createElement("div");
      c.className = "page__content";
      c.style.fontFamily = state.currentFontFamily;
      c.style.fontSize = state.fontSizePt + "pt";
      c.style.lineHeight = String(state.lineHeight);
      c.style.fontFeatureSettings = window.GlyphComposer.buildFeatureSettings(state.features);
      c.textContent = content;

      const wm = document.createElement("div");
      wm.className = "page__watermark";
      wm.textContent = "Página " + (idx + 1);

      page.appendChild(c);
      page.appendChild(wm);
      el.pages.appendChild(page);
    });

    // Si no hay páginas (texto vacío), renderiza 1 página en blanco para vista
    if (!pages.length){
      const page = document.createElement("div");
      page.className = "page";
      page.setAttribute("aria-label", "Página 1");
      const c = document.createElement("div");
      c.className = "page__content";
      c.style.fontFamily = state.currentFontFamily;
      c.style.fontSize = state.fontSizePt + "pt";
      c.style.lineHeight = String(state.lineHeight);
      c.style.fontFeatureSettings = window.GlyphComposer.buildFeatureSettings(state.features);
      c.textContent = "";
      const wm = document.createElement("div");
      wm.className = "page__watermark";
      wm.textContent = "Página 1";
      page.appendChild(c);
      page.appendChild(wm);
      el.pages.appendChild(page);
    }
  }

  function clampInt(v, min, max){
    if (!Number.isFinite(v)) return min;
    return Math.max(min, Math.min(max, Math.round(v)));
  }
  function clampFloat(v, min, max){
    if (!Number.isFinite(v)) return min;
    return Math.max(min, Math.min(max, v));
  }

  function announce(msg){
    el.a11yAlert.textContent = msg || "";
    // Limpia para permitir repetición de mensajes
    setTimeout(() => { el.a11yAlert.textContent = ""; }, 200);
  }

  async function generateFontViaBackend(){
    if (!state.files.length){
      setStatus("Sube al menos una imagen.", "err");
      return;
    }

    const language = (el.languageSelect.value || "es").trim();
    const apiKey = (el.apiKeyInput.value || "").trim(); // vacío por defecto

    // Opciones que el backend puede usar para GSUB/GPOS y alternates
    const options = {
      maxPages: clampInt(Number(el.maxPages.value || 10), 1, 10),
      target: "us-letter-composer",
      opentype: {
        contextualAlternates: true,
        ligatures: true,
        kerning: true,
        stylisticSets: true
      }
    };

    setStatus("Creando job en backend...", "");
    setProgress(5, "Creando job...");

    el.btnGenerate.disabled = true;

    try{
      const create = await window.GlyphAPI.createJob({ files: state.files, language, options, apiKey });
      const jobId = create.jobId || create.id || create.job_id;
      if (!jobId){
        throw new Error("Respuesta del backend sin jobId/id.");
      }

      setStatus("Job creado: " + jobId + ". Procesando...", "");
      setProgress(10, "Procesando...");

      await pollJob(jobId);

      // Descargar fuente
      setStatus("Descargando fuente...", "");
      setProgress(92, "Descargando fuente...");
      const { blob, contentType } = await window.GlyphAPI.downloadJobFont(jobId);

      // Sugerencia de nombre si viene del backend
      const suggested = (create.fontName || create.font_name || "InkReplicaFont");
      await loadFontFromBlob(blob, suggested);

      setProgress(100, "Completado.");
      setStatus("Fuente generada y cargada. Ya puedes componer el documento.", "ok");

    } catch (e){
      setStatus("Error: " + (e && e.message ? e.message : String(e)), "err");
      setProgress(0, "Listo.");
      announce("Error en generación.");
    } finally {
      el.btnGenerate.disabled = false;
    }
  }

  async function pollJob(jobId){
    const interval = (window.GLYPHMASTER_CONFIG.POLL_INTERVAL_MS || 1100);

    for (;;){
      const st = await window.GlyphAPI.getJobStatus(jobId);

      const status = (st.status || "").toLowerCase();
      const pct = Number(st.progress);
      const msg = st.message || "";

      if (Number.isFinite(pct)) setProgress(Math.max(10, Math.min(90, pct)), msg || ("Estado: " + status));
      else setProgress(20, msg || ("Estado: " + status));

      if (status === "done" || status === "completed"){
        return st;
      }
      if (status === "error" || status === "failed"){
        throw new Error(msg || "Job failed.");
      }

      await sleep(interval);
    }
  }

  function setupLocalFontLoader(){
    el.btnLoadLocalFont.addEventListener("click", () => el.localFontInput.click());
    el.localFontInput.addEventListener("change", async (e) => {
      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      el.localFontInput.value = "";
      if (!f) return;

      try{
        setStatus("Cargando fuente local...", "");
        setProgress(40, "Cargando fuente local...");

        const blob = new Blob([await f.arrayBuffer()], { type: f.type || "application/octet-stream" });
        const name = (f.name || "LocalFont").replace(/\.[^/.]+$/, "");
        await loadFontFromBlob(blob, name);

        setProgress(100, "Fuente local cargada.");
        setStatus("Fuente local cargada: " + name, "ok");
      } catch (err){
        setProgress(0, "Listo.");
        setStatus("Error cargando fuente local: " + (err && err.message ? err.message : String(err)), "err");
      }
    });
  }

  function setupEvents(){
    setupDropzone();
    updateGenerateEnabled();

    el.btnGenerate.addEventListener("click", generateFontViaBackend);

    el.inputText.addEventListener("input", () => scheduleCompose(false));
    el.maxPages.addEventListener("input", () => scheduleCompose(true));
    el.fontSize.addEventListener("input", () => scheduleCompose(true));
    el.lineHeight.addEventListener("input", () => scheduleCompose(true));
    el.pageMargin.addEventListener("input", () => scheduleCompose(true));

    // Features
    [el.featLiga, el.featCalt, el.featKern, el.featDlig, el.featHlig, el.featSalt, el.featSS].forEach(x => {
      x.addEventListener("change", () => scheduleCompose(true));
    });

    // Print / PDF
    el.btnPrint.addEventListener("click", () => window.print());

    // Export HTML
    el.btnExportHTML.addEventListener("click", exportHTML);

    // Clear
    el.btnClearText.addEventListener("click", () => {
      el.inputText.value = "";
      scheduleCompose(true);
      announce("Texto limpiado.");
    });

    // Inicial
    el.fontStatusText.textContent = "No cargada";
    el.activeFontName.textContent = state.currentFontName;
    el.activeFeatures.textContent = featuresLabel(state.features);
    setProgress(0, "Listo.");
    scheduleCompose(true);

    setupLocalFontLoader();
  }

  function exportHTML(){
    // Exporta un HTML autónomo (sin panel) con las páginas actuales renderizadas.
    const pages = el.pages.cloneNode(true);
    const title = "InkReplica-Export-" + new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");

    // Inserta estilos mínimos para pages
    const css = `
      body{ margin:0; padding:24px; background:#fff; }
      .pages{ display:flex; flex-direction:column; gap:0; align-items:center; }
      .page{ width:8.5in; height:11in; background:#fff; color:#000; overflow:hidden; page-break-after:always; }
    `.trim();

    const html =
`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${pages.outerHTML}</body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = title + ".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
    setStatus("Exportado HTML.", "ok");
  }

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  // Boot
  setupEvents();
})();
