// Paper-style preview of one lesson plan, laid out like the school's original template (12 sections).
import { SECTIONS, PROCESS_STEPS, SUFFICIENCY } from "./template.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const lines = (v) => (Array.isArray(v) ? v : String(v ?? "").split(/\r?\n/)).map((l) => String(l).trim()).filter(Boolean);
const stripNum = (l) => l.replace(/^\s*(\d+[.)]|[-•–])\s*/, "");
const nl = (t) => esc(t);

export function planPreviewHtml(ctx, plan) {
  const th = ctx.thNum, sec = plan.sections ?? {}, c = ctx.course, u = ctx.unit;
  const codes = plan.indicator_codes ?? [];
  const inds = ctx.indicators.filter((i) => codes.includes(i.code));
  const stdCodes = [...new Set(inds.map((i) => i.standard_code))];
  const stdOf = (sc) => ctx.standards.find((s) => s.standard_code === sc);
  const H = (n, t) => `<h4>${n}. ${esc(t)}</h4>`;
  const P = (t, cls = "") => `<p class="${cls}">${nl(t)}</p>`;
  const L = (txt, fmt) => lines(txt).map((l, i) => P(fmt ? fmt(l, i) : l, "ind2")).join("");
  const out = [];
  out.push(`<h3 class="c">แผนการจัดการเรียนรู้</h3>`);
  const row = (a, b) => `<div class="hd"><span>${esc(a)}</span><span>${esc(b ?? "")}</span></div>`;
  out.push(row(`รายวิชา${ctx.subject}`, `รหัสวิชา ${c.course_code || "........"}`));
  out.push(`<p class="c">ชั้นประถมศึกษาปีที่ ${c.grade}</p>`);
  out.push(row(`หน่วยการเรียนรู้ที่ ${u.seq}   เรื่อง ${u.name}`, `เวลา ${u.hours} ชั่วโมง`));
  out.push(row(`เรื่อง ${plan.title}`, `เวลา ${plan.hours} ชั่วโมง`));
  out.push(`<div class="dots"></div>`);

  out.push(H(1, SECTIONS[0].title));
  stdCodes.forEach((sc) => out.push(P(`มาตรฐาน ${th(sc)}  ${stdOf(sc)?.description ?? ""}`, "ind1")));
  out.push(`<p class="b ind0">ตัวชี้วัด/ผลการเรียนรู้</p>`);
  inds.forEach((i) => out.push(P(`ตัวชี้วัด : ${th(i.code.replace(/^\S+\s\d\.\d\s*/, ""))} ${i.description}${i.kind ? ` (ตัวชี้วัด${i.kind})` : ""}`, "ind1")));
  if (!inds.length) out.push(`<p class="ph ind1">(ยังไม่ได้เลือกตัวชี้วัด)</p>`);

  out.push(H(2, SECTIONS[1].title));
  [["2.1 ด้านความรู้ ความเข้าใจ (K)", "K"], ["2.2 ด้านทักษะกระบวนการ (P)", "P"], ["2.3 ด้านคุณลักษณะ (A)", "A"]].forEach(([t, k]) => {
    out.push(P(t, "ind1")); out.push(L(sec.objectives?.[k]) || `<p class="ph ind2">(ว่าง)</p>`);
  });

  out.push(H(3, SECTIONS[2].title)); out.push(`<p class="b ind1">สาระการเรียนรู้</p>`);
  out.push(L(sec.content, (l) => `- ${stripNum(l)}`) || `<p class="ph ind2">(ว่าง)</p>`);

  out.push(H(4, SECTIONS[3].title)); out.push(lines(sec.key_idea).map((l) => P(l, "first")).join("") || `<p class="ph">(ว่าง)</p>`);

  out.push(H(5, SECTIONS[4].title)); out.push((sec.traits ?? []).map((t, i) => P(`${i + 1}. ${t}`, "ind1")).join("") || `<p class="ph ind1">(ว่าง)</p>`);

  out.push(H(6, SECTIONS[5].title));
  out.push(`<p class="b ind0">สมรรถนะภูเก็ต</p>`); out.push(L(sec.competencies?.local) || `<p class="ph ind2">(ว่าง)</p>`);
  out.push(`<p class="b ind0">สมรรถนะสำคัญของผู้เรียน</p>`); out.push(L(sec.competencies?.key) || `<p class="ph ind2">(ว่าง)</p>`);

  out.push(H(7, SECTIONS[6].title));
  const suf = SUFFICIENCY.filter(([k]) => sec.sufficiency?.[k]).map(([k, label]) => P(`${label}  ${sec.sufficiency[k]}`, "ind0")).join("");
  out.push(suf || `<p class="ph ind0">(ว่าง)</p>`);

  out.push(H(8, SECTIONS[7].title));
  if ((sec.focus?.r3 ?? []).length) { out.push(`<p class="b ind1">3Rs คือ</p>`); sec.focus.r3.forEach((t) => out.push(P(`☑ ${t}`, "ind2"))); }
  if ((sec.focus?.c8 ?? []).length) { out.push(`<p class="b ind1">8Cs คือ</p>`); sec.focus.c8.forEach((t) => out.push(P(`☑ ${t}`, "ind2"))); }
  if (!(sec.focus?.r3 ?? []).length && !(sec.focus?.c8 ?? []).length) out.push(`<p class="ph ind1">(ยังไม่เลือก)</p>`);

  out.push(H(9, SECTIONS[8].title));
  PROCESS_STEPS.forEach((st, i) => { out.push(`<p class="b">${esc(st)}</p>`); out.push(L(sec.process?.[i]) || `<p class="ph ind0">(ว่าง)</p>`); });

  out.push(H(10, SECTIONS[9].title)); out.push(L(sec.media, (l, i) => `${i + 1}. ${stripNum(l)}`) || `<p class="ph ind1">(ว่าง)</p>`);

  out.push(H(11, SECTIONS[10].title));
  [["11.1 แหล่งเรียนรู้ภายในโรงเรียน", "inside"], ["11.2 แหล่งเรียนรู้ภายนอกห้องเรียน", "outside"], ["11.3 ภูมิปัญญาท้องถิ่น", "local"]].forEach(([t, k]) => {
    const ls = lines(sec.resources?.[k]); out.push(P(t, "ind1"));
    (ls.length ? ls : ["-"]).forEach((l, i) => out.push(P(ls.length > 1 ? `${i + 1}) ${stripNum(l)}` : stripNum(l), "ind2")));
  });

  out.push(H(12, SECTIONS[11].title));
  const toCell = (t) => (lines(t).length ? lines(t) : [""]).map((l) => `<div>${l ? "- " + esc(stripNum(l)) : "&nbsp;"}</div>`).join("");
  out.push(`<table class="pt"><tr><th>รายการประเมิน</th><th>วิธีการวัด</th><th>เครื่องมือวัด</th><th>เกณฑ์การประเมินผล</th></tr>${(sec.assessment ?? []).map((a) => {
    const k = /\(K\)/.test(a.item) ? "K" : /\(P\)/.test(a.item) ? "P" : /\(A\)/.test(a.item) ? "A" : null;
    return `<tr><td><b>${esc(a.item)}</b>${k ? lines(sec.objectives?.[k]).map((l) => `<div>- ${esc(stripNum(l))}</div>`).join("") : ""}</td><td>${toCell(a.method)}</td><td>${toCell(a.tool)}</td><td>${toCell(a.criteria)}</td></tr>`;
  }).join("")}</table>`);

  (sec.attachments ?? []).forEach((a, i) => {
    if (!String(a.title ?? "").trim() && !String(a.body ?? "").trim()) return;
    out.push(`<hr><h3 class="c">เอกสารแนบที่ ${i + 1} ${esc(a.title)}</h3>${lines(a.body).map((l) => P(l, "ind0")).join("")}`);
  });
  return `<div class="paper">${out.join("")}</div>`;
}
