// Lesson-plan template, taken from the school's original plan (พ15101 ป.5).
// Section numbering is sequential 1..12 (the original file has numbering slips such as 3.1 under item 2 and 13.1 under item 11).

export const PROCESS_STEPS = [
  "ขั้นที่ 1 สร้างความสนใจ",
  "ขั้นที่ 2 สำรวจและค้นหา",
  "ขั้นที่ 3 อธิบายและลงข้อสรุป",
  "ขั้นที่ 4 ขยายความรู้",
  "ขั้นที่ 5 ประเมิน",
];

export const SUFFICIENCY = [
  ["moderation", "ความพอประมาณ"],
  ["reason", "ความมีเหตุผล"],
  ["immunity", "ความมีภูมิคุ้มกันที่ดีในตน"],
  ["knowledge", "เงื่อนไขความรู้"],
  ["morality", "เงื่อนไขคุณธรรม"],
];

export const R3 = ["R1- (R)eading (อ่านออก)", "R2- W(R)iting (เขียนได้)", "R3- A(R)ithmatics (คิดเลขเป็น)"];
export const C8 = [
  "C1- Critical Thinking and Problem Solving (ทักษะการคิดอย่างมีวิจารณญาณและทักษะในการแก้ปัญหา)",
  "C2- Creativity and Innovation (ทักษะด้านการสร้างสรรค์ และนวัตกรรม)",
  "C3- Cross-cultural Understanding (ทักษะด้านความเข้าใจต่างวัฒนธรรม ต่างกระบวนทัศน์)",
  "C4- Collaboration, Teamwork and Leadership (ทักษะด้านความร่วมมือ การทำงานเป็นทีม และภาวะผู้นำ)",
  "C5- Communications, Information, and Media Literacy (ทักษะด้านการสื่อสาร สารสนเทศ และการรู้เท่าทันสื่อ)",
  "C6- Computing and ICT Literacy (ทักษะด้านคอมพิวเตอร์และการรู้เท่าทันเทคโนโลยี)",
  "C7- Career and Learning Skills (ทักษะอาชีพ และทักษะการเรียนรู้)",
  "C8- Compassion (มีเมตตา กรุณา มีวินัย คุณธรรม จริยธรรม)",
];

export const TRAITS = [
  "รักชาติ ศาสน์ กษัตริย์", "ซื่อสัตย์สุจริต", "มีวินัย", "ใฝ่เรียนรู้",
  "อยู่อย่างพอเพียง", "มุ่งมั่นในการทำงาน", "รักความเป็นไทย", "มีจิตสาธารณะ",
];

// Ordered sections of the plan (title + how the editor stores it)
export const SECTIONS = [
  { n: 1, title: "มาตรฐานการเรียนรู้/ตัวชี้วัด", auto: true },
  { n: 2, title: "จุดประสงค์การเรียนรู้สู่ตัวชี้วัด" },
  { n: 3, title: "สาระหลัก/เนื้อหา" },
  { n: 4, title: "สาระสำคัญ" },
  { n: 5, title: "คุณลักษณะอันพึงประสงค์" },
  { n: 6, title: "สมรรถนะสำคัญตามเป้าหมายการเรียนรู้แกนกลางของพื้นที่นวัตกรรมการศึกษาภูเก็ต" },
  { n: 7, title: "การบูรณาการกับหลักปรัชญาของเศรษฐกิจพอเพียง" },
  { n: 8, title: "จุดเน้นสู่การพัฒนาผู้เรียน ความสามารถและทักษะของผู้เรียนในศตวรรษที่ 21" },
  { n: 9, title: "กระบวนการจัดการเรียนรู้" },
  { n: 10, title: "สื่อการเรียนการสอน" },
  { n: 11, title: "แหล่งการเรียนรู้" },
  { n: 12, title: "การวัดและประเมินผลการเรียนรู้" },
];

export const emptySections = () => ({
  objectives: { K: "", P: "", A: "" },
  content: "",
  key_idea: "",
  traits: [],
  competencies: { local: "", key: "" },
  sufficiency: { moderation: "", reason: "", immunity: "", knowledge: "", morality: "" },
  focus: { r3: [], c8: [] },
  process: ["", "", "", "", ""],
  media: "",
  resources: { inside: "", outside: "", local: "" },
  attachments: [],
  assessment: [
    { item: "พุทธิพิสัย (K)", method: "", tool: "", criteria: "" },
    { item: "ทักษะ/กระบวนการ (P)", method: "", tool: "", criteria: "" },
    { item: "จิตพิสัย (A)", method: "", tool: "", criteria: "" },
    { item: "คุณลักษณะอันพึงประสงค์", method: "", tool: "", criteria: "" },
  ],
});

export const SYSTEM_PROMPT =
  "คุณคือครูผู้เชี่ยวชาญด้านการจัดทำหลักสูตรสถานศึกษาและแผนการจัดการเรียนรู้ของไทย ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน " +
  "ตอบเป็นภาษาไทยที่เป็นทางการ กระชับ ใช้งานได้จริงในห้องเรียน และตอบเป็น JSON ที่ถูกต้องเท่านั้น (ไม่มีข้อความนอก JSON) " +
  "ห้ามสร้างหรือแก้ไขรหัสตัวชี้วัดและข้อความตัวชี้วัด ให้ใช้เฉพาะที่ระบุให้เท่านั้น";

export const withMaterial = (m) => (m && String(m).trim() ? `\n\nข้อมูลที่ครู/โรงเรียนให้มา (ใช้เป็นหลัก ห้ามขัดแย้งหรือตัดทิ้ง เรียบเรียงเป็นภาษาทางการของหลักสูตร และเติมเฉพาะส่วนที่ไม่มีให้สอดคล้องกับหลักสูตรแกนกลางและตัวชี้วัดที่ให้ข้างต้น):\n${String(m).slice(0, 20000)}\n` : "");
const lines = (arr) => arr.map((i) => `- ${i.code}: ${i.description}`).join("\n");

