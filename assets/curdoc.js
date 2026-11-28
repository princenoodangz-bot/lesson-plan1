// Word files for the school curriculum and the teaching-schedule (course structure).
const DOCX_CDN = "https://cdn.jsdelivr.net/npm/docx@9.16.1/+esm";
const FONT = "TH SarabunIT๙";
const cm = (v) => Math.round(v * 567);
const getDocx = async () => globalThis.__docx ?? (await import(DOCX_CDN));

async function kit(th) {
  const D = await getDocx();
  const { Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, TableLayoutType, LineRuleType, VerticalAlign } = D;
  const run = (t, o = {}) => new TextRun({ text: th(t), font: FONT, size: o.size ?? 32, bold: o.bold, italics: o.italics });
  const p = (t, o = {}) => new Paragraph({ children: [run(t, o)], alignment: o.align ?? AlignmentType.LEFT, indent: o.indent, spacing: { line: 250, lineRule: LineRuleType.AUTO, before: o.before ?? 0, after: o.after ?? 0 }, keepNext: o.keepNext });
  const ln = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
  const cell = (t, w, o = {}) => new TableCell({ children: [p(t, { bold: o.bold, align: o.align })], width: { size: cm(w), type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, margins: { top: 50, bottom: 50, left: 90, right: 90 }, borders: { top: ln, bottom: ln, left: ln, right: ln }, shading: o.fill ? { fill: o.fill } : undefined });
  const table = (widths, header, rows) => new Table({
    layout: TableLayoutType.FIXED, width: { size: cm(widths.reduce((a, b) => a + b, 0)), type: WidthType.DXA }, columnWidths: widths.map(cm),
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { bold: true, align: AlignmentType.CENTER, fill: "F2F2F2" })) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i], { align: i === 0 || typeof v === "number" ? AlignmentType.CENTER : undefined })) }))],
  });
  return { D, p, table, AlignmentType };
}
const page = (landscape) => ({ page: { size: { orientation: landscape ? "landscape" : "portrait", width: 11906, height: 16838 }, margin: { top: cm(2), bottom: cm(1.8), left: cm(2.2), right: cm(2) } } });
export const sortCode = (a, b) => a.code.localeCompare(b.code, "th", { numeric: true });

// หลักสูตรสถานศึกษา (รายวิชา/ชั้น): ข้อมูลทั่วไป เวลาเรียน คำอธิบายรายวิชา มาตรฐาน ตัวชี้วัด
export async function buildCurriculumDoc(c) {
  const { D, p, table, AlignmentType } = await kit(c.thNum);
  const C = AlignmentType.CENTER, doc = c.doc ?? {};
  const kids = [
    p("หลักสูตรสถานศึกษา" + (c.school ? ` ${c.school}` : ""), { bold: true, size: 40, align: C }),
    p(`กลุ่มสาระการเรียนรู้${c.subject} ชั้นประถมศึกษาปีที่ ${c.grade}`, { bold: true, size: 36, align: C }),
    p(`ตามหลักสูตร ${c.curriculumName}`, { align: C, after: 160 }),
    p("๑. เวลาเรียน", { bold: true, before: 120 }),
    p(`เวลาเรียนรวมทั้งปี ${c.totalHours ?? "-"} ชั่วโมง${c.perWeek ? ` (สัปดาห์ละ ${c.perWeek} ชั่วโมง)` : ""}`, { indent: { left: cm(1) } }),
  ];
  let n = 2;
  const sec = (title, text) => { if (!text) return; kids.push(p(`${n++}. ${title}`, { bold: true, before: 120, keepNext: true })); String(text).split(/\r?\n/).filter((x) => x.trim()).forEach((l) => kids.push(p(l, { indent: { left: cm(1), firstLine: 0 }, align: AlignmentType.THAI_DISTRIBUTE }))); };
  sec("วิสัยทัศน์/เป้าหมายของกลุ่มสาระ", doc.vision);
  sec("คำอธิบายรายวิชา", doc.course_description);
  sec("สมรรถนะสำคัญและคุณลักษณะอันพึงประสงค์ที่เน้น", doc.competencies);
  sec("แนวทางการจัดการเรียนรู้และการวัดผลประเมินผล", doc.approach);
  kids.push(p(`${n++}. มาตรฐานการเรียนรู้`, { bold: true, before: 120, keepNext: true }));
  kids.push(table([3, 13.6], ["รหัสมาตรฐาน", "มาตรฐานการเรียนรู้"], (c.standards ?? []).map((s) => [s.standard_code, s.description ?? ""])));
  kids.push(p(`${n++}. ตัวชี้วัดชั้นปี`, { bold: true, before: 160, keepNext: true }));
  kids.push(table([3.4, 13.2], ["รหัสตัวชี้วัด", "ตัวชี้วัด"], [...(c.indicators ?? [])].sort(sortCode).map((i) => [i.code, i.description ?? ""])));
  return new D.Document({ sections: [{ properties: page(false), children: kids }] });
}

