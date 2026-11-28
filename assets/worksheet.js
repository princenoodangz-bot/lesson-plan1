// Draws a designed A4 worksheet (colourful, Thai text) onto canvases and returns JPEG data URLs.
// Thai text is drawn by us (not by an image model) so the wording is always correct.
export const THEMES = {
  blue: { name: "ฟ้า", main: "#2f7fd8", dark: "#17467f", light: "#e6f1fd" },
  pink: { name: "ชมพู", main: "#d6336c", dark: "#85163f", light: "#fde8f0" },
  green: { name: "เขียว", main: "#2f9e5f", dark: "#146035", light: "#e5f6ec" },
  orange: { name: "ส้ม", main: "#e8870e", dark: "#8a4d00", light: "#fff1de" },
  purple: { name: "ม่วง", main: "#7c4dcc", dark: "#41237a", light: "#efe8fb" },
};
const W = 1240, H = 1754, M = 78;

function words(text) {
  const t = String(text ?? "");
  try { return [...new Intl.Segmenter("th", { granularity: "word" }).segment(t)].map((s) => s.segment); }
  catch { return t.match(/\S+\s*|\s+/g) ?? [t]; }
}
function wrap(ctx, text, maxW) {
  const out = [];
  String(text ?? "").split(/\r?\n/).forEach((para) => {
    let line = "";
    for (const w of words(para)) {
      if (ctx.measureText(line + w).width > maxW && line.trim()) { out.push(line.trimEnd()); line = w.trimStart(); } else line += w;
    }
    out.push(line.trimEnd());
  });
  return out;
}
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
function star(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r; ctx[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function dots(ctx, x1, x2, y, color = "#777") { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([2, 7]); ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore(); }

export async function renderWorksheet(ws, { theme = "blue", meta = {}, makeCanvas, font = "Sarabun, 'Noto Sans Thai', sans-serif" } = {}) {
  const T = THEMES[theme] ?? THEMES.blue;
  const mk = makeCanvas ?? (() => Object.assign(document.createElement("canvas"), { width: W, height: H }));
  if (typeof document !== "undefined" && document.fonts?.load) { try { await Promise.all(["400", "600", "700"].map((w) => document.fonts.load(`${w} 32px Sarabun`, "กขค"))); } catch {} }
  const pages = []; let cv, ctx, y, pageNo = 0;
  const F = (px, w = 400) => { ctx.font = `${w} ${px}px ${font}`; };
  const newPage = (first) => {
    cv = mk(); ctx = cv.getContext("2d"); pageNo++; pages.push(cv);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = T.main; ctx.lineWidth = 7; rr(ctx, 26, 26, W - 52, H - 52, 26); ctx.stroke();
    ctx.strokeStyle = T.light; ctx.lineWidth = 3; rr(ctx, 40, 40, W - 80, H - 80, 20); ctx.stroke();
    y = 78;
    if (first) {
      F(56, 700); const tl = wrap(ctx, ws.title || "ใบงาน", W - 2 * M - 250).slice(0, 3), hh = 70 + tl.length * 62 + 56;
      ctx.fillStyle = T.light; rr(ctx, M, y, W - 2 * M, hh, 28); ctx.fill();
      [[W - 150, y + 52, 26], [W - 214, y + 112, 16], [W - 100, y + 132, 14]].forEach(([a, b, r]) => star(ctx, a, b, r, T.main));
      ctx.fillStyle = T.main; rr(ctx, M, y, 20, hh, 10); ctx.fill();
      ctx.fillStyle = T.dark; F(56, 700); ctx.textBaseline = "alphabetic";
      tl.forEach((l, i) => ctx.fillText(l, M + 48, y + 74 + i * 62));
      F(30, 500); ctx.fillStyle = "#555"; ctx.fillText(meta.sub || "", M + 48, y + 74 + tl.length * 62 - 4 + 26);
      y += hh + 54;
      F(34, 500); ctx.fillStyle = "#222";
      ctx.fillText("ชื่อ-นามสกุล", M, y + 8); dots(ctx, M + 190, 760, y + 8);
      ctx.fillText("ชั้น", 790, y + 8); dots(ctx, 840, 960, y + 8);
      ctx.fillText("เลขที่", 985, y + 8); dots(ctx, 1065, W - M, y + 8);
      y += 56;
      if (ws.instructions) {
        F(32, 400); const il = wrap(ctx, "คำชี้แจง: " + ws.instructions, W - 2 * M - 60), h = il.length * 44 + 30;
        ctx.fillStyle = T.light; rr(ctx, M, y, W - 2 * M, h, 18); ctx.fill();
        ctx.fillStyle = T.dark; il.forEach((l, i) => { if (i === 0) { F(32, 700); ctx.fillText("คำชี้แจง:", M + 28, y + 46); const w = ctx.measureText("คำชี้แจง: ").width; F(32, 400); ctx.fillText(l.replace(/^คำชี้แจง:\s*/, ""), M + 28 + w, y + 46); } else ctx.fillText(l, M + 28, y + 46 + i * 44); });
        y += h + 26;
      }
    }
    F(24, 400); ctx.fillStyle = "#888"; ctx.textAlign = "center"; ctx.fillText(`${pageNo}`, W / 2, H - 52); ctx.textAlign = "left";
  };
  newPage(true);
  const bottom = H - 120;
  const qs = ws.questions ?? [];
  qs.forEach((q, n) => {
    const inner = W - 2 * M - 110;
    F(34, 500); const ql = wrap(ctx, q.q, inner);
    let h = 28 + ql.length * 46;
    const type = q.type;
    let opts = (q.options ?? []).map(String);
    F(32, 400);
    const optLines = opts.map((o) => wrap(ctx, o, (inner - 60) / 2 - 50));
    if (type === "choice" && opts.length) { h += 34; for (let i = 0; i < opts.length; i += 2) h += Math.max(optLines[i].length, optLines[i + 1]?.length ?? 0) * 42 + 12; }
    else if (type === "tf") h += 66;
    else if (type === "draw") h += 250;
    else if (type === "fill") h += 14;
    else h += (q.lines ?? 2) * 56;
    h += 18;
    if (y + h > bottom) newPage(false);
    ctx.fillStyle = "#fff"; ctx.strokeStyle = T.light; ctx.lineWidth = 4; rr(ctx, M, y, W - 2 * M, h, 20); ctx.fill(); ctx.stroke();
    ctx.fillStyle = T.main; ctx.beginPath(); ctx.arc(M + 44, y + 44, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; F(30, 700); ctx.textAlign = "center"; ctx.fillText(String(n + 1), M + 44, y + 55); ctx.textAlign = "left";
    ctx.fillStyle = "#1a1a1a"; F(34, 500); let yy = y + 54; ql.forEach((l) => { ctx.fillText(l, M + 90, yy); yy += 46; }); yy -= 46;
    yy += 18 + (type === "choice" ? 22 : 0); const x0 = M + 90;
    if (type === "choice" && opts.length) {
      const colW = (inner - 30) / 2; F(32, 400);
      for (let i = 0; i < opts.length; i += 2) {
        let rowH = 0;
        [i, i + 1].forEach((k, c) => { if (!opts[k]) return; const x = x0 + c * (colW + 30);
          ctx.strokeStyle = T.main; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 18, yy + 4, 16, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = T.dark; F(26, 700); ctx.textAlign = "center"; ctx.fillText("กขคง"[k] ?? String(k + 1), x + 18, yy + 13); ctx.textAlign = "left";
          F(32, 400); ctx.fillStyle = "#222"; optLines[k].forEach((l, li) => ctx.fillText(l, x + 48, yy + 12 + li * 42)); rowH = Math.max(rowH, optLines[k].length * 42); });
        yy += rowH + 12;
      }
    } else if (type === "tf") {
      F(34, 500); ctx.fillStyle = "#222";
      [["ถูก", 0], ["ผิด", 1]].forEach(([t, c]) => { const x = x0 + 40 + c * 280; ctx.strokeStyle = T.main; ctx.lineWidth = 4; rr(ctx, x, yy + 6, 40, 40, 8); ctx.stroke(); ctx.fillText(t, x + 60, yy + 40); });
    } else if (type === "draw") {
      ctx.save(); ctx.strokeStyle = T.main; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); rr(ctx, x0, yy, inner, 220, 16); ctx.stroke(); ctx.restore();
    } else if (type !== "fill") {
      F(30, 500); ctx.fillStyle = "#666"; ctx.fillText("ตอบ:", x0, yy + 30);
      for (let i = 0; i < (q.lines ?? 2); i++) dots(ctx, x0 + (i ? 0 : 76), W - M - 40, yy + 34 + i * 56);
    }
    y += h + 20;
  });
  // score box on last page
  if (y + 90 > bottom + 30) newPage(false);
  ctx.fillStyle = T.light; rr(ctx, W - M - 330, y, 330, 70, 18); ctx.fill();
  ctx.fillStyle = T.dark; F(34, 700); ctx.fillText("คะแนน", W - M - 310, y + 46); ctx.fillStyle = "#222"; F(34, 500); ctx.fillText(`....... / ${ws.total_score ?? qs.length}`, W - M - 190, y + 46);
  const out = [];
  for (const c of pages) {
    const data = c.toDataURL ? c.toDataURL("image/jpeg", 0.88) : "";
    out.push({ name: "worksheet.jpg", data, w: c.width, h: c.height });
  }
  return out;
}
