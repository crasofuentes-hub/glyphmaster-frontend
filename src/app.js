import { APP, API } from "./config.js";
import { apiHealth, startFontBuild, waitForFontJob, downloadFont } from "./api.js";
import { composeUSLetterPages, renderUSLetterPages } from "./composer.js";

const $ = (sel) => document.querySelector(sel);

function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

function formatPct(x) {
  const v = Number.isFinite(x) ? clamp(x, 0, 1) : 0;
  return `${Math.round(v * 100)}%`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function loadFontFace({ family, blob }) {
  const buf = await blob.arrayBuffer();
  const face = new FontFace(family, buf, { style: "normal", weight: "400" });
  await face.load();
  document.fonts.add(face);
  return family;
}

function ensureKeyboardClickable(el, onActivate) {
  if (!el) return;
  el.tabIndex = 0;
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onActivate();
    }
  });
}

function createSampleRow(file) {
  const row = document.createElement("div");
  row.className = "gm-sample-row";

  const name = document.createElement("div");
  name.className = "gm-sample-name";
  name.textContent = file.name;

  const meta = document.createElement("div");
  meta.className = "gm-sample-meta";
  meta.textContent = `${Math.round(file.size / 1024)} KB`;

  const btn = document.createElement("button");
  btn.className = "gm-btn gm-btn-danger";
  btn.type = "button";
  btn.textContent = "Remove";
  btn.setAttribute("aria-label", `Remove sample ${file.name}`);

  row.appendChild(name);
  row.appendChild(meta);
  row.appendChild(btn);
  return { row, removeBtn: btn };
}

