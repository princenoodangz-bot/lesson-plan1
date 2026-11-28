const DEMO = new URLSearchParams(location.search).has("demo");
const { createClient } = await import(DEMO ? "./demo.js" : "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
import {
  SECTIONS, PROCESS_STEPS, SUFFICIENCY, R3, C8, TRAITS, SYSTEM_PROMPT,
  emptySections, BOOK_TEXTS, promptBookText, promptCore, promptGradeDesc, promptExtraDesc, promptReadStructure, promptFillMissing, promptPlanFill, promptCurriculumDoc, promptStructure, promptKeyIdea, promptPlan, promptPlanTitles, promptField, promptAttachments,
} from "./template.js";

const { SUPABASE_URL, SUPABASE_KEY } = window.APP_CONFIG;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const KEYCOLS = "id,label,priority,enabled,exhausted_until,last_error,last_used_at,created_at,used_today,used_day,daily_limit";
// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => crypto.randomUUID();
const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? 0 : Number(v));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const THDIG = "๐๑๒๓๔๕๖๗๘๙";
const thNum = (n) => String(n).replace(/\d/g, (d) => THDIG[d]);

let toastT;
function toast(msg, kind = "") {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast " + kind;
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), kind === "err" ? 7000 : 3000);
}
const must = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
const busy = async (btn, fn) => {
  const old = btn?.innerHTML; if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span>กำลังทำงาน...'; }
  try { return await fn(); } catch (e) { console.error(e); toast(e.message || String(e), "err"); }
  finally { if (btn) { btn.disabled = false; btn.innerHTML = old; } }
};
function openModal(html) { $("#modalBody").innerHTML = html; $("#modal").showModal(); }
function closeModal() { $("#modal").close(); }

// ---------- state ----------
const S = {
  user: null, settings: null,
  subjects: [], curricula: [],
  curStructs: [], cs: null,          // tab 1
  courses: [], course: null, rows: [], // tab 2
  units: [], unit: null,              // tab 3/4
  plans: [], plan: null,
  indCache: {},                       // cs.id -> indicators[]
  keys: [],
  tab: "t1",
};
const subjName = (id) => S.subjects.find((s) => s.id === id)?.name ?? "";
const curName = (id) => S.curricula.find((c) => c.id === id)?.id ?? id;
const saveSel = () => localStorage.setItem("lp_sel", JSON.stringify({ cs: S.cs?.id, course: S.course?.id, unit: S.unit?.id, tab: S.tab }));

// ---------- auth ----------
function demoBanner() {
  if (!DEMO) return;
  let why = ""; try { why = sessionStorage.getItem("lp_err") || ""; } catch {}
  const d = document.createElement("div");
  d.style.cssText = "background:#b91c1c;color:#fff;padding:8px 12px;text-align:center;font-size:14px;position:sticky;top:0;z-index:50";
  d.textContent = "⚠ โหมดตัวอย่าง: ข้อมูล/API key ไม่ถูกบันทึก และ AI ใช้ไม่ได้" + (why ? " — เหตุผล: " + why : "");
  document.body.prepend(d);
}
async function boot() {
  demoBanner();
  let { data } = await sb.auth.getSession();
  const { AUTO_EMAIL, AUTO_PASS } = window.APP_CONFIG;
  if (!data.session && AUTO_EMAIL && AUTO_PASS) {
    const r = await sb.auth.signInWithPassword({ email: AUTO_EMAIL, password: AUTO_PASS });
    if (r.error) $("#authMsg").textContent = "เข้าอัตโนมัติไม่สำเร็จ: " + r.error.message; else data = r.data;
  }
  await onSession(data.session);
  sb.auth.onAuthStateChange((_e, session) => { if ((session?.user?.id ?? null) !== (S.user?.id ?? null)) onSession(session); });
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
async function onSession(session) {
  S.user = session?.user ?? null;
  $("#auth").classList.toggle("hidden", !!S.user);
  $("#app").classList.toggle("hidden", !S.user);
  if (S.user) { await loadAll(); drawQuota(); }
}
document.addEventListener("click", (e) => { if (e.target.closest?.("#quota")) go("t7"); });
$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#authEmail").value.trim(), password = $("#authPass").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  $("#authMsg").textContent = error ? "เข้าสู่ระบบไม่สำเร็จ: " + error.message : "";
});
$("#googleBtn").addEventListener("click", async () => {
  const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
  if (error) $("#authMsg").textContent = "เข้าสู่ระบบด้วย Google ไม่สำเร็จ: " + error.message;
});
$("#signupBtn").addEventListener("click", async () => {
  const email = $("#authEmail").value.trim(), password = $("#authPass").value;
  if (!email || password.length < 6) { $("#authMsg").textContent = "กรอกอีเมลและรหัสผ่านอย่างน้อย 6 ตัว"; return; }
  const { data, error } = await sb.auth.signUp({ email, password });
  $("#authMsg").textContent = error ? "สมัครไม่สำเร็จ: " + error.message
    : (data.session ? "" : "ส่งอีเมลยืนยันแล้ว เปิดลิงก์ในอีเมลก่อน จากนั้นกลับมาเข้าสู่ระบบ");
});
$("#logoutBtn").addEventListener("click", () => sb.auth.signOut());

// ---------- load ----------
async function loadAll() {
  const [sj, cu, st, cs, co, ks] = await Promise.all([
    sb.from("subjects").select("*").order("id"),
    sb.from("curricula").select("*"),
    sb.from("app_settings").select("*").maybeSingle(),
    sb.from("curriculum_structures").select("*").order("created_at", { ascending: false }),
    sb.from("course_structures").select("*").order("created_at", { ascending: false }),
    sb.from("api_keys").select(KEYCOLS).order("priority").order("created_at"),
  ]);
  S.subjects = must(sj); S.curricula = must(cu); S.settings = must(st);
  S.curStructs = must(cs); S.courses = must(co); S.keys = must(ks);
  let sel = {}; try { sel = JSON.parse(localStorage.getItem("lp_sel") || "{}"); } catch {}
  S.cs = S.curStructs.find((x) => x.id === sel.cs) ?? null;
  S.course = S.courses.find((x) => x.id === sel.course) ?? null;
  if (S.course) { await loadRows(); await loadUnits(sel.unit); }
  go(sel.tab || "t1");
}
async function loadRows() {
  S.rows = must(await sb.from("course_structure_rows").select("*").eq("course_structure_id", S.course.id).order("seq")).map((r) => ({ ...r, indicator_codes: r.indicator_codes ?? [] }));
}
async function loadUnits(selId) {
  S.units = S.course ? must(await sb.from("units").select("*").eq("course_structure_id", S.course.id).order("seq")).map((u) => ({ ...u, indicator_codes: u.indicator_codes ?? [] })) : [];
  S.unit = S.units.find((u) => u.id === selId) ?? S.units[0] ?? null;
  await loadPlans();
}
async function loadPlans() {
  S.plans = S.unit ? must(await sb.from("lesson_plans").select("*").eq("unit_id", S.unit.id).order("seq")).map((p) => ({ ...p, indicator_codes: p.indicator_codes ?? [], sections: p.sections ?? {} })) : [];
  if (!S.plans.find((p) => p.id === S.plan?.id)) S.plan = S.plans[0] ?? null;
}

// ---- indicators/standards: official reference + user-imported (user rows override same code)
const PRESET_MODELS = ["gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
const modelOptions = (list, cur) => [...new Set([cur, ...list].filter(Boolean))].map((m) => `<option value="${esc(m)}" ${m === cur ? "selected" : ""}>${esc(m)}</option>`).join("");
async function fetchModels() {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_KEY }, body: JSON.stringify({ action: "list_models" }) });
  const out = await res.json(); if (!res.ok) throw new Error(out.error || "ดึงรายชื่อโมเดลไม่สำเร็จ");
  S.models = out.models.map((m) => m.replace(/^models\//, "")).filter((m) => /gemini/.test(m)).sort().reverse();
  const sel = $("#sModel"); if (sel) sel.innerHTML = modelOptions(S.models, sel.value);
  return S.models.length;
}
async function loadInds(curriculum, subject, grade) {
  const [a, b] = await Promise.all([
    sb.from("indicators").select("code,description,kind,standard_code").eq("curriculum_id", curriculum).eq("subject_id", subject).eq("grade", grade).order("code"),
    sb.from("user_indicators").select("code,description,kind,standard_code").eq("curriculum_id", curriculum).eq("subject_id", subject).eq("grade", grade).order("code"),
  ]);
  const m = new Map(must(a).map((i) => [i.code, i])); must(b).forEach((i) => m.set(i.code, i));
  return [...m.values()].sort((x, y) => x.code.localeCompare(y.code, "th", { numeric: true }));
}
async function loadStds(curriculum, subject) {
  const [a, b] = await Promise.all([
    sb.from("standards").select("standard_code,strand_no,strand_name,description").eq("curriculum_id", curriculum).eq("subject_id", subject),
    sb.from("user_standards").select("standard_code,description,strand_no,strand_name").eq("curriculum_id", curriculum).eq("subject_id", subject),
  ]);
  const m = new Map(must(a).map((x) => [x.standard_code, x])); must(b).forEach((x) => { const o = m.get(x.standard_code) ?? {}; m.set(x.standard_code, { ...o, ...x, strand_no: x.strand_no ?? o.strand_no, strand_name: x.strand_name || o.strand_name }); });
  return [...m.values()];
}
// parse pasted curriculum text into standards + indicators for one grade
function parseCurriculumText(text, grade) {
  const T = "๐๑๒๓๔๕๖๗๘๙";
  const lines = String(text).replace(/[๐-๙]/g, (d) => T.indexOf(d)).replace(/[\u200b\u00a0]/g, " ").split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);
  const stds = new Map(), strandOf = new Map(), inds = []; let curStd = null, last = null, curStrand = null;
  const reStrand = /^สาระที่\s*(\d+)\s*(.*)$/;
  const reStd = /^มาตรฐาน(?:การเรียนรู้)?(?:\s*ที่)?\s*([ก-ฮ])\s*(\d+)\s*\.\s*(\d+)\s*[:\-–]?\s*(.*)$/;
  const reInd = /^(?:([ก-ฮ])\s*(\d+)\s*\.\s*(\d+)\s+)?ป\.?\s*(\d)\s*\/\s*(\d+)\s*[:\-–.]?\s*(.*)$/;
  for (const l of lines) {
    const sm = l.match(reStrand); if (sm) { curStrand = { no: sm[1], name: sm[2].trim() }; last = null; continue; }
    if (/^(ตัวชี้วัด|ผลการเรียนรู้|ชั้น|สาระการเรียนรู้แกนกลาง)$/.test(l)) { last = last?.code ? null : last; continue; }
    let m = l.match(reStd);
    if (m) { curStd = `${m[1]} ${m[2]}.${m[3]}`; if (!stds.has(curStd)) stds.set(curStd, m[4]); strandOf.set(curStd, curStrand ?? { no: m[2], name: "" }); last = { std: curStd }; continue; }
    m = l.match(reInd);
    if (m) {
      const std = m[1] ? `${m[1]} ${m[2]}.${m[3]}` : curStd;
      if ((grade && Number(m[4]) !== grade) || !std) { last = null; continue; }
      const gr = Number(m[4]);
      let d = m[6], kind = null; const k = d.match(/\((ระหว่างทาง|ปลายทาง)\)\s*$/); if (k) { kind = k[1]; d = d.replace(k[0], "").trim(); }
      last = { code: `${std} ป.${gr}/${m[5]}`, grade: gr, standard_code: std, description: d, kind }; inds.push(last); continue;
    }
    if (last?.code) last.description = (last.description + " " + l).trim();
    else if (last?.std && stds.get(last.std) !== undefined) stds.set(last.std, (stds.get(last.std) + " " + l).trim());
  }
  inds.forEach((i) => { const k = i.description.match(/\((ระหว่างทาง|ปลายทาง)\)\s*$/); if (k) { i.kind = k[1]; i.description = i.description.replace(k[0], "").trim(); } });
  const seen = new Set(), out = inds.filter((i) => !seen.has(i.code) && seen.add(i.code));
  return { standards: [...stds].map(([standard_code, description]) => ({ standard_code, description, strand_no: strandOf.get(standard_code)?.no ?? null, strand_name: strandOf.get(standard_code)?.name || null })), indicators: out };
}
let IMP = null;
async function indicatorsFor(cs) {
  if (!cs) return [];
  if (S.indCache[cs.id]) return S.indCache[cs.id];
  const r = await loadInds(cs.curriculum_id, cs.subject_id, cs.grade);
  return (S.indCache[cs.id] = r);
}
const csOfCourse = (c) => S.curStructs.find((x) => x.id === c?.curriculum_structure_id) ?? null;
async function courseIndicators() {
  const cs = csOfCourse(S.course) ?? (S.course ? { id: "c" + S.course.id, curriculum_id: S.course.curriculum_id, subject_id: S.course.subject_id, grade: S.course.grade } : null);
  return indicatorsFor(cs);
}

// ---------- navigation ----------
function go(tab) {
  if (S.tab === "t5" && tab !== "t5" && $("#pTitle")) { try { collectPlan(); autosavePlan(); } catch {} }
  S.tab = tab; saveSel();
  $$(".tab").forEach((t) => t.classList.toggle("active", t.id === tab));
  $$(".step").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  const c = S.course ? `${subjName(S.course.subject_id)} ป.${S.course.grade} · ${S.course.curriculum_id}` : S.cs ? `${subjName(S.cs.subject_id)} ป.${S.cs.grade} · ${S.cs.curriculum_id}` : "";
  $("#crumb").textContent = c;
  ({ t10: render10, t1: render1, t2: render2, t3: render3, t4: render4, t5: render5, t6: render6, t7: render7, t8: render8, t9: render9, t0: render0 })[tab]();
}
$("#steps").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) go(b.dataset.tab); });

// ---------- AI ----------
const ptDay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
const keyUsed = (k) => (k.used_day === ptDay() ? k.used_today ?? 0 : 0);
const qColor = (pct) => `hsl(${Math.round(120 * (1 - Math.min(1, Math.max(0, pct))))} 75% 45%)`;
const qBar = (used, limit, h = 10) => { const pct = limit ? used / limit : 0; return `<div class="qbar" style="height:${h}px"><i style="width:${Math.min(100, Math.round(pct * 100))}%;background:${qColor(pct)}"></i></div>`; };
function drawQuota() {
  const el = $("#quota"); if (!el) return;
  const ks = (S.keys ?? []).filter((k) => k.enabled);
  if (!ks.length) { el.innerHTML = '<span class="muted small">ยังไม่มีคีย์ AI</span>'; return; }
  const used = ks.reduce((a, k) => a + keyUsed(k), 0), lim = ks.reduce((a, k) => a + (k.daily_limit ?? 250), 0), pct = lim ? used / lim : 0;
  el.title = `โควตา AI วันนี้: ใช้ ${used} จาก ${lim} ครั้ง (นับเอง รีเซ็ตเที่ยงคืนเวลาแปซิฟิก)`;
  el.innerHTML = `<span class="small">AI ${used}/${lim}</span>${qBar(used, lim, 8)}${pct >= 1 ? '<span class="pill bad">เต็ม</span>' : ""}`;
}
async function refreshQuota() { try { S.keys = must(await sb.from("api_keys").select(KEYCOLS).order("priority").order("created_at")); drawQuota(); } catch {} }
async function callAI(prompt, { json = true, system = SYSTEM_PROMPT, files } = {}) {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_KEY },
    body: JSON.stringify({ prompt, system, json, files }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (out.code === "NO_KEYS") throw new Error("ยังไม่มี API key — ไปที่แถบ ⚙ ตั้งค่า แล้วเพิ่มคีย์ก่อน");
    throw new Error(out.error || "เรียก AI ไม่สำเร็จ");
  }
  refreshQuota();
  const used = out.attempts?.length ? ` (สลับคีย์ ${out.attempts.length} ครั้ง ใช้ "${out.key_label}")` : "";
  if (used) toast("ใช้คีย์สำรอง" + used);
  if (!json) return out.text;
  const clean = out.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(clean); } catch { throw new Error("AI ตอบไม่เป็น JSON ลองกดอีกครั้ง"); }
}

// ---------- reading images / PDFs ----------
async function fileToPart(file) {
  const b64 = (buf) => { let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  if (file.type === "application/pdf") { if (file.size > 15e6) throw new Error(`${file.name} ใหญ่เกิน 15MB`); return { mime: "application/pdf", data: b64(await file.arrayBuffer()) }; }
  try {
    const bmp = await createImageBitmap(file); const max = 2000, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88));
    return { mime: "image/jpeg", data: b64(await blob.arrayBuffer()) };
  } catch { if (file.size > 15e6) throw new Error(`${file.name} ใหญ่เกิน 15MB`); return { mime: file.type || "image/jpeg", data: b64(await file.arrayBuffer()) }; }
}
const normCode = (c) => String(c ?? "").replace(/[๐-๙]/g, (d) => "๐๑๒๓๔๕๖๗๘๙".indexOf(d)).replace(/\s+/g, "").replace(/^([ก-ฮ])\.?/, "$1");
function matchCodes(list, valid) { const m = new Map(valid.map((i) => [normCode(i.code), i.code])); const ok = [], bad = []; (list ?? []).forEach((c) => { const v = m.get(normCode(c)); v ? ok.includes(v) || ok.push(v) : bad.push(String(c)); }); return { ok, bad }; }