// โครงสร้างกำหนดการสอน (รายวิชา)
export async function buildScheduleDoc(c) {
  const { D, p, table, AlignmentType } = await kit(c.thNum);
  const C = AlignmentType.CENTER, desc = Object.fromEntries((c.indicators ?? []).map((i) => [i.code, i.description]));
  const kids = [
    p("โครงสร้างกำหนดการสอน" + (c.school ? ` ${c.school}` : ""), { bold: true, size: 40, align: C }),
    p(`รายวิชา${c.courseName}${c.courseCode ? ` รหัสวิชา ${c.courseCode}` : ""} ชั้นประถมศึกษาปีที่ ${c.grade}`, { bold: true, size: 36, align: C }),
    p(`กลุ่มสาระการเรียนรู้${c.subject} · เวลาเรียน ${c.totalHours} ชั่วโมง/ปี · ${c.semesters} ภาคเรียน${c.year ? ` · ปีการศึกษา ${c.year}` : ""}`, { align: C, after: 160 }),
  ];
  let seq = 0, sumH = 0, sumS = 0;
  const rows = (c.rows ?? []).map((r) => {
    const isU = r.kind === "unit"; if (isU) seq++;
    sumH += Number(r.hours) || 0; sumS += Number(r.score_weight) || 0;
    const codes = (r.indicator_codes ?? []).join("\n");
    return [isU ? seq : "-", r.semester ?? "", r.name, codes, Number(r.hours) || 0, Number(r.score_weight) || 0];
  });
  rows.push(["", "", "รวม", "", sumH, sumS]);
  kids.push(table([1.7, 1.4, 5.1, 4.6, 1.9, 1.9], ["หน่วยที่", "ภาค", "ชื่อหน่วยการเรียนรู้/สอบ", "ตัวชี้วัด", "ชั่วโมง", "คะแนน"], rows));
  if (c.units?.some((u) => u.key_concept)) {
    kids.push(p("สาระสำคัญรายหน่วย", { bold: true, before: 200, keepNext: true }));
    c.units.forEach((u) => u.key_concept && kids.push(p(`หน่วยที่ ${u.seq} ${u.name}: ${u.key_concept}`, { indent: { left: cm(0.6) }, align: AlignmentType.THAI_DISTRIBUTE })));
  }
  if (Object.keys(desc).length) {
    kids.push(p("ตัวชี้วัดที่ใช้ในรายวิชา", { bold: true, before: 200, keepNext: true }));
    [...c.indicators].sort(sortCode).forEach((i) => kids.push(p(`${i.code} ${i.description ?? ""}`, { indent: { left: cm(0.6) } })));
  }
  return new D.Document({ sections: [{ properties: page(false), children: kids }] });
}

export async function docBlob(doc) { return (await getDocx()).Packer.toBlob(doc); }
