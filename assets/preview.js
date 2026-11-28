// Paper-style preview of one lesson plan, laid out like the school's original template (12 sections).
import { SECTIONS, PROCESS_STEPS, SUFFICIENCY, R3, C8 } from "./template.js";

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
  const ANS = /^[\s\-•–]*\(?\s*ตัวอย่าง/, QST = /^[\s\-•–]*(\d+[.)]\s*)?ครู\s*(ถาม|ตั้งคำถาม|ใช้คำถาม|:)/;
  const P = (t, cls = "") => `<p class="${cls}">${nl(t)}</p>`;
  const L = (txt, fmt) => lines(txt).map((l, i) => P(fmt ? fmt(l, i) : l, "ind2")).join("");
  const out = [];
  out.push(`<h3 class="c"><u>แผนการจัดการเรียนรู้</u></h3>`);
  const row3 = (l, m, r, w) => `<div class="hd3"><span style="width:${w}">${esc(l)}</span><span class="mid">${esc(m)}</span><span class="r">${esc(r)}</span></div>`;
  out.push(row3(`รายวิชา${ctx.subject}`, `รหัสวิชา ${c.course_code ?? ""}`, `ชั้นประถมศึกษาปีที่ ${c.grade}`, "40%"));
  out.push(row3(`หน่วยการเรียนรู้ที่ ${u.seq}`, `เรื่อง ${u.name}`, `เวลา ${u.hours} ชั่วโมง`, "22%"));
  out.push(row3("เรื่อง", plan.title, `เวลา ${plan.hours} ชั่วโมง`, "8%"));
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
  out.push(`<p class="b ind1">3Rs คือ</p>`); R3.forEach((t) => out.push(P(`${(sec.focus?.r3 ?? []).includes(t) ? "☑" : "☐"} ${t}`, "ind2")));
  out.push(`<p class="b ind1">8Cs คือ</p>`); C8.forEach((t) => out.push(P(`${(sec.focus?.c8 ?? []).includes(t) ? "☑" : "☐"} ${t}`, "ind2")));

  out.push(H(9, SECTIONS[8].title));
  PROCESS_STEPS.forEach((st, i) => { out.push(`<p class="b"><u>${esc(st)}</u></p>`); out.push(lines(sec.process?.[i]).map((l) => P(l, ANS.test(l) ? "ind2 ans" : QST.test(l) ? "ind1 qst" : "ind0")).join("") || `<p class="ph ind0">(ว่าง)</p>`); });

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

  const dl = (t = "") => `<div class="dl"><span>${esc(t)}</span></div>`;
  const dots = "...............";
  const sign = (role, name, extra) => `<div class="sg"><p>ลงชื่อ .........................................${role ? ` (${esc(role)})` : ""}</p><p>(${esc(name || "........................................")})</p>${extra ? `<p>${esc(extra)}</p>` : ""}<p>........../............../..........</p></div>`;
  out.push(`<div class="pgbreak"></div>`);
  out.push(H(13, "บันทึกหลังการสอน"));
  out.push(`<p class="b ind0">13.1 ผลการเรียนรู้</p>`);
  out.push(P(`1) นักเรียนที่ผ่านตัวชี้วัด  มีจำนวน ${dots} คน  คิดเป็นร้อยละ ${dots}`, "ind1"));
  out.push(P(`2) นักเรียนที่ไม่ผ่านตัวชี้วัด มีจำนวน ${dots} คน  คิดเป็นร้อยละ ${dots}`, "ind1"));
  out.push(P(`1. ${dots}${dots} สาเหตุ ${dots}${dots}`, "ind2")); out.push(P(`2. ${dots}${dots} สาเหตุ ${dots}${dots}`, "ind2"));
  out.push(dl("แนวทางแก้ปัญหา")); out.push(dl("3) นักเรียนที่มีความสามารถพิเศษได้แก่")); out.push(dl("แนวทางการพัฒนา / ส่งเสริม"));
  out.push(dl("4) นักเรียนได้รับความรู้ (K)")); out.push(dl("5) นักเรียนเกิดทักษะกระบวนการ (P)")); out.push(dl("6) นักเรียนมีคุณธรรม จริยธรรม ค่านิยม (A)"));
  out.push(`<p class="b ind0">13.2 ทักษะในศตวรรษที่ 21 ที่เน้นในแผนการจัดการเรียนรู้</p>`);
  [...R3, ...C8].forEach((t) => out.push(dl(t)));
  out.push(`<p class="b ind0">13.3 ปัญหา/อุปสรรค (ถ้ามี)</p>`, dl(), dl(), `<p class="b ind0">13.4 แนวทางแก้ไข (ถ้ามี)</p>`, dl(), dl());
  out.push(sign("ครูผู้สอน", ctx.teacher));
  out.push(H(14, "ความเห็นผู้บริหาร/ผู้ที่ได้รับมอบหมาย"));
  out.push(`<p class="b ind0">ความเห็นของรองผู้อำนวยการโรงเรียน</p>`, dl(), dl(), sign("", ctx.deputy, `รองผู้อำนวยการ${ctx.school ?? ""}`));
  out.push(`<p class="b ind0">ความเห็นของผู้อำนวยการโรงเรียน</p>`, dl(), dl(), sign("", ctx.director, `ผู้อำนวยการ${ctx.school ?? ""}`));

  (sec.attachments ?? []).forEach((a, i) => {
    if (!String(a.title ?? "").trim() && !String(a.body ?? "").trim()) return;
    out.push(`<hr><h3 class="c">เอกสารแนบที่ ${i + 1} ${esc(a.title)}</h3>${lines(a.body).map((l) => P(l, "ind0")).join("")}`);
  });
  const html = out.join("").replace(/>([^<]*)</g, (m, t) => ">" + th(t) + "<");
  return `<div class="paper">${html}</div>`;
}