function debounceRaf(fn, delayMs = 80) {
  let t = null;
  let raf = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => fn(...args));
    }, delayMs);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  // Bind elements (IDs are defined in index.html below)
  const statusLive = $("#statusLive");
  const apiBadge = $("#apiBadge");
  const dropZone = $("#dropZone");
  const fileInput = $("#fileInput");
  const samplesList = $("#samplesList");
  const buildBtn = $("#buildBtn");
  const buildOptions = $("#buildOptions");
  const fontNameInput = $("#fontName");
  const downloadFontBtn = $("#downloadFontBtn");
  const textInput = $("#textInput");
  const pagesContainer = $("#pagesContainer");
  const overflowNote = $("#overflowNote");
  const printBtn = $("#printBtn");
  const clearBtn = $("#clearBtn");

  let samples = [];
  let lastBuilt = null; // { job, font: {blob, filename}, family }

  function announce(msg) {
    setText(statusLive, msg);
  }

  function refreshSamplesUI() {
    samplesList.innerHTML = "";
    samples.forEach((f, idx) => {
      const { row, removeBtn } = createSampleRow(f);
      removeBtn.addEventListener("click", () => {
        samples.splice(idx, 1);
        refreshSamplesUI();
        announce(`Removed sample. ${samples.length} remaining.`);
      });
      samplesList.appendChild(row);
    });

    const rec = APP.recommendedSamples;
    const hint = $("#samplesHint");
    if (hint) {
      if (samples.length < rec.min) hint.textContent = `Recommended: add at least ${rec.min} samples.`;
      else if (samples.length > rec.max) hint.textContent = `You have ${samples.length} samples; ${rec.max} is typically enough.`;
      else hint.textContent = `Samples ready (${samples.length}).`;
    }
  }

  function addFiles(files) {
    const arr = Array.from(files || []);
    for (const f of arr) {
      if (!/^image\//i.test(f.type)) continue;
      samples.push(f);
    }
    refreshSamplesUI();
    announce(`Added ${arr.length} file(s). Total samples: ${samples.length}.`);
  }

  // Drop zone: accessible
  ensureKeyboardClickable(dropZone, () => fileInput.click());
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("is-dragover");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("is-dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("is-dragover");
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener("change", () => addFiles(fileInput.files));

  // Print & clear
  printBtn.addEventListener("click", () => window.print());
  clearBtn.addEventListener("click", () => {
    textInput.value = "";
    scheduleCompose();
    announce("Text cleared.");
  });

  // API health badge
  try {
    const h = await apiHealth();
    apiBadge.textContent = "API: OK";
    apiBadge.classList.add("ok");
    apiBadge.title = JSON.stringify(h);
  } catch (e) {
    apiBadge.textContent = "API: Unreachable";
    apiBadge.classList.add("bad");
    apiBadge.title = (e && e.message) ? e.message : "API unavailable";
  }

  // Composition state
  let activeFamily = "ui-serif, ui-rounded, system-ui, 'Segoe UI', Arial, sans-serif";
  let activeFontSizePx = APP.defaultFontSizePx;

  function computeLineHeightPx() {
    return Math.max(14, Math.round(activeFontSizePx * APP.defaultLineHeight));
  }

  function doCompose() {
    const model = composeUSLetterPages({
      text: textInput.value,
      fontFamily: activeFamily,
      fontSizePx: activeFontSizePx,
      lineHeightMultiplier: APP.defaultLineHeight,
      marginsIn: APP.defaultMarginsIn,
      maxPages: APP.maxPages,
    });

    renderUSLetterPages(pagesContainer, model, {
      fontFamily: activeFamily,
      fontSizePx: activeFontSizePx,
      lineHeightPx: computeLineHeightPx(),
      marginsIn: APP.defaultMarginsIn,
    });

    overflowNote.hidden = !model.overflow;
    if (model.overflow) {
      overflowNote.textContent = `Text exceeds ${APP.maxPages} pages. Output was truncated to ${APP.maxPages} pages.`;
    }
  }

  const scheduleCompose = debounceRaf(doCompose, 80);
  textInput.addEventListener("input", scheduleCompose);

  // Initial compose
  scheduleCompose();

  // Build + download + load font
  buildBtn.addEventListener("click", async () => {
    try {
      if (samples.length < APP.recommendedSamples.min) {
        announce(`Please add at least ${APP.recommendedSamples.min} handwriting samples.`);
        return;
      }

      buildBtn.disabled = true;
      downloadFontBtn.disabled = true;

      const family = (fontNameInput.value || "GlyphMasterHand").trim().slice(0, 40) || "GlyphMasterHand";

      let options = {};
      try {
        options = JSON.parse(buildOptions.value || "{}");
      } catch {
        announce("Build options JSON is invalid.");
        return;
      }

      // Force professional defaults (backend decides GSUB/GPOS implementation)
      options = {
        fontFamily: family,
        features: { calt: true, liga: true, kern: true },
        maxGlyphAlternates: 3,
        ...options,
      };

      announce("Submitting build job to backend...");
      const started = await startFontBuild({ images: samples, options });
      const jobId = started.jobId;

      announce(`Build started. Job: ${jobId}. Polling...`);

      const job = await waitForFontJob(jobId, {
        onTick: (j) => {
          const msg = j?.message ? ` ${j.message}` : "";
          const pct = formatPct(j?.progress);
          announce(`Building font… ${pct}.${msg}`);
        },
      });

      // Attach jobId for convenience
      job.jobId = jobId;

      announce("Downloading font…");
      const font = await downloadFont(job);

      announce("Loading font in browser…");
      await loadFontFace({ family, blob: font.blob });

      lastBuilt = { job, font, family };

      activeFamily = `'${family}', ui-serif, ui-rounded, system-ui, 'Segoe UI', Arial, sans-serif`;
      scheduleCompose();

      announce("Font loaded. Preview updated.");
      downloadFontBtn.disabled = false;
    } catch (e) {
      const msg = e?.message || "Unexpected error.";
      announce(msg);
      console.error(e);
    } finally {
      buildBtn.disabled = false;
    }
  });

  downloadFontBtn.addEventListener("click", () => {
    if (!lastBuilt?.font?.blob) {
      announce("No built font available to download yet.");
      return;
    }
    downloadBlob(lastBuilt.font.blob, lastBuilt.font.filename);
    announce(`Downloaded: ${lastBuilt.font.filename}`);
  });
});
