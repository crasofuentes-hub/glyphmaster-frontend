import { APP } from "./config.js";

/**
 * Deterministic US Letter compositor (max 10 pages).
 * - Uses CSS inches for print fidelity; uses 96dpi conversion for text layout.
 * - Word wrap via Canvas measureText for consistent line breaks.
 */

const DPI = 96;
const LETTER = { wIn: 8.5, hIn: 11 };

function inchesToPx(inches) {
  return Math.round(inches * DPI);
}

function normalizeText(text) {
  return (text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function createMeasureCtx(fontFamily, fontSizePx) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.font = `${fontSizePx}px ${fontFamily}`;
  return ctx;
}

function wrapLine(ctx, line, maxWidthPx) {
  // Preserve explicit blank lines
  if (!line) return [""];

  const words = line.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxWidthPx) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

export function composeUSLetterPages({
  text,
  fontFamily,
  fontSizePx,
  lineHeightMultiplier,
  marginsIn,
  maxPages = APP.maxPages,
}) {
  const t = normalizeText(text);

  const m = marginsIn || APP.defaultMarginsIn;
  const contentWpx = inchesToPx(LETTER.wIn - (m.left + m.right));
  const contentHpx = inchesToPx(LETTER.hIn - (m.top + m.bottom));

  const lhPx = Math.max(12, Math.round(fontSizePx * (lineHeightMultiplier || APP.defaultLineHeight)));
  const linesPerPage = Math.max(1, Math.floor(contentHpx / lhPx));

  const ctx = createMeasureCtx(fontFamily, fontSizePx);

  const rawLines = t.split("\n");
  const wrapped = [];
  for (const rl of rawLines) {
    const wl = wrapLine(ctx, rl, contentWpx);
    for (const w of wl) wrapped.push(w);
  }

  const pages = [];
  let idx = 0;

  while (idx < wrapped.length && pages.length < maxPages) {
    pages.push(wrapped.slice(idx, idx + linesPerPage));
    idx += linesPerPage;
  }

  const overflow = idx < wrapped.length;
  if (overflow && pages.length > 0) {
    const last = pages[pages.length - 1];
    if (last.length > 0) {
      last[last.length - 1] = (last[last.length - 1] || "").replace(/\s*$/, "") + " …";
    }
  }

  return {
    pages,
    overflow,
    metrics: { contentWpx, contentHpx, linesPerPage, lhPx, fontSizePx },
    paper: { ...LETTER, marginsIn: m },
  };
}

export function renderUSLetterPages(container, model, { fontFamily, fontSizePx, lineHeightPx, marginsIn }) {
  if (!container) return;
  container.innerHTML = "";

  const m = marginsIn || APP.defaultMarginsIn;

  const root = document.createElement("div");
  root.className = "gm-pages";

  model.pages.forEach((lines, i) => {
    const page = document.createElement("section");
    page.className = "gm-page";
    page.setAttribute("role", "article");
    page.setAttribute("aria-label", `Page ${i + 1}`);

    const content = document.createElement("div");
    content.className = "gm-page-content";
    content.style.padding = `${m.top}in ${m.right}in ${m.bottom}in ${m.left}in`;
    content.style.fontFamily = fontFamily;
    content.style.fontSize = `${fontSizePx}px`;
    content.style.lineHeight = `${lineHeightPx}px`;

    for (const ln of lines) {
      const p = document.createElement("div");
      p.className = "gm-line";
      p.textContent = ln;
      content.appendChild(p);
    }

    const footer = document.createElement("div");
    footer.className = "gm-page-footer";
    footer.textContent = `${i + 1} / ${model.pages.length}`;

    page.appendChild(content);
    page.appendChild(footer);
    root.appendChild(page);
  });

  container.appendChild(root);
}
