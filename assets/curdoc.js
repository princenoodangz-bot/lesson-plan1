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
  const cell = (t, w, o = {}) => new TableCell({ children: [p(t, { bold: o.bold, align: o.align })], width: { size: cm(w), type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP, margins: { top: 50, bottom: 50, left: 90, right: 90 }, borders: { top: ln, bottom: ln, left: ln, right: ln }, shading: o.fill ? { fill: o.fill } : undefined, columnSpan: o.span });
  const table = (widths, header, rows) => new Table({
    layout: TableLayoutType.FIXED, width: { size: cm(widths.reduce((a, b) => a + b, 0)), type: WidthType.DXA }, columnWidths: widths.map(cm),
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], { bold: true, align: AlignmentType.CENTER, fill: "F2F2F2" })) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i], { align: i === 0 || typeof v === "number" ? AlignmentType.CENTER : undefined })) }))],
  });
  return { D, p, table, AlignmentType, cell, Table, TableRow, WidthType, TableLayoutType, cm };
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

// ---------------------------------------------------------------------------
// กำหนดการสอนรายชั่วโมง: สร้างจาก หน่วยการเรียนรู้ → แผนรายคาบ จริงในระบบ (ไม่แต่งเอง) พร้อมตรวจความสอดคล้อง
// ---------------------------------------------------------------------------
const nz = (v) => (v === "" || v == null || isNaN(Number(v)) ? 0 : Number(v));
const thDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${Number(m[3])}/${Number(m[2])}/${Number(m[1]) + 543}` : ""; };
// c: { rows, units, plans, perWeek, semesters, totalHours }
export function hourlyModel(c) {
  const semCount = Math.max(1, nz(c.semesters) || 2), pw = nz(c.perWeek) > 0 ? nz(c.perWeek) : 1;
  const rows = c.rows ?? [], units = [...(c.units ?? [])].sort((a, b) => nz(a.seq) - nz(b.seq)), plans = c.plans ?? [];
  const issues = [], rowById = Object.fromEntries(rows.map((r) => [r.id, r]));
  const semOf = (u) => { const s = nz(u.semester) || nz(rowById[u.source_row_id]?.semester); if (!s) issues.push(`หน่วยที่ ${u.seq} "${u.name}" ยังไม่ระบุภาคเรียน (ใช้ภาคเรียนที่ 1)`); return Math.min(semCount, s || 1); };
  const unitNo = new Map(units.map((u, i) => [u.id, i + 1]));
  const sems = Array.from({ length: semCount }, (_, i) => ({ sem: i + 1, items: [], hours: 0 }));
  units.forEach((u) => {
    const my = plans.filter((x) => x.unit_id === u.id).sort((a, b) => nz(a.seq) - nz(b.seq));
    const ph = my.reduce((a, x) => a + nz(x.hours), 0), uh = nz(u.hours), no = unitNo.get(u.id);
    if (!my.length) issues.push(`หน่วยที่ ${no} "${u.name}" ยังไม่มีแผนรายคาบ (ใช้ชั่วโมงของหน่วย ${uh} ชม. แทน)`);
    else if (ph !== uh) issues.push(`หน่วยที่ ${no} "${u.name}": ชั่วโมงรวมของแผน ${ph} ไม่เท่ากับชั่วโมงของหน่วย ${uh}`);
    const ucodes = new Set(u.indicator_codes ?? []), pcodes = new Set(my.flatMap((x) => x.indicator_codes ?? []));
    const extra = [...pcodes].filter((k) => ucodes.size && !ucodes.has(k)), miss = [...ucodes].filter((k) => my.length && !pcodes.has(k));
    if (extra.length) issues.push(`หน่วยที่ ${no}: แผนใช้ตัวชี้วัดที่ไม่อยู่ในหน่วย (${extra.join(", ")})`);
    if (miss.length) issues.push(`หน่วยที่ ${no}: ตัวชี้วัดของหน่วยที่ยังไม่มีแผนรองรับ (${miss.join(", ")})`);
    my.filter((x) => !(x.indicator_codes ?? []).length).forEach((x) => issues.push(`หน่วยที่ ${no}: แผนที่ ${x.seq} "${x.title}" ไม่มีตัวชี้วัด`));
    const sm = sems[semOf(u) - 1];
    const lines = my.length ? my.map((x) => ({ title: x.title || `แผนที่ ${x.seq}`, codes: x.indicator_codes ?? [], hours: nz(x.hours), date: x.planned_date || "", seq: x.seq })) : [{ title: u.name, codes: u.indicator_codes ?? [], hours: uh, date: "", missing: true }];
    sm.items.push({ kind: "unit", no, name: u.name, hours: lines.reduce((a, x) => a + x.hours, 0), lines });
  });
  rows.filter((r) => r.kind === "exam").forEach((r) => { const sm = sems[Math.min(semCount, nz(r.semester) || semCount) - 1]; sm.items.push({ kind: "exam", name: r.name, hours: nz(r.hours), lines: [{ title: r.name, codes: [], hours: nz(r.hours), date: "" }] }); });
  sems.forEach((sm) => {
    if (!sm.items.some((x) => x.kind === "exam")) issues.push(`ภาคเรียนที่ ${sm.sem} ไม่มีแถวสอบ`);
    let cur = 0;
    sm.items.forEach((it) => it.lines.forEach((ln) => { const h = ln.hours; ln.from = Math.floor(cur / pw) + 1; ln.to = Math.max(ln.from, Math.ceil((cur + h) / pw)); cur += h; }));
    sm.hours = cur;
  });
  const total = sems.reduce((a, x) => a + x.hours, 0), want = nz(c.totalHours);
  if (want && total !== want) issues.push(`ชั่วโมงรวมในกำหนดการ ${total} ไม่เท่ากับชั่วโมงรวมของรายวิชา ${want}`);
  if (want) sems.forEach((sm) => { if (Math.abs(sm.hours - want / semCount) >= 1) issues.push(`ภาคเรียนที่ ${sm.sem}: ${sm.hours} ชั่วโมง (ควร ${want / semCount})`); });
  const orphan = plans.filter((x) => !unitNo.has(x.unit_id)).length; if (orphan) issues.push(`พบแผน ${orphan} แผนที่ไม่ผูกกับหน่วยใดของรายวิชานี้ (ไม่นำมาแสดง)`);
  return { sems, total, perWeek: pw, issues };
}
export async function buildHourlyDoc(c) {
  const { D, p, cell, Table, TableRow, WidthType, TableLayoutType, AlignmentType } = await kit(c.thNum);
  const C = AlignmentType.CENTER, W = [1.9, 2.2, 5.5, 3.2, 2.2, 1.8], model = c.model ?? hourlyModel(c), th = c.thNum;
  const sections = model.sems.map((sm) => {
    const cr = sm.hours / 20, credit = Number.isInteger(cr) ? String(cr) : cr.toFixed(1);
    const sp = (...x) => x.filter(Boolean).join("      ");
    const kids = [
      p("กำหนดการสอนรายชั่วโมง", { bold: true, size: 40, align: C }),
      p(sp(`กลุ่มสาระการเรียนรู้${c.subject}`, `รายวิชา${c.courseName}`, c.courseCode ? `รหัสวิชา ${c.courseCode}` : ""), { bold: true, size: 28, align: C }),
      p(sp(`ระดับชั้น ประถมศึกษาปีที่ ${c.grade}`, `จำนวน ${credit} หน่วยกิต`, `เวลา ${sm.hours} ชั่วโมง` ), { bold: true, size: 28, align: C, after: 120 }),
      p(`ภาคเรียนที่ ${sm.sem}${c.year ? `   ปีการศึกษา ${c.year}` : ""}`, { bold: true, after: 60 }),
    ];
    const head = new TableRow({ tableHeader: true, children: ["สัปดาห์ที่", "วันเดือนปี", "หน่วยการเรียนรู้/สาระการเรียนรู้", "มาตรฐาน/ตัวชี้วัด", "ชั่วโมง", "หมายเหตุ"].map((h, i) => cell(h, W[i], { bold: true, align: C, fill: "F2F2F2" })) });
    const body = [];
    sm.items.forEach((it) => {
      if (it.kind === "unit" && c.showUnits) body.push(new TableRow({ cantSplit: true, children: [cell(`หน่วยการเรียนรู้ที่ ${it.no} ${it.name} (${it.hours} ชั่วโมง)`, 16.8, { bold: true, span: 6, fill: "FAF5E8" })] }));
      it.lines.forEach((ln) => body.push(new TableRow({ cantSplit: true, children: [
        cell(ln.from === ln.to ? String(ln.from) : `${ln.from}-${ln.to}`, W[0], { align: C }), cell(thDate(ln.date), W[1], { align: C }), cell(ln.title, W[2]),
        cell((ln.codes ?? []).join("\n"), W[3]), cell(String(ln.hours), W[4], { align: C }), cell(ln.missing ? "ยังไม่มีแผนรายคาบ" : "", W[5])] })));
    });
    body.push(new TableRow({ children: [cell(`รวมภาคเรียนที่ ${sm.sem}`, 15.0, { bold: true, align: C, span: 4 }), cell(String(sm.hours), W[4], { bold: true, align: C }), cell("", W[5])] }));
    kids.push(new Table({ layout: TableLayoutType.FIXED, width: { size: cm(W.reduce((a, b) => a + b, 0)), type: WidthType.DXA }, columnWidths: W.map(cm), rows: [head, ...body] }));
    return { properties: page(false), children: kids };
  });
  return new D.Document({ sections });
}

export async function docBlob(doc) { return (await getDocx()).Packer.toBlob(doc); }
