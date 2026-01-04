/* src/composer.js */
(function(){
  "use strict";

  // US Letter: 8.5in x 11in
  const LETTER_W_IN = 8.5;
  const LETTER_H_IN = 11;

  function pxPerIn(){
    // En browsers modernos suele aproximar a 96px/in, pero usamos una medición real:
    const div = document.createElement("div");
    div.style.width = "1in";
    div.style.position = "absolute";
    div.style.left = "-10000px";
    div.style.top = "-10000px";
    document.body.appendChild(div);
    const px = div.getBoundingClientRect().width || 96;
    div.remove();
    return px;
  }

  function buildFeatureSettings(features){
    // font-feature-settings: 'liga' 1, 'calt' 1, ...
    const onOff = (tag, enabled) => `'${tag}' ${enabled ? 1 : 0}`;
    const items = [];
    items.push(onOff("liga", !!features.liga));
    items.push(onOff("calt", !!features.calt));
    items.push(onOff("kern", !!features.kern));
    items.push(onOff("dlig", !!features.dlig));
    items.push(onOff("hlig", !!features.hlig));
    items.push(onOff("salt", !!features.salt));
    if (features.ss && typeof features.ss === "string" && features.ss.trim()){
      items.push(onOff(features.ss.trim(), true));
    }
    return items.join(", ");
  }

  function createMeasurer(){
    const m = document.createElement("div");
    m.style.position = "absolute";
    m.style.left = "-10000px";
    m.style.top = "-10000px";
    m.style.whiteSpace = "pre-wrap";
    m.style.wordBreak = "break-word";
    m.style.visibility = "hidden";
    document.body.appendChild(m);
    return m;
  }

  function paginateText(text, settings remind){
    // This file must remain valid JS; no TS.
  }

  function composePages({
    text,
    fontFamily,
    fontSizePt,
    lineHeight,
    marginIn,
    maxPages,
    features
  }){
    const ppi = pxPerIn();
    const pageW = LETTER_W_IN * ppi;
    const pageH = LETTER_H_IN * ppi;
    const pad = Math.max(0.3, Math.min(1.5, marginIn)) * ppi;

    const contentW = pageW - pad*2;
    const contentH = pageH - pad*2;

    const measurer = createMeasurer();
    measurer.style.width = contentW + "px";
    measurer.style.fontFamily = fontFamily;
    measurer.style.fontSize = fontSizePt + "pt";
    measurer.style.lineHeight = String(lineHeight);
    measurer.style.fontFeatureSettings = buildFeatureSettings(features);

    const pages = [];
    const normalized = (text || "").replace(/\r\n/g, "\n");

    // Estrategia: iterar por líneas (preserva saltos) y llenar hasta altura máxima.
    const lines = normalized.split("\n");
    let current = "";
    let i = 0;

    while (i < lines.length && pages.length < maxPages){
      const nextLine = lines[i];
      const candidate = (current.length ? (current + "\n" + nextLine) : nextLine);

      measurer.textContent = candidate;
      const h = measurer.getBoundingClientRect().height;

      if (h <= contentH){
        current = candidate;
        i++;
        continue;
      }

      // Si ni siquiera entra una sola línea (caso extremo: fuente muy grande)
      if (!current.length){
        // Fuerza corte duro por caracteres
        let chunk = "";
        for (const ch of nextLine){
          const cand2 = chunk + ch;
          measurer.textContent = cand2;
          if (measurer.getBoundingClientRect().height <= contentH){
            chunk = cand2;
          } else {
            break;
          }
        }
        pages.push(chunk);
        // Resto de la línea queda para siguientes páginas
        lines[i] = nextLine.slice(chunk.length);
        current = "";
        continue;
      }

      pages.push(current);
      current = "";
    }

    if (pages.length < maxPages && current.length){
      pages.push(current);
    }

    // Si se cortó por maxPages, adjunta aviso (sin “payasadas”, solo rigor)
    const truncated = i < lines.length;
    measurer.remove();

    return {
      pages,
      truncated,
      pageCss: {
        padPx: pad
      }
    };
  }

  window.GlyphComposer = { composePages, buildFeatureSettings };
})();