export function promptStructure({ subject, grade, curriculum, totalHours, semesters, indicators, material }) {
  const examHours = semesters; // 1 hour per semester
  return `ออกแบบโครงสร้างรายวิชา ${subject} ชั้นประถมศึกษาปีที่ ${grade} ตามหลักสูตร ${curriculum}
เวลาเรียนรวมทั้งปี ${totalHours} ชั่วโมง จำนวน ${semesters} ภาคเรียน

ตัวชี้วัดที่ต้องครอบคลุม (ใช้เฉพาะรหัสเหล่านี้):
${lines(indicators)}${withMaterial(material)}

เงื่อนไขบังคับ:
1. แบ่งเป็นหน่วยการเรียนรู้ (kind="unit") จัดเรียงตามภาคเรียนและลำดับการเรียนรู้ที่เหมาะสม
2. ตัวชี้วัดทุกตัวต้องอยู่ในอย่างน้อย 1 หน่วย
3. ผลรวมชั่วโมงของหน่วย = ${totalHours - examHours} และมีแถวสอบปลายภาคเรียนละ 1 ชั่วโมง (kind="exam") ภาคเรียนละ 1 แถว รวม ${examHours} ชั่วโมง
4. น้ำหนักคะแนน (score_weight) รวมทุกหน่วย = ${100 - 10 * semesters} และสอบปลายภาคแถวละ 10 คะแนน รวมทั้งปี 100 คะแนน
5. ชั่วโมงและคะแนนเป็นจำนวนเต็ม ชื่อหน่วยสื่อความหมายและสอดคล้องกับตัวชี้วัดที่ผูก

ตอบเป็น JSON รูปแบบ:
{"rows":[{"kind":"unit","semester":1,"name":"...","indicator_codes":["รหัส"],"hours":5,"score_weight":5},{"kind":"exam","semester":1,"name":"สอบปลายภาคเรียนที่ 1","indicator_codes":[],"hours":1,"score_weight":10}]}`;
}

export function promptKeyIdea({ subject, grade, unit, indicators, material }) {
  return `เขียน "สาระสำคัญ/ความคิดรวบยอด" ของหน่วยการเรียนรู้ "${unit.name}" วิชา${subject} ชั้นประถมศึกษาปีที่ ${grade} จำนวน ${unit.hours} ชั่วโมง
ตัวชี้วัดของหน่วย:
${lines(indicators)}${withMaterial(material)}
ความยาว 2-4 ประโยค เป็นภาษาที่ครูใช้ในแผนการสอน
ตอบเป็น JSON: {"key_idea":"..."}`;
}

export function promptPlan({ school, subject, grade, courseCode, unit, plan, indicators }) {
  return `ร่างแผนการจัดการเรียนรู้รายคาบ
โรงเรียน: ${school || "-"}
รายวิชา: ${subject} รหัส ${courseCode || "-"} ชั้นประถมศึกษาปีที่ ${grade}
หน่วยการเรียนรู้: ${unit.name} (${unit.hours} ชั่วโมง)
สาระสำคัญของหน่วย: ${unit.key_concept || "-"}
เรื่องของแผนนี้: ${plan.title} เวลา ${plan.hours} ชั่วโมง
ตัวชี้วัดของแผนนี้:
${lines(indicators)}

กระบวนการจัดการเรียนรู้ใช้ 5 ขั้น ตามลำดับ: ${PROCESS_STEPS.join(" / ")}
รูปแบบจุดประสงค์: ด้านความรู้ (K) ด้านทักษะกระบวนการ (P) ด้านคุณลักษณะ (A) ลงท้ายด้วย (K) (P) (A) ตามลำดับ
ในแต่ละขั้นของ process (เฉพาะ process เท่านั้น) เขียนเป็นข้อ ๆ ขึ้นต้นด้วยเลขข้อ และทุกขั้นต้องมีบทสนทนาครูถาม-นักเรียนตอบ อย่างน้อย 1 คู่ รูปแบบบรรทัดแยกเสมอ:\n- ครูถามว่า: "..."\n- ตัวอย่างคำตอบของนักเรียน: "..."
รูปแบบของแต่ละขั้น (ชัดเจนเป็นขั้นเป็นตอน): เรียงเป็นข้อ 1. 2. 3. ... ข้อละ 1 กิจกรรม ขึ้นบรรทัดใหม่ทุกข้อ แต่ละข้อขึ้นต้นด้วยชื่อกิจกรรมสั้น ๆ แล้วตามด้วยครูทำอะไรและนักเรียนทำอะไร (ระบุตัวผู้ทำชัดเจน) เช่น "1. สนทนาเร้าความสนใจ: ครูแสดงภาพ... นักเรียนสังเกตและตอบ..." ตามด้วยบรรทัดย่อย - ครูถามว่า / - ตัวอย่างคำตอบของนักเรียน ของข้อนั้น แต่ละขั้นมี 2-4 ข้อ ลำดับต่อเนื่องและสอดคล้องกับจุดประสงค์ สาระการเรียนรู้ และเวลาของแผน
ห้ามใส่บรรทัด "ครูถามว่า" หรือ "ตัวอย่างคำตอบของนักเรียน" ในช่องอื่นนอกจาก process (จุดประสงค์ สาระการเรียนรู้ สาระสำคัญ สื่อ การวัดผล ฯลฯ ให้เขียนเป็นเนื้อหาปกติ)
การวัดและประเมินผลต้องมี 4 รายการ: พุทธิพิสัย (K), ทักษะ/กระบวนการ (P), จิตพิสัย (A), คุณลักษณะอันพึงประสงค์
คุณลักษณะอันพึงประสงค์ เลือกจากรายการนี้เท่านั้น: ${TRAITS.join(", ")}

ตอบเป็น JSON รูปแบบนี้เท่านั้น (ค่าเป็นข้อความภาษาไทย ใช้ \\n แยกบรรทัด):
{"objectives":{"K":"...","P":"...","A":"..."},
"content":"สาระการเรียนรู้ ขึ้นต้นด้วย - ทีละบรรทัด",
"key_idea":"...",
"traits":["..."],
"competencies":{"local":"...","key":"..."},
"sufficiency":{"moderation":"...","reason":"...","immunity":"...","knowledge":"...","morality":"..."},
"process":["ขั้นที่ 1 ...","ขั้นที่ 2 ...","ขั้นที่ 3 ...","ขั้นที่ 4 ...","ขั้นที่ 5 ..."],
"media":"...",
"resources":{"inside":"...","outside":"-","local":"-"},
"assessment":[{"item":"พุทธิพิสัย (K)","method":"...","tool":"...","criteria":"..."},{"item":"ทักษะ/กระบวนการ (P)","method":"...","tool":"...","criteria":"..."},{"item":"จิตพิสัย (A)","method":"...","tool":"...","criteria":"..."},{"item":"คุณลักษณะอันพึงประสงค์","method":"...","tool":"...","criteria":"..."}]}`;
}