// ---------- read teaching schedule from .docx (deterministic) ----------
const thToAr = (x) => String(x ?? "").replace(/[๐-๙]/g, (d) => "๐๑๒๓๔๕๖๗๘๙".indexOf(d));
async function docxBody(file) {
  const JSZip = globalThis.__JSZip ?? (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
  const z = await JSZip.loadAsync(await file.arrayBuffer()); const xml = await z.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("ไฟล์ .docx ไม่ถูกต้อง");
  const doc = new DOMParser().parseFromString(xml, "application/xml"), W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const txt = (el) => [...el.getElementsByTagNameNS(W, "t")].map((t) => t.textContent).join("").replace(/\s+/g, " ").trim();
  const body = doc.getElementsByTagNameNS(W, "body")[0], out = [];
  for (const ch of [...body.childNodes]) {
    if (ch.localName === "p") { const t = txt(ch); if (t) out.push({ p: t }); }
    else if (ch.localName === "tbl") {
      const last = []; const rows = [...ch.childNodes].filter((r) => r.localName === "tr").map((tr) => { const row = [];
        [...tr.childNodes].filter((c) => c.localName === "tc").forEach((tc) => {
          const pr = [...tc.childNodes].find((q) => q.localName === "tcPr"), gs = Number(pr && [...pr.childNodes].find((q) => q.localName === "gridSpan")?.getAttributeNS(W, "val")) || 1;
          const vm = pr && [...pr.childNodes].find((q) => q.localName === "vMerge"), cont = vm && vm.getAttributeNS(W, "val") !== "restart";
          let t = [...tc.childNodes].filter((q) => q.localName === "p").map(txt).filter(Boolean).join(" / ");
          const col = row.length; if (cont && !t) t = last[col] ?? ""; else if (vm) last[col] = t;
          for (let k = 0; k < gs; k++) row.push(t);
        }); return row; });
      out.push({ t: rows });
    }
  }
  return out;
}
const bodyText = (b) => b.map((x) => x.p ?? x.t.map((r) => r.join(" | ")).join("\n")).join("\n");
function parseSchedule(blocks, course) {
  const warn = []; const sums = [], hours = []; let head = { grade: null, sem: null };
  for (const b of blocks) {
    if (b.p) { const g = thToAr(b.p).match(/ชั้นประถมศึกษาปีที่\s*(\d)/), m = thToAr(b.p).match(/ภาคเรียนที่\s*(\d)/); if (g) head.grade = Number(g[1]); if (m) head.sem = Number(m[1]); continue; }
    const h = b.t[0]?.join(" ") ?? "";
    if (/หน่วยการเรียนรู้/.test(h) && /คะแนน/.test(h)) sums.push({ rows: b.t.slice(1), head: { ...head } });
    else if (/ชั่วโมงที่/.test(h) && /มาตรฐาน|ตัวชี้วัด/.test(h)) hours.push({ rows: b.t.slice(1), head: { ...head } });
  }
  if (!sums.length) return null;
  const rows = [], numOf = (x) => num(thToAr(x).replace(/[^\d.]/g, ""));
  sums.forEach((sm, si) => {
    const sem = si + 1, hr = hours[si];
    if (sm.head.sem && sm.head.sem !== sem) warn.push(`หัวกระดาษของตารางที่ ${si + 1} เขียน "ภาคเรียนที่ ${sm.head.sem}" แต่เป็นตารางลำดับที่ ${si + 1} จึงนับเป็นภาคเรียนที่ ${sem}`);
    if (sm.head.grade && course && sm.head.grade !== course.grade) warn.push(`หัวกระดาษตารางที่ ${si + 1} เขียนชั้น ป.${sm.head.grade} แต่รายวิชานี้คือ ป.${course.grade}`);
    if (!hr) warn.push(`ไม่พบตารางรายชั่วโมงของภาคเรียนที่ ${sem} ตัวชี้วัดรายแผนจะว่าง`);
    const hmap = (hr?.rows ?? []).map((r) => ({ title: r[1] ?? "", hours: numOf(r[2]) || 1, codes: String(r[3] ?? "").split(/[,;،\n]+/).map((x) => x.trim()).filter(Boolean), used: false }));
    const units = new Map(); let stated = null; const rowsBefore = rows.length;
    sm.rows.forEach((r) => {
      const a = r[0] ?? "", title = r[1] ?? "";
      if (/^รวม/.test(a) || /^รวม/.test(title)) { if (/สอนในชั้นเรียน/.test(a + title)) stated = { h: numOf(r[2]), s: numOf(r[3]) }; return; }
      if (/^สอบ/.test(a)) { rows.push({ kind: "exam", semester: sem, name: a.replace(/\s*\(.*$/, "").trim(), indicator_codes: [], hours: numOf(r[2]), score_weight: numOf(r[3]), plans: [] }); return; }
      const uname = a.replace(/^หน่วยที่\s*[\d๐-๙]+\s*[:/]?\s*/, "").replace(/^[:/\s]+/, "").trim() || a;
      if (!units.has(uname)) { const u = { kind: "unit", semester: sem, name: uname, indicator_codes: [], hours: 0, score_weight: 0, plans: [] }; units.set(uname, u); rows.push(u); }
      const u = units.get(uname), hm = hmap.find((x) => !x.used && x.title.replace(/\s+/g, "") === title.replace(/\s+/g, ""));
      if (hm) hm.used = true; else warn.push(`เรื่อง "${title}" (ภาค ${sem}) ไม่พบในตารางรายชั่วโมง`);
      const hrs = numOf(r[2]) || 1; u.hours += hrs; u.score_weight += numOf(r[3]);
      u.plans.push({ title, hours: hrs, codes: hm?.codes ?? [] });
    });
    hmap.filter((x) => !x.used).forEach((x) => warn.push(`รายชั่วโมง "${x.title}" (ภาค ${sem}) ไม่มีในตารางสรุปหน่วย`));
    const mine = rows.slice(rowsBefore).filter((x) => x.kind === "unit"), ah = mine.reduce((a, x) => a + x.hours, 0), as = mine.reduce((a, x) => a + x.score_weight, 0);
    if (stated && (stated.h !== ah || stated.s !== as)) warn.push(`ภาคเรียนที่ ${sem}: เอกสารเขียน "รวมสอนในชั้นเรียน" ${stated.h} ชั่วโมง ${stated.s} คะแนน แต่นับจากรายการจริงได้ ${ah} ชั่วโมง ${as} คะแนน (ระบบใช้ตัวเลขที่นับจริง)`);
  });
  rows.filter((r) => r.kind === "unit").forEach((u) => { u.codes_raw = [...new Set(u.plans.flatMap((p) => p.codes))]; });
  return { rows, warn };
}
function resolveSchedule(parsed, inds) {
  parsed.rows.forEach((r) => {
    if (r.kind !== "unit") { r.bad = []; return; }
    const bad = [];
    r.plans.forEach((p) => { const m = matchCodes(p.codes, inds); p.indicator_codes = m.ok; bad.push(...m.bad); });
    r.indicator_codes = [...new Set(r.plans.flatMap((p) => p.indicator_codes))]; r.bad = [...new Set(bad)];
  });
  return parsed;
}
function scheduleChecks(READ, course, inds) {
  const rows = READ.rows, items = [], units = rows.filter((r) => r.kind === "unit");
  const H = rows.reduce((a, r) => a + num(r.hours), 0), SC = rows.reduce((a, r) => a + num(r.score_weight), 0);
  items.push({ ok: H === course.total_hours, t: `ชั่วโมงรวม ${H} / ${course.total_hours} ตามรายวิชา`, fix: H !== course.total_hours ? "set-hours" : null });
  [1, 2].forEach((m) => { const h = rows.filter((r) => r.semester === m).reduce((a, r) => a + num(r.hours), 0); if (h) items.push({ ok: Math.abs(h - course.total_hours / 2) < 1, t: `ภาคเรียนที่ ${m}: ${h} ชั่วโมง (ควร ${course.total_hours / 2})` }); });
  items.push({ ok: SC === 100, t: `คะแนนรวม ${SC} / 100` });
  items.push({ ok: rows.filter((r) => r.kind === "exam").length >= (course.semester_count ?? 2), t: `แถวสอบปลายภาค ${rows.filter((r) => r.kind === "exam").length} / ${course.semester_count ?? 2} ภาคเรียน` });
  const used = new Set(units.flatMap((r) => r.indicator_codes)), miss = inds.filter((i) => !used.has(i.code));
  items.push({ ok: !miss.length, t: `ตัวชี้วัดของหลักสูตรที่กำหนดการครอบคลุม ${inds.length - miss.length} / ${inds.length}`, miss });
  const bad = units.flatMap((r) => r.bad ?? []); if (bad.length) items.push({ ok: false, t: `รหัสตัวชี้วัดที่ไม่มีในหลักสูตร (ไม่ถูกนำไปใช้): ${[...new Set(bad)].join(", ")}` });
  const noCode = units.flatMap((r) => r.plans.filter((p) => !(p.indicator_codes ?? []).length).map((p) => p.title)); if (noCode.length) items.push({ ok: false, t: `แผนที่ไม่มีตัวชี้วัด ${noCode.length} แผน: ${noCode.slice(0, 3).join(", ")}${noCode.length > 3 ? "..." : ""}` });
  READ.warn?.forEach((w) => items.push({ ok: false, warn: true, t: w }));
  return items;
}

// ---------- generic "ข้อมูลจากครู" input (text + files) ----------
const inBox = (id, ph = "พิมพ์ข้อมูลที่ครูให้มา เช่น ชื่อหัวข้อ เนื้อหาที่สอน ตัวชี้วัด หรือวางข้อความจากเอกสาร") => `<details class="card" style="padding:8px;margin:8px 0"><summary class="small"><b>📎 ข้อมูลจากครู</b> <span class="muted">ใส่แค่บางช่องก็ได้ ระบบวิเคราะห์เติมที่ขาดตามหลักสูตร</span></summary><textarea id="${id}T" rows="4" placeholder="${ph}"></textarea><label class="small">แนบไฟล์ (Word / PDF / รูป / .txt)<input type="file" id="${id}F" accept="image/*,application/pdf,.docx,.txt" multiple></label></details>`;
async function readIn(id) {
  let text = ($("#" + id + "T")?.value ?? "").trim(); const files = [];
  for (const f of [...($("#" + id + "F")?.files ?? [])]) {
    if (/\.docx$/i.test(f.name)) text += `\n--- ${f.name} ---\n` + bodyText(await docxBody(f));
    else if (/\.txt$/i.test(f.name) || f.type === "text/plain") text += `\n--- ${f.name} ---\n` + (await f.text());
    else files.push(await fileToPart(f));
  }
  return { text: text.trim(), files: files.length ? files : undefined, has: !!(text.trim() || files.length) };
}
let READ = null;

// =====================================================================
// TAB 1 — school curriculum structure
// =====================================================================
const T1 = { subject: 5, curriculum: "2551r60", grade: 5, ind: null, std: null, total: 80, week: 2 };
const optList = (arr, val, label) => arr.map((o) => `<option value="${esc(o[val])}">${esc(o[label])}</option>`).join("");

function render1() {
  const el = $("#t1");
  el.innerHTML = `
  <div class="card accent">
    <h2>0 · โครงสร้างหลักสูตรสถานศึกษา</h2>
    <p class="muted">เลือกวิชา ชั้น และหลักสูตร ระบบจะดึงมาตรฐานและตัวชี้วัดจริงจากฐานข้อมูลหลักสูตร (ไม่ให้ AI เดา)</p>
    <div class="grid">
      <label>กลุ่มสาระ/วิชา<select id="t1s">${optList(S.subjects, "id", "name")}</select></label>
      <label>หลักสูตร<select id="t1c">${S.curricula.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label>
      <label>ชั้น<select id="t1g">${[1, 2, 3, 4, 5, 6].map((g) => `<option value="${g}">ป.${g}</option>`).join("")}</select></label>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="t1-load">ดึงมาตรฐานและตัวชี้วัด</button></div>
  </div>
  <div id="t1prev"></div>
  <details class="card"><summary><b>นำเข้าตัวชี้วัดเอง</b> <span class="muted small">— สำหรับวิชา/ชั้น/หลักสูตรที่ยังไม่มีในระบบ</span></summary>
    <p class="muted small">คัดลอกตัวชี้วัดจากเอกสารหลักสูตรทางการหรือเอกสารของโรงเรียน (เลือกวิชา หลักสูตร ชั้น ด้านบนก่อน) มาวาง ระบบอ่านบรรทัดรูปแบบ "มาตรฐาน พ 1.1 ..." และ "ป.5/1 ..." ให้ แล้วให้ตรวจก่อนบันทึก</p>
    <div class="row" style="margin-bottom:6px"><input type="file" id="impFile" accept="image/*,application/pdf,.docx,.txt"><button class="btn small" data-act="imp-file">อ่านไฟล์ใส่ช่อง</button></div>
    <textarea id="impText" rows="8" placeholder="มาตรฐาน ท 1.1 ใช้กระบวนการอ่าน...&#10;ป.5/1 อ่านออกเสียงบทร้อยแก้ว..."></textarea>
    <label style="flex-direction:row;gap:6px;color:var(--text);margin-top:6px"><input type="checkbox" id="impAll" checked> อ่านทุกชั้น ป.1–6 ในครั้งเดียว (ไม่ติ๊ก = เฉพาะชั้นที่เลือก) และอ่านบรรทัด "สาระที่ ..." เป็นชื่อสาระ</label>
    <div class="row" style="margin-top:8px"><button class="btn" data-act="imp-parse">แปลงและตรวจ</button><button class="btn primary" data-act="imp-save">บันทึกลงระบบ</button></div><div id="impPrev" class="small" style="margin-top:8px"></div></details>
  <div class="card"><h3>โครงสร้างหลักสูตรที่บันทึกไว้</h3><div id="t1list" class="list"></div></div>`;
  $("#t1s").value = T1.subject; $("#t1c").value = T1.curriculum; $("#t1g").value = T1.grade;
  ["t1s", "t1c", "t1g"].forEach((id) => $("#" + id).addEventListener("change", () => {
    T1.subject = Number($("#t1s").value); T1.curriculum = $("#t1c").value; T1.grade = Number($("#t1g").value); T1.ind = null; $("#t1prev").innerHTML = "";
  }));
  renderT1Prev(); renderT1List();
}
function renderT1List() {
  $("#t1list").innerHTML = S.curStructs.length ? S.curStructs.map((c) => `
    <div class="item ${S.cs?.id === c.id ? "sel" : ""}">
      <div><div class="t">${esc(c.title)}</div><div class="muted small">${esc(subjName(c.subject_id))} · ป.${c.grade} · ${esc(c.curriculum_id)} · ${c.content?.indicators?.length ?? 0} ตัวชี้วัด · ${c.content?.time?.total_hours ?? "-"} ชม.</div></div>
      <div class="row"><button class="btn small primary" data-act="t1-use" data-id="${c.id}">ใช้ต่อ → แถบ 3</button><button class="btn small danger" data-act="t1-del" data-id="${c.id}">ลบ</button></div>
    </div>`).join("") : '<div class="muted">ยังไม่มี</div>';
}
function renderT1Prev() {
  const box = $("#t1prev"); if (!box || !T1.ind) return;
  if (!T1.ind.length) {
    box.innerHTML = `<div class="card"><b>ยังไม่มีข้อมูลตัวชี้วัดของ ${esc(subjName(T1.subject))} ป.${T1.grade} (${esc(T1.curriculum)}) ในระบบ</b>
      <p class="muted">ต้องนำเข้าก่อนจึงจะสร้างโครงสร้างได้ ใช้ช่อง “นำเข้าตัวชี้วัดเอง” ด้านล่าง (วางข้อความจากเอกสารหลักสูตร) ตอนนี้มีข้อมูลสำเร็จรูปเฉพาะสุขศึกษาและพลศึกษา ป.1-6 หลักสูตร 2551 ปรับปรุง 2560</p></div>`;
    return;
  }
  const by = {}; T1.ind.forEach((i) => (by[i.standard_code] ??= []).push(i));
  const title = `โครงสร้างหลักสูตร ${subjName(T1.subject)} ป.${T1.grade}`;
  box.innerHTML = `<div class="card">
    <h3>มาตรฐานและตัวชี้วัด (${T1.ind.length} ตัวชี้วัด)</h3>
    ${Object.entries(by).map(([sc, list]) => `<details class="sec" open><summary>มาตรฐาน ${esc(sc)} ${esc(T1.std[sc]?.description ?? "")}</summary><div class="body">
      <div class="tablewrap"><table><tr><th style="width:130px">รหัส</th><th>ตัวชี้วัด</th><th style="width:110px">ประเภท</th></tr>
      ${list.map((i) => `<tr><td>${esc(i.code)}</td><td>${esc(i.description)}</td><td>${esc(i.kind ?? "")}</td></tr>`).join("")}</table></div></div></details>`).join("")}
  </div>
  <div class="card accent">
    <h3>โครงสร้างเวลาเรียน</h3>
    <div class="grid">
      <label>ชื่อโครงสร้าง<input id="t1title" value="${esc(title)}"></label>
      <label>เวลาเรียนรวมทั้งปี (ชั่วโมง)<input id="t1total" type="number" min="1" value="${T1.total}"></label>
      <label>ชั่วโมงต่อสัปดาห์<input id="t1week" type="number" min="0.5" step="0.5" value="${T1.week}"></label>
      <label>ชื่อโรงเรียน<input id="t1school" value="${esc(S.settings?.school_name ?? "")}"></label>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn accent" data-act="t1-save">บันทึกโครงสร้างหลักสูตร</button></div>
  </div>`;
}

// =====================================================================
// TAB 2 — course structure
// =====================================================================
function render2() {
  const el = $("#t2");
  const csOpts = S.curStructs.map((c) => `<option value="${c.id}">${esc(c.title)} (ป.${c.grade})</option>`).join("");
  el.innerHTML = `
  <div class="card accent">
    <h2>3 · โครงสร้างรายวิชา</h2>
    <p class="muted">ดึงตัวชี้วัดจากโครงสร้างหลักสูตรในแถบ 0 แล้วกำหนดหน่วย เวลา และน้ำหนักคะแนน</p>
    ${S.curStructs.length ? `<div class="grid">
      <label>โครงสร้างหลักสูตรต้นทาง<select id="t2cs">${csOpts}</select></label>
      <label>รหัสวิชา<input id="t2code" placeholder="เช่น พ15101"></label>
      <label>ชื่อรายวิชา<input id="t2name" placeholder="เช่น สุขศึกษาและพลศึกษา"></label>
      <label>เวลาเรียนรวม (ชั่วโมง)<input id="t2hours" type="number" min="1"></label>
      <label>จำนวนภาคเรียน<select id="t2sem"><option>2</option><option>1</option></select></label>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="t2-create">สร้างโครงสร้างรายวิชา</button></div>` : `<p>ต้องสร้างโครงสร้างหลักสูตรในแถบ 0 ก่อน</p><button class="btn" data-act="goto" data-tab="t1">ไปแถบ 0</button>`}
  </div>
  <div class="card"><h3>รายวิชาที่สร้างไว้</h3><div class="list">${S.courses.map((c) => `
    <div class="item ${S.course?.id === c.id ? "sel" : ""}"><div><div class="t">${esc(c.course_code ?? "")} ${esc(c.course_name)}</div>
      <div class="muted small">${esc(subjName(c.subject_id))} · ป.${c.grade} · ${c.total_hours} ชม.</div></div>
      <div class="row"><button class="btn small primary" data-act="t2-open" data-id="${c.id}">เปิดแก้ไข</button><button class="btn small danger" data-act="t2-del" data-id="${c.id}">ลบ</button></div></div>`).join("") || '<div class="muted">ยังไม่มี</div>'}</div></div>
  <div id="t2edit"></div>`;
  const cs = $("#t2cs"); if (cs) {
    if (S.cs) cs.value = S.cs.id;
    const fill = () => {
      const c = S.curStructs.find((x) => x.id === cs.value); if (!c) return;
      $("#t2hours").value = c.content?.time?.total_hours ?? 80;
      $("#t2name").value ||= subjName(c.subject_id);
    }; cs.addEventListener("change", fill); fill();
  }
  renderT2Edit();
}
function readPreview() {
  const r = READ, checks = r.checks ?? [], np = r.rows.reduce((a, x) => a + (x.plans?.length ?? 0), 0);
  const miss = checks.find((c) => c.miss)?.miss ?? [];
  return `<div class="card" style="padding:10px"><b>ผลตรวจกับหลักสูตร</b>${checks.map((c) => `<div class="small" style="margin:3px 0;color:${c.ok ? "var(--text)" : c.warn ? "#8a6100" : "#c62828"}">${c.ok ? "✅" : c.warn ? "⚠️" : "❌"} ${esc(c.t)}${c.fix === "set-hours" ? ` <button class="btn small" data-act="read-sethours">ปรับชั่วโมงรายวิชาเป็นตามกำหนดการ</button>` : ""}</div>`).join("")}
  ${miss.length ? `<details open style="margin-top:6px"><summary class="small"><b>ตัวชี้วัดที่ยังไม่มีในกำหนดการ (${miss.length})</b></summary>${miss.map((i) => `<div class="small">• ${esc(i.code)} ${esc(i.description)} <span class="muted">(${esc(i.kind ?? "")})</span></div>`).join("")}<div class="row" style="margin-top:6px"><button class="btn small accent" data-act="read-fill">ให้ AI เสนอแผนเสริมให้ตัวชี้วัดที่ขาด</button></div></details>` : ""}</div>
  ${r.notes ? `<p class="small">📝 ${esc(r.notes)}</p>` : ""}
  <div class="tablewrap"><table><tr><th>#</th><th>ภาค</th><th>หน่วย/สอบ</th><th>ตัวชี้วัด</th><th>ชม.</th><th>คะแนน</th>${r.withPlans ? "<th>หัวข้อแผน</th>" : ""}</tr>${r.rows.map((x, i) => `<tr><td>${i + 1}</td><td>${x.semester ?? ""}</td><td>${esc(x.name)}${x.kind === "exam" ? " (สอบ)" : ""}</td><td class="small">${x.indicator_codes.map(esc).join("<br>")}${x.bad?.length ? `<br><span style="color:#c62828">ไม่พบ: ${x.bad.map(esc).join(", ")}</span>` : ""}</td><td>${x.hours}</td><td>${x.score_weight}</td>${r.withPlans ? `<td class="small">${(x.plans ?? []).map((p, k) => `${k + 1}. ${esc(p.title)} (${p.hours} ชม.)${p.extra ? " ✚เสริม" : ""}${(p.indicator_codes ?? []).length ? `<br><span class="muted">${p.indicator_codes.map(esc).join(", ")}</span>` : ""}`).join("<br>")}</td>` : ""}</tr>`).join("")}</table></div>
  <p class="small">${r.rows.filter((x) => x.kind === "unit").length} หน่วย${r.withPlans ? ` · ${np} หัวข้อแผน` : ""} — ตรวจแล้วกดใช้ (แก้ไขรายละเอียดต่อได้ที่แถบ 3–5)</p>
  <div class="row"><button class="btn primary" data-act="read-apply">ใช้โครงสร้างนี้</button><button class="btn" data-act="read-clear">ทิ้ง</button></div>`;
}
async function renderT2Edit() {
  const box = $("#t2edit"); if (!box || !S.course) { if (box) box.innerHTML = ""; return; }
  const inds = await courseIndicators();
  const total = S.course.total_hours;
  const units = S.rows.filter((r) => r.kind === "unit");
  const uh = sum(S.rows.map((r) => num(r.hours))), uw = sum(S.rows.map((r) => num(r.score_weight)));
  const used = new Set(S.rows.flatMap((r) => r.indicator_codes));
  const missing = inds.filter((i) => !used.has(i.code));
  const stat = (id, label, val, ok) => `<div class="stat ${ok ? "ok" : "bad"}" id="${id}"><span class="muted small">${label}</span><b>${val}</b></div>`;
  box.innerHTML = `${inBox("st", "ข้อมูลที่ครูให้มา เช่น ชื่อหน่วยที่ต้องการ ลำดับ ชั่วโมงบางหน่วย (ใส่บางส่วนก็ได้ ปุ่ม 'ให้ AI ร่างหน่วย' จะใช้ข้อมูลนี้)")}<details class="card" data-dk2="read" ${READ ? "open" : ""}><summary><b>📷 อ่านโครงสร้างจากภาพ/ไฟล์</b> <span class="muted small">— มีโครงสร้างรายวิชา กำหนดการสอน หรือตารางสอนอยู่แล้ว ถ่ายรูปหรือแนบ PDF ให้ AI ถอดให้</span></summary>
    <p class="muted small">แนบได้หลายไฟล์ (สูงสุด 10): รูปภาพ PDF หรือไฟล์ Word (.docx) ของกำหนดการสอน ไฟล์ Word ที่เป็นตารางอ่านแบบตรงตัวไม่ต้องใช้ AI และไม่กินโควตา ระบบจับคู่ตัวชี้วัดกับรหัสจริงในฐานข้อมูลเท่านั้น</p>
    <input type="file" id="readFiles" accept="image/*,application/pdf,.docx" multiple>
    <label style="flex-direction:row;gap:6px;color:var(--text);margin-top:6px"><input type="checkbox" id="readPlans" checked> สร้างหน่วยการเรียนรู้และหัวข้อแผนรายคาบให้ด้วย (ไปเขียนแผนต่อได้เลย)</label>
    <div class="row" style="margin-top:8px"><button class="btn primary" data-act="read-run">ให้ AI อ่าน</button></div><div id="readOut" style="margin-top:8px">${READ ? readPreview() : ""}</div></details>
  <div class="card accent">
    <div class="row spread"><h3>${esc(S.course.course_code ?? "")} ${esc(S.course.course_name)} — ${total} ชั่วโมง</h3>
    <div class="row"><button class="btn small accent" data-act="t2-ai">ให้ AI ร่างหน่วย</button><button class="btn small" data-act="t2-add">+ เพิ่มหน่วย</button><button class="btn small" data-act="t2-addexam">+ เพิ่มสอบ</button></div></div>
    <div class="check">${stat("stH", "ชั่วโมงรวม", `${uh}/${total}`, uh === total)}${stat("stW", "คะแนนรวม", `${uw}/100`, uw === 100)}${stat("stM", "ตัวชี้วัดที่ยังไม่ถูกใช้", missing.length, missing.length === 0)}</div>
    ${missing.length ? `<div class="muted small">ยังไม่ถูกใช้: ${missing.map((i) => esc(i.code)).join(", ")}</div>` : ""}
    <div class="tablewrap"><table><tr><th>#</th><th>ภาค</th><th>ประเภท</th><th>ชื่อหน่วย</th><th>ตัวชี้วัด</th><th>ชม.</th><th>คะแนน</th><th></th></tr>
    ${S.rows.map((r, i) => `<tr>
      <td>${i + 1}</td>
      <td class="num"><input data-row="${i}" data-f="semester" type="number" min="1" max="2" value="${r.semester ?? ""}"></td>
      <td><select data-row="${i}" data-f="kind"><option value="unit" ${r.kind === "unit" ? "selected" : ""}>หน่วย</option><option value="exam" ${r.kind === "exam" ? "selected" : ""}>สอบ</option></select></td>
      <td><input data-row="${i}" data-f="name" value="${esc(r.name)}"></td>
      <td>${r.kind === "unit" ? `<div class="chips">${r.indicator_codes.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div><button class="btn small" data-act="t2-ind" data-row="${i}">เลือก (${r.indicator_codes.length})</button>` : ""}</td>
      <td class="num"><input data-row="${i}" data-f="hours" type="number" min="0" value="${r.hours}"></td>
      <td class="num"><input data-row="${i}" data-f="score_weight" type="number" min="0" value="${r.score_weight}"></td>
      <td><div class="row"><button class="btn small" data-act="t2-up" data-row="${i}">↑</button><button class="btn small" data-act="t2-down" data-row="${i}">↓</button><button class="btn small danger" data-act="t2-rm" data-row="${i}">✕</button></div></td></tr>`).join("")}
    </table></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="t2-save">บันทึกโครงสร้างรายวิชา</button><button class="btn" data-act="goto" data-tab="t3">ไปแถบ 4 →</button></div>
  </div>`;
}

// =====================================================================
// TAB 3 — units
// =====================================================================
async function render3() {
  const el = $("#t3");
  const opts = S.courses.map((c) => `<option value="${c.id}">${esc(c.course_code ?? "")} ${esc(c.course_name)} ป.${c.grade}</option>`).join("");
  el.innerHTML = `<div class="card accent"><h2>4 · หน่วยการเรียนรู้</h2>
    <p class="muted">สร้างจากโครงสร้างรายวิชา กี่หน่วยก็ได้ (แยกหรือเพิ่มหน่วยเองได้) ชั่วโมงรวมต้องไม่เกินชั่วโมงของรายวิชา</p>
    ${S.courses.length ? `<div class="row"><label style="flex:1">รายวิชา<select id="t3c">${opts}</select></label></div>` : `<p>ต้องสร้างโครงสร้างรายวิชาในแถบ 3 ก่อน</p><button class="btn" data-act="goto" data-tab="t2">ไปแถบ 3</button>`}</div>
    <div id="t3body"></div>`;
  const sel = $("#t3c"); if (!sel) return;
  if (S.course) sel.value = S.course.id; else { S.course = S.courses[0]; await loadRows(); await loadUnits(); sel.value = S.course.id; }
  sel.addEventListener("change", async () => { S.course = S.courses.find((c) => c.id === sel.value); S.unit = null; await loadRows(); await loadUnits(); saveSel(); renderT3Body(); $("#crumb").textContent = `${subjName(S.course.subject_id)} ป.${S.course.grade} · ${S.course.curriculum_id}`; });
  renderT3Body();
}
async function renderT3Body() {
  const box = $("#t3body"); if (!box || !S.course) return;
  const inds = await courseIndicators();
  const total = S.course.total_hours, uh = sum(S.units.map((u) => num(u.hours)));
  const canImport = !S.units.length && S.rows.some((r) => r.kind === "unit");
  box.innerHTML = `${inBox("un", "ข้อมูลเกี่ยวกับหน่วย เช่น เนื้อหาหลักของแต่ละหน่วย แนวทางที่ครูต้องการ (ใส่บางหน่วยก็ได้)")}<div class="row" style="margin-bottom:8px"><button class="btn small accent" data-act="t3-fill-all">🔍 วิเคราะห์และเติมสาระสำคัญทุกหน่วยที่ว่าง</button></div><div class="card">
    <div class="row spread"><div class="check"><div class="stat ${uh === total ? "ok" : ""}"><span class="muted small">ชั่วโมงหน่วยรวม</span><b>${uh}/${total}</b></div><div class="stat"><span class="muted small">จำนวนหน่วย</span><b>${S.units.length}</b></div></div>
    <div class="row">${canImport ? '<button class="btn primary" data-act="t3-import">สร้างหน่วยจากโครงสร้างรายวิชา</button>' : ""}<button class="btn" data-act="t3-add">+ เพิ่มหน่วย</button></div></div>
    <div class="list">${S.units.map((u, i) => `
      <details class="sec" ${S.unit?.id === u.id ? "open" : ""}><summary>หน่วยที่ ${u.seq} ${esc(u.name)} · ${u.hours} ชม. · ภาค ${u.semester ?? "-"}</summary><div class="body">
        <div class="grid">
          <label>ชื่อหน่วย<input data-u="${i}" data-f="name" value="${esc(u.name)}"></label>
          <label>ภาคเรียน<input data-u="${i}" data-f="semester" type="number" min="1" max="2" value="${u.semester ?? ""}"></label>
          <label>ชั่วโมง<input data-u="${i}" data-f="hours" type="number" min="1" value="${u.hours}"></label>
          <label>น้ำหนักคะแนน<input data-u="${i}" data-f="score_weight" type="number" min="0" value="${u.score_weight}"></label>
        </div>
        <label>สาระสำคัญ/ความคิดรวบยอด<textarea data-u="${i}" data-f="key_concept">${esc(u.key_concept ?? "")}</textarea></label>
        <div><div class="chips">${u.indicator_codes.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}</div></div>
        <div class="row"><button class="btn small" data-act="t3-ind" data-u="${i}">เลือกตัวชี้วัด (${u.indicator_codes.length})</button><button class="btn small accent" data-act="t3-ai" data-u="${i}">ให้ AI ร่างสาระสำคัญ</button><button class="btn small primary" data-act="t3-save" data-u="${i}">บันทึกหน่วยนี้</button><button class="btn small" data-act="t3-plans" data-u="${i}">ไปแผนรายคาบ →</button><button class="btn small danger" data-act="t3-del" data-u="${i}">ลบ</button></div>
      </div></details>`).join("") || '<div class="muted">ยังไม่มีหน่วย</div>'}</div>`;
}

// =====================================================================
// TAB 4 — lesson plans
// =====================================================================
const planDone = (p) => !!String(p.sections?.key_idea ?? "").trim();
async function render4() {
  const el = $("#t4");
  if (!S.units.length) { el.innerHTML = `<div class="card accent"><h2>5 · หัวข้อแผนรายคาบ (ร่างเรื่องคร่าวๆ ก่อน)</h2><p>ต้องมีหน่วยการเรียนรู้ในแถบ 4 ก่อน</p><button class="btn" data-act="goto" data-tab="t3">ไปแถบ 4</button></div>`; return; }
  let view = "table"; try { view = localStorage.getItem("lp_view") || "table"; } catch {}
  const unitOpts = S.units.map((u) => `<option value="${u.id}">หน่วยที่ ${u.seq} ${esc(u.name)} (${u.hours} ชม.)</option>`).join("");
  const ph = sum(S.plans.map((p) => num(p.hours)));
  const stCls = (p) => (p.status === "reviewed" ? "ตรวจแล้ว" : planDone(p) ? "ร่างแล้ว" : "ว่าง");
  const tableHtml = `<div class="tablewrap"><table><tr><th>#</th><th>เรื่อง</th><th>ชม.</th><th>ตัวชี้วัด</th><th>วันที่สอน</th><th>สถานะ</th><th></th></tr>
    ${S.plans.map((p, i) => `<tr class="${S.plan?.id === p.id ? "sel" : ""}">
      <td>${p.seq}</td>
      <td><input data-pid="${p.id}" data-pf="title" value="${esc(p.title)}" style="min-width:180px"></td>
      <td><input data-pid="${p.id}" data-pf="hours" type="number" min="1" value="${p.hours}" style="width:64px"></td>
      <td><div class="chips">${p.indicator_codes.map((c) => `<span class="chip" title="${esc(c)}">${esc(c.replace(/^\S+\s/, ""))} <a href="#" data-act="t4-ind-rm" data-id="${p.id}" data-code="${esc(c)}" style="text-decoration:none;color:var(--red)">×</a></span>`).join("")}<button class="btn small" data-act="t4-ind-edit" data-id="${p.id}" title="เพิ่ม/ลดตัวชี้วัด">＋/－</button></div>${p.indicator_codes.length ? "" : '<div class="small" style="color:var(--red)">ยังไม่มีตัวชี้วัด</div>'}</td>
      <td><input data-pid="${p.id}" data-pf="planned_date" type="date" value="${p.planned_date ?? ""}"></td>
      <td><select data-pid="${p.id}" data-pf="status"><option value="draft" ${p.status !== "reviewed" ? "selected" : ""}>${planDone(p) ? "ร่างแล้ว" : "ว่าง/ร่าง"}</option><option value="reviewed" ${p.status === "reviewed" ? "selected" : ""}>ตรวจแล้ว</option></select></td>
      <td style="white-space:nowrap"><button class="btn small" data-act="t4-up" data-id="${p.id}" ${i === 0 ? "disabled" : ""}>↑</button> <button class="btn small" data-act="t4-down" data-id="${p.id}" ${i === S.plans.length - 1 ? "disabled" : ""}>↓</button> <button class="btn small primary" data-act="t4-pick" data-id="${p.id}">เขียนแผน →</button> <button class="btn small" data-act="t4-copy" data-id="${p.id}">คัดลอก</button> <button class="btn small danger" data-act="t4-del-id" data-id="${p.id}">ลบ</button></td></tr>`).join("") || '<tr><td colspan="7" class="muted">ยังไม่มีแผน</td></tr>'}
    <tr><td></td><td><b>รวม</b></td><td><b>${ph}/${S.unit.hours}</b></td><td colspan="4"></td></tr></table></div>`;
  const listHtml = `<div class="list">${S.plans.map((p) => `<details class="item" style="display:block"><summary style="cursor:pointer"><b>แผนที่ ${p.seq}</b> ${esc(p.title)} <span class="muted small">· ${p.hours} ชม. · ${stCls(p)}${p.planned_date ? " · " + p.planned_date : ""}</span></summary>
      <div class="small" style="margin-top:8px"><div class="chips">${p.indicator_codes.map((c) => `<span class="chip">${esc(c)}</span>`).join("")}<button class="btn small" data-act="t4-ind-edit" data-id="${p.id}">＋/－ ตัวชี้วัด</button></div>
      <p><b>สาระสำคัญ:</b> ${esc(p.sections?.key_idea || "-")}</p><p><b>จุดประสงค์:</b> ${esc([p.sections?.objectives?.K, p.sections?.objectives?.P, p.sections?.objectives?.A].filter(Boolean).join(" | ") || "-")}</p>
      <div class="row"><button class="btn small primary" data-act="t4-pick" data-id="${p.id}">เขียนแผน →</button> <button class="btn small" data-act="t4-copy" data-id="${p.id}">คัดลอก</button> <button class="btn small danger" data-act="t4-del-id" data-id="${p.id}">ลบ</button></div></div></details>`).join("") || '<div class="muted">ยังไม่มีแผน</div>'}</div>`;
  el.innerHTML = `<div class="card accent"><h2>5 · หัวข้อแผนรายคาบ (ร่างเรื่องคร่าวๆ ก่อน)</h2>
    <div class="row"><label style="flex:1">หน่วยการเรียนรู้<select id="t4u">${unitOpts}</select></label></div>
    <div class="check"><div class="stat ${ph === S.unit.hours ? "ok" : "bad"}"><span class="muted small">ชั่วโมงแผนรวม</span><b>${ph}/${S.unit.hours}</b></div><div class="stat"><span class="muted small">จำนวนแผน</span><b>${S.plans.length}</b></div><div class="stat"><span class="muted small">ร่างแล้ว</span><b>${S.plans.filter(planDone).length}/${S.plans.length}</b></div></div>
    ${inBox("ti", "พิมพ์รายการหัวข้อ/เรื่องที่ครูจะสอนในหน่วยนี้ (บรรทัดละเรื่อง) หรือแนบกำหนดการ ระบบจะคงหัวข้อของครูไว้ เติมที่ขาดให้ครบชั่วโมงและตัวชี้วัด")}<div class="row" style="margin-top:10px"><button class="btn small primary" data-act="t4-add">+ เพิ่มหัวข้อ</button><button class="btn small accent" data-act="t4-ai-titles">✨ AI วางหัวข้อทั้งหน่วย (ใช้ข้อมูลจากครูด้านล่างถ้ามี)</button><button class="btn small" data-act="t4-check">ตรวจความครบถ้วน</button><button class="btn small" data-act="t4-export-unit">ส่งออก Word ทั้งหน่วย</button></div></div>
    <div class="card"><div class="row spread"><h3>แผนในหน่วยนี้</h3><div class="row"><button class="btn small ${view === "table" ? "primary" : ""}" data-act="t4-view" data-v="table">ตาราง</button><button class="btn small ${view === "list" ? "primary" : ""}" data-act="t4-view" data-v="list">รายการ</button></div></div>
      <div style="margin-top:8px">${view === "table" ? tableHtml : listHtml}</div></div>
`;
  $("#t4u").value = S.unit.id;
  $("#t4u").addEventListener("change", async (e) => { S.unit = S.units.find((u) => u.id === e.target.value); S.plan = null; await loadPlans(); saveSel(); render4(); });
}
async function render5() {
  const el = $("#t5");
  if (!S.units.length) { el.innerHTML = `<div class="card accent"><h2>6 · เขียนแผนรายคาบ</h2><p>ต้องมีหน่วยการเรียนรู้ในแถบ 4 ก่อน</p><button class="btn" data-act="goto" data-tab="t3">ไปแถบ 4</button></div>`; return; }
  const unitOpts = S.units.map((u) => `<option value="${u.id}">หน่วยที่ ${u.seq} ${esc(u.name)} (${u.hours} ชม.)</option>`).join("");
  const idx = S.plans.findIndex((p) => p.id === S.plan?.id);
  el.innerHTML = `<div class="card accent"><h2>6 · เขียนแผนรายคาบ <span class="muted small">— ทีละแผน ทีละหน่วย</span></h2>
    <div class="grid"><label>หน่วยการเรียนรู้<select id="t5u">${unitOpts}</select></label>
    <label>แผน (หัวข้อจากแถบ 5)<select id="t5p">${S.plans.map((p) => `<option value="${p.id}">แผนที่ ${p.seq} ${planDone(p) ? "✓ " : ""}${esc(p.title)}</option>`).join("")}</select></label></div>
    ${S.plans.length ? `<div class="row" style="margin-top:10px"><button class="btn small" data-act="t5-prev" ${idx <= 0 ? "disabled" : ""}>← แผนก่อนหน้า</button><span class="muted small">แผนที่ ${idx + 1}/${S.plans.length} · เขียนแล้ว ${S.plans.filter(planDone).length}</span><button class="btn small" data-act="t5-next" ${idx >= S.plans.length - 1 ? "disabled" : ""}>แผนถัดไป →</button></div>` : `<p class="muted">ยังไม่มีหัวข้อแผนในหน่วยนี้ ไปสร้างหัวข้อที่แถบ 5 ก่อน</p><button class="btn" data-act="goto" data-tab="t4">ไปแถบ 5</button>`}</div>
    <div id="t4edit"></div>`;
  $("#t5u").value = S.unit.id; if (S.plan) $("#t5p").value = S.plan.id;
  $("#t5u").addEventListener("change", async (e) => { await autosavePlan(); S.unit = S.units.find((u) => u.id === e.target.value); S.plan = null; await loadPlans(); saveSel(); render5(); });
  $("#t5p").addEventListener("change", async (e) => { await autosavePlan(); S.plan = S.plans.find((p) => p.id === e.target.value); render5(); });
  renderPlanEditor();
}
async function render6() {
  const el = $("#t6");
  if (!S.plans.length || !S.plan) { el.innerHTML = `<div class="card accent"><h2>7 · พรีวิวแผน</h2><p>ยังไม่มีแผนให้ดู สร้างหัวข้อที่แถบ 5 แล้วเขียนที่แถบ 6 ก่อน</p><button class="btn" data-act="goto" data-tab="t4">ไปแถบ 5</button></div>`; return; }
  const idx = S.plans.findIndex((p) => p.id === S.plan.id);
  const ctx = await exportCtx();
  const { planPreviewHtml } = await import("./preview.js");
  el.innerHTML = `<div class="card accent"><h2>7 · พรีวิวแผน <span class="muted small">— หน้าตาตามแผนต้นฉบับ 12 หัวข้อ</span></h2>
    <div class="row"><label style="flex:1">แผน<select id="t6p">${S.plans.map((p) => `<option value="${p.id}">แผนที่ ${p.seq} ${planDone(p) ? "✓ " : ""}${esc(p.title)}</option>`).join("")}</select></label></div>
    <div class="row" style="margin-top:10px"><button class="btn small" data-act="t6-prev" ${idx <= 0 ? "disabled" : ""}>← ก่อนหน้า</button><button class="btn small" data-act="t6-next" ${idx >= S.plans.length - 1 ? "disabled" : ""}>ถัดไป →</button><button class="btn small primary" data-act="t6-edit">แก้ไขแผนนี้</button><button class="btn small accent" data-act="t4-export">ส่งออก Word</button></div></div>
    ${planPreviewHtml(ctx, S.plan)}`;
  $("#t6p").value = S.plan.id;
  $("#t6p").addEventListener("change", (e) => { S.plan = S.plans.find((p) => p.id === e.target.value); render6(); });
}
async function autosavePlan() { try { if (S.plan && $("#pTitle")) { collectPlan(); await savePlan(); } } catch (e) { toast("บันทึกอัตโนมัติไม่สำเร็จ: " + e.message, "err"); } }
async function stepPlan(d) { await autosavePlan(); const i = S.plans.findIndex((p) => p.id === S.plan?.id) + d; if (S.plans[i]) { S.plan = S.plans[i]; await render5(); window.scrollTo?.(0, 0); } }
async function renderPlanEditor() {
  const box = $("#t4edit"); if (!box) return;
  if (!S.plan) { box.innerHTML = '<div class="card muted">เลือกหรือเพิ่มแผนทางซ้าย</div>'; return; }
  const p = S.plan, sec = { ...emptySections(), ...p.sections };
  p.sections = sec;
  const allInds = await courseIndicators();
  const sel = allInds.filter((i) => p.indicator_codes.includes(i.code));
  const AIF = ["objectives.K", "objectives.P", "objectives.A", "content", "key_idea", "media", "process.0", "process.1", "process.2", "process.3", "process.4"];
  const ta = (path, label, rows = 3) => `<label>${label}<textarea data-p="${path}" rows="${rows}">${esc(path.split(".").reduce((o, k) => o?.[k], sec) ?? "")}</textarea></label>${AIF.includes(path) ? `<button type="button" class="btn small" data-act="t4-ai-field" data-path="${path}" data-label="${esc(label)}">✨ AI เขียนหัวข้อนี้ใหม่</button>` : ""}${path.startsWith("process.") ? `<button type="button" class="btn small" data-act="t5-qa" data-path="${path}">＋ ครูถาม/นักเรียนตอบ</button>` : ""}`;
  const inp = (path, label) => `<label>${label}<input data-p="${path}" value="${esc(path.split(".").reduce((o, k) => o?.[k], sec) ?? "")}"></label>`;
  const chk = (path, list) => list.map((t, i) => `<label style="flex-direction:row;gap:8px;align-items:flex-start;color:var(--text)"><input type="checkbox" data-pc="${path}" value="${esc(t)}" ${(path.split(".").reduce((o, k) => o?.[k], sec) ?? []).includes(t) ? "checked" : ""}> ${esc(t)}</label>`).join("");
  box.innerHTML = `<div class="card accent">
    <div class="row spread"><h3>แผนที่ ${p.seq}</h3><div class="row">
      <button class="btn small accent" data-act="t4-ai">ให้ AI ร่างแผนนี้</button>
      <button class="btn small" data-act="t4-preview">ดูพรีวิว</button>
      <button class="btn small" data-act="t4-export">ส่งออก Word</button>
      <button class="btn small danger" data-act="t4-del">ลบ</button></div></div>
    ${inBox("pl", "พิมพ์สิ่งที่ครูมี เช่น จุดประสงค์ กิจกรรมที่จะสอน สื่อที่ใช้ หรือวางแผนเดิม/เนื้อหา (ใส่บางช่องก็ได้)")}
    <div class="row"><button class="btn small primary" data-act="t5-fill">🔍 วิเคราะห์ข้อมูลจากครูแล้วเติมแผน</button><label class="small" style="flex-direction:row;gap:6px;color:var(--text)"><input type="checkbox" id="plOnly" checked> เติมเฉพาะช่องที่ว่าง (ไม่ทับที่เขียนไว้แล้ว)</label></div>
    <div class="grid" style="margin:10px 0">
      <label>เรื่อง<input id="pTitle" value="${esc(p.title)}"></label>
      <label>เวลา (ชั่วโมง)<input id="pHours" type="number" min="1" value="${p.hours}"></label>
      <label>สถานะ<select id="pStatus"><option value="draft" ${p.status === "draft" ? "selected" : ""}>ฉบับร่าง</option><option value="reviewed" ${p.status === "reviewed" ? "selected" : ""}>ตรวจแล้ว</option></select></label>
    </div>
    <details class="sec" open><summary>1. ${SECTIONS[0].title}</summary><div class="body">
      <div class="chips">${p.indicator_codes.map((c) => `<span class="chip">${esc(c)}</span>`).join("") || '<span class="muted">ยังไม่ได้เลือกตัวชี้วัด</span>'}</div>
      <div class="autotext">${esc(sel.map((i) => `${i.code} ${i.description}`).join("\n"))}</div>
      <button class="btn small" data-act="t4-ind">เลือกตัวชี้วัดของแผนนี้ (จากหน่วย)</button></div></details>
    <details class="sec"><summary>2. ${SECTIONS[1].title}</summary><div class="body">${ta("objectives.K", "ด้านความรู้ ความเข้าใจ (K)", 2)}${ta("objectives.P", "ด้านทักษะกระบวนการ (P)", 2)}${ta("objectives.A", "ด้านคุณลักษณะ (A)", 2)}</div></details>
    <details class="sec"><summary>3. ${SECTIONS[2].title}</summary><div class="body">${ta("content", "สาระการเรียนรู้ (หนึ่งบรรทัดต่อหนึ่งข้อ)", 3)}</div></details>
    <details class="sec"><summary>4. ${SECTIONS[3].title}</summary><div class="body">${ta("key_idea", "สาระสำคัญ", 4)}</div></details>
    <details class="sec"><summary>5. ${SECTIONS[4].title}</summary><div class="body">${chk("traits", TRAITS)}</div></details>
    <details class="sec"><summary>6. ${SECTIONS[5].title}</summary><div class="body">${ta("competencies.local", "สมรรถนะภูเก็ต (หนึ่งบรรทัดต่อหนึ่งข้อ)", 4)}${ta("competencies.key", "สมรรถนะสำคัญของผู้เรียน (หนึ่งบรรทัดต่อหนึ่งข้อ)", 3)}</div></details>
    <details class="sec"><summary>7. ${SECTIONS[6].title}</summary><div class="body">${SUFFICIENCY.map(([k, l]) => ta("sufficiency." + k, l, 2)).join("")}</div></details>
    <details class="sec"><summary>8. ${SECTIONS[7].title}</summary><div class="body"><b>3Rs</b>${chk("focus.r3", R3)}<b>8Cs</b>${chk("focus.c8", C8)}</div></details>
    <details class="sec"><summary>9. ${SECTIONS[8].title}</summary><div class="body">${PROCESS_STEPS.map((s, i) => ta("process." + i, s, 6)).join("")}</div></details>
    <details class="sec"><summary>10. ${SECTIONS[9].title}</summary><div class="body">${ta("media", "สื่อการเรียนการสอน (หนึ่งบรรทัดต่อหนึ่งข้อ)", 3)}</div></details>
    <details class="sec"><summary>11. ${SECTIONS[10].title}</summary><div class="body">${ta("resources.inside", "แหล่งเรียนรู้ภายในโรงเรียน", 2)}${ta("resources.outside", "แหล่งเรียนรู้ภายนอกห้องเรียน", 2)}${ta("resources.local", "ภูมิปัญญาท้องถิ่น", 2)}</div></details>
    <details class="sec"><summary>12. ${SECTIONS[11].title}</summary><div class="body"><div class="tablewrap"><table><tr><th>รายการประเมิน</th><th>วิธีการวัด</th><th>เครื่องมือวัด</th><th>เกณฑ์การประเมินผล</th><th></th></tr>
      ${sec.assessment.map((a, i) => `<tr><td><input data-p="assessment.${i}.item" value="${esc(a.item)}"></td><td><textarea data-p="assessment.${i}.method" rows="2">${esc(a.method)}</textarea></td><td><textarea data-p="assessment.${i}.tool" rows="2">${esc(a.tool)}</textarea></td><td><textarea data-p="assessment.${i}.criteria" rows="2">${esc(a.criteria)}</textarea></td><td><button class="btn small danger" data-act="t4-as-del" data-i="${i}">✕</button></td></tr>`).join("")}</table></div><button class="btn small" data-act="t4-as-add">+ เพิ่มรายการประเมิน</button></div></details>
    <details class="sec"><summary>13. เอกสารแนบ (ใบงาน / เกณฑ์รูบริก) <span class="muted small">— ต่อท้ายไฟล์ Word</span></summary><div class="body">
      ${(sec.attachments ?? []).map((a, i) => `<div class="card" style="padding:10px"><label>ชื่อเอกสาร<input data-p="attachments.${i}.title" value="${esc(a.title)}"></label><label>เนื้อหา<textarea data-p="attachments.${i}.body" rows="8">${esc(a.body)}</textarea></label><button class="btn small danger" data-act="t4-att-del" data-i="${i}">ลบเอกสารนี้</button></div>`).join("") || '<div class="muted">ยังไม่มีเอกสารแนบ</div>'}
      <div class="row"><button class="btn small" data-act="t4-att-add">+ เพิ่มเอกสารแนบ</button><button class="btn small accent" data-act="t4-att-ai">✨ AI ร่างใบงาน + รูบริก</button></div></div></details>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="t4-save">บันทึกแผนนี้</button><button class="btn" data-act="t4-save-next">บันทึกและไปแผนถัดไป →</button></div>
  </div>`;
}

// =====================================================================
// TAB 5 — settings & API keys
// =====================================================================
// ---------- tab 9: school curriculum + teaching schedule files ----------
const T9 = { subject: 5, curriculum: "2551r60", grade: 5 };
function render9() {
  const el = $("#t9");
  const cl = S.courses.map((c) => `<div class="item"><div><div class="t">${esc(c.course_code ?? "")} ${esc(c.course_name)}</div><div class="muted small">${esc(subjName(c.subject_id))} · ป.${c.grade} · ${esc(c.curriculum_id)} · ${c.total_hours} ชม.${csOfCourse(c)?.content?.doc?.course_description ? " · มีเนื้อหาหลักสูตรแล้ว" : ""}</div></div>
    <div class="row"><button class="btn small primary" data-act="t9-cur" data-id="${c.id}">หลักสูตรสถานศึกษา (Word)</button><button class="btn small accent" data-act="t9-sch" data-id="${c.id}">กำหนดการสอน (Word)</button><button class="btn small" data-act="t9-aidoc" data-id="${c.id}">AI ร่างเนื้อหาหลักสูตร</button></div></div>`).join("") || '<div class="muted">ยังไม่มีรายวิชา ใช้ฟอร์มด้านบนสร้างได้เลย</div>';
  el.innerHTML = `<div class="card accent"><h2>2 · หลักสูตรสถานศึกษา และกำหนดการสอน <span class="muted small">— สร้างตั้งแต่ต้นด้วย AI แล้วโหลดเป็น Word</span></h2>
    <p class="muted small">กดครั้งเดียว ระบบดึงตัวชี้วัดจริงจากฐานข้อมูล → AI ร่างเนื้อหาหลักสูตร → AI ร่างหน่วยการเรียนรู้ ชั่วโมง คะแนน → สร้างหน่วย แก้ไขต่อได้ที่แถบ 0 กับแถบ 3–4</p>
    <div class="grid">
      <label>กลุ่มสาระ/วิชา<select id="t9s">${optList(S.subjects, "id", "name")}</select></label>
      <label>หลักสูตร<select id="t9c">${S.curricula.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label>
      <label>ชั้น<select id="t9g">${[1, 2, 3, 4, 5, 6].map((g) => `<option value="${g}">ป.${g}</option>`).join("")}</select></label>
      <label>รหัสวิชา<input id="t9code" placeholder="พ15101"></label>
      <label>ชื่อรายวิชา<input id="t9name" placeholder="สุขศึกษาและพลศึกษา"></label>
      <label>ชั่วโมงทั้งปี<input id="t9hours" type="number" value="80"></label>
      <label>ภาคเรียน<select id="t9sem"><option>2</option><option>1</option></select></label>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="t9-all">สร้างทั้งชุดด้วย AI</button></div><div class="muted small" id="t9st" style="margin-top:6px"></div></div>
    <div class="card"><h3>รายวิชาของฉัน</h3><div class="list">${cl}</div></div>`;
  $("#t9s").value = T9.subject; $("#t9c").value = T9.curriculum; $("#t9g").value = T9.grade;
  ["s", "c", "g"].forEach((k) => $("#t9" + k).addEventListener("change", () => { T9.subject = Number($("#t9s").value); T9.curriculum = $("#t9c").value; T9.grade = Number($("#t9g").value); }));
}
async function t9Ctx(courseId) {
  const c = S.courses.find((x) => x.id === courseId), cs = csOfCourse(c);
  const [rows, units] = await Promise.all([
    sb.from("course_structure_rows").select("*").eq("course_structure_id", c.id).order("seq"),
    sb.from("units").select("*").eq("course_structure_id", c.id).order("seq"),
  ]);
  const inds = await loadInds(c.curriculum_id, c.subject_id, c.grade);
  const stds = cs?.content?.standards ?? (await loadStds(c.curriculum_id, c.subject_id));
  const R = must(rows), used = new Set(R.flatMap((r) => r.indicator_codes ?? []));
  return { c, cs, thNum, school: S.settings?.school_name ?? "", year: S.settings?.academic_year ?? "", subject: subjName(c.subject_id), grade: c.grade, curriculumName: S.curricula.find((x) => x.id === c.curriculum_id)?.name ?? c.curriculum_id,
    totalHours: c.total_hours, perWeek: cs?.content?.time?.hours_per_week, doc: cs?.content?.doc, standards: stds,
    indicators: used.size ? inds.filter((i) => used.has(i.code)) : inds, courseName: c.course_name, courseCode: c.course_code, semesters: c.semester_count, rows: R, units: must(units) };
}
async function t9Draft(cx) {
  const out = await callAI(promptCurriculumDoc({ subject: cx.subject, grade: cx.grade, curriculum: cx.curriculumName, school: cx.school, indicators: cx.indicators, standards: cx.standards }));
  const doc = { vision: out.vision ?? "", course_description: out.course_description ?? "", competencies: out.competencies ?? "", approach: out.approach ?? "" };
  if (cx.cs) { const content = { ...cx.cs.content, doc }; must(await sb.from("curriculum_structures").update({ content }).eq("id", cx.cs.id)); cx.cs.content = content; }
  cx.doc = doc; return doc;
}
const t9Msg = (m) => { const e = $("#t9st"); if (e) e.textContent = m; };
const t9Save = async (doc, name) => (await import("./export.js")).saveBlob(await (await import("./curdoc.js")).docBlob(doc), safeName(name) + ".docx");
// ---------- tab 0: school curriculum book ----------
const DEF_HOURS = { 1: [200, 200, 200, 160, 160, 160], 2: [200, 200, 200, 160, 160, 160], 3: [120, 120, 120, 120, 120, 120], 4: [120, 120, 120, 120, 120, 120], 5: [80, 80, 80, 80, 80, 80], 6: [80, 80, 80, 80, 80, 80], 7: [40, 40, 40, 40, 40, 40], 8: [40, 40, 40, 80, 80, 80] };
const DEF_TT = () => [
  { group: true, name: "รายวิชาพื้นฐาน" },
  { name: "ภาษาไทย", h: [200, 200, 200, 160, 160, 160] }, { name: "คณิตศาสตร์", h: [200, 200, 200, 160, 160, 160] },
  { name: "วิทยาศาสตร์และเทคโนโลยี", h: [120, 120, 120, 120, 120, 120] }, { name: "สังคมศึกษา ศาสนา และวัฒนธรรม", h: [80, 80, 80, 80, 80, 80] },
  { name: "ประวัติศาสตร์", indent: true, h: [40, 40, 40, 40, 40, 40] }, { name: "สุขศึกษาและพลศึกษา", h: [80, 80, 80, 80, 80, 80] },
  { name: "ศิลปะ", h: [80, 80, 80, 80, 80, 80] }, { name: "การงานอาชีพ", h: [40, 40, 40, 40, 40, 40] }, { name: "ภาษาต่างประเทศ", h: [40, 40, 40, 80, 80, 80] },
  { group: true, name: "กิจกรรมพัฒนาผู้เรียน" },
  { name: "กิจกรรมแนะแนว", indent: true, h: [40, 40, 40, 40, 40, 40] }, { name: "ลูกเสือ เนตรนารี / ยุวกาชาด", indent: true, h: [40, 40, 40, 40, 40, 40] },
  { name: "ชุมนุม", indent: true, h: [30, 30, 30, 30, 30, 30] }, { name: "กิจกรรมเพื่อสังคมและสาธารณประโยชน์", indent: true, h: [10, 10, 10, 10, 10, 10] },
];
const BK = { open: new Set(), subject: 5, curriculum: "2551r60", book: null, books: null, busy: false };
const bkGet = (o, path) => path.split(".").reduce((a, k) => a?.[k], o);
const bkSet = (o, path, v) => { const ks = path.split("."); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] ??= {}), o); t[last] = v; };
let bkTimer;
const bkSave = () => { clearTimeout(bkTimer); bkTimer = setTimeout(async () => { try { if (BK.book) must(await sb.from("curriculum_books").update({ data: BK.book.data, updated_at: new Date().toISOString() }).eq("id", BK.book.id)); const e = $("#bkst"); if (e && !BK.busy) e.textContent = "บันทึกแล้ว"; } catch (e) { toast("บันทึกไม่สำเร็จ: " + e.message, "err"); } }, 700); };
async function bkLoad() { BK.books = must(await sb.from("curriculum_books").select("*").order("created_at", { ascending: false })); if (BK.book) BK.book = BK.books.find((b) => b.id === BK.book.id) ?? null; }
async function render0() {
  const el = $("#t0");
  if (!BK.books) await bkLoad();
  const list = BK.books.map((b) => `<div class="item ${BK.book?.id === b.id ? "sel" : ""}"><div><div class="t">${esc(b.title)}</div><div class="muted small">${esc(subjName(b.subject_id))} · ${esc(b.curriculum_id)}</div></div><div class="row"><button class="btn small primary" data-act="bk-open" data-id="${b.id}">เปิด</button><button class="btn small danger" data-act="bk-del" data-id="${b.id}">ลบ</button></div></div>`).join("") || '<div class="muted">ยังไม่มีเล่มหลักสูตร</div>';
  el.innerHTML = `<div class="card accent"><h2>1 · เล่มหลักสูตรสถานศึกษา <span class="muted small">— ต้องทำก่อน แล้วค่อยไปรายวิชา หน่วย และแผน</span></h2>
    <p class="muted small">สร้างเล่มเต็ม (ปก คำนำ ความนำ มาตรฐาน คุณภาพผู้เรียน ตัวชี้วัดระหว่างทาง/ปลายทาง สาระแกนกลาง คำอธิบายและโครงสร้างรายวิชา ป.1–6 เวลาเรียน เกณฑ์ประเมิน อภิธานศัพท์) มาตรฐานและตัวชี้วัดดึงจากฐานข้อมูลจริง ส่วนที่ AI เขียนต้องตรวจก่อนใช้</p>
    <div class="grid"><label>กลุ่มสาระ/วิชา<select id="b0s">${optList(S.subjects, "id", "name")}</select></label><label>หลักสูตร<select id="b0c">${S.curricula.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="bk-new">สร้างเล่มใหม่</button></div></div>
    <div class="card"><h3>เล่มของฉัน</h3><div class="list">${list}</div></div><div id="bkedit"></div>`;
  $("#b0s").value = BK.subject; $("#b0c").value = BK.curriculum;
  ["s", "c"].forEach((k) => $("#b0" + k).addEventListener("change", () => { BK.subject = Number($("#b0s").value); BK.curriculum = $("#b0c").value; }));
  if (BK.book) { BK.stds = await loadStds(BK.book.curriculum_id, BK.book.subject_id); renderBook(); }
}
const bkStrandNo = (st) => String(st.strand_no ?? st.standard_code.match(/\d+/)?.[0] ?? "");
const bkStrands = () => [...new Set((BK.stds ?? []).map(bkStrandNo))].sort((a, b) => Number(a) - Number(b));
const bkStrandName = (n) => (BK.stds ?? []).find((x) => bkStrandNo(x) === n)?.strand_name ?? "";
function renderBook() {
  const b = BK.book, d = b.data, ed = $("#bkedit"); if (!ed) return;
  const sy = window.scrollY;
  const filled = (v) => (v && String(v).trim() ? "✓" : "○");
  d.school_info ??= ""; const ta = (path, rows = 6) => `<textarea rows="${rows}" data-bk="${path}">${esc(bkGet(d, path) ?? "")}</textarea>`;
  const texts = BOOK_TEXTS.map(([k, t]) => `<details class="card" data-dk="t_${k}"><summary><b>${filled(d.texts?.[k])}${d.reviewed?.["t_" + k] ? "✔" : ""} ${esc(t)}</b></summary><div class="row" style="margin:8px 0"><button class="btn small primary" data-act="bk-ai-text" data-k="${k}">AI ร่างเฉพาะส่วนนี้</button><label style="flex-direction:row;gap:6px;color:var(--text)"><input type="checkbox" data-bk="reviewed.t_${k}" ${d.reviewed?.["t_" + k] ? "checked" : ""}> ตรวจแล้ว</label></div>${inBox("bk_" + k, "ข้อมูลสำหรับส่วนนี้ที่ครู/โรงเรียนมี (ใส่บางส่วนก็ได้)")}${ta("texts." + k, 12)}</details>`).join("");
  const gr = [1, 2, 3, 4, 5, 6].map((g) => { const x = d.grades?.[g] ?? {}; const st = x.structure ?? [];
    return `<details class="card" data-dk="g${g}"><summary><b>${filled(x.desc)}${st.length ? "✓" : "○"}${Object.keys(x.core ?? {}).length ? "✓" : "○"}${d.reviewed?.["g" + g] ? "✔" : ""} ชั้นประถมศึกษาปีที่ ${g}</b> <span class="muted small">${st.length} แถวโครงสร้าง · ${Object.keys(x.core ?? {}).length} สาระแกนกลาง</span></summary>
      <div class="grid" style="margin:8px 0"><label>รหัสวิชา<input data-bk="grades.${g}.code" value="${esc(x.code ?? "")}"></label><label>ชื่อรายวิชา<input data-bk="grades.${g}.name" value="${esc(x.name ?? "")}"></label><label>ชั่วโมง/ปี<input type="number" data-bk="grades.${g}.hours" value="${x.hours ?? 80}"></label></div>
      <div class="row" style="margin-bottom:8px"><button class="btn small" data-act="bk-use-course" data-g="${g}">ใช้โครงสร้างจากรายวิชาที่สร้างไว้ (แถบ 3)</button></div>
      <div class="card" style="padding:10px"><div class="row"><b>① สาระการเรียนรู้แกนกลาง</b><span class="muted small">ทำทีละสาระ</span></div><div class="row" style="margin-top:6px">${bkStrands().map((n) => `<button class="btn small" data-act="bk-ai-core" data-g="${g}" data-n="${n}">AI สาระที่ ${n}</button>`).join("") || '<span class="muted small">ไม่พบสาระ</span>'}</div>
      <details style="margin-top:8px" data-dk="gc${g}"><summary>แก้ไขรายตัวชี้วัด (${Object.keys(x.core ?? {}).length})</summary>${Object.entries(x.core ?? {}).map(([c, v]) => `<label>${esc(c.replace(/‧/g, "."))} — สาระแกนกลาง<textarea rows="2" data-bk="grades.${g}.core.${c}">${esc(v)}</textarea></label><label class="small">สาระท้องถิ่น<textarea rows="1" data-bk="grades.${g}.local.${c}">${esc(x.local?.[c] ?? "")}</textarea></label>`).join("") || '<div class="muted small">ยังไม่มี</div>'}</details></div>
      <div class="card" style="padding:10px"><div class="row"><b>② โครงสร้างรายวิชา</b><button class="btn small" data-act="bk-ai-struct" data-g="${g}">AI ร่างหน่วย/ชั่วโมง/คะแนน</button></div>
      ${st.map((r, i) => `<div class="card" style="padding:8px"><div class="grid"><label>ชื่อหน่วย<input data-bk="grades.${g}.structure.${i}.name" value="${esc(r.name ?? "")}"></label><label>ตัวชี้วัด (คั่นด้วย ,)<input data-bkl="grades.${g}.structure.${i}.indicator_codes" value="${esc((r.indicator_codes ?? []).join(", "))}"></label><label>ชั่วโมง<input type="number" data-bk="grades.${g}.structure.${i}.hours" value="${r.hours ?? 0}"></label><label>คะแนน<input type="number" data-bk="grades.${g}.structure.${i}.score_weight" value="${r.score_weight ?? 0}"></label></div><label>เนื้อหา</label><textarea rows="2" data-bk="grades.${g}.structure.${i}.content">${esc(r.content ?? "")}</textarea></div>`).join("") || '<div class="muted small">ยังไม่มี</div>'}</div>
      <div class="card" style="padding:10px"><div class="row"><b>③ คำอธิบายรายวิชา</b><button class="btn small" data-act="bk-ai-desc" data-g="${g}">AI ร่างคำอธิบาย</button></div>${ta(`grades.${g}.desc`, 8)}</div>
      <label style="flex-direction:row;gap:6px;color:var(--text);margin-top:6px"><input type="checkbox" data-bk="reviewed.g${g}" ${d.reviewed?.["g" + g] ? "checked" : ""}> ตรวจชั้นนี้แล้ว</label>
      </details></details>`; }).join("");
  if (!d.time_table) d.time_table = DEF_TT(); d.extra ??= [];
  const ttHtml = d.time_table.map((r, i) => `<div class="row" style="gap:4px;margin:3px 0"><input style="flex:2;min-width:160px${r.group ? ";font-weight:bold" : ""}" data-bk="time_table.${i}.name" value="${esc(r.name)}">${r.group ? '<span class="muted small" style="flex:3">หัวข้อกลุ่ม</span>' : [0, 1, 2, 3, 4, 5].map((k) => `<input type="number" style="width:62px" title="ป.${k + 1}" data-bk="time_table.${i}.h.${k}" value="${r.h?.[k] ?? 0}">`).join("")}<button class="btn small danger" data-act="bk-tt-del" data-i="${i}">ลบ</button></div>`).join("");
  const exHtml = d.extra.map((x, i) => `<div class="card" style="padding:8px"><div class="grid"><label>ชั้น ป.<input type="number" min="1" max="6" data-bk="extra.${i}.grade" value="${x.grade ?? 1}"></label><label>รหัสวิชา<input data-bk="extra.${i}.code" value="${esc(x.code ?? "")}"></label><label>ชื่อรายวิชา<input data-bk="extra.${i}.name" value="${esc(x.name ?? "")}"></label><label>ชั่วโมง/ปี<input type="number" data-bk="extra.${i}.hours" value="${x.hours ?? 40}"></label></div>
    <label>ขอบข่ายที่ต้องการ (ให้ AI ใช้)<input data-bk="extra.${i}.note" value="${esc(x.note ?? "")}" placeholder="เช่น ว่ายน้ำเพื่อความปลอดภัย"></label>
    <div class="row" style="margin:6px 0"><button class="btn small" data-act="bk-ai-extra" data-i="${i}">AI ร่างคำอธิบาย</button><button class="btn small danger" data-act="bk-ex-del" data-i="${i}">ลบรายวิชา</button></div>${ta(`extra.${i}.desc`, 6)}</div>`).join("");
  const noData = !(BK.stds ?? []).length;
  ed.innerHTML = `${noData ? `<div class="card" style="border:2px solid var(--red)"><b>⚠ ยังไม่มีมาตรฐาน/ตัวชี้วัดของวิชานี้ในระบบ</b><p class="small">AI จะเขียนโดยไม่มีข้อมูลจริงอ้างอิง ไปแถบ 0 → "นำเข้าตัวชี้วัดเอง" วางมาตรฐานและตัวชี้วัด ป.1–6 จากเอกสารหลักสูตรก่อน แล้วกลับมากด AI ใหม่</p><button class="btn small" data-act="goto" data-tab="t1">ไปแถบ 0</button></div>` : ""}<div class="card accent"><h3>${esc(b.title)}</h3><div class="row"><button class="btn accent" data-act="bk-doc">ดาวน์โหลด Word ทั้งเล่ม</button><button class="btn" data-act="bk-next">ไปรายวิชา → แถบ 3</button></div>
    <div class="muted small" style="margin-top:6px">กด AI ทีละส่วน ตรวจแล้วติ๊ก "ตรวจแล้ว" ✔ = ตรวจแล้ว ✓ = มีเนื้อหา ○ = ยังว่าง</div><div class="muted small" id="bkst" style="margin-top:6px"></div></div>
    <div class="card"><b>ข้อมูลทั่วไปของโรงเรียน</b> <span class="muted small">— ใช้กับทุกส่วนของเล่ม (วิสัยทัศน์ พันธกิจ บริบทชุมชน จุดเด่นของโรงเรียน ฯลฯ ใส่เท่าที่มี)</span><textarea rows="4" data-bk="school_info" placeholder="เช่น วิสัยทัศน์ของโรงเรียน บริบทชุมชน กิจกรรมเด่น ภูมิปัญญาท้องถิ่น">${esc(d.school_info ?? "")}</textarea></div><h3>ส่วนหน้า/ท้ายเล่ม</h3>${texts}<h3>รายชั้น ป.1–6</h3>${gr}
    <details class="card" data-dk="extra"><summary><b>${d.extra.length ? "✓" : "○"} รายวิชาเพิ่มเติม (${d.extra.length})</b></summary><p class="muted small">ใช้ "ผลการเรียนรู้" แทนตัวชี้วัด</p>${exHtml}<button class="btn small" data-act="bk-ex-add">+ เพิ่มรายวิชาเพิ่มเติม</button></details>
    <details class="card" data-dk="tt"><summary><b>✓ โครงสร้างเวลาเรียนทั้งโรงเรียน</b></summary><p class="muted small">ค่าเริ่มต้นเป็นตัวอย่าง ตรวจและแก้ให้ตรงกับโรงเรียน (ช่องตัวเลข = ป.1 ถึง ป.6) แถววิชานี้จะใช้ชั่วโมงจากรายชั้นอัตโนมัติ รายวิชาเพิ่มเติมจะเพิ่มเข้าตารางเอง</p>${ttHtml}<div class="row" style="margin-top:6px"><button class="btn small" data-act="bk-tt-add">+ เพิ่มแถว</button><button class="btn small" data-act="bk-tt-reset">คืนค่าเริ่มต้น</button></div></details>`;
  $$("#bkedit details[data-dk]").forEach((x) => { if (BK.open.has(x.dataset.dk)) x.open = true; });
  window.scrollTo?.(0, sy);
}
document.addEventListener("toggle", (e) => { const x = e.target; if (x?.dataset?.dk) x.open ? BK.open.add(x.dataset.dk) : BK.open.delete(x.dataset.dk); }, true);
const bkSub = () => subjName(BK.book.subject_id);
async function bkCtx() {
  const b = BK.book, d = b.data;
  const stds = await loadStds(b.curriculum_id, b.subject_id);
  const inds = []; for (let g = 1; g <= 6; g++) inds.push(...(await loadInds(b.curriculum_id, b.subject_id, g)));
  return { stds, inds };
}
const bkMsg = (m) => { const e = $("#bkst"); if (e) e.textContent = m; };
async function bkRetry(fn) { try { return await fn(); } catch (e) { await new Promise((r) => setTimeout(r, 2500)); return await fn(); } }
async function bkAiText(k, c, extra) {
  if (!c.inds.length) throw new Error("ยังไม่มีตัวชี้วัดของวิชานี้ในระบบ นำเข้าที่แถบ 0 ก่อน");
  const b = BK.book, cn = S.curricula.find((x) => x.id === b.curriculum_id)?.name ?? b.curriculum_id;
  const out = await bkRetry(() => callAI(promptBookText(k, { school: S.settings?.school_name ?? "", subject: bkSub(), curriculum: cn, standards: c.stds, indicators: c.inds, material: [BK.book.data.school_info, extra?.text].filter(Boolean).join("\n") }), { files: extra?.files }));
  bkSet(b.data, "texts." + k, String(out.text ?? ""));
}
const bkGradeInds = (g, c) => c.inds.filter((i) => new RegExp(`ป\\.${g}/`).test(i.code));
async function bkAiCore(g, n, c) {
  const b = BK.book, gd = (b.data.grades[g] ??= {}), codes = new Set((c.stds ?? []).filter((x) => bkStrandNo(x) === String(n)).map((x) => x.standard_code));
  const gi = bkGradeInds(g, c).filter((i) => codes.has(i.standard_code));
  if (!gi.length) throw new Error(`ไม่มีตัวชี้วัด ป.${g} ในสาระที่ ${n}`);
  const o = await bkRetry(() => callAI(promptCore({ subject: bkSub(), grade: g, indicators: gi, school: S.settings?.school_name ?? "" })));
  gd.core ??= {}; gd.local ??= {}; gi.forEach((i) => { const k = i.code.replace(/\./g, "‧"), v = o.core?.[i.code], lv = o.local?.[i.code]; if (v) gd.core[k] = String(v); if (lv && !gd.local[k]) gd.local[k] = String(lv); });
}
async function bkAiStruct(g, c) {
  const b = BK.book, gd = (b.data.grades[g] ??= {}), gi = bkGradeInds(g, c);
  if (!gi.length) throw new Error(`ไม่มีตัวชี้วัด ป.${g} ในระบบ`);
  const o = await bkRetry(() => callAI(promptStructure({ subject: bkSub(), grade: g, curriculum: b.curriculum_id, totalHours: Number(gd.hours) || 80, semesters: 2, indicators: gi })));
  const valid = new Set(gi.map((i) => i.code));
  gd.structure = (o.rows ?? []).map((r) => { const codes = r.kind === "exam" ? [] : (r.indicator_codes ?? []).filter((x) => valid.has(x)); return { kind: r.kind === "exam" ? "exam" : "unit", name: String(r.name ?? ""), indicator_codes: codes, hours: Math.round(num(r.hours)), score_weight: num(r.score_weight), content: codes.map((cd) => gd.core?.[cd.replace(/\./g, "‧")]).filter(Boolean).join(", ") }; });
}
async function bkAiDesc(g, c) {
  const b = BK.book, gd = (b.data.grades[g] ??= {}), gi = bkGradeInds(g, c);
  const o = await bkRetry(() => callAI(promptGradeDesc({ subject: bkSub(), grade: g, name: gd.name || bkSub(), hours: gd.hours || 80, indicators: gi, units: (gd.structure ?? []).filter((r) => r.kind !== "exam").map((r) => r.name) })));
  gd.desc = String(o.text ?? "");
}
async function bkRun(tasks) {
  BK.busy = true; const errs = []; let n = 0;
  for (const [label, fn] of tasks) { bkMsg(`(${++n}/${tasks.length}) ${label}...`); try { await fn(); must(await sb.from("curriculum_books").update({ data: BK.book.data, updated_at: new Date().toISOString() }).eq("id", BK.book.id)); } catch (e) { errs.push(`${label}: ${e.message}`); } }
  BK.busy = false; renderBook(); bkMsg(errs.length ? `เสร็จ แต่มี ${errs.length} ส่วนไม่สำเร็จ (กดอีกครั้งเพื่อทำส่วนที่ว่างต่อ): ${errs.join(" | ")}` : "เสร็จแล้ว ตรวจเนื้อหาแล้วโหลด Word ได้");
}
function bkTimeTable(d, grades) {
  const sub = bkSub(), rows = (d.time_table ?? DEF_TT()).map((r) => (r.name === sub ? { ...r, h: [1, 2, 3, 4, 5, 6].map((g) => grades[g]?.hours ?? r.h?.[g - 1]) } : r));
  const ex = (d.extra ?? []).filter((x) => x.name);
  if (ex.length) { rows.push({ group: true, name: "รายวิชาเพิ่มเติม" }); ex.forEach((x) => rows.push({ name: x.name, indent: true, h: [1, 2, 3, 4, 5, 6].map((g) => (Number(x.grade) === g ? Number(x.hours) || 0 : 0)) })); }
  return rows;
}
async function bkDoc() {
  const b = BK.book, d = b.data, c = await bkCtx(), m = await import("./bookdoc.js");
  const grades = {}; for (let g = 1; g <= 6; g++) { const x = d.grades?.[g] ?? {}; const fix = (o) => Object.fromEntries(Object.entries(o ?? {}).map(([k, v]) => [k.replace(/‧/g, "."), v])); grades[g] = { ...x, core: fix(x.core), local: fix(x.local) }; }
  const blob = await m.bookBlob({ thNum, school: S.settings?.school_name ?? "", year: S.settings?.academic_year ?? "", subject: bkSub(), curriculumName: S.curricula.find((x) => x.id === b.curriculum_id)?.name ?? b.curriculum_id, texts: d.texts ?? {}, grades, standards: c.stds, indicators: c.inds, extra: d.extra ?? [], timeTable: bkTimeTable(d, grades) });
  (await import("./export.js")).saveBlob(blob, safeName(`เล่มหลักสูตร_${bkSub()}`) + ".docx");
}
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.dataset?.klim) { try { must(await sb.from("api_keys").update({ daily_limit: Math.max(1, num(t.value)) }).eq("id", t.dataset.klim)); await refreshQuota(); render7(); } catch (er) { toast(er.message, "err"); } return; }
  if (!BK.book) return;
  if (t.dataset?.bk) { let v = t.type === "checkbox" ? t.checked : t.value; if (t.type === "number") v = num(v); bkSet(BK.book.data, t.dataset.bk, v); bkSave(); }
  if (t.dataset?.bkl) { bkSet(BK.book.data, t.dataset.bkl, t.value.split(",").map((x) => x.trim()).filter(Boolean)); bkSave(); }
});

// ---------- tab 8: downloads ----------
const T8 = { sel: new Set() };
const safeName = (x) => String(x).replace(/[\\/:*?"<>|]/g, "_").trim();
// =====================================================================
// TAB 8 — indicator usage check
// =====================================================================
async function render10() {
  const el = $("#t10");
  if (!S.course) { el.innerHTML = `<div class="card accent"><h2>8 · ตรวจตัวชี้วัด</h2><p>เลือกรายวิชาที่แถบ 3 ก่อน</p><button class="btn" data-act="goto" data-tab="t2">ไปแถบ 3</button></div>`; return; }
  el.innerHTML = `<div class="card accent"><h2>8 · ตรวจตัวชี้วัด</h2><p class="muted">กำลังนับ...</p></div>`;
  const c = S.course, inds = await courseIndicators(), stds = await loadStds(c.curriculum_id, c.subject_id);
  const ids = S.units.map((u) => u.id);
  const plans = ids.length ? must(await sb.from("lesson_plans").select("unit_id,seq,title,indicator_codes").in("unit_id", ids)) : [];
  const uOf = new Map(S.units.map((u) => [u.id, u]));
  const info = new Map(inds.map((i) => [i.code, { i, units: [], plans: [] }]));
  S.units.forEach((u) => (u.indicator_codes ?? []).forEach((k) => info.get(k)?.units.push(u)));
  plans.forEach((p) => (p.indicator_codes ?? []).forEach((k) => info.get(k)?.plans.push(p)));
  const unknown = [...new Set([...S.units.flatMap((u) => u.indicator_codes ?? []), ...plans.flatMap((p) => p.indicator_codes ?? [])])].filter((k) => !info.has(k));
  const stdOf = new Map(stds.map((x) => [x.standard_code, x]));
  const groups = new Map();
  inds.forEach((i) => { const sd = stdOf.get(i.standard_code), key = sd?.strand_no ? `สาระที่ ${sd.strand_no}${sd.strand_name ? " " + sd.strand_name : ""}` : "ไม่ระบุสาระ"; const g = groups.get(key) ?? new Map(); const arr = g.get(i.standard_code) ?? []; arr.push(info.get(i.code)); g.set(i.standard_code, arr); groups.set(key, g); });
  const used = (x) => x.plans.length, tot = sum(inds.map((i) => used(info.get(i.code)))), covered = inds.filter((i) => used(info.get(i.code)) > 0).length;
  const miss = inds.filter((i) => !used(info.get(i.code)) && !info.get(i.code).units.length), unitOnly = inds.filter((i) => !used(info.get(i.code)) && info.get(i.code).units.length);
  const color = (x) => (!x.plans.length ? (x.units.length ? "var(--warn)" : "var(--red)") : "inherit");
  const bg = (x) => (!x.plans.length ? (x.units.length ? "var(--warnbg)" : "var(--redbg)") : "transparent");
  const body = [...groups].map(([name, g]) => {
    const all = [...g.values()].flat(), gUsed = sum(all.map(used)), gCov = all.filter((x) => used(x) > 0).length;
    return `<details class="sec" open><summary>${esc(name)} · ใช้ ${gUsed} ครั้ง · ครอบคลุม ${gCov}/${all.length} ตัว</summary><div class="body">${[...g].map(([sc, arr]) => `<div class="small"><b>${esc(sc ?? "-")}</b> ${esc(stdOf.get(sc)?.description ?? "")} <span class="muted">· ใช้ ${sum(arr.map(used))} ครั้ง</span></div>
      <div class="tablewrap"><table><tr><th>ตัวชี้วัด</th><th>ในหน่วย</th><th>ในแผน (ครั้ง)</th><th>แผนที่ใช้</th></tr>${arr.map((x) => `<tr style="background:${bg(x)};color:${color(x)}"><td>${esc(x.i.code)} ${esc(x.i.description)}</td><td>${x.units.length}</td><td><b>${x.plans.length}</b></td><td class="small">${x.plans.map((p) => `หน่วย ${uOf.get(p.unit_id)?.seq ?? "?"} แผน ${p.seq}`).join(", ") || "—"}</td></tr>`).join("")}</table></div>`).join("")}</div></details>`;
  }).join("");
  el.innerHTML = `<div class="card accent"><h2>8 · ตรวจตัวชี้วัด <span class="muted small">— ใช้ในแผนกี่ครั้ง</span></h2>
    <div class="check"><div class="stat"><span class="muted small">ใช้รวมทั้งหมด (ครั้ง)</span><b>${tot}</b></div><div class="stat"><span class="muted small">ครอบคลุม</span><b>${covered}/${inds.length}</b></div><div class="stat ${miss.length ? "bad" : ""}"><span class="muted small">ยังไม่ใช้เลย</span><b>${miss.length}</b></div><div class="stat ${unitOnly.length ? "warn" : ""}"><span class="muted small">อยู่ในหน่วย แต่ยังไม่มีแผน</span><b>${unitOnly.length}</b></div></div>
    <p class="small muted">แดง = ไม่อยู่ในหน่วยหรือแผนใดเลย · เหลือง = อยู่ในหน่วยแล้วแต่ยังไม่มีแผนรองรับ · ตัวเลข "ครั้ง" นับจำนวนแผนรายคาบที่เลือกตัวชี้วัดนั้น</p>
    ${unknown.length ? `<div class="errbox small">รหัสที่ไม่พบในหลักสูตร: ${unknown.map(esc).join(", ")}</div>` : ""}
    <div class="row" style="margin:8px 0"><button class="btn small" data-act="t10-refresh">นับใหม่</button></div></div>${body || '<div class="card muted">ยังไม่มีตัวชี้วัดของวิชานี้</div>'}`;
}

async function render8() {
  const el = $("#t8");
  if (!S.course) { el.innerHTML = `<div class="card accent"><h2>9 · ดาวน์โหลด</h2><p>เลือกรายวิชาที่แถบ 3 ก่อน</p><button class="btn" data-act="goto" data-tab="t2">ไปแถบ 3</button></div>`; return; }
  const ids = S.units.map((u) => u.id);
  const plans = ids.length ? must(await sb.from("lesson_plans").select("*").in("unit_id", ids).order("seq")) : [];
  T8.plans = plans;
  const body = S.units.map((u) => {
    const ps = plans.filter((p) => p.unit_id === u.id);
    return `<div class="card"><div class="row"><label style="flex-direction:row;gap:8px;color:var(--text)"><input type="checkbox" data-t8u="${u.id}"> <b>หน่วยที่ ${u.seq} ${esc(u.name)}</b></label><span class="muted small">${ps.length} แผน</span><button class="btn small" data-act="t8-unit" data-id="${u.id}" ${ps.length ? "" : "disabled"}>โหลดทั้งหน่วย (1 ไฟล์)</button></div>
      ${ps.map((p) => `<div class="row" style="margin-top:6px"><label style="flex:1;flex-direction:row;gap:8px;color:var(--text)"><input type="checkbox" data-t8p="${p.id}" data-u="${u.id}" ${T8.sel.has(p.id) ? "checked" : ""}> แผนที่ ${p.seq} ${esc(p.title)}</label><button class="btn small" data-act="t8-one" data-id="${p.id}">โหลด</button></div>`).join("") || '<div class="muted small">ยังไม่มีแผน</div>'}</div>`;
  }).join("") || '<div class="muted">ยังไม่มีหน่วยการเรียนรู้</div>';
  el.innerHTML = `<div class="card accent"><h2>9 · ดาวน์โหลด <span class="muted small">— เลือกแล้วโหลดเป็นไฟล์ Word แยกรายแผน</span></h2>
    <div class="row"><button class="btn small" data-act="t8-all">เลือกทั้งหมด</button><button class="btn small" data-act="t8-none">ล้างที่เลือก</button><button class="btn small primary" data-act="t8-zip">โหลดที่เลือก (ZIP แยกไฟล์)</button><button class="btn small accent" data-act="t8-each">โหลดที่เลือกทีละไฟล์</button></div>
    <div class="muted small" id="t8n" style="margin-top:6px">เลือก 0 แผน</div></div>
    ${body}
    <div class="card"><h3>ข้อมูลหลักสูตรของรายวิชานี้</h3><p class="muted small">มาตรฐานและตัวชี้วัดที่ใช้อยู่ในรายวิชา</p><div class="row"><button class="btn small" data-act="t8-csv">โหลดตัวชี้วัด (CSV)</button><button class="btn small" data-act="t8-json">โหลดข้อมูลทั้งหมด (JSON)</button></div></div>`;
  t8Count();
}
function t8Count() { const n = $("#t8n"); if (n) n.textContent = `เลือก ${T8.sel.size} แผน`; $$("[data-t8u]").forEach((c) => { const ps = (T8.plans ?? []).filter((p) => p.unit_id === c.dataset.t8u); c.checked = ps.length > 0 && ps.every((p) => T8.sel.has(p.id)); }); }
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset?.t8p) { t.checked ? T8.sel.add(t.dataset.t8p) : T8.sel.delete(t.dataset.t8p); t8Count(); }
  if (t.dataset?.t8u) { (T8.plans ?? []).filter((p) => p.unit_id === t.dataset.t8u).forEach((p) => { t.checked ? T8.sel.add(p.id) : T8.sel.delete(p.id); $(`[data-t8p="${p.id}"]`).checked = t.checked; }); t8Count(); }
});
async function t8Files(list) {
  const m = await import("./export.js"); const out = [];
  for (const p of list) { const u = S.units.find((x) => x.id === p.unit_id); const { blob, name } = await m.planBlob(await exportCtx(u), [{ ...p, indicator_codes: p.indicator_codes ?? [], sections: p.sections ?? {} }]); out.push({ blob, name }); }
  return out;
}
const t8Chosen = () => (T8.plans ?? []).filter((p) => T8.sel.has(p.id));
function t8Download(blob, name) { return import("./export.js").then((m) => m.saveBlob(blob, name)); }
function render7() {
  const st = S.settings ?? {};
  $("#t7").innerHTML = `
  <div class="card accent"><h2>⚙ ตั้งค่า</h2>
    <div class="grid">
      <label>ชื่อโรงเรียน<input id="sSchool" value="${esc(st.school_name ?? "")}"></label>
      <label>ชื่อครูผู้สอน<input id="sTeacher" value="${esc(st.teacher_name ?? "")}"></label>
      <label>ชื่อรองผู้อำนวยการ<input id="sDeputy" value="${esc(st.deputy_name ?? "")}"></label>
      <label>ชื่อผู้อำนวยการ<input id="sDirector" value="${esc(st.director_name ?? "")}"></label>
      <label>ปีการศึกษา<input id="sYear" value="${esc(st.academic_year ?? "")}" placeholder="เช่น 2569"></label>
      <label>โมเดล Gemini<select id="sModel">${modelOptions(S.models ?? PRESET_MODELS, st.ai_model ?? "gemini-2.5-flash")}</select></label>
    </div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="s-save">บันทึกการตั้งค่า</button><button class="btn" data-act="s-models">ดึงรายชื่อโมเดลจากคีย์</button></div>
  </div>
  <div class="card"><h3>Google API Key (Gemini)</h3>
    <p class="muted small">หลอดโควตาเป็นการนับเองจากจำนวนครั้งที่ระบบเรียก AI วันนี้ (Google ไม่บอกโควตาที่เหลือ) ปรับตัวเลขเพดานให้ตรงกับของคีย์คุณได้ รีเซ็ตเที่ยงคืนเวลาแปซิฟิก เขียว = เหลือเยอะ แดง = ใกล้เต็ม</p><p class="muted small">วางได้หลายอัน ระบบใช้ตามลำดับ ถ้าอันแรกหมดโควตาจะข้ามไปอันถัดไปเองและพักอันนั้นไว้ คีย์เก็บในฐานข้อมูลของคุณและถูกใช้ผ่านฟังก์ชันฝั่งเซิร์ฟเวอร์เท่านั้น</p>
    <div class="grid"><label>ชื่อเรียก<input id="kLabel" placeholder="เช่น คีย์ 1"></label><label>API Key<input id="kVal" type="password" placeholder="AIza..." autocomplete="off"></label></div>
    <div class="row" style="margin:10px 0"><button class="btn accent" data-act="k-add">+ เพิ่มคีย์</button></div>
    <div class="list">${S.keys.map((k, i) => {
      const cooling = k.exhausted_until && new Date(k.exhausted_until) > new Date();
      const pill = !k.enabled ? '<span class="pill bad">ปิดอยู่</span>' : cooling ? `<span class="pill warn">โควตาหมด ถึง ${new Date(k.exhausted_until).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</span>` : '<span class="pill ok">พร้อมใช้</span>';
      return `<div class="item"><div><div class="t">${i + 1}. ${esc(k.label)} ${pill}</div><div style="min-width:220px;margin:4px 0">${qBar(keyUsed(k), k.daily_limit ?? 250, 12)}<div class="small">ใช้วันนี้ ${keyUsed(k)} / <input type="number" data-klim="${k.id}" value="${k.daily_limit ?? 250}" style="width:80px;display:inline-block;padding:2px 6px"> ครั้ง</div></div><div class="muted small">${esc(k.last_error ?? "")}${k.last_used_at ? " · ใช้ล่าสุด " + new Date(k.last_used_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : ""}</div></div>
      <div class="row"><button class="btn small" data-act="k-up" data-id="${k.id}">↑</button><button class="btn small" data-act="k-down" data-id="${k.id}">↓</button><button class="btn small" data-act="k-toggle" data-id="${k.id}">${k.enabled ? "ปิด" : "เปิด"}</button><button class="btn small" data-act="k-reset" data-id="${k.id}">ล้างสถานะ</button><button class="btn small danger" data-act="k-del" data-id="${k.id}">ลบ</button></div></div>`;
    }).join("") || '<div class="muted">ยังไม่มีคีย์</div>'}</div>
  </div>
  <div class="card"><h3>สำรอง / กู้คืนข้อมูล</h3>
    <p class="muted small">ดาวน์โหลดโครงสร้าง หน่วย และแผนทั้งหมดเป็นไฟล์ .json เก็บไว้ (ไม่รวม API Key) และนำกลับเข้ามาได้ทุกเครื่อง</p>
    <div class="row"><button class="btn" data-act="bk-export">⬇ สำรองข้อมูล</button><label class="btn" style="cursor:pointer">⬆ กู้คืนจากไฟล์<input id="bkFile" type="file" accept=".json,application/json" style="display:none"></label></div>
  </div>`;
}

// =====================================================================
// actions (event delegation)
// =====================================================================
const actions = {
  goto: (b) => go(b.dataset.tab),

  // ---- tab 1
  "imp-file": (b) => busy(b, async () => {
    const f = $("#impFile")?.files?.[0]; if (!f) throw new Error("เลือกไฟล์ก่อน");
    if (/\.docx$/i.test(f.name)) $("#impText").value = bodyText(await docxBody(f));
    else if (/\.txt$/i.test(f.name)) $("#impText").value = await f.text();
    else { toast("AI กำลังถอดข้อความจากไฟล์ อาจใช้เวลาครู่หนึ่ง"); const part = await fileToPart(f);
      $("#impText").value = await callAI("ถอดข้อความมาตรฐานและตัวชี้วัดจากเอกสารที่แนบเป็นข้อความล้วน ห้ามแก้ไขถ้อยคำ รูปแบบ:\nสาระที่ N ชื่อสาระ\nมาตรฐาน พ 1.1 ...\nป.1/1 ...\nขึ้นบรรทัดใหม่ทุกมาตรฐานและทุกตัวชี้วัด ไม่ต้องมีคำอธิบายอื่น", { json: false, files: [part] }); }
    toast("ใส่ข้อความในช่องแล้ว กด 'แปลงและตรวจ' ต่อ", "ok");
  }),
  "imp-parse": () => {
    const all = $("#impAll")?.checked; IMP = parseCurriculumText($("#impText").value, all ? 0 : T1.grade);
    const byG = [1, 2, 3, 4, 5, 6].map((g) => [g, IMP.indicators.filter((i) => i.grade === g).length]).filter((x) => x[1]).map(([g, n]) => `ป.${g}: ${n}`).join(" · ");
    $("#impPrev").innerHTML = IMP.indicators.length ? `<p>พบมาตรฐาน ${IMP.standards.length} ข้อ (สาระ ${new Set(IMP.standards.map((x) => x.strand_no)).size}) ตัวชี้วัด ${IMP.indicators.length} ข้อ (${byG}) — ตรวจรายการ:</p><div class="tablewrap"><table>${IMP.indicators.map((i) => `<tr><td style="white-space:nowrap">${esc(i.code)}</td><td>${esc(i.description)}</td></tr>`).join("")}</table></div>` : '<p class="muted">ไม่พบตัวชี้วัดของชั้นนี้ในข้อความ ตรวจว่ามีบรรทัดขึ้นต้นด้วย "ป.5/1" และมีบรรทัด "มาตรฐาน ..." และเลือกชั้นตรงกัน</p>';
  },
  "imp-save": (b) => busy(b, async () => {
    if (!IMP?.indicators.length) throw new Error("กด 'แปลงและตรวจ' ก่อน");
    const base = { owner_id: S.user.id, curriculum_id: T1.curriculum, subject_id: T1.subject };
    const stdRows = IMP.standards.map((x) => ({ ...base, standard_code: x.standard_code, description: x.description, strand_no: x.strand_no, strand_name: x.strand_name }));
    const indRows = IMP.indicators.map((i) => ({ ...base, grade: i.grade, standard_code: i.standard_code, code: i.code, description: i.description, kind: i.kind }));
    if (stdRows.length) must(await sb.from("user_standards").upsert(stdRows, { onConflict: "owner_id,curriculum_id,subject_id,standard_code" }));
    must(await sb.from("user_indicators").upsert(indRows, { onConflict: "owner_id,curriculum_id,subject_id,grade,code" }));
    S.indCache = {}; IMP = null; $("#impPrev").innerHTML = ""; $("#impText").value = "";
    toast(`บันทึกตัวชี้วัด ${indRows.length} ข้อแล้ว`, "ok");
    T1.ind = await loadInds(T1.curriculum, T1.subject, T1.grade);
    T1.std = Object.fromEntries((await loadStds(T1.curriculum, T1.subject)).map((x) => [x.standard_code, x])); renderT1Prev();
  }),
  "t1-load": (b) => busy(b, async () => {
    T1.ind = await loadInds(T1.curriculum, T1.subject, T1.grade);
    T1.std = Object.fromEntries((await loadStds(T1.curriculum, T1.subject)).map((x) => [x.standard_code, x]));
    renderT1Prev();
  }),
  "t1-save": (b) => busy(b, async () => {
    const total = num($("#t1total").value), week = num($("#t1week").value);
    if (!total) throw new Error("กรอกเวลาเรียนรวม");
    const content = {
      school_name: $("#t1school").value.trim(),
      standards: Object.values(T1.std), indicators: T1.ind,
      time: { total_hours: total, hours_per_week: week },
    };
    const row = must(await sb.from("curriculum_structures").insert({
      subject_id: T1.subject, curriculum_id: T1.curriculum, grade: T1.grade,
      school_name: content.school_name, title: $("#t1title").value.trim() || "โครงสร้างหลักสูตร", content,
    }).select().single());
    S.curStructs.unshift(row); S.cs = row; saveSel(); toast("บันทึกแล้ว", "ok"); renderT1List(); $("#crumb").textContent = `${subjName(row.subject_id)} ป.${row.grade} · ${row.curriculum_id}`;
  }),
  "t1-use": (b) => { S.cs = S.curStructs.find((c) => c.id === b.dataset.id); saveSel(); go("t2"); },
  "t1-del": async (b) => {
    if (!confirm("ลบโครงสร้างหลักสูตรนี้? (รายวิชาที่สร้างจากมันจะยังอยู่)")) return;
    must(await sb.from("curriculum_structures").delete().eq("id", b.dataset.id));
    S.curStructs = S.curStructs.filter((c) => c.id !== b.dataset.id); if (S.cs?.id === b.dataset.id) S.cs = null; renderT1List();
  },

  // ---- tab 2
  "t2-create": (b) => busy(b, async () => {
    const cs = S.curStructs.find((c) => c.id === $("#t2cs").value);
    const total = num($("#t2hours").value), name = $("#t2name").value.trim();
    if (!cs || !total || !name) throw new Error("กรอกชื่อวิชาและเวลาเรียนรวม");
    const row = must(await sb.from("course_structures").insert({
      curriculum_structure_id: cs.id, subject_id: cs.subject_id, curriculum_id: cs.curriculum_id, grade: cs.grade,
      course_code: $("#t2code").value.trim() || null, course_name: name, total_hours: total, semester_count: Number($("#t2sem").value),
    }).select().single());
    S.courses.unshift(row); S.course = row; S.cs = cs; S.rows = []; S.units = []; S.unit = null; S.plans = []; S.plan = null; saveSel();
    toast("สร้างโครงสร้างรายวิชาแล้ว กด 'ให้ AI ร่างหน่วย' หรือเพิ่มเอง", "ok"); render2();
  }),
  "t2-open": (b) => busy(b, async () => { S.course = S.courses.find((c) => c.id === b.dataset.id); await loadRows(); await loadUnits(); saveSel(); go("t2"); }),
  "t2-del": async (b) => {
    if (!confirm("ลบรายวิชานี้พร้อมหน่วยและแผนทั้งหมด?")) return;
    must(await sb.from("course_structures").delete().eq("id", b.dataset.id));
    S.courses = S.courses.filter((c) => c.id !== b.dataset.id);
    if (S.course?.id === b.dataset.id) { S.course = null; S.rows = []; S.units = []; S.unit = null; S.plans = []; S.plan = null; }
    saveSel(); render2();
  },
  "t2-add": () => { S.rows.push({ id: uid(), kind: "unit", semester: 1, name: "หน่วยใหม่", indicator_codes: [], hours: 1, score_weight: 0 }); renderT2Edit(); },
  "t2-addexam": () => { const n = S.rows.filter((r) => r.kind === "exam").length + 1; S.rows.push({ id: uid(), kind: "exam", semester: n, name: `สอบปลายภาคเรียนที่ ${n}`, indicator_codes: [], hours: 1, score_weight: 10 }); renderT2Edit(); },
  "t2-rm": (b) => { S.rows.splice(Number(b.dataset.row), 1); renderT2Edit(); },
  "t2-up": (b) => { const i = Number(b.dataset.row); if (i > 0) { [S.rows[i - 1], S.rows[i]] = [S.rows[i], S.rows[i - 1]]; renderT2Edit(); } },
  "t2-down": (b) => { const i = Number(b.dataset.row); if (i < S.rows.length - 1) { [S.rows[i + 1], S.rows[i]] = [S.rows[i], S.rows[i + 1]]; renderT2Edit(); } },
  "t2-ind": async (b) => pickIndicators(await courseIndicators(), S.rows[Number(b.dataset.row)].indicator_codes, (codes) => { S.rows[Number(b.dataset.row)].indicator_codes = codes; renderT2Edit(); }),
  "t2-save": (b) => busy(b, async () => {
    const rows = S.rows.map((r, i) => ({ id: r.id, course_structure_id: S.course.id, seq: i + 1, kind: r.kind, semester: r.semester || null, name: r.name, indicator_codes: r.kind === "unit" ? r.indicator_codes : [], hours: num(r.hours), score_weight: num(r.score_weight) }));
    if (rows.length) must(await sb.from("course_structure_rows").upsert(rows, { onConflict: "id" }));
    const keep = rows.map((r) => r.id);
    let del = sb.from("course_structure_rows").delete().eq("course_structure_id", S.course.id);
    if (keep.length) del = del.not("id", "in", `(${keep.join(",")})`);
    must(await del); await loadRows(); toast("บันทึกแล้ว", "ok"); renderT2Edit();
  }),
  "t2-ai": (b) => busy(b, async () => {
    if (S.rows.length && !confirm("แทนที่แถวทั้งหมดด้วยที่ AI ร่าง?")) return;
    const inds = await courseIndicators(), c = S.course;
    const inp = await readIn("st"); const out = await callAI(promptStructure({ subject: subjName(c.subject_id), grade: c.grade, curriculum: c.curriculum_id, totalHours: c.total_hours, semesters: c.semester_count, indicators: inds, material: inp.text }), { files: inp.files });
    const valid = new Set(inds.map((i) => i.code));
    S.rows = (out.rows ?? []).map((r) => ({ id: uid(), kind: r.kind === "exam" ? "exam" : "unit", semester: num(r.semester) || 1, name: String(r.name ?? ""), indicator_codes: (r.indicator_codes ?? []).filter((x) => valid.has(x)), hours: Math.round(num(r.hours)), score_weight: num(r.score_weight) }));
    toast("AI ร่างแล้ว ตรวจตัวเลขแล้วกดบันทึก", "ok"); renderT2Edit();
  }),

  // ---- tab 3
  "t3-import": (b) => busy(b, async () => {
    const list = S.rows.filter((r) => r.kind === "unit").map((r, i) => ({ course_structure_id: S.course.id, source_row_id: r.id, seq: i + 1, semester: r.semester, name: r.name, indicator_codes: r.indicator_codes, hours: Math.max(1, num(r.hours)), score_weight: num(r.score_weight) }));
    must(await sb.from("units").insert(list)); await loadUnits(); toast(`สร้าง ${list.length} หน่วย`, "ok"); renderT3Body();
  }),
  "t3-add": (b) => busy(b, async () => {
    const seq = (S.units.at(-1)?.seq ?? 0) + 1;
    must(await sb.from("units").insert({ course_structure_id: S.course.id, seq, name: "หน่วยใหม่", hours: 1, semester: 1 }));
    await loadUnits(); renderT3Body();
  }),
  "t3-ind": async (b) => { const i = Number(b.dataset.u); pickIndicators(await courseIndicators(), S.units[i].indicator_codes, (codes) => { S.units[i].indicator_codes = codes; renderT3Body(); }); },
  "t3-fill-all": (b) => busy(b, async () => {
    const inp = await readIn("un"), all = await courseIndicators(), c = S.course; let n = 0;
    for (const u of S.units) { if ((u.key_concept ?? "").trim()) continue;
      const out = await callAI(promptKeyIdea({ subject: subjName(c.subject_id), grade: c.grade, unit: u, indicators: all.filter((x) => u.indicator_codes.includes(x.code)), material: inp.text }), { files: inp.files });
      u.key_concept = String(out.key_idea ?? ""); must(await sb.from("units").update({ key_concept: u.key_concept }).eq("id", u.id)); n++; }
    toast(n ? `เติมสาระสำคัญ ${n} หน่วย` : "ทุกหน่วยมีสาระสำคัญแล้ว", "ok"); renderT3Body();
  }),
  "t3-ai": (b) => busy(b, async () => {
    const u = S.units[Number(b.dataset.u)], all = await courseIndicators();
    const out = await callAI(promptKeyIdea({ material: (await readIn("un")).text, subject: subjName(S.course.subject_id), grade: S.course.grade, unit: u, indicators: all.filter((x) => u.indicator_codes.includes(x.code)) }));
    u.key_concept = out.key_idea ?? ""; renderT3Body();
  }),
  "t3-save": (b) => busy(b, async () => {
    const u = S.units[Number(b.dataset.u)];
    must(await sb.from("units").update({ name: u.name, semester: u.semester || null, hours: num(u.hours), score_weight: num(u.score_weight), key_concept: u.key_concept, indicator_codes: u.indicator_codes }).eq("id", u.id));
    toast("บันทึกหน่วยแล้ว", "ok"); await loadUnits(u.id); renderT3Body();
  }),
  "t3-plans": async (b) => { S.unit = S.units[Number(b.dataset.u)]; S.plan = null; await loadPlans(); saveSel(); go("t4"); },
  "t3-del": async (b) => {
    const u = S.units[Number(b.dataset.u)]; if (!confirm(`ลบหน่วย "${u.name}" พร้อมแผนทั้งหมด?`)) return;
    must(await sb.from("units").delete().eq("id", u.id)); await loadUnits(); renderT3Body();
  },

  // ---- tab 4
  "close-modal": () => closeModal(),
  "t4-view": (b) => { try { localStorage.setItem("lp_view", b.dataset.v); } catch {} render4(); },
  "t4-up": (b) => busy(b, async () => { const i = S.plans.findIndex((p) => p.id === b.dataset.id); if (i > 0) { await swapSeq(S.plans[i], S.plans[i - 1]); await loadPlans(); render4(); } }),
  "t4-down": (b) => busy(b, async () => { const i = S.plans.findIndex((p) => p.id === b.dataset.id); if (i >= 0 && i < S.plans.length - 1) { await swapSeq(S.plans[i], S.plans[i + 1]); await loadPlans(); render4(); } }),
  "t4-copy": (b) => busy(b, async () => {
    const src = S.plans.find((p) => p.id === b.dataset.id), seq = (S.plans.at(-1)?.seq ?? 0) + 1;
    const row = must(await sb.from("lesson_plans").insert({ unit_id: S.unit.id, seq, title: src.title + " (สำเนา)", hours: src.hours, indicator_codes: src.indicator_codes, sections: JSON.parse(JSON.stringify(src.sections ?? {})) }).select().single());
    await loadPlans(); S.plan = S.plans.find((p) => p.id === row.id); toast("คัดลอกแผนแล้ว", "ok"); render4();
  }),
  "t4-del-id": async (b) => {
    if (!confirm("ลบแผนนี้?")) return;
    try { must(await sb.from("lesson_plans").delete().eq("id", b.dataset.id)); if (S.plan?.id === b.dataset.id) S.plan = null; await loadPlans(); render4(); } catch (e) { toast(e.message, "err"); }
  },
  "t4-check": (b) => busy(b, checkCourse),
  "t6-prev": () => { const i = S.plans.findIndex((p) => p.id === S.plan?.id); if (S.plans[i - 1]) { S.plan = S.plans[i - 1]; render6(); } },
  "t6-next": () => { const i = S.plans.findIndex((p) => p.id === S.plan?.id); if (S.plans[i + 1]) { S.plan = S.plans[i + 1]; render6(); } },
  "t6-edit": () => go("t5"),
  "t4-preview": () => go("t6"),
  "t5-prev": () => stepPlan(-1),
  "t5-next": () => stepPlan(1),
  "t4-save-next": (b) => busy(b, async () => { collectPlan(); await savePlan(); toast("บันทึกแผนแล้ว", "ok"); await stepPlan(1); }),
  "t4-ai-titles": (b) => busy(b, async () => {
    const all = await courseIndicators(), c = S.course;
    const unitInds = all.filter((i) => S.unit.indicator_codes.includes(i.code));
    const have = sum(S.plans.map((p) => num(p.hours))), count = Math.max(0, Math.min(40, num(S.unit.hours) - have));
    if (!count) throw new Error("ชั่วโมงแผนครบตามหน่วยแล้ว (เพิ่มชั่วโมงของหน่วยในแถบ 4 หรือลบหัวข้อก่อน)");
    toast("AI กำลังวางหัวข้อแผน...");
    const inp = await readIn("ti"); const out = await callAI(promptPlanTitles({ subject: subjName(c.subject_id), grade: c.grade, unit: S.unit, indicators: unitInds, count, material: inp.text }), { files: inp.files });
    const list = (out.plans ?? []).slice(0, count);
    if (!list.length) throw new Error("AI ไม่ได้ส่งรายการหัวข้อกลับมา");
    const valid = new Set(S.unit.indicator_codes);
    let seq = S.plans.at(-1)?.seq ?? 0;
    for (const it of list) {
      const codes = (it.indicator_codes ?? []).filter((x) => valid.has(x));
      must(await sb.from("lesson_plans").insert({ unit_id: S.unit.id, seq: ++seq, title: String(it.title ?? `แผนที่ ${seq}`), hours: 1, indicator_codes: codes.length ? codes : S.unit.indicator_codes, sections: emptySections() }));
    }
    await loadPlans(); render4(); toast(`วางหัวข้อ ${list.length} แผนแล้ว ตรวจและแก้ชื่อได้ในตาราง แล้วกด “เขียนแผน →”`, "ok");
  }),
  "t4-ai-all": (b) => busy(b, async () => {
    const all = await courseIndicators(), c = S.course;
    const unitInds = all.filter((i) => S.unit.indicator_codes.includes(i.code));
    if (!S.plans.length) {
      const count = Math.max(1, Math.min(40, num(S.unit.hours)));
      toast("AI กำลังวางหัวข้อแผน...");
      const out = await callAI(promptPlanTitles({ subject: subjName(c.subject_id), grade: c.grade, unit: S.unit, indicators: unitInds, count }));
      const list = (out.plans ?? []).slice(0, count);
      if (!list.length) throw new Error("AI ไม่ได้ส่งรายการแผนกลับมา");
      const valid = new Set(S.unit.indicator_codes);
      for (let i = 0; i < list.length; i++) {
        const codes = (list[i].indicator_codes ?? []).filter((x) => valid.has(x));
        must(await sb.from("lesson_plans").insert({ unit_id: S.unit.id, seq: i + 1, title: String(list[i].title ?? `แผนที่ ${i + 1}`), hours: 1, indicator_codes: codes.length ? codes : S.unit.indicator_codes, sections: emptySections() }));
      }
      await loadPlans();
    }
    const todo = S.plans.filter((p) => !planDone(p)); let ok = 0, fail = 0, lastErr = "";
    for (let i = 0; i < todo.length; i++) {
      toast(`AI กำลังร่างแผน ${i + 1}/${todo.length}...`);
      try { await aiDraftPlan(todo[i]); must(await sb.from("lesson_plans").update({ sections: todo[i].sections, updated_at: new Date().toISOString() }).eq("id", todo[i].id)); ok++; }
      catch (e) { fail++; lastErr = e.message; if (/NO_KEYS|ALL_KEYS_FAILED/.test(lastErr)) break; }
    }
    await loadPlans(); render4();
    toast(`ร่างสำเร็จ ${ok} แผน${fail ? ` ไม่สำเร็จ ${fail} (${lastErr}) กดปุ่มอีกครั้งเพื่อร่างที่เหลือ` : ""}`, fail ? "err" : "ok");
  }),
  "t4-ai-field": (b) => busy(b, async () => {
    collectPlan();
    const path = b.dataset.path, cur = path.split(".").reduce((o, k) => o?.[k], S.plan.sections) ?? "";
    const all = await courseIndicators(), c = S.course;
    const out = await callAI(promptField({ subject: subjName(c.subject_id), grade: c.grade, unit: S.unit, plan: S.plan, label: b.dataset.label, current: cur, indicators: all.filter((i) => S.plan.indicator_codes.includes(i.code)) }));
    setPath(S.plan.sections, path, Array.isArray(out.text) ? out.text.join("\n") : String(out.text ?? ""));
    await savePlan(); renderPlanEditor(); toast("AI เขียนหัวข้อใหม่แล้ว", "ok");
  }),
  "t4-as-add": () => { collectPlan(); S.plan.sections.assessment.push({ item: "รายการใหม่", method: "", tool: "", criteria: "" }); renderPlanEditor(); },
  "t4-as-del": (b) => { collectPlan(); S.plan.sections.assessment.splice(Number(b.dataset.i), 1); renderPlanEditor(); },
  "t4-att-add": () => { collectPlan(); (S.plan.sections.attachments ??= []).push({ title: "ใบงาน", body: "" }); renderPlanEditor(); },
  "t4-att-del": (b) => { collectPlan(); S.plan.sections.attachments.splice(Number(b.dataset.i), 1); renderPlanEditor(); },
  "t4-att-ai": (b) => busy(b, async () => {
    collectPlan(); const all = await courseIndicators(), c = S.course;
    const out = await callAI(promptAttachments({ subject: subjName(c.subject_id), grade: c.grade, unit: S.unit, plan: S.plan, indicators: all.filter((i) => S.plan.indicator_codes.includes(i.code)) }));
    const add = (out.attachments ?? []).map((a) => ({ title: String(a.title ?? ""), body: Array.isArray(a.body) ? a.body.join("\n") : String(a.body ?? "") }));
    (S.plan.sections.attachments ??= []).push(...add); await savePlan(); renderPlanEditor(); toast("AI ร่างเอกสารแนบแล้ว", "ok");
  }),
  "t4-pick": (b) => { S.plan = S.plans.find((p) => p.id === b.dataset.id); go("t5"); },
  "t4-add": (b) => busy(b, async () => {
    const seq = (S.plans.at(-1)?.seq ?? 0) + 1;
    const row = must(await sb.from("lesson_plans").insert({ unit_id: S.unit.id, seq, title: "แผนใหม่", hours: 1, indicator_codes: S.unit.indicator_codes, sections: emptySections() }).select().single());
    await loadPlans(); S.plan = S.plans.find((p) => p.id === row.id); render4();
  }),
  "t5-qa": (b) => { const t = document.querySelector(`[data-p="${b.dataset.path}"]`); if (!t) return; t.value = (t.value.replace(/\s+$/, "") + '\n- ครูถามว่า: ""\n- ตัวอย่างคำตอบของนักเรียน: ""').replace(/^\n/, ""); t.focus(); },
  "t10-refresh": () => render10(),
  "t4-ind-rm": async (b, e) => { e?.preventDefault?.(); const p = S.plans.find((x) => x.id === b.dataset.id); if (!p) return;
    must(await sb.from("lesson_plans").update({ indicator_codes: p.indicator_codes.filter((c) => c !== b.dataset.code) }).eq("id", p.id)); await loadPlans(); render4(); },
  "t4-ind-edit": async (b) => { const p = S.plans.find((x) => x.id === b.dataset.id); if (!p) return;
    const all = await courseIndicators(), inU = new Set(S.unit.indicator_codes), list = [...all.filter((i) => inU.has(i.code)), ...all.filter((i) => !inU.has(i.code))];
    pickIndicators(list, p.indicator_codes, async (codes) => {
      must(await sb.from("lesson_plans").update({ indicator_codes: codes }).eq("id", p.id));
      const extra = codes.filter((c) => !inU.has(c));
      if (extra.length) { S.unit.indicator_codes = [...S.unit.indicator_codes, ...extra]; must(await sb.from("units").update({ indicator_codes: S.unit.indicator_codes }).eq("id", S.unit.id)); toast(`เพิ่ม ${extra.length} ตัวชี้วัดนอกหน่วยเข้าหน่วยด้วย`, "ok"); }
      await loadPlans(); render4(); }); },
  "t4-ind": async () => pickIndicators((await courseIndicators()).filter((i) => S.unit.indicator_codes.includes(i.code)), S.plan.indicator_codes, (codes) => { collectPlan(); S.plan.indicator_codes = codes; renderPlanEditor(); }),
  "t4-save": (b) => busy(b, async () => { collectPlan(); await savePlan(); toast("บันทึกแผนแล้ว", "ok"); render5(); }),
  "t4-del": async () => {
    if (!confirm("ลบแผนนี้?")) return;
    must(await sb.from("lesson_plans").delete().eq("id", S.plan.id)); S.plan = null; await loadPlans(); render5();
  },
  "t5-fill": (b) => busy(b, async () => {
    collectPlan(); const inp = await readIn("pl"), onlyEmpty = $("#plOnly")?.checked ?? true, p = S.plan, c = S.course;
    if (!inp.has && !onlyEmpty) throw new Error("ใส่ข้อมูลจากครูก่อน หรือติ๊กเติมเฉพาะช่องว่าง");
    const all = await courseIndicators(), prev = JSON.parse(JSON.stringify(p.sections ?? {}));
    const out = await callAI(promptPlanFill({ school: S.settings?.school_name, subject: subjName(c.subject_id), grade: c.grade, courseCode: c.course_code, unit: S.unit, plan: p, indicators: all.filter((i) => p.indicator_codes.includes(i.code)), current: prev, material: inp.text }), { files: inp.files });
    const fresh = planFromOut(out, prev), merged = JSON.parse(JSON.stringify(prev)); let filled = 0;
    for (const path of PLAN_FIELDS) { const cur = pGet(merged, path), nv = pGet(fresh, path); if (pEmpty(nv)) continue; if (!onlyEmpty || pEmpty(cur)) { pSet(merged, path, nv); if (pEmpty(cur) || String(cur) !== String(nv)) filled++; } }
    p.sections = { ...emptySections(), ...merged }; await savePlan(); renderPlanEditor();
    const gaps = PLAN_FIELDS.filter((f) => pEmpty(pGet(p.sections, f))), A = (out.assumptions ?? []).map(String), Q = (out.questions ?? []).map(String);
    openModal(`<h3>ผลวิเคราะห์ข้อมูลจากครู</h3><p class="small">เติม/ปรับ ${filled} ช่อง${onlyEmpty ? " (ไม่ทับที่เขียนไว้แล้ว)" : ""} · ยังว่าง ${gaps.length} ช่อง</p>
      ${A.length ? `<b class="small">AI สันนิษฐานเอง (ให้ครูตรวจ)</b><ul class="small">${A.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${Q.length ? `<b class="small">ควรขอข้อมูลเพิ่มจากครู</b><ul class="small">${Q.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${gaps.length ? `<b class="small">ช่องที่ยังว่าง</b><div class="small muted">${gaps.map(esc).join(", ")}</div>` : ""}
      <div class="row" style="margin-top:12px"><button class="btn primary" id="mCancel">ปิด</button></div>`); $("#mCancel").onclick = closeModal;
  }),
  "t4-ai": (b) => busy(b, async () => { collectPlan(); await aiDraftPlan(S.plan); await savePlan(); toast("AI ร่างแผนแล้ว (ตรวจก่อนใช้จริง)", "ok"); renderPlanEditor(); }),
  "t4-export": (b) => busy(b, async () => { collectPlan(); await savePlan(); const m = await import("./export.js"); await m.exportPlans(await exportCtx(), [S.plan]); }),
  "t4-export-unit": (b) => busy(b, async () => { const m = await import("./export.js"); await m.exportPlans(await exportCtx(), S.plans); }),

  // ---- tab 5
  "bk-export": (b) => busy(b, async () => {
    const out = { app: "lesson-plan", version: 1, exported_at: new Date().toISOString() };
    for (const t of BK_TABLES) out[t] = must(await sb.from(t).select("*"));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
    a.download = `lesson-plan-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(a); a.click(); a.remove(); toast("ดาวน์โหลดไฟล์สำรองแล้ว", "ok");
  }),
  "s-save": (b) => busy(b, async () => {
    const row = { owner_id: S.user.id, school_name: $("#sSchool").value.trim(), teacher_name: $("#sTeacher").value.trim(), deputy_name: $("#sDeputy").value.trim(), director_name: $("#sDirector").value.trim(), academic_year: $("#sYear").value.trim(), ai_model: $("#sModel").value.trim() || "gemini-2.5-flash", updated_at: new Date().toISOString() };
    S.settings = must(await sb.from("app_settings").upsert(row, { onConflict: "owner_id" }).select().single()); toast("บันทึกแล้ว", "ok");
  }),
  "s-models": (b) => busy(b, async () => { const n = await fetchModels(); toast(`พบ ${n} โมเดลที่คีย์ของคุณใช้ได้ เลือกจากรายการแล้วกดบันทึก`, "ok"); }),
  "k-add": (b) => busy(b, async () => {
    const label = $("#kLabel").value.trim() || `คีย์ ${S.keys.length + 1}`, key = $("#kVal").value.trim();
    if (!key) throw new Error("วาง API key ก่อน");
    must(await sb.from("api_keys").insert({ label, api_key: key, priority: (S.keys.at(-1)?.priority ?? 0) + 10 }));
    await reloadKeys(); toast("เพิ่มคีย์แล้ว กำลังดึงรายชื่อโมเดล...", "ok"); try { const n = await fetchModels(); toast(`เพิ่มคีย์แล้ว พบ ${n} โมเดลให้เลือก`, "ok"); } catch (e) { toast("เพิ่มคีย์แล้ว แต่ดึงรายชื่อโมเดลไม่สำเร็จ: " + e.message, "err"); }
  }),
  "k-del": async (b) => { if (!confirm("ลบคีย์นี้?")) return; must(await sb.from("api_keys").delete().eq("id", b.dataset.id)); await reloadKeys(); },
  "k-toggle": async (b) => { const k = S.keys.find((x) => x.id === b.dataset.id); must(await sb.from("api_keys").update({ enabled: !k.enabled }).eq("id", k.id)); await reloadKeys(); },
  "k-reset": async (b) => { must(await sb.from("api_keys").update({ exhausted_until: null, last_error: null, enabled: true }).eq("id", b.dataset.id)); await reloadKeys(); },
  "k-up": (b) => moveKey(b.dataset.id, -1),
  "k-down": (b) => moveKey(b.dataset.id, 1),
};
async function reloadKeys() {
  S.keys = must(await sb.from("api_keys").select(KEYCOLS).order("priority").order("created_at")); render7();
}
async function moveKey(id, d) {
  const i = S.keys.findIndex((k) => k.id === id), j = i + d; if (j < 0 || j >= S.keys.length) return;
  const order = [...S.keys]; [order[i], order[j]] = [order[j], order[i]];
  for (let n = 0; n < order.length; n++) must(await sb.from("api_keys").update({ priority: (n + 1) * 10 }).eq("id", order[n].id));
  await reloadKeys();
}

// plan editor <-> state
function setPath(obj, path, val) {
  const ks = path.split("."); let o = obj;
  ks.slice(0, -1).forEach((k) => (o = o[k] ??= (isNaN(Number(ks[ks.indexOf(k) + 1])) ? {} : [])));
  o[ks.at(-1)] = val;
}
function collectPlan() {
  const p = S.plan; if (!p || !$("#pTitle")) return;
  p.title = $("#pTitle").value.trim() || p.title; p.hours = Math.max(1, num($("#pHours").value)); p.status = $("#pStatus").value;
  $$("#t4edit [data-p]").forEach((el) => setPath(p.sections, el.dataset.p, el.value));
  const groups = {};
  $$("#t4edit [data-pc]").forEach((el) => { (groups[el.dataset.pc] ??= []); if (el.checked) groups[el.dataset.pc].push(el.value); });
  Object.entries(groups).forEach(([path, v]) => setPath(p.sections, path, v));
}

function planFromOut(out, prev) {
  const base = emptySections(), lines = (v) => Array.isArray(v) ? v.join("\n") : String(v ?? "");
  return {
    ...base, ...out,
    objectives: { ...base.objectives, ...out.objectives },
    competencies: { ...base.competencies, ...out.competencies },
    sufficiency: { ...base.sufficiency, ...out.sufficiency },
    resources: { inside: lines(out.resources?.inside), outside: lines(out.resources?.outside) || "-", local: lines(out.resources?.local) || "-" },
    focus: prev.focus ?? base.focus,
    attachments: prev.attachments ?? [],
    process: Array.from({ length: 5 }, (_, i) => String(out.process?.[i] ?? "")),
    content: lines(out.content), media: lines(out.media), traits: (out.traits ?? []).filter((t) => TRAITS.includes(t)),
    assessment: base.assessment.map((a, i) => ({ ...a, ...(out.assessment?.[i] ?? {}), item: a.item })),
  };
}
async function aiDraftPlan(plan) {
  const all = await courseIndicators(), c = S.course;
  const out = await callAI(promptPlan({
    school: S.settings?.school_name, subject: subjName(c.subject_id), grade: c.grade, courseCode: c.course_code, unit: S.unit,
    plan, indicators: all.filter((i) => plan.indicator_codes.includes(i.code)),
  }));
  plan.sections = planFromOut(out, plan.sections ?? {});
}
const PLAN_FIELDS = ["objectives.K", "objectives.P", "objectives.A", "content", "key_idea", "media", "competencies.local", "competencies.key", "sufficiency.moderation", "sufficiency.reason", "sufficiency.immunity", "sufficiency.knowledge", "sufficiency.morality", "resources.inside", "process.0", "process.1", "process.2", "process.3", "process.4", "traits", ...[0, 1, 2, 3].flatMap((i) => ["method", "tool", "criteria"].map((k) => `assessment.${i}.${k}`))];
const pGet = (o, path) => path.split(".").reduce((x, k) => x?.[k], o);
const pSet = (o, path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((x, k) => (x[k] ??= {}), o)[last] = v; };
const pEmpty = (v) => v == null || (Array.isArray(v) ? !v.length : !String(v).trim() || String(v).trim() === "-");
async function updatePlanRow(id, patch) {
  must(await sb.from("lesson_plans").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id));
}
async function swapSeq(a, b) {
  const T = 100000 + Math.floor(Math.random() * 1000);
  await updatePlanRow(a.id, { seq: T }); await updatePlanRow(b.id, { seq: a.seq }); await updatePlanRow(a.id, { seq: b.seq });
}
async function checkCourse() {
  const ids = S.units.map((u) => u.id);
  const plans = must(await sb.from("lesson_plans").select("unit_id,title,hours,indicator_codes,sections,status").in("unit_id", ids));
  const probs = [];
  const courseCodes = new Set(S.rows.flatMap((r) => r.indicator_codes ?? []));
  const usedInUnits = new Set(S.units.flatMap((u) => u.indicator_codes ?? []));
  const lostCodes = [...courseCodes].filter((c) => !usedInUnits.has(c));
  if (lostCodes.length) probs.push(`ตัวชี้วัดในโครงสร้างรายวิชาที่ไม่มีหน่วยรองรับ: ${lostCodes.join(", ")}`);
  let draftCount = 0, total = 0;
  S.units.forEach((u) => {
    const ps = plans.filter((p) => p.unit_id === u.id), h = sum(ps.map((p) => num(p.hours)));
    const tag = `หน่วยที่ ${u.seq} ${u.name}`;
    if (!ps.length) probs.push(`${tag}: ยังไม่มีแผน`);
    else if (h !== num(u.hours)) probs.push(`${tag}: ชั่วโมงแผนรวม ${h} ไม่เท่ากับ ${u.hours}`);
    const covered = new Set(ps.flatMap((p) => p.indicator_codes ?? []));
    const miss = (u.indicator_codes ?? []).filter((c) => !covered.has(c));
    if (ps.length && miss.length) probs.push(`${tag}: ตัวชี้วัดที่ไม่มีแผนรองรับ: ${miss.join(", ")}`);
    ps.forEach((p) => { total++; if (!String(p.sections?.key_idea ?? "").trim()) draftCount++; if (!(p.indicator_codes ?? []).length) probs.push(`${tag} · "${p.title}": ยังไม่เลือกตัวชี้วัด`); });
  });
  if (draftCount) probs.push(`แผนที่ยังไม่มีเนื้อหา: ${draftCount} จาก ${total} แผน`);
  openModal(`<h3>ตรวจความครบถ้วนทั้งรายวิชา</h3>${probs.length ? `<ul>${probs.map((x) => `<li>⚠ ${esc(x)}</li>`).join("")}</ul>` : "<p>✅ ครบถ้วน ไม่พบปัญหา</p>"}<div class="row"><button class="btn" data-act="close-modal">ปิด</button></div>`);
}
async function savePlan() {
  const p = S.plan;
  must(await sb.from("lesson_plans").update({ title: p.title, hours: p.hours, status: p.status, indicator_codes: p.indicator_codes, sections: p.sections, updated_at: new Date().toISOString() }).eq("id", p.id));
  await loadPlans();
}
async function exportCtx(unit = S.unit) {
  const c = S.course, cs = csOfCourse(c), inds = await courseIndicators();
  const stds = cs?.content?.standards ?? (await loadStds(c.curriculum_id, c.subject_id));
  return { school: S.settings?.school_name ?? "", teacher: S.settings?.teacher_name ?? "", deputy: S.settings?.deputy_name ?? "", director: S.settings?.director_name ?? "", year: S.settings?.academic_year ?? "", course: c, unit, subject: subjName(c.subject_id), indicators: inds, standards: stds, thNum };
}

// indicator picker modal
function pickIndicators(all, current, onOk) {
  openModal(`<h3>เลือกตัวชี้วัด</h3><div class="list" style="max-height:55vh;overflow:auto">${all.map((i) => `<label style="flex-direction:row;gap:10px;align-items:flex-start;color:var(--text);background:var(--panel2);padding:8px;border-radius:8px"><input type="checkbox" value="${esc(i.code)}" ${current.includes(i.code) ? "checked" : ""}><span><b>${esc(i.code)}</b> ${esc(i.description)}</span></label>`).join("") || '<div class="muted">ไม่มีตัวชี้วัดให้เลือก (ต้องเลือกตัวชี้วัดในระดับก่อนหน้าก่อน)</div>'}</div>
  <div class="row" style="margin-top:12px"><button class="btn primary" id="mOk">ตกลง</button><button class="btn" id="mCancel">ยกเลิก</button></div>`);
  $("#mCancel").onclick = closeModal;
  $("#mOk").onclick = () => { const codes = $$("#modalBody input:checked").map((x) => x.value); closeModal(); onOk(codes); };
}

Object.assign(actions, {
  "t8-all": () => { (T8.plans ?? []).forEach((p) => T8.sel.add(p.id)); render8(); },
  "t8-none": () => { T8.sel.clear(); render8(); },
  "t8-one": (b) => busy(b, async () => { const p = T8.plans.find((x) => x.id === b.dataset.id); const [f] = await t8Files([p]); await t8Download(f.blob, f.name); }),
  "t8-unit": (b) => busy(b, async () => { const u = S.units.find((x) => x.id === b.dataset.id); const m = await import("./export.js"); const { blob, name } = await m.planBlob(await exportCtx(u), T8.plans.filter((p) => p.unit_id === u.id)); await t8Download(blob, name); }),
  "t8-each": (b) => busy(b, async () => { const l = t8Chosen(); if (!l.length) return toast("ยังไม่ได้เลือกแผน", "err"); for (const f of await t8Files(l)) { await t8Download(f.blob, f.name); await new Promise((r) => setTimeout(r, 600)); } }),
  "t8-zip": (b) => busy(b, async () => {
    const l = t8Chosen(); if (!l.length) return toast("ยังไม่ได้เลือกแผน", "err");
    const JSZip = (await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm")).default;
    const z = new JSZip(); for (const f of await t8Files(l)) z.file(f.name, f.blob);
    await t8Download(await z.generateAsync({ type: "blob" }), `${safeName(S.course.course_code || "แผน")}_แผนรายคาบ.zip`);
  }),
  "t8-csv": (b) => busy(b, async () => {
    const inds = await courseIndicators(); const q = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
    const csv = "\ufeffรหัส,ตัวชี้วัด\n" + inds.map((i) => `${q(i.code)},${q(i.description)}`).join("\n");
    await t8Download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${safeName(S.course.course_code || "course")}_ตัวชี้วัด.csv`);
  }),
  "t8-json": (b) => busy(b, async () => {
    const data = { course: S.course, units: S.units, plans: T8.plans ?? [], indicators: await courseIndicators() };
    await t8Download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${safeName(S.course.course_code || "course")}_ข้อมูล.json`);
  }),
});

Object.assign(actions, {
  "t9-cur": (b) => busy(b, async () => { const cx = await t9Ctx(b.dataset.id); if (!cx.doc?.course_description) await t9Draft(cx); await t9Save(await (await import("./curdoc.js")).buildCurriculumDoc(cx), `หลักสูตร_${cx.courseCode || cx.courseName}`); render9(); }),
  "t9-sch": (b) => busy(b, async () => { const cx = await t9Ctx(b.dataset.id); await t9Save(await (await import("./curdoc.js")).buildScheduleDoc(cx), `โครงสร้างกำหนดการสอน_${cx.courseCode || cx.courseName}`); }),
  "t9-aidoc": (b) => busy(b, async () => { const cx = await t9Ctx(b.dataset.id); await t9Draft(cx); toast("AI ร่างเนื้อหาหลักสูตรแล้ว กด 'หลักสูตรสถานศึกษา (Word)' เพื่อโหลด", "ok"); render9(); }),
  "t9-all": (b) => busy(b, async () => {
    const code = $("#t9code").value.trim(), name = $("#t9name").value.trim(), total = num($("#t9hours").value), sem = Number($("#t9sem").value);
    if (!name || !total) throw new Error("กรอกชื่อรายวิชาและชั่วโมงทั้งปี");
    t9Msg("1/5 ดึงมาตรฐานและตัวชี้วัด...");
    const inds = await loadInds(T9.curriculum, T9.subject, T9.grade), stds = await loadStds(T9.curriculum, T9.subject);
    if (!inds.length) throw new Error("ยังไม่มีตัวชี้วัดของวิชา/ชั้น/หลักสูตรนี้ในระบบ ไปแถบ 0 → 'นำเข้าตัวชี้วัดเอง' ก่อน");
    const school = S.settings?.school_name ?? "";
    const content = { school_name: school, standards: stds.filter((x) => inds.some((i) => i.standard_code === x.standard_code)), indicators: inds, time: { total_hours: total } };
    const cs = must(await sb.from("curriculum_structures").insert({ subject_id: T9.subject, curriculum_id: T9.curriculum, grade: T9.grade, school_name: school, title: `${name} ป.${T9.grade}`, content }).select().single());
    S.curStructs.unshift(cs);
    const course = must(await sb.from("course_structures").insert({ curriculum_structure_id: cs.id, subject_id: cs.subject_id, curriculum_id: cs.curriculum_id, grade: cs.grade, course_code: code || null, course_name: name, total_hours: total, semester_count: sem }).select().single());
    S.courses.unshift(course); S.course = course; S.cs = cs; S.indCache = {}; saveSel();
    const subj = subjName(T9.subject), curName = S.curricula.find((x) => x.id === T9.curriculum)?.name ?? T9.curriculum;
    t9Msg("2/5 AI ร่างเนื้อหาหลักสูตร...");
    await t9Draft({ cs, subject: subj, grade: T9.grade, curriculumName: curName, school, indicators: inds, standards: content.standards });
    t9Msg("3/5 AI ร่างหน่วยการเรียนรู้ ชั่วโมง คะแนน...");
    const out = await callAI(promptStructure({ subject: subj, grade: T9.grade, curriculum: T9.curriculum, totalHours: total, semesters: sem, indicators: inds }));
    const valid = new Set(inds.map((i) => i.code));
    const rows = (out.rows ?? []).map((r, i) => ({ id: uid(), course_structure_id: course.id, seq: i + 1, kind: r.kind === "exam" ? "exam" : "unit", semester: num(r.semester) || 1, name: String(r.name ?? ""), indicator_codes: r.kind === "exam" ? [] : (r.indicator_codes ?? []).filter((x) => valid.has(x)), hours: Math.round(num(r.hours)), score_weight: num(r.score_weight) }));
    if (!rows.length) throw new Error("AI ไม่ได้ส่งหน่วยกลับมา ลองกดใหม่");
    t9Msg("4/5 บันทึกโครงสร้าง..."); must(await sb.from("course_structure_rows").insert(rows));
    t9Msg("5/5 สร้างหน่วยการเรียนรู้...");
    must(await sb.from("units").insert(rows.filter((r) => r.kind === "unit").map((r, i) => ({ course_structure_id: course.id, source_row_id: r.id, seq: i + 1, semester: r.semester, name: r.name, indicator_codes: r.indicator_codes, hours: Math.max(1, r.hours), score_weight: r.score_weight }))));
    await loadRows(); await loadUnits(); t9Msg("");
    toast("สร้างเสร็จ โหลดไฟล์ Word ได้ที่รายการด้านล่าง", "ok"); render9();
  }),
});

Object.assign(actions, {
  "bk-new": (b) => busy(b, async () => {
    const c = { stds: await loadStds(BK.curriculum, BK.subject) };
    let nInd = 0; for (let g = 1; g <= 6; g++) nInd += (await loadInds(BK.curriculum, BK.subject, g)).length;
    if (!c.stds.length || !nInd) throw new Error(`ยังไม่มีมาตรฐาน/ตัวชี้วัดของ ${subjName(BK.subject)} (${BK.curriculum}) ในระบบ ไปแถบ 0 → "นำเข้าตัวชี้วัดเอง" วางจากเอกสารหลักสูตรก่อน`); const ab = c.stds[0]?.standard_code?.split(" ")[0] ?? "";
    const grades = {}; for (let g = 1; g <= 6; g++) grades[g] = { hours: DEF_HOURS[BK.subject]?.[g - 1] ?? 80, code: `${ab}1${g}101`, name: subjName(BK.subject), desc: "", structure: [], core: {} };
    const row = must(await sb.from("curriculum_books").insert({ subject_id: BK.subject, curriculum_id: BK.curriculum, title: `เล่มหลักสูตร ${subjName(BK.subject)}`, data: { texts: {}, grades } }).select().single());
    BK.books.unshift(row); BK.book = row; render0();
  }),
  "bk-open": (b) => { BK.book = BK.books.find((x) => x.id === b.dataset.id); render0(); },
  "bk-del": async (b) => { if (!confirm("ลบเล่มนี้?")) return; must(await sb.from("curriculum_books").delete().eq("id", b.dataset.id)); if (BK.book?.id === b.dataset.id) BK.book = null; await bkLoad(); render0(); },
  "bk-ai-text": (b) => busy(b, async () => { const c = await bkCtx(), x = await readIn("bk_" + b.dataset.k); await bkAiText(b.dataset.k, c, x); bkSave(); renderBook(); }),
  "bk-ai-core": (b) => busy(b, async () => { const c = await bkCtx(); await bkRun([[`ป.${b.dataset.g} สาระที่ ${b.dataset.n}`, () => bkAiCore(Number(b.dataset.g), b.dataset.n, c)]]); }),
  "bk-ai-struct": (b) => busy(b, async () => { const c = await bkCtx(); await bkRun([[`โครงสร้างรายวิชา ป.${b.dataset.g}`, () => bkAiStruct(Number(b.dataset.g), c)]]); }),
  "bk-ai-desc": (b) => busy(b, async () => { const c = await bkCtx(); await bkRun([[`คำอธิบายรายวิชา ป.${b.dataset.g}`, () => bkAiDesc(Number(b.dataset.g), c)]]); }),
  "bk-use-course": (b) => busy(b, async () => {
    const g = Number(b.dataset.g), bk = BK.book, own = S.courses.find((x) => x.subject_id === bk.subject_id && x.curriculum_id === bk.curriculum_id && x.grade === g);
    if (!own) throw new Error(`ยังไม่มีรายวิชา ป.${g} ในแถบ 3`);
    const rows = must(await sb.from("course_structure_rows").select("*").eq("course_structure_id", own.id).order("seq"));
    const gd = (bk.data.grades[g] ??= {}); gd.hours = own.total_hours; if (own.course_code) gd.code = own.course_code; gd.name = own.course_name;
    gd.structure = rows.map((r) => ({ kind: r.kind, name: r.name, indicator_codes: r.indicator_codes ?? [], hours: r.hours, score_weight: r.score_weight, content: r.kind === "exam" ? "" : (r.indicator_codes ?? []).map((cd) => gd.core?.[cd.replace(/\./g, "‧")]).filter(Boolean).join(", ") }));
    bkSave(); renderBook();
  }),
  "bk-doc": (b) => busy(b, bkDoc),
  "read-run": (b) => busy(b, async () => {
    const fs = [...($("#readFiles")?.files ?? [])]; if (!fs.length) throw new Error("เลือกไฟล์ก่อน"); if (fs.length > 10) throw new Error("ไม่เกิน 10 ไฟล์");
    const withPlans = $("#readPlans")?.checked ?? true, c = S.course, inds = await courseIndicators();
    if (!inds.length) throw new Error("ยังไม่มีตัวชี้วัดของวิชา/ชั้นนี้ในระบบ นำเข้าที่แถบ 0 ก่อน");
    const docs = fs.filter((f) => /\.docx$/i.test(f.name)), media = fs.filter((f) => !/\.docx$/i.test(f.name));
    let parsed = null, docText = "";
    for (const f of docs) { const blocks = await docxBody(f); const r = parseSchedule(blocks, c); if (r) { if (parsed) { parsed.rows.push(...r.rows); parsed.warn.push(...r.warn); } else parsed = r; } else docText += `\n--- ไฟล์ ${f.name} ---\n` + bodyText(blocks); }
    if (parsed && !media.length && !docText) { READ = { ...resolveSchedule(parsed, inds), withPlans: true, notes: "อ่านจากตารางในไฟล์ Word โดยตรง (ไม่ใช้ AI)", course: {} }; }
    else {
      toast("กำลังให้ AI อ่าน อาจใช้เวลา 30–90 วินาที");
      const files = []; for (const f of media) files.push(await fileToPart(f));
      const out = await callAI(promptReadStructure({ subject: subjName(c.subject_id), grade: c.grade, curriculum: c.curriculum_id, totalHours: c.total_hours, semesters: c.semester_count, indicators: inds, withPlans, docText }), { files: files.length ? files : undefined });
      const rows = (out.rows ?? []).map((x) => { const kind = x.kind === "exam" ? "exam" : "unit";
        const plans = withPlans && kind === "unit" ? (x.plans ?? []).map((p) => ({ title: String(p.title ?? ""), hours: Math.max(1, Math.round(num(p.hours)) || 1), codes: p.indicator_codes ?? x.indicator_codes ?? [] })).filter((p) => p.title) : [];
        return { kind, semester: num(x.semester) || 1, name: String(x.name ?? ""), indicator_codes: [], codes_raw: x.indicator_codes ?? [], hours: Math.round(num(x.hours)), score_weight: num(x.score_weight), plans }; });
      if (!rows.length) throw new Error("AI อ่านไม่พบหน่วยการเรียนรู้ ลองไฟล์ที่ชัดขึ้น");
      rows.forEach((r) => { if (r.kind === "unit" && !r.plans.length) r.plans = []; });
      const res = resolveSchedule({ rows, warn: parsed?.warn ?? [] }, inds);
      res.rows.forEach((r) => { if (r.kind === "unit") { const m = matchCodes(r.codes_raw, inds); r.indicator_codes = [...new Set([...r.indicator_codes, ...m.ok])]; r.bad = [...new Set([...(r.bad ?? []), ...m.bad])]; } });
      READ = { ...res, withPlans, notes: String(out.notes ?? ""), course: out.course ?? {} };
    }
    READ.checks = scheduleChecks(READ, c, inds); renderT2Edit();
  }),
  "read-sethours": (b) => busy(b, async () => {
    const H = READ.rows.reduce((a, r) => a + num(r.hours), 0); if (!confirm(`เปลี่ยนชั่วโมงทั้งปีของรายวิชาจาก ${S.course.total_hours} เป็น ${H}?`)) return;
    must(await sb.from("course_structures").update({ total_hours: H }).eq("id", S.course.id)); S.course.total_hours = H; READ.checks = scheduleChecks(READ, S.course, await courseIndicators()); renderT2Edit();
  }),
  "read-fill": (b) => busy(b, async () => {
    const inds = await courseIndicators(), used = new Set(READ.rows.filter((r) => r.kind === "unit").flatMap((r) => r.indicator_codes)), miss = inds.filter((i) => !used.has(i.code));
    if (!miss.length) return;
    const units = READ.rows.filter((r) => r.kind === "unit");
    const out = await callAI(promptFillMissing({ subject: subjName(S.course.subject_id), grade: S.course.grade, units: units.map((u) => u.name), missing: miss }));
    let n = 0; (out.plans ?? []).forEach((p) => { const m = matchCodes([p.indicator_code, ...(p.indicator_codes ?? [])], miss); if (!m.ok.length || !p.title) return; const ui = Math.min(Math.max(0, num(p.unit_index) - 1), units.length - 1), u = units[ui];
      u.plans.push({ title: String(p.title), hours: 1, codes: m.ok, indicator_codes: m.ok, extra: true }); u.hours += 1; u.indicator_codes = [...new Set([...u.indicator_codes, ...m.ok])]; n++; });
    READ.checks = scheduleChecks(READ, S.course, inds); toast(n ? `เพิ่มแผนเสริม ${n} แผน (เพิ่มชั่วโมงหน่วยละ 1 ปรับได้ภายหลัง)` : "AI ไม่ได้เสนอแผนเสริม", n ? "ok" : "err"); renderT2Edit();
  }),
  "read-clear": () => { READ = null; renderT2Edit(); },
  "read-apply": (b) => busy(b, async () => {
    if (!READ) return; if (S.rows.length && !confirm("แทนที่แถวโครงสร้างเดิมทั้งหมดด้วยที่อ่านจากภาพ?")) return;
    const c = S.course, rows = READ.rows.map((x, i) => ({ id: uid(), course_structure_id: c.id, seq: i + 1, kind: x.kind, semester: x.semester, name: x.name, indicator_codes: x.indicator_codes, hours: Math.round(x.kind === 'unit' && x.plans?.length ? x.plans.reduce((a, p) => a + num(p.hours), 0) : x.hours), score_weight: x.score_weight }));
    must(await sb.from("course_structure_rows").delete().eq("course_structure_id", c.id));
    if (rows.length) must(await sb.from("course_structure_rows").insert(rows));
    if (READ.course?.code && !c.course_code) { must(await sb.from("course_structures").update({ course_code: READ.course.code }).eq("id", c.id)); c.course_code = READ.course.code; }
    await loadRows(); let msg = "บันทึกโครงสร้างแล้ว";
    if (READ.withPlans) {
      await loadUnits();
      if (S.units.length) msg += " (รายวิชานี้มีหน่วยอยู่แล้ว จึงไม่สร้างหน่วย/แผนซ้ำ ถ้าต้องการให้ลบหน่วยเดิมที่แถบ 4 ก่อน)";
      else {
        const urows = rows.filter((r) => r.kind === "unit"); let np = 0;
        for (let i = 0; i < urows.length; i++) {
          const r = urows[i], src = READ.rows[READ.rows.indexOf(READ.rows.filter((x) => x.kind === "unit")[i])];
          const u = must(await sb.from("units").insert({ course_structure_id: c.id, source_row_id: r.id, seq: i + 1, semester: r.semester, name: r.name, indicator_codes: r.indicator_codes, hours: Math.max(1, r.hours), score_weight: r.score_weight }).select().single());
          const ps = (src?.plans ?? []).map((p, k) => ({ unit_id: u.id, seq: k + 1, title: p.title, hours: p.hours, indicator_codes: (p.indicator_codes ?? []).length ? p.indicator_codes : r.indicator_codes, sections: emptySections() }));
          if (ps.length) { must(await sb.from("lesson_plans").insert(ps)); np += ps.length; }
        }
        await loadUnits(); msg += ` · สร้าง ${urows.length} หน่วย ${np} หัวข้อแผน ไปเขียนแผนที่แถบ 6 ได้เลย`;
      }
    }
    READ = null; toast(msg, "ok"); renderT2Edit();
  }),
  "bk-tt-add": () => { BK.book.data.time_table.push({ name: "แถวใหม่", h: [0, 0, 0, 0, 0, 0] }); bkSave(); renderBook(); },
  "bk-tt-del": (b) => { BK.book.data.time_table.splice(Number(b.dataset.i), 1); bkSave(); renderBook(); },
  "bk-tt-reset": () => { if (!confirm("คืนค่าตารางเวลาเรียนเป็นค่าเริ่มต้น?")) return; BK.book.data.time_table = DEF_TT(); bkSave(); renderBook(); },
  "bk-ex-add": () => { const ab = (BK.stds?.[0]?.standard_code ?? "").split(" ")[0]; BK.book.data.extra.push({ grade: 1, code: `${ab}1120${BK.book.data.extra.length + 1}`, name: "", hours: 40, note: "", desc: "" }); bkSave(); renderBook(); },
  "bk-ex-del": (b) => { if (!confirm("ลบรายวิชาเพิ่มเติมนี้?")) return; BK.book.data.extra.splice(Number(b.dataset.i), 1); bkSave(); renderBook(); },
  "bk-ai-extra": (b) => busy(b, async () => { const x = BK.book.data.extra[Number(b.dataset.i)]; if (!x.name) throw new Error("ใส่ชื่อรายวิชาก่อน"); await bkRun([[`รายวิชาเพิ่มเติม ${x.name}`, async () => { const o = await bkRetry(() => callAI(promptExtraDesc({ subject: bkSub(), grade: x.grade, name: x.name, hours: x.hours, note: x.note }))); x.desc = String(o.text ?? ""); }]]); }),
  "bk-next": () => go("t2"),
});
// global listeners
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const fn = actions[b.dataset.act]; if (fn) { if (b.tagName === "A") e.preventDefault(); fn(b, e); }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.row !== undefined && t.dataset.f) { const r = S.rows[Number(t.dataset.row)]; r[t.dataset.f] = t.type === "number" ? num(t.value) : t.value; if (t.dataset.f === "hours" || t.dataset.f === "score_weight") debounceCheck(); }
  if (t.dataset.u !== undefined && t.dataset.f) { const u = S.units[Number(t.dataset.u)]; u[t.dataset.f] = t.type === "number" ? num(t.value) : t.value; }
});
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.id === "bkFile" && t.files?.[0]) { try { await restoreBackup(t.files[0]); } catch (err) { toast(err.message, "err"); } t.value = ""; return; }
  if (t.dataset.pid && t.dataset.pf) {
    const f = t.dataset.pf; let v = t.value;
    if (f === "hours") v = Math.max(1, num(v)); if (f === "planned_date" && !v) v = null;
    try { await updatePlanRow(t.dataset.pid, { [f]: v }); const p = S.plans.find((x) => x.id === t.dataset.pid); if (p) p[f] = v; if (p && S.plan?.id === p.id) { const m = { title: "#pTitle", hours: "#pHours", status: "#pStatus" }[f]; if (m && $(m)) $(m).value = v; } if (f === "hours" || f === "status") render4(); toast("บันทึกแล้ว", "ok"); }
    catch (err) { toast(err.message, "err"); await loadPlans(); render4(); }
    return;
  }
   if (t.dataset.row !== undefined && t.dataset.f === "kind") { S.rows[Number(t.dataset.row)].kind = t.value; renderT2Edit(); } });
