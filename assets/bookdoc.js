// Full school-curriculum book (เล่มหลักสูตรสถานศึกษา) as one Word file.
import { BOOK_TEXTS } from "./template.js";
const DOCX_CDN = "https://cdn.jsdelivr.net/npm/docx@9.16.1/+esm";
const FONT = "TH SarabunIT๙";
const cm = (v) => Math.round(v * 567);
const getDocx = async () => globalThis.__docx ?? (await import(DOCX_CDN));
const byCode = (a, b) => a.code.localeCompare(b.code, "th", { numeric: true });

export async function buildBookDoc(b) {
  const D = await getDocx();
  const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, TableLayoutType, LineRuleType, VerticalAlign, Footer, Header, PageNumber } = D;
  const th = b.thNum, C = AlignmentType.CENTER;
  const run = (t, o = {}) => new TextRun({ text: th(t), font: FONT, size: o.size ?? 32, bold: o.bold, italics: o.italics });
  const p = (t, o = {}) => new Paragraph({ children: [run(t, o)], alignment: o.align ?? AlignmentType.LEFT, indent: o.indent, pageBreakBefore: o.pb, keepNext: o.keepNext, spacing: { line: 260, lineRule: LineRuleType.AUTO, before: o.before ?? 0, after: o.after ?? 60 } });
  const h1 = (t, pb = true) => p(t, { bold: true, size: 40, align: C, pb, after: 160 });
  const h2 = (t) => p(t, { bold: true, size: 34, before: 160, keepNext: true });
  const h3 = (t) => p(t, { bold: true, before: 100, keepNext: true });
  const body = (t) => String(t ?? "").split(/\r?\n/).filter((x) => x.trim()).map((l) => p(l.trim(), { indent: { firstLine: cm(1.2) }, align: AlignmentType.THAI_DISTRIBUTE }));
  const ln = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const cell = (t, w, o = {}) => new TableCell({ children: String(t ?? "").split("\n").map((l) => p(l, { bold: o.bold, align: o.align, size: 30, after: 0 })), width: { size: cm(w), type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, columnSpan: o.span, margins: { top: 40, bottom: 40, left: 80, right: 80 }, borders: { top: ln, bottom: ln, left: ln, right: ln }, shading: o.fill ? { fill: o.fill } : undefined });
  const table = (w, head, rows, o = {}) => new Table({
    layout: TableLayoutType.FIXED, width: { size: cm(w.reduce((a, c) => a + c, 0)), type: WidthType.DXA }, columnWidths: w.map(cm),
    rows: [new TableRow({ tableHeader: true, children: head.map((x, i) => cell(x, w[i], { bold: true, align: C, fill: "F2F2F2" })) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((v, i) => (v && v.span) ? cell(v.t, w.slice(i).reduce((a, c) => a + c, 0), { span: w.length - i, bold: true, fill: "E8EEF7" }) : cell(v && v.t !== undefined ? v.t : v, w[i], { align: o.center?.includes(i) ? C : undefined, bold: v && v.bold })) }))],
  });
  const sp = () => p("", { after: 40 });

  const stds = b.standards ?? [], inds = [...(b.indicators ?? [])].sort(byCode);
  const strands = [...new Set(stds.map((s) => s.strand_no ?? s.standard_code.match(/\d+/)?.[0]))].sort((x, y) => Number(x) - Number(y));
  const strandName = (n) => stds.find((s) => String(s.strand_no ?? s.standard_code.match(/\d+/)?.[0]) === String(n))?.strand_name ?? "";
  const stdsOf = (n) => stds.filter((s) => String(s.strand_no ?? s.standard_code.match(/\d+/)?.[0]) === String(n)).sort((x, y) => x.standard_code.localeCompare(y.standard_code, "th", { numeric: true }));
  const grades = Object.keys(b.grades ?? {}).map(Number).sort((x, y) => x - y);
  const indOf = (g, std) => inds.filter((i) => /ป\.(\d)\//.exec(i.code)?.[1] === String(g) && i.standard_code === std);
  const T = b.texts ?? {};
  const kids = [];

  // ปก
  kids.push(p("", { before: 1800 }), p("เอกสารประกอบหลักสูตรสถานศึกษา", { bold: true, size: 56, align: C }), p(b.school || "", { bold: true, size: 48, align: C }),
    p(`พุทธศักราช ${b.year || ""}`, { bold: true, size: 44, align: C, after: 300 }),
    p("ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน", { bold: true, size: 40, align: C }), p(b.curriculumName, { bold: true, size: 40, align: C, after: 400 }),
    p(`กลุ่มสาระการเรียนรู้${b.subject}`, { bold: true, size: 48, align: C }), p("ชั้นประถมศึกษาปีที่ ๑ – ๖", { bold: true, size: 40, align: C, after: 800 }),
    p("สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน กระทรวงศึกษาธิการ", { size: 32, align: C }));

  // คำนำ + สารบัญ
  kids.push(h1("คำนำ")); kids.push(...body(T.foreword)); kids.push(p("คณะผู้จัดทำ", { align: AlignmentType.RIGHT, before: 300 }));
  const toc = ["คำนำ", "สารบัญ", "ความนำ", `เรียนรู้อะไรใน${b.subject}`, "สาระและมาตรฐานการเรียนรู้", "คุณภาพผู้เรียน", "ตัวชี้วัดระหว่างทางและปลายทาง", "ตัวชี้วัดและสาระการเรียนรู้แกนกลาง", ...grades.map((g) => `ชั้นประถมศึกษาปีที่ ${g}: คำอธิบายรายวิชาและโครงสร้างรายวิชา`), "โครงสร้างเวลาเรียน", "เกณฑ์การวัดและการประเมินผล", "อภิธานศัพท์"];
  kids.push(h1("สารบัญ"), p("เรื่อง", { bold: true }), ...toc.map((t) => p(t)));

  kids.push(h1("ความนำ")); kids.push(...body(T.intro));
  kids.push(h1(`เรียนรู้อะไรใน${b.subject}`)); kids.push(...body(T.learn_what));

  // สาระและมาตรฐาน
  kids.push(h1("สาระและมาตรฐานการเรียนรู้"));
  strands.forEach((n) => { kids.push(h2(`สาระที่ ${n} ${strandName(n)}`)); stdsOf(n).forEach((s) => kids.push(p(`มาตรฐาน ${s.standard_code} ${s.description ?? ""}`, { indent: { left: cm(0.8) } }))); });

  kids.push(h1("คุณภาพผู้เรียน")); kids.push(h3("จบชั้นประถมศึกษาปีที่ ๓")); kids.push(...body(T.outcome_g3)); kids.push(h3("จบชั้นประถมศึกษาปีที่ ๖")); kids.push(...body(T.outcome_g6));

  // ตัวชี้วัดระหว่างทางและปลายทาง (per grade)
  kids.push(h1("ตัวชี้วัดระหว่างทางและปลายทาง"));
  grades.forEach((g, gi) => {
    kids.push(h2(`ชั้นประถมศึกษาปีที่ ${g}`));
    strands.forEach((n) => {
      const rows = [];
      stdsOf(n).forEach((s) => {
        const all = indOf(g, s.standard_code); if (!all.length) return;
        const mid = all.filter((i) => i.kind !== "ปลายทาง"), end = all.filter((i) => i.kind === "ปลายทาง");
        rows.push([{ span: true, t: `มาตรฐาน ${s.standard_code} ${s.description ?? ""}` }]);
        for (let k = 0; k < Math.max(mid.length, end.length); k++) rows.push([k + 1, mid[k] ? `${mid[k].code} ${mid[k].description}` : "-", end[k] ? `${end[k].code} ${end[k].description}` : "-"]);
      });
      if (rows.length) { kids.push(h3(`สาระที่ ${n} ${strandName(n)}`)); kids.push(table([1.4, 7.6, 7.6], ["ที่", "ตัวชี้วัดระหว่างทาง", "ตัวชี้วัดปลายทาง"], rows, { center: [0] })); kids.push(sp()); }
    });
  });

  // ตัวชี้วัดและสาระการเรียนรู้แกนกลาง (per grade)
  kids.push(h1("ตัวชี้วัดและสาระการเรียนรู้แกนกลาง"));
  grades.forEach((g) => {
    kids.push(h2(`ชั้นประถมศึกษาปีที่ ${g}`));
    strands.forEach((n) => {
      const rows = [];
      stdsOf(n).forEach((s) => {
        const all = indOf(g, s.standard_code); if (!all.length) return;
        rows.push([{ span: true, t: `มาตรฐาน ${s.standard_code} ${s.description ?? ""}` }]);
        all.forEach((i) => rows.push([`ป.${g}`, `${i.code}\n${i.description}`, b.grades[g].core?.[i.code] ?? b.grades[g].core?.[i.code?.replace(/\s+/g, " ")] ?? "", "-"]));
      });
      if (rows.length) { kids.push(h3(`สาระที่ ${n} ${strandName(n)}`)); kids.push(table([1.4, 6.2, 6.2, 2.8], ["ชั้น", "ตัวชี้วัด", "สาระการเรียนรู้แกนกลาง", "สาระการเรียนรู้ท้องถิ่น"], rows, { center: [0] })); kids.push(sp()); }
    });
  });

  // รายวิชารายชั้น
  grades.forEach((g) => {
    const gd = b.grades[g], gi = inds.filter((i) => /ป\.(\d)\//.exec(i.code)?.[1] === String(g));
    kids.push(h1(`คำอธิบายรายวิชา ชั้นประถมศึกษาปีที่ ${g}`));
    kids.push(p(`รายวิชา${gd.name || b.subject}${gd.code ? ` รหัสวิชา ${gd.code}` : ""}`, { bold: true }), p(`กลุ่มสาระการเรียนรู้${b.subject} ชั้นประถมศึกษาปีที่ ${g} เวลาเรียน ${gd.hours} ชั่วโมง/ปี`, { bold: true, after: 120 }));
    kids.push(...body(gd.desc));
    kids.push(h1(`โครงสร้างรายวิชา ชั้นประถมศึกษาปีที่ ${g}`));
    kids.push(p(`รายวิชา${gd.name || b.subject}${gd.code ? ` รหัสวิชา ${gd.code}` : ""} กลุ่มสาระการเรียนรู้${b.subject} เวลา ${gd.hours} ชั่วโมง`, { bold: true, after: 120 }));
    let sh = 0, ss = 0, n = 0;
    const rows = (gd.structure ?? []).map((r) => { sh += Number(r.hours) || 0; ss += Number(r.score_weight) || 0; const isU = r.kind !== "exam"; if (isU) n++; return [isU ? `${n}. ${r.name}` : r.name, (r.indicator_codes ?? []).join("\n"), r.content ?? "", Number(r.hours) || 0, Number(r.score_weight) || 0]; });
    rows.push([{ t: "รวมทั้งสิ้น", bold: true }, "", "", sh, ss]);
    kids.push(table([4, 4.2, 5.2, 1.6, 1.6], ["ชื่อหน่วยการเรียนรู้", "มาตรฐาน/ตัวชี้วัด", "เนื้อหา", "จำนวน (ชั่วโมง)", "น้ำหนักคะแนน"], rows, { center: [3, 4] }));
  });

  kids.push(h1("โครงสร้างเวลาเรียน"));
  kids.push(p("เวลาเรียนของกลุ่มสาระการเรียนรู้ในแต่ละชั้นปี (ชั่วโมง/ปี)", { after: 120 }));
  kids.push(table([5.6, ...grades.map(() => 1.8)], ["กลุ่มสาระ/กิจกรรม", ...grades.map((g) => `ป.${g}`)], [[`${b.subject}`, ...grades.map((g) => b.grades[g].hours)]], { center: grades.map((_, i) => i + 1) }));
  kids.push(h1("เกณฑ์การวัดและการประเมินผล")); kids.push(...body(T.assess_criteria));
  kids.push(h1("อภิธานศัพท์")); kids.push(...body(T.glossary));

  return new Document({ sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: cm(2), bottom: cm(1.8), left: cm(2.2), right: cm(2) } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: C, children: [new TextRun({ text: th(`กลุ่มสาระการเรียนรู้${b.subject}   `), font: FONT, size: 26 }), new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 26 })] })] }) },
    children: kids }] });
}
export async function bookBlob(b) { const D = await getDocx(); return D.Packer.toBlob(await buildBookDoc(b)); }