// ---- extra prompts ----
export function promptPlanTitles({ subject, grade, unit, indicators, count, material }) {
  return `วางแผนการสอนรายคาบของหน่วยการเรียนรู้นี้ให้ครบ ${count} แผน (แผนละ 1 ชั่วโมง รวม ${unit.hours} ชั่วโมง)
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit.name}
สาระสำคัญของหน่วย: ${unit.key_concept || "-"}
ตัวชี้วัดของหน่วย:
${lines(indicators)}${withMaterial(material)}
ถ้าครูให้หัวข้อมาแล้ว ให้ใช้หัวข้อของครูก่อน (คงชื่อตามที่ให้) แล้วเพิ่มเฉพาะที่ขาดให้ครอบคลุมตัวชี้วัดและครบ ${count} แผน
เรียงลำดับเนื้อหาจากง่ายไปยาก แต่ละแผนมีเรื่องไม่ซ้ำกัน และให้ตัวชี้วัดที่เกี่ยวข้อง (ใช้รหัสจากรายการข้างต้นเท่านั้น ห้ามสร้างรหัสใหม่)
ตอบเป็น JSON เท่านั้น: {"plans":[{"title":"เรื่องของแผน","indicator_codes":["รหัส"]}]}`;
}

export function promptField({ subject, grade, unit, plan, label, current, instruction, indicators }) {
  return `ช่วยเขียนหัวข้อ "${label}" ของแผนการจัดการเรียนรู้ใหม่
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit.name}  เรื่องของแผน: ${plan.title} (${plan.hours} ชั่วโมง)
ตัวชี้วัด:
${lines(indicators)}
เนื้อหาปัจจุบัน:
${current || "(ว่าง)"}
${instruction ? "คำสั่งเพิ่มเติมจากครู: " + instruction : ""}
ถ้าเป็นขั้นตอนการจัดการเรียนรู้ ให้เขียนเรียงเป็นข้อ 1. 2. 3. ข้อละ 1 กิจกรรม ขึ้นต้นด้วยชื่อกิจกรรมสั้น ๆ ระบุว่าครูทำอะไรและนักเรียนทำอะไร (2-4 ข้อ)\nถ้าหัวข้อนี้คือขั้นตอนการจัดการเรียนรู้ (ขั้นสอน 5E) เท่านั้น ต้องมีครูถาม-นักเรียนตอบ เป็นบรรทัดแยก: - ครูถามว่า: "..." และ - ตัวอย่างคำตอบของนักเรียน: "..." แต่ถ้าเป็นหัวข้ออื่น (จุดประสงค์ สาระ สื่อ ฯลฯ) ห้ามมีบรรทัดครูถาม/ตัวอย่างคำตอบเด็ดขาด
ตอบเป็น JSON เท่านั้น: {"text":"เนื้อหาใหม่ ใช้ \\n แยกบรรทัด"}`;
}

export function promptAttachments({ subject, grade, unit, plan, indicators }) {
  return `สร้างเอกสารแนบท้ายแผนการจัดการเรียนรู้ 2 ชิ้น: (1) ใบงาน (2) เกณฑ์การให้คะแนนแบบรูบริก
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit.name}  เรื่อง: ${plan.title}
ตัวชี้วัด:
${lines(indicators)}
สาระสำคัญ: ${plan.sections?.key_idea || "-"}
ใบงาน: มีชื่อ-ชั้น-เลขที่ คำชี้แจง และข้อคำถาม 5-8 ข้อที่ตรงกับตัวชี้วัด
รูบริก: ระดับคะแนน 4/3/2/1 พร้อมคำอธิบายแต่ละระดับ เขียนบรรทัดละระดับ รูปแบบ "ระดับ 4 (ดีเยี่ยม): คำอธิบาย" (ระบบจะแสดงเป็นตาราง)
ตอบเป็น JSON เท่านั้น: {"attachments":[{"title":"ใบงาน เรื่อง ...","body":"ข้อความหลายบรรทัด ใช้ \\n แยกบรรทัด"},{"title":"เกณฑ์การให้คะแนน (รูบริก)","body":"..."}]}`;
}

export function promptCurriculumDoc({ subject, grade, curriculum, school, indicators, standards, material }) {
  const st = (standards ?? []).map((s) => `- ${s.standard_code}: ${s.description ?? ""}`).join("\n");
  const ind = indicators.map((i) => `- ${i.code}: ${i.description}`).join("\n");
  return `จัดทำเนื้อหาหลักสูตรสถานศึกษา${school ? ` ของ${school}` : ""} กลุ่มสาระการเรียนรู้${subject} ชั้นประถมศึกษาปีที่ ${grade} ตามหลักสูตร ${curriculum}
มาตรฐาน:
${st}
ตัวชี้วัด:
${ind}${withMaterial(material)}

เขียนอย่างเป็นทางการ กระชับ อ้างอิงเฉพาะมาตรฐาน/ตัวชี้วัดข้างต้น ห้ามสร้างรหัสใหม่
ตอบเป็น JSON: {"vision":"2-3 ประโยค","course_description":"คำอธิบายรายวิชารูปแบบมาตรฐาน 1 ย่อหน้า (ศึกษา/ฝึก/อภิปราย ... เพื่อให้เกิดความรู้ ความคิด ทักษะ ... มีตัวชี้วัด รวม ${indicators.length} ตัวชี้วัด)","competencies":"สมรรถนะสำคัญและคุณลักษณะอันพึงประสงค์ที่เน้น เป็นบรรทัดละข้อ","approach":"แนวทางการจัดการเรียนรู้และวัดผลประเมินผล 3-5 ข้อ บรรทัดละข้อ"}`;
}

