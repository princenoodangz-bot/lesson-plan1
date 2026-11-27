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

const lines = (arr) => arr.map((i) => `- ${i.code}: ${i.description}`).join("\n");

export function promptStructure({ subject, grade, curriculum, totalHours, semesters, indicators }) {
  const examHours = semesters; // 1 hour per semester
  return `ออกแบบโครงสร้างรายวิชา ${subject} ชั้นประถมศึกษาปีที่ ${grade} ตามหลักสูตร ${curriculum}
เวลาเรียนรวมทั้งปี ${totalHours} ชั่วโมง จำนวน ${semesters} ภาคเรียน

ตัวชี้วัดที่ต้องครอบคลุม (ใช้เฉพาะรหัสเหล่านี้):
${lines(indicators)}

เงื่อนไขบังคับ:
1. แบ่งเป็นหน่วยการเรียนรู้ (kind="unit") จัดเรียงตามภาคเรียนและลำดับการเรียนรู้ที่เหมาะสม
2. ตัวชี้วัดทุกตัวต้องอยู่ในอย่างน้อย 1 หน่วย
3. ผลรวมชั่วโมงของหน่วย = ${totalHours - examHours} และมีแถวสอบปลายภาคเรียนละ 1 ชั่วโมง (kind="exam") ภาคเรียนละ 1 แถว รวม ${examHours} ชั่วโมง
4. น้ำหนักคะแนน (score_weight) รวมทุกหน่วย = ${100 - 10 * semesters} และสอบปลายภาคแถวละ 10 คะแนน รวมทั้งปี 100 คะแนน
5. ชั่วโมงและคะแนนเป็นจำนวนเต็ม ชื่อหน่วยสื่อความหมายและสอดคล้องกับตัวชี้วัดที่ผูก

ตอบเป็น JSON รูปแบบ:
{"rows":[{"kind":"unit","semester":1,"name":"...","indicator_codes":["รหัส"],"hours":5,"score_weight":5},{"kind":"exam","semester":1,"name":"สอบปลายภาคเรียนที่ 1","indicator_codes":[],"hours":1,"score_weight":10}]}`;
}

export function promptKeyIdea({ subject, grade, unit, indicators }) {
  return `เขียน "สาระสำคัญ/ความคิดรวบยอด" ของหน่วยการเรียนรู้ "${unit.name}" วิชา${subject} ชั้นประถมศึกษาปีที่ ${grade} จำนวน ${unit.hours} ชั่วโมง
ตัวชี้วัดของหน่วย:
${lines(indicators)}
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
ในแต่ละขั้นเขียนเป็นข้อ ๆ ขึ้นต้นด้วยเลขข้อ มีคำถามและตัวอย่างคำตอบของนักเรียนเมื่อเหมาะสม
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
