// Word (.docx) export that follows the school's original plan layout:
// A4, margins L3.17 R1.75 T2.30 B1.50 cm, TH SarabunIT๙ 16.5/16 pt, 12 numbered sections, 4-column assessment table.
import { SECTIONS, PROCESS_STEPS, SUFFICIENCY, R3, C8 } from "./template.js";

const DOCX_CDN = "https://cdn.jsdelivr.net/npm/docx@9.16.1/+esm";
const FONT = "TH SarabunIT๙";
const cm = (v) => Math.round(v * 567); // cm -> twips
const SZ = 33;   // 16.5 pt (half-points)
const SZ_S = 32; // 16 pt

async function getDocx() {
  return globalThis.__docx ?? (await import(DOCX_CDN));
}
const lines = (s) => String(s ?? "").split(/\r?\n/).map((x) => x.replace(/\s+$/, "")).filter((x) => x.trim() !== "");
const stripNum = (s) => s.replace(/^\s*(\d+[.)]|[-•])\s*/, "");

export async function buildDoc(ctx, plans) {
  const D = await getDocx();
  const { TableLayoutType, TabStopType, LeaderType, LineRuleType, Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, TableOfContents, Footer, PageNumber, PageBreak, VerticalAlign } = D;
  const th = ctx.thNum;

  const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size ?? SZ, bold: o.bold, ...o.extra });
  const para = (children, o = {}) => new Paragraph({
    children: typeof children === "string" ? [run(children, o)] : children,
    alignment: o.align ?? AlignmentType.LEFT,
    indent: o.indent, spacing: { line: o.line ?? 250, lineRule: LineRuleType.AUTO, before: o.before ?? 0, after: o.after ?? 0 },
    heading: o.heading, keepNext: o.keepNext, pageBreakBefore: o.pageBreakBefore,
  });
  const head = (n, title) => para(`${n}. ${title}`, { bold: true, before: 80, keepNext: true });
  const sub = (text) => para(text, { bold: true, indent: { left: cm(1.27) }, keepNext: true });
  const body = (text, o = {}) => para(text, { align: AlignmentType.THAI_DISTRIBUTE, indent: { firstLine: cm(1.27), left: o.left ?? 0 }, ...o });
  const bullets = (txt, prefix) => lines(txt).map((l, i) => body(prefix === "num" ? `${i + 1}. ${stripNum(l)}` : prefix === "dash" ? `- ${stripNum(l)}` : l, { left: cm(0.6) }));

  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const cell = (children, w, o = {}) => new TableCell({
    children, width: { size: cm(w), type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    borders: { top: line, bottom: line, left: line, right: line }, shading: o.fill ? { fill: o.fill } : undefined,
  });

  const blocks = (plan, idx) => {
    const sec = plan.sections ?? {};
    const out = [];
    const c = ctx.course, u = ctx.unit;
    const codes = plan.indicator_codes ?? [];
    const inds = ctx.indicators.filter((i) => codes.includes(i.code));
    const stdCodes = [...new Set(inds.map((i) => i.standard_code))];
    const stdOf = (sc) => ctx.standards.find((s) => s.standard_code === sc);

    out.push(para("แผนการจัดการเรียนรู้", { bold: true, align: AlignmentType.CENTER, heading: ctx.multi ? HeadingLevel.HEADING_1 : undefined, pageBreakBefore: ctx.multi && idx > 0, line: 240 }));
    out.push(para(`รายวิชา${ctx.subject}\t รหัสวิชา ${c.course_code ?? ""}   ชั้นประถมศึกษาปีที่ ${c.grade}`));
    out.push(para(`หน่วยการเรียนรู้ที่ ${u.seq}\t เรื่อง ${u.name}\t เวลา ${u.hours} ชั่วโมง`));
    out.push(para(`เรื่อง \t${plan.title}\t เวลา ${plan.hours} ชั่วโมง`));
    out.push(new Paragraph({ children: [run("\t")], tabStops: [{ type: TabStopType.RIGHT, position: cm(16.05), leader: LeaderType.DOT }], spacing: { line: 250, lineRule: LineRuleType.AUTO } }));

    // 1
    out.push(head(1, SECTIONS[0].title));
    stdCodes.forEach((sc) => out.push(body(`มาตรฐาน ${th(sc)}  ${stdOf(sc)?.description ?? ""}`, { left: cm(1.2) })));
    out.push(para("ตัวชี้วัด/ผลการเรียนรู้", { bold: true, indent: { firstLine: cm(1.27) } }));
    inds.forEach((i) => out.push(body(`ตัวชี้วัด : ${th(i.code.replace(/^พ\s*\d\.\d\s*/, ""))} ${i.description}${i.kind ? ` (ตัวชี้วัด${i.kind})` : ""}`, { left: cm(1.2) })));

    // 2
    out.push(head(2, SECTIONS[1].title));
    [["2.1 ด้านความรู้ ความเข้าใจ (K)", "K"], ["2.2 ด้านทักษะกระบวนการ (P)", "P"], ["2.3 ด้านคุณลักษณะ (A)", "A"]].forEach(([t, k]) => {
      out.push(para(t, { indent: { left: cm(1.2) }, keepNext: true }));
      lines(sec.objectives?.[k]).forEach((l) => out.push(body(l, { left: cm(1.8) })));
    });

    // 3
    out.push(head(3, SECTIONS[2].title));
    out.push(para("สาระการเรียนรู้", { bold: true, indent: { left: cm(1.2) } }));
    lines(sec.content).forEach((l) => out.push(para(`- ${stripNum(l)}`, { indent: { left: cm(1.8) } })));

    // 4
    out.push(head(4, SECTIONS[3].title));
    lines(sec.key_idea).forEach((l) => out.push(body(l)));

    // 5
    out.push(head(5, SECTIONS[4].title));
    (sec.traits ?? []).forEach((t, i) => out.push(para(`${i + 1}. ${t}`, { indent: { left: cm(1.2) } })));

    // 6
    out.push(head(6, SECTIONS[5].title));
    out.push(para("สมรรถนะภูเก็ต", { bold: true, indent: { left: cm(0.6) } }));
    lines(sec.competencies?.local).forEach((l) => out.push(body(l, { left: cm(0.6) })));
    out.push(para("สมรรถนะสำคัญของผู้เรียน", { bold: true, indent: { left: cm(0.6) } }));
    lines(sec.competencies?.key).forEach((l) => out.push(body(l, { left: cm(0.6) })));

    // 7
    out.push(head(7, SECTIONS[6].title));
    SUFFICIENCY.forEach(([k, label]) => { if (sec.sufficiency?.[k]) out.push(body(`${label}  ${sec.sufficiency[k]}`, { left: cm(0.6) })); });

    // 8
    out.push(head(8, SECTIONS[7].title));
    const picked = (list, key) => (sec.focus?.[key] ?? []);
    if (picked(R3, "r3").length) {
      out.push(para("3Rs คือ", { bold: true, indent: { left: cm(1.2) } }));
      picked(R3, "r3").forEach((t) => out.push(para([run("☑ ", { extra: { font: "Segoe UI Symbol" } }), run(t)], { indent: { left: cm(1.8) } })));
    }
    if (picked(C8, "c8").length) {
      out.push(para("8Cs คือ", { bold: true, indent: { left: cm(1.2) } }));
      picked(C8, "c8").forEach((t) => out.push(para([run("☑ ", { extra: { font: "Segoe UI Symbol" } }), run(t)], { indent: { left: cm(1.8) } })));
    }

    // 9
    out.push(head(9, SECTIONS[8].title));
    PROCESS_STEPS.forEach((st, i) => {
      out.push(para(st, { bold: true, keepNext: true }));
      lines(sec.process?.[i]).forEach((l) => out.push(body(l, { left: cm(0.6) })));
    });

    // 10
    out.push(head(10, SECTIONS[9].title));
    lines(sec.media).forEach((l, i) => out.push(para(`${i + 1}. ${stripNum(l)}`, { indent: { left: cm(1.2) } })));

    // 11
    out.push(head(11, SECTIONS[10].title));
    [["11.1 แหล่งเรียนรู้ภายในโรงเรียน", "inside"], ["11.2 แหล่งเรียนรู้ภายนอกห้องเรียน", "outside"], ["11.3 ภูมิปัญญาท้องถิ่น", "local"]].forEach(([t, k]) => {
      out.push(para(t, { indent: { left: cm(1.2) }, keepNext: true }));
      const ls = lines(sec.resources?.[k]);
      (ls.length ? ls : ["-"]).forEach((l, i) => out.push(para(ls.length > 1 ? `${i + 1}) ${stripNum(l)}` : stripNum(l), { indent: { left: cm(1.8) } })));
    });

    // 12
    out.push(head(12, SECTIONS[11].title));
    const W = [7.0, 3.2, 3.2, 2.6];
    const hdr = new TableRow({ tableHeader: true, children: ["รายการประเมิน", "วิธีการวัด", "เครื่องมือวัด", "เกณฑ์การประเมินผล"].map((t, i) => cell([para(t, { bold: true, align: AlignmentType.CENTER })], W[i], { fill: "F2F2F2" })) });
    const rows = (sec.assessment ?? []).map((a) => {
      const k = /\(K\)/.test(a.item) ? "K" : /\(P\)/.test(a.item) ? "P" : /\(A\)/.test(a.item) ? "A" : null;
      const itemParas = [para(a.item, { bold: true }), ...(k ? lines(sec.objectives?.[k]).map((l) => para(`- ${stripNum(l)}`)) : [])];
      const toParas = (t) => (lines(t).length ? lines(t) : [""]).map((l) => para(l ? `- ${stripNum(l)}` : ""));
      return new TableRow({ cantSplit: true, children: [cell(itemParas, W[0]), cell(toParas(a.method), W[1]), cell(toParas(a.tool), W[2]), cell(toParas(a.criteria).map((p) => p), W[3])] });
    });
    out.push(new Table({ width: { size: cm(W.reduce((x, y) => x + y)), type: WidthType.DXA }, columnWidths: W.map(cm), rows: [hdr, ...rows], layout: TableLayoutType.FIXED }));
    return out;
  };

  const children = [];
  if (ctx.multi) {
    children.push(para(ctx.school || "", { bold: true, align: AlignmentType.CENTER, before: 2400, size: 40 }));
    children.push(para("แผนการจัดการเรียนรู้", { bold: true, align: AlignmentType.CENTER, size: 40, before: 240 }));
    children.push(para(`รายวิชา${ctx.subject} รหัสวิชา ${ctx.course.course_code ?? ""}`, { align: AlignmentType.CENTER, size: 36, before: 240 }));
    children.push(para(`ชั้นประถมศึกษาปีที่ ${ctx.course.grade}${ctx.year ? ` ปีการศึกษา ${ctx.year}` : ""}`, { align: AlignmentType.CENTER, size: 36 }));
    children.push(para(`หน่วยการเรียนรู้ที่ ${ctx.unit.seq} ${ctx.unit.name}`, { align: AlignmentType.CENTER, size: 36, before: 240 }));
    if (ctx.teacher) children.push(para(`โดย ${ctx.teacher}`, { align: AlignmentType.CENTER, size: 32, before: 480 }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(para("สารบัญ", { bold: true, align: AlignmentType.CENTER }));
    children.push(new TableOfContents("สารบัญ", { hyperlink: true, headingStyleRange: "1-1" }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
  plans.forEach((p, i) => children.push(...blocks(p, i)));

  return new Document({
    creator: ctx.teacher || "ระบบสร้างแผนการสอน",
    title: "แผนการจัดการเรียนรู้",
    features: ctx.multi ? { updateFields: true } : undefined,
    styles: {
      default: { document: { run: { font: FONT, size: SZ } } },
      paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: FONT, size: SZ, bold: true, color: "000000" }, paragraph: { spacing: { before: 0, after: 0 } } }],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { left: cm(3.17), right: cm(1.75), top: cm(2.3), bottom: cm(1.5) } } },
      footers: ctx.multi ? { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: SZ })] })] }) } : undefined,
      children,
    }],
  });
}

export function fileName(ctx, plans) {
  const code = ctx.course.course_code || "แผน";
  const base = plans.length === 1 ? `${code}_หน่วย${ctx.unit.seq}_แผน${plans[0].seq}` : `${code}_หน่วย${ctx.unit.seq}_ทั้งหน่วย`;
  return base.replace(/[\\/:*?"<>|]/g, "_") + ".docx";
}

export async function exportPlans(ctx, plans) {
  if (!plans?.length) throw new Error("ไม่มีแผนให้ส่งออก");
  const D = await getDocx();
  const c = { ...ctx, multi: plans.length > 1 };
  const doc = await buildDoc(c, plans);
  const blob = await D.Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = fileName(c, plans);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