// ---------- school curriculum book (เล่มหลักสูตรสถานศึกษา) ----------
export const BOOK_TEXTS = [
  ["foreword", "คำนำ"], ["intro", "ความนำ"], ["vision", "วิสัยทัศน์ พันธกิจ เป้าหมาย"], ["competencies", "สมรรถนะสำคัญของผู้เรียน"], ["traits", "คุณลักษณะอันพึงประสงค์"],
  ["learn_what", "เรียนรู้อะไรในกลุ่มสาระการเรียนรู้"],
  ["outcome_g3", "คุณภาพผู้เรียน (จบชั้นประถมศึกษาปีที่ 3)"], ["outcome_g6", "คุณภาพผู้เรียน (จบชั้นประถมศึกษาปีที่ 6)"],
  ["activities", "กิจกรรมพัฒนาผู้เรียน"], ["management", "การจัดการเรียนรู้ สื่อ และการบริหารจัดการหลักสูตร"],
  ["assess_criteria", "เกณฑ์การวัดและประเมินผลการเรียน"], ["glossary", "อภิธานศัพท์"],
];
const BOOK_HINT = {
  vision: "วิสัยทัศน์ของสถานศึกษา/กลุ่มสาระ 1 ย่อหน้า, พันธกิจ 4-6 ข้อ, เป้าหมาย 4-6 ข้อ สอดคล้องกับกลุ่มสาระนี้",
  competencies: "สมรรถนะสำคัญของผู้เรียน 5 ประการตามหลักสูตรแกนกลาง (1. ความสามารถในการสื่อสาร 2. ความสามารถในการคิด 3. ความสามารถในการแก้ปัญหา 4. ความสามารถในการใช้ทักษะชีวิต 5. ความสามารถในการใช้เทคโนโลยี) แต่ละข้ออธิบาย 2-3 บรรทัด และยกตัวอย่างการพัฒนาในกลุ่มสาระนี้",
  traits: "คุณลักษณะอันพึงประสงค์ 8 ประการ (1. รักชาติ ศาสน์ กษัตริย์ 2. ซื่อสัตย์สุจริต 3. มีวินัย 4. ใฝ่เรียนรู้ 5. อยู่อย่างพอเพียง 6. มุ่งมั่นในการทำงาน 7. รักความเป็นไทย 8. มีจิตสาธารณะ) แต่ละข้อมีนิยามและพฤติกรรมบ่งชี้ 2-3 ข้อ",
  activities: "กิจกรรมพัฒนาผู้เรียนระดับประถมศึกษา 120 ชั่วโมง/ปี: กิจกรรมแนะแนว, กิจกรรมนักเรียน (ลูกเสือ เนตรนารี ยุวกาชาด ผู้บำเพ็ญประโยชน์ / ชุมนุม ชมรม), กิจกรรมเพื่อสังคมและสาธารณประโยชน์ แต่ละกิจกรรมอธิบายวัตถุประสงค์ แนวการจัด และการประเมิน และเชื่อมโยงกับกลุ่มสาระนี้",
  management: "แนวการจัดการเรียนรู้ (เน้นผู้เรียนเป็นสำคัญ กระบวนการเรียนรู้ที่ใช้ในกลุ่มสาระนี้), สื่อและแหล่งเรียนรู้, การวัดและประเมินผลระดับชั้นเรียน, การเทียบโอนผลการเรียน, การบริหารจัดการหลักสูตร (การนิเทศ ติดตาม ประเมินและปรับปรุงหลักสูตร) เขียนเป็นหัวข้อพร้อมรายละเอียด",
  foreword: "คำนำ 4-5 ย่อหน้าเต็ม: จุดประสงค์ของการจัดทำหลักสูตรสถานศึกษา การประเมินผลการใช้หลักสูตร การศึกษาสภาพปัญหาและบริบท การวางแผนปรับปรุง ผลที่ได้ และกล่าวขอบคุณผู้เกี่ยวข้อง",
  intro: "ความนำ 8-10 ย่อหน้าละเอียด: ที่มาของหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน การกระจายอำนาจให้สถานศึกษา ปัญหาที่พบจากการใช้หลักสูตร การปรับปรุง และการนำไปใช้ของกลุ่มสาระนี้",
  learn_what: "สรุปว่าผู้เรียนเรียนรู้อะไรในกลุ่มสาระนี้ แยกเป็นหัวข้อตามสาระที่ 1-5 (หรือสาระของวิชานี้) แต่ละสาระ 2-4 บรรทัด โดยอ้างอิงมาตรฐานที่ให้มา และเขียนความสำคัญ/วิสัยทัศน์ของกลุ่มสาระ 1 ย่อหน้า",
  outcome_g3: "คุณภาพผู้เรียนเมื่อจบชั้นประถมศึกษาปีที่ 3 เป็นข้อ ๆ ตามสาระ (12-18 ข้อ ละเอียด) ให้สอดคล้องกับตัวชี้วัด ป.1-3 ที่ให้มา",
  outcome_g6: "คุณภาพผู้เรียนเมื่อจบชั้นประถมศึกษาปีที่ 6 เป็นข้อ ๆ ตามสาระ (12-18 ข้อ ละเอียด) ให้สอดคล้องกับตัวชี้วัด ป.4-6 ที่ให้มา",
  assess_criteria: "เกณฑ์การวัดและประเมินผลการเรียนระดับประถมศึกษา: 1) การตัดสินผลการเรียน (เวลาเรียนไม่น้อยกว่าร้อยละ 80, ประเมินทุกตัวชี้วัดและผ่านไม่น้อยกว่าร้อยละ 80, ระดับ 1 ขึ้นไป, อ่านคิดวิเคราะห์เขียน คุณลักษณะ กิจกรรมผ่าน, การเลื่อนชั้น) 2) การให้ระดับผลการเรียน 8 ระดับ (4,3.5,3,2.5,2,1.5,1,0 พร้อมช่วงคะแนนร้อยละ 80-100, 75-79, 70-74, 65-69, 60-64, 55-59, 50-54, 0-49) 3) การรายงานผล 4) เกณฑ์การจบการศึกษา เขียนเป็นข้อ ๆ ตามแนวหลักสูตรแกนกลาง 2551",
  glossary: "อภิธานศัพท์ 20-25 คำที่ใช้ในกลุ่มสาระนี้ แต่ละคำเขียนเป็น: คำไทย (English term) แล้วบรรทัดถัดไปอธิบาย 1-3 ประโยค เว้นหนึ่งบรรทัดระหว่างคำ",
};
export function promptBookText(key, { school, subject, curriculum, standards, indicators, material }) {
  const st = (standards ?? []).map((s) => `- ${s.standard_code}: ${s.description ?? ""}`).join("\n");
  const ind = (indicators ?? []).filter((i) => key === "outcome_g3" ? /ป\.[123]\//.test(i.code) : key === "outcome_g6" ? /ป\.[456]\//.test(i.code) : false).map((i) => `- ${i.code}: ${i.description}`).join("\n");
  return `เขียนส่วน "${(BOOK_TEXTS.find((x) => x[0] === key) ?? [])[1] ?? key}" ของเอกสารประกอบหลักสูตรสถานศึกษา${school ? ` ของ${school}` : ""} กลุ่มสาระการเรียนรู้${subject} ระดับประถมศึกษา ตามหลักสูตร ${curriculum}
มาตรฐานการเรียนรู้ของกลุ่มสาระ:
${st}
${ind ? `ตัวชี้วัดที่เกี่ยวข้อง:\n${ind}\n` : ""}
แนวทาง: ${BOOK_HINT[key]}${withMaterial(material)}
เขียนเป็นภาษาไทยทางการแบบเอกสารหลักสูตร ห้ามสร้างรหัสมาตรฐาน/ตัวชี้วัดใหม่ ใช้เฉพาะที่ให้มา
ตอบเป็น JSON: {"text":"เนื้อหาเต็ม ใช้ \\n ขึ้นบรรทัดใหม่"}`;
}
export function promptCore({ subject, grade, indicators, school }) {
  const ind = indicators.map((i) => `- ${i.code}: ${i.description}`).join("\n");
  return `กำหนด "สาระการเรียนรู้แกนกลาง" ของแต่ละตัวชี้วัด วิชา${subject} ชั้นประถมศึกษาปีที่ ${grade}
ตัวชี้วัด:
${ind}

สาระการเรียนรู้แกนกลาง = เนื้อหา/ความรู้/ทักษะที่ต้องเรียนเพื่อให้บรรลุตัวชี้วัดนั้น เขียนเป็นหัวข้อสั้น ๆ คั่นด้วยเครื่องหมาย , 1-3 บรรทัด
สาระการเรียนรู้ท้องถิ่น = ตัวอย่างเนื้อหาท้องถิ่น/ภูมิปัญญา/บริบทชุมชน${school ? `ของ${school}` : ""} ที่เชื่อมกับตัวชี้วัดได้จริง สั้น ๆ ถ้าไม่เหมาะให้ใส่ "-"
ใช้เฉพาะรหัสตัวชี้วัดข้างต้นเป็นคีย์ ห้ามสร้างรหัสใหม่
ตอบเป็น JSON: {"core":{"<รหัสตัวชี้วัด>":"สาระการเรียนรู้แกนกลาง"},"local":{"<รหัสตัวชี้วัด>":"สาระท้องถิ่น หรือ -"}}`;
}
export function promptGradeDesc({ subject, grade, name, hours, indicators, units }) {
  return `เขียน "คำอธิบายรายวิชา" รายวิชา${name} กลุ่มสาระการเรียนรู้${subject} ชั้นประถมศึกษาปีที่ ${grade} เวลา ${hours} ชั่วโมง/ปี
หน่วยการเรียนรู้: ${units.join(", ")}
จำนวนตัวชี้วัดทั้งหมด ${indicators.length} ตัวชี้วัด:
${indicators.map((i) => `- ${i.code}: ${i.description}`).join("\n")}

รูปแบบมาตรฐาน: ย่อหน้าแรก "ศึกษา ฝึก ปฏิบัติ ... เกี่ยวกับ ..." ครอบคลุมเนื้อหาของทุกหน่วย ย่อหน้าสอง "โดยใช้กระบวนการ ... เพื่อให้ ... มีความรู้ ความเข้าใจ ... เห็นคุณค่า ... " แล้วปิดด้วย "รหัสตัวชี้วัด" (คัดรหัสทั้งหมดคั่นด้วย , ) และ "รวม ${indicators.length} ตัวชี้วัด"
ตอบเป็น JSON: {"text":"..."}`;
}

export function promptExtraDesc({ subject, grade, name, hours, note }) {
  return `เขียน "คำอธิบายรายวิชาเพิ่มเติม" รายวิชา${name} กลุ่มสาระการเรียนรู้${subject} ชั้นประถมศึกษาปีที่ ${grade} เวลา ${hours} ชั่วโมง/ปี
${note ? `ขอบข่ายที่ครูกำหนด: ${note}\n` : ""}รูปแบบ: ย่อหน้า "ศึกษา ฝึก ปฏิบัติ ..." ต่อด้วย "โดยใช้กระบวนการ ... เพื่อให้ ..." แล้วตามด้วย "ผลการเรียนรู้" เป็นข้อ ๆ 4-8 ข้อ (รายวิชาเพิ่มเติมใช้ผลการเรียนรู้ ไม่ใช้รหัสตัวชี้วัด) และ "รวม n ผลการเรียนรู้"
ตอบเป็น JSON: {"text":"..."}`;
}

export function promptReadStructure({ subject, grade, curriculum, totalHours, semesters, indicators, withPlans, docText, material }) {
  return `ภาพ/ไฟล์ที่แนบคือเอกสารของครู เช่น โครงสร้างรายวิชา กำหนดการสอน หรือตารางสอนรายสัปดาห์ วิชา${subject} ชั้นประถมศึกษาปีที่ ${grade} (หลักสูตร ${curriculum}, เวลาเรียน ${totalHours} ชั่วโมง ${semesters} ภาคเรียน)
${withMaterial(material)}${docText ? `ข้อความจากไฟล์ Word (ตารางคั่นด้วย |):\n${docText.slice(0, 30000)}\n\n` : ""}อ่านเอกสารอย่างละเอียดแล้วถอดเป็นโครงสร้างรายวิชา:
- แต่ละหน่วยการเรียนรู้ = 1 แถว kind="unit" (ชื่อหน่วย ภาคเรียน ชั่วโมง น้ำหนักคะแนน ตัวชี้วัด) ตามลำดับในเอกสาร
- แถวสอบกลางภาค/ปลายภาค = kind="exam"
- ตัวชี้วัด: จับคู่กับรายการรหัสจริงด้านล่างเท่านั้น (เอกสารอาจใช้เลขไทยหรือเขียนต่างเล็กน้อย) ถ้าเอกสารเขียนเป็นข้อความไม่มีรหัส ให้เลือกรหัสที่ความหมายตรงที่สุด ห้ามสร้างรหัสใหม่
${withPlans ? `- ถ้าเอกสารมีเรื่อง/หัวข้อย่อยรายสัปดาห์หรือรายคาบ ให้ใส่ใน plans ของหน่วยนั้น (title, hours และ indicator_codes ของแต่ละเรื่อง ตามที่เอกสารระบุ) ถ้าไม่มี ให้แบ่งหัวข้อแผนรายคาบตามชั่วโมงของหน่วยอย่างเหมาะสม (1 แผน = 1 ชั่วโมง)\n` : ""}- ห้ามเดาตัวเลขที่ไม่มีในเอกสาร ถ้าอ่านไม่ออกให้ใส่ 0 และบอกใน notes
รหัสตัวชี้วัดจริงของวิชา/ชั้นนี้:
${indicators.map((i) => `- ${i.code}: ${i.description}`).join("\n")}

ตอบเป็น JSON: {"course":{"code":"รหัสวิชาถ้ามี","name":"ชื่อวิชาถ้ามี"},"rows":[{"kind":"unit","semester":1,"name":"...","indicator_codes":["รหัส"],"hours":5,"score_weight":10${withPlans ? ',"plans":[{"title":"...","hours":1,"indicator_codes":["รหัส"]}]' : ""}}],"notes":"สิ่งที่อ่านไม่ชัดหรือข้อสังเกต"}`;
}

export function promptFillMissing({ subject, grade, units, missing }) {
  return `กำหนดการสอน วิชา${subject} ชั้นประถมศึกษาปีที่ ${grade} ยังไม่ครอบคลุมตัวชี้วัดต่อไปนี้ของหลักสูตร:
${missing.map((i) => `- ${i.code}: ${i.description}`).join("\n")}

หน่วยการเรียนรู้ที่มีอยู่ (ลำดับที่ 1..${units.length}):
${units.map((u, i) => `${i + 1}. ${u}`).join("\n")}

เสนอแผนเสริม 1 ชั่วโมง ต่อ 1 ตัวชี้วัดที่ขาด (ตัวชี้วัดที่ใกล้กันรวมเป็นแผนเดียวได้) โดยเลือกหน่วยที่เนื้อหาใกล้เคียงที่สุด ชื่อแผนเป็นหัวข้อสั้น ๆ ที่สอนแล้วบรรลุตัวชี้วัดนั้นจริง ใช้เฉพาะรหัสที่ให้มา
ตอบเป็น JSON: {"plans":[{"title":"...","unit_index":1,"indicator_codes":["รหัส"]}]}`;
}

export function promptPlanFill(args) {
  const { current, material } = args;
  return promptPlan(args) + `

แผนนี้ครูมีข้อมูลบางส่วนแล้ว ให้วิเคราะห์และเติมให้สมบูรณ์ตามหลักสูตร:
ข้อมูลที่มีอยู่ในแผน (JSON, ค่าว่างคือยังไม่มี):
${JSON.stringify(current).slice(0, 8000)}${withMaterial(material)}
กฎ: 1) ข้อมูลของครูมาก่อน ใช้ตามที่ให้ 2) ช่องที่ครูไม่ได้ให้ ให้เขียนเติมให้สอดคล้องกับตัวชี้วัดและเรื่องของแผน 3) ห้ามสร้างรหัสตัวชี้วัดใหม่
เพิ่มสองคีย์ใน JSON: "assumptions": [สิ่งที่คุณสันนิษฐานเองเพราะครูไม่ได้ให้ ให้ครูตรวจ], "questions": [สิ่งที่ครูควรให้ข้อมูลเพิ่มเพื่อให้แผนแม่นยำขึ้น (ถ้ามี)]`;
}

// attachment body -> blocks: paragraphs and tables (rubric lines "ระดับ 4 (ดีเยี่ยม): ..." or "a | b | c" rows)
export function parseAttachment(body) {
  const L = String(body ?? "").split(/\r?\n/).map((x) => x.replace(/\s+$/, ""));
  const rub = /^\s*ระดับ(?:คะแนน)?\s*([0-9๐-๙]+)\s*(?:\(([^)]*)\))?\s*[:：-]\s*(.+)$/;
  const out = []; let i = 0;
  while (i < L.length) {
    if (rub.test(L[i])) { const rows = []; while (i < L.length && rub.test(L[i])) { const m = L[i].match(rub); rows.push([m[1], m[2] ?? "", m[3]]); i++; }
      if (rows.length >= 2) { out.push({ t: "tbl", head: ["ระดับ", "ระดับคุณภาพ", "เกณฑ์การให้คะแนน"], rows, w: [2.0, 3.0, 11.0] }); continue; }
      out.push({ t: "p", text: `ระดับ ${rows[0][0]}${rows[0][1] ? ` (${rows[0][1]})` : ""}: ${rows[0][2]}` }); continue; }
    if ((L[i].match(/\|/g) ?? []).length >= 1 && L[i].trim().includes("|")) { const g = []; while (i < L.length && L[i].includes("|")) { g.push(L[i].split("|").map((c) => c.trim()).filter((c, k, a) => !(c === "" && (k === 0 || k === a.length - 1)))); i++; }
      const rows = g.filter((r) => !r.every((c) => /^[-:\s]+$/.test(c))), n = Math.max(...rows.map((r) => r.length));
      if (rows.length >= 2 && n >= 2) { out.push({ t: "tbl", head: rows[0], rows: rows.slice(1).map((r) => Array.from({ length: n }, (_, k) => r[k] ?? "")), w: (n >= 4 && rows.slice(0, 6).every((r) => r.slice(1).every((c) => String(c).length <= 14))) ? [16 - 2.0 * (n - 1), ...Array(n - 1).fill(2.0)] : Array.from({ length: n }, () => 16 / n) }); continue; }
      rows.forEach((r) => out.push({ t: "p", text: r.join(" | ") })); continue; }
    if (L[i].trim()) { const m = L[i].match(/^(.*?)\s*[.…_·]{6,}\s*$/); if (m) { if (m[1].trim()) out.push({ t: "p", text: m[1] }); out.push({ t: "dots" }); } else out.push({ t: "p", text: L[i] }); } i++;
  }
  return out;
}