// live totals while typing (no re-render, so focus is kept)
const BK_TABLES = ["app_settings", "curriculum_structures", "course_structures", "course_structure_rows", "units", "lesson_plans"];
async function restoreBackup(file) {
  const j = JSON.parse(await file.text());
  if (j.app !== "lesson-plan") throw new Error("ไม่ใช่ไฟล์สำรองของระบบนี้");
  if (!confirm("กู้คืนข้อมูลจากไฟล์นี้? (ข้อมูลที่มี id เดียวกันจะถูกเขียนทับ)")) return;
  for (const t of BK_TABLES) {
    const rows = (j[t] ?? []).map((r) => ({ ...r, owner_id: S.user.id }));
    if (rows.length) must(await sb.from(t).upsert(rows));
  }
  await loadAll(); toast("กู้คืนข้อมูลแล้ว", "ok");
}
function debounceCheck() {
  const total = S.course.total_hours, uh = sum(S.rows.map((r) => num(r.hours))), uw = sum(S.rows.map((r) => num(r.score_weight)));
  const set = (id, val, ok) => { const el = $("#" + id); if (!el) return; el.className = "stat " + (ok ? "ok" : "bad"); el.querySelector("b").textContent = val; };
  set("stH", `${uh}/${total}`, uh === total); set("stW", `${uw}/100`, uw === 100);
}

boot();

// ---------- keep <details> open/closed state across re-renders ----------
{
  const st = new Map(), key = (d) => (d.closest(".tab")?.id ?? "") + "|" + (d.dataset.dk ?? d.dataset.dk2 ?? (d.querySelector(":scope>summary")?.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 50));
  document.addEventListener("toggle", (e) => { const d = e.target; if (d?.tagName === "DETAILS") st.set(key(d), d.open); }, true);
  const restore = (root) => root.querySelectorAll?.("details").forEach((d) => { const v = st.get(key(d)); if (v !== undefined && d.open !== v) d.open = v; });
  if (globalThis.MutationObserver) new globalThis.MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.tagName === "DETAILS") { const v = st.get(key(n)); if (v !== undefined) n.open = v; } restore(n); } })))
    .observe(document.querySelector("main"), { childList: true, subtree: true });
}