// classify a teaching-step line: "ans" (student answer, pink) / "qst" (teacher asks, blue) / ""
const PFX = "^[\\s\\-•–*·0-9๐-๙.)(]*";
const ANS_RE = new RegExp(PFX + "(ตัวอย่างคำตอบ|ตัวอย่างการตอบ|ตัวอย่าง|คำตอบของนักเรียน|คำตอบนักเรียน|นักเรียนตอบ|นักเรียนอาจตอบ|คำตอบ)");
const QST_RE = new RegExp(PFX + "(ครูถาม|ครูตั้งคำถาม|ครูใช้คำถาม|ครู\\s*[:：]|คำถามครู|คำถาม\\s*[:：])");
export const QA_STRICT = /(ครูถามว่า|ตัวอย่างคำตอบ(ของนักเรียน)?)\s*[:：]/;
export const stripQA = (v) => String(v ?? "").split("\n").filter((l) => !QA_STRICT.test(l)).join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "");
export const lineKind = (l) => (ANS_RE.test(l) ? "ans" : QST_RE.test(l) ? "qst" : "");

export function promptWorksheet({ subject, grade, unit, plan, indicators, count, extra }) {
  return `ออกแบบใบงานนักเรียน 1 ชุด สำหรับแผนการจัดการเรียนรู้
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit.name}  เรื่อง: ${plan.title}
ตัวชี้วัด:
${lines(indicators)}
สาระสำคัญ: ${plan.sections?.key_idea || "-"}
เนื้อหา: ${String(plan.sections?.content || "-").slice(0, 1200)}
ข้อกำหนด: ${count} ข้อ ใช้ภาษาง่ายเหมาะกับนักเรียนชั้น ป.${grade} ตรงกับตัวชี้วัดและเนื้อหาของแผนนี้เท่านั้น ผสมรูปแบบข้อให้หลากหลาย
ชนิดข้อที่ใช้ได้: "short" (เขียนตอบ ระบุ lines 1-3), "choice" (ตัวเลือก 4 ข้อ ใส่ options), "tf" (ถูก/ผิด), "fill" (เติมคำ ใช้ ______ ในประโยค), "draw" (วาดภาพ/ผังความคิด ใช้ได้ไม่เกิน 1 ข้อ)
${extra ? "คำสั่งเพิ่มเติมจากครู: " + extra : ""}
ตอบเป็น JSON เท่านั้น: {"title":"ใบงาน เรื่อง ...","instructions":"คำชี้แจง 1-2 ประโยค","total_score":จำนวนคะแนนรวม,"questions":[{"type":"short","q":"...","lines":2,"answer":"เฉลย"},{"type":"choice","q":"...","options":["...","...","...","..."],"answer":"ข. ..."},{"type":"tf","q":"...","answer":"ถูก"},{"type":"fill","q":"...______...","answer":"..."},{"type":"draw","q":"...","answer":"แนวทางตรวจ"}]}`;
}

export function promptWorksheetImage(ws, { theme, grade, sub }) {
  const qs = (ws.questions ?? []).map((q, i) => {
    const t = { short: "(เขียนตอบ มีเส้นประให้เขียน)", choice: "", tf: "(ถูก ☐  ผิด ☐)", fill: "", draw: "(กรอบเส้นประให้วาดภาพ)" }[q.type] ?? "";
    const o = q.type === "choice" ? "\n   " + (q.options ?? []).map((x, k) => `${"กขคง"[k]}. ${x}`).join("   ") : "";
    return `${i + 1}. ${q.q} ${t}${o}`;
  }).join("\n");
  return `Create ONE beautiful, colourful, child-friendly printable worksheet page (A4 portrait) for Thai primary school grade ${grade}, in a ${theme} colour theme. Clean white background, rounded boxes, cute simple cartoon illustrations related to the topic, decorative border, easy for children to read and write on.
CRITICAL: all text is Thai. Copy every Thai word below EXACTLY, letter by letter, with correct spelling, tone marks and vowels. Do not translate, shorten, rewrite or invent any other Thai text. Use large, clear, rounded Thai font.
Layout: big title banner at top; line for "ชื่อ-นามสกุล ........ ชั้น ........ เลขที่ ........"; instruction box; then the numbered questions each with space to write the answer (dotted lines) ; a small score box "คะแนน ..... / ${ws.total_score ?? (ws.questions ?? []).length}" at the bottom.
TITLE: ${ws.title}
SUBTITLE: ${sub}
INSTRUCTIONS: คำชี้แจง: ${ws.instructions ?? ""}
QUESTIONS:
${qs}`;
}

export function promptWorksheetFromText({ subject, grade, title, body, indicators }) {
  return `แปลงใบงานที่มีอยู่แล้วเป็นข้อมูลโครงสร้าง พร้อมเขียนเฉลย โดยห้ามเปลี่ยนถ้อยคำของข้อคำถามเดิม
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
ชื่อใบงาน: ${title}
ตัวชี้วัด:
${lines(indicators)}
เนื้อหาใบงาน:
${String(body).slice(0, 6000)}

ชนิดข้อ: "short" (เขียนตอบ ระบุ lines), "choice" (มีตัวเลือก ใส่ options ไม่ต้องมี ก ข ค นำหน้า), "tf" (ถูก/ผิด), "fill" (เติมคำ ใช้ ______), "draw" (วาดภาพ)
ตัดบรรทัดชื่อ-ชั้น-เลขที่และบรรทัดจุดไข่ปลาออก เก็บเฉพาะคำชี้แจงและข้อคำถาม
ตอบเป็น JSON เท่านั้น: {"title":"${title}","instructions":"คำชี้แจง","total_score":จำนวนคะแนนรวม,"questions":[{"type":"short","q":"...","lines":2,"answer":"เฉลย"}]}`;
}

// สื่อการเรียนการสอนแต่ละชิ้น → เนื้อหาพร้อมใช้ + คำสั่งสำหรับคัดลอกไปสร้างในแอป AI (ChatGPT/Gemini)
export function promptMediaKit({ subject, grade, unit, plan, indicators, media }) {
  return `ครูกำหนดสื่อการเรียนการสอนของแผนนี้ไว้แล้ว ให้เตรียมสื่อแต่ละชิ้นให้พร้อมสร้าง
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit?.name ?? "-"}  เรื่อง: ${plan?.title ?? "-"}
ตัวชี้วัด:
${lines(indicators ?? [])}
สาระสำคัญ: ${plan?.sections?.key_idea || "-"}
เนื้อหา: ${String(plan?.sections?.content || "-").slice(0, 1200)}

สื่อที่ครูกำหนด (ทำให้ครบทุกข้อ ห้ามเพิ่มหรือตัดข้อ):
${String(media || "").trim() || "(ว่าง)"}

สำหรับสื่อแต่ละข้อ ให้ระบุ type เป็นหนึ่งใน: "ใบงาน", "ใบความรู้", "ภาพประกอบ", "อื่นๆ"
- content: ถ้าเป็นใบงานหรือใบความรู้ ให้เขียนเนื้อหาเต็มพร้อมใช้ (ใบงาน 4-6 ข้อพร้อมที่ให้เขียนตอบ ใบความรู้เนื้อหากระชับเหมาะกับ ป.${grade}) ถ้าเป็นภาพประกอบหรืออื่นๆ ให้ใส่ "" ห้ามเขียนครูถาม/ตัวอย่างคำตอบ
- prompt: คำสั่งสำหรับวางใน ChatGPT หรือ Gemini เพื่อสร้างสื่อชิ้นนั้นเป็นรูปภาพ/เอกสารที่สวยงามพิมพ์ได้ ภาษาไทยชัดเจน ระบุขนาด A4 แนวตั้ง สไตล์สีสันเหมาะเด็กประถม และต้องคัดลอกข้อความไทยตาม content ทุกตัวอักษร (ถ้าเป็นภาพประกอบ ให้บรรยายภาพที่ต้องการ ไม่มีตัวหนังสือไทยในภาพ)
ตอบเป็น JSON: {"items":[{"name":"ชื่อสื่อตามที่ครูเขียน","type":"ใบงาน","content":"...","prompt":"..."}]}`;
}

// เกณฑ์การประเมิน (รูบริก) แยกตามรายการประเมิน → ตารางพร้อมแนบ Word
export function promptRubric({ subject, grade, unit, plan, indicators, assessment, which }) {
  const names = ["พุทธิพิสัย (K)", "ทักษะ/กระบวนการ (P)", "จิตพิสัย (A)", "คุณลักษณะอันพึงประสงค์"];
  const items = which.map((i) => `${i}. ${assessment?.[i]?.item || names[i] || `รายการที่ ${i + 1}`} — วิธีวัด: ${assessment?.[i]?.method || "-"} | เครื่องมือ: ${assessment?.[i]?.tool || "-"} | เกณฑ์เดิม: ${assessment?.[i]?.criteria || "-"}`).join("\n");
  return `เขียนเกณฑ์การประเมิน (รูบริก) ของแผนการจัดการเรียนรู้
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit?.name ?? "-"}  เรื่อง: ${plan?.title ?? "-"}
ตัวชี้วัด:
${lines(indicators ?? [])}
จุดประสงค์: K ${plan?.sections?.objectives?.K || "-"} | P ${plan?.sections?.objectives?.P || "-"} | A ${plan?.sections?.objectives?.A || "-"}
สาระการเรียนรู้: ${String(plan?.sections?.content || "-").slice(0, 800)}

รายการประเมินที่ต้องเขียนเกณฑ์ (index ตามเลขหน้า):
${items}

สำหรับแต่ละรายการ เขียนตารางเกณฑ์ 3-4 ประเด็นประเมิน × 4 ระดับ (ดีมาก 4 / ดี 3 / พอใช้ 2 / ปรับปรุง 1) ให้สอดคล้องกับจุดประสงค์และเครื่องมือวัดของรายการนั้น ภาษาทางการของครู วัดและสังเกตได้จริง
รูปแบบ table: ทุกบรรทัดคั่นช่องด้วย | บรรทัดแรกเป็นหัวตาราง "ประเด็นการประเมิน | ดีมาก (4) | ดี (3) | พอใช้ (2) | ปรับปรุง (1)" ตามด้วยบรรทัดละ 1 ประเด็น ปิดท้ายด้วยบรรทัดข้อความ "เกณฑ์การตัดสิน: รวมคะแนน ... ถือว่า ..." (ไม่ใส่ |)
ห้ามเขียนครูถามว่า/ตัวอย่างคำตอบ
ตอบ JSON: {"rubrics":[{"index":0,"table":"ประเด็นการประเมิน | ดีมาก (4) | ...\n..."}]}`;
}

// เพิ่มกิจกรรม 1 ข้อให้ขั้นตอน 5E ที่เลือก ให้สอดคล้องกับเนื้อหาที่มีอยู่
export function promptActivity({ subject, grade, unit, plan, stepName, current, nextNo, others, indicators }) {
  return `เพิ่มกิจกรรมการเรียนรู้ใหม่ 1 ข้อ ต่อท้าย "${stepName}" ของแผนการจัดการเรียนรู้
รายวิชา: ${subject} ชั้นประถมศึกษาปีที่ ${grade}
หน่วย: ${unit?.name ?? "-"}  เรื่อง: ${plan?.title ?? "-"} (${plan?.hours ?? "-"} ชั่วโมง)
ตัวชี้วัด:
${lines(indicators ?? [])}
จุดประสงค์: K ${plan?.sections?.objectives?.K || "-"} | P ${plan?.sections?.objectives?.P || "-"} | A ${plan?.sections?.objectives?.A || "-"}
สาระการเรียนรู้: ${String(plan?.sections?.content || "-").slice(0, 800)}
ขั้นตอนอื่น ๆ ที่เขียนไว้แล้ว (ใช้ดูความต่อเนื่อง):
${others || "-"}

เนื้อหาของ "${stepName}" ตอนนี้:
${current || "(ว่าง)"}

เงื่อนไข: กิจกรรมใหม่ต้องเป็นข้อที่ ${nextNo} ต่อจากเนื้อหาเดิม ไม่ซ้ำกับที่มี ต่อเนื่องและสอดคล้องกับเนื้อหา/หัวข้อ/จุดประสงค์ของแผน และเหมาะกับจุดมุ่งหมายของ${stepName} ใช้ภาษาครูในแผนการสอน
รูปแบบ (ไม่ต้องเขียนข้อเดิมซ้ำ):
${nextNo}. ชื่อกิจกรรมสั้น ๆ: ครูทำ... นักเรียนทำ...
- ครูถามว่า: "..."
- ตัวอย่างคำตอบของนักเรียน: "..."
ตอบ JSON เท่านั้น: {"text":"ข้อความของกิจกรรมใหม่ ใช้ \\n แยกบรรทัด"}`;
}

// each attachment -> separate sheets (A4 pages): a body containing a line starting "เฉลย" is split so the key gets its own page
export function attachmentSheets(list) {
  const out = [];
  (list ?? []).forEach((a) => {
    if (!String(a.title ?? "").trim() && !String(a.body ?? "").trim() && !(a.images ?? []).length) return;
    const L = String(a.body ?? "").split(/\r?\n/), k = L.findIndex((l, i) => i > 0 && /^\s*(เฉลย|แนวคำตอบ)/.test(l)) ;
    if (k > 0 && L.slice(0, k).join("").trim() && !(a.images ?? []).length && !/^เฉลย/.test(a.title ?? "")) {
      out.push({ ...a, body: L.slice(0, k).join("\n") });
      out.push({ ...a, title: `เฉลย ${a.title ?? ""}`, body: L.slice(k).join("\n"), images: [] });
    } else out.push(a);
  });
  return out;
}
