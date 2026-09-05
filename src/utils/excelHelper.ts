import * as XLSX from 'xlsx';
import { User, Question, ExamSubmission } from '../types';

// ==========================================
// 1. Student / Personnel Import & Export
// ==========================================

// Helper to normalize grade level strings
export function normalizeGradeLevel(grade?: string): string {
  if (!grade) return '';
  const g = grade.trim();
  if (g === 'ป.1' || g === '1' || g === 'ประถมศึกษาปีที่ 1' || g === 'ชั้นประถมศึกษาปีที่ 1' || g.includes('ป.1') || g.includes('ประถมศึกษาปีที่ 1')) {
    return 'ชั้นประถมศึกษาปีที่ 1';
  }
  if (g === 'ป.2' || g === '2' || g === 'ประถมศึกษาปีที่ 2' || g === 'ชั้นประถมศึกษาปีที่ 2' || g.includes('ป.2') || g.includes('ประถมศึกษาปีที่ 2')) {
    return 'ชั้นประถมศึกษาปีที่ 2';
  }
  if (g === 'ป.3' || g === '3' || g === 'ประถมศึกษาปีที่ 3' || g === 'ชั้นประถมศึกษาปีที่ 3' || g.includes('ป.3') || g.includes('ประถมศึกษาปีที่ 3')) {
    return 'ชั้นประถมศึกษาปีที่ 3';
  }
  if (g === 'ป.4' || g === '4' || g === 'ประถมศึกษาปีที่ 4' || g === 'ชั้นประถมศึกษาปีที่ 4' || g.includes('ป.4') || g.includes('ประถมศึกษาปีที่ 4')) {
    return 'ชั้นประถมศึกษาปีที่ 4';
  }
  if (g === 'ป.5' || g === '5' || g === 'ประถมศึกษาปีที่ 5' || g === 'ชั้นประถมศึกษาปีที่ 5' || g.includes('ป.5') || g.includes('ประถมศึกษาปีที่ 5')) {
    return 'ชั้นประถมศึกษาปีที่ 5';
  }
  if (g === 'ป.6' || g === '6' || g === 'ประถมศึกษาปีที่ 6' || g === 'ชั้นประถมศึกษาปีที่ 6' || g.includes('ป.6') || g.includes('ประถมศึกษาปีที่ 6')) {
    return 'ชั้นประถมศึกษาปีที่ 6';
  }
  return g;
}

export function downloadStudentTemplate() {
  const sampleData = [
    {
      'รหัสนักเรียน/บุคลากร': '1209',
      'คำนำหน้า': 'เด็กชาย',
      'ชื่อ': 'พัชระพงศ์',
      'นามสกุล': 'กระจกเอี่ยม',
      'ชื่อ - นามสกุล': 'เด็กชายพัชระพงศ์ กระจกเอี่ยม',
      'บทบาท (student/teacher/director)': 'student',
      'ระดับชั้น (เช่น ชั้นประถมศึกษาปีที่ 1)': 'ชั้นประถมศึกษาปีที่ 1',
      'ห้อง (เช่น ชั้นประถมศึกษาปีที่ 1/1)': 'ชั้นประถมศึกษาปีที่ 1/1',
      'ชื่อผู้ใช้ (Username)': '1209',
      'รหัสผ่าน (Password)': '123456',
      'อีเมล': 'std1209@kps.ac.th',
      'เบอร์โทร': '089-123-4567',
    },
    {
      'รหัสนักเรียน/บุคลากร': '1204',
      'คำนำหน้า': 'เด็กหญิง',
      'ชื่อ': 'วิภาพร',
      'นามสกุล': 'วังวงค์',
      'ชื่อ - นามสกุล': 'เด็กหญิงวิภาพร วังวงค์',
      'บทบาท (student/teacher/director)': 'student',
      'ระดับชั้น (เช่น ชั้นประถมศึกษาปีที่ 1)': 'ชั้นประถมศึกษาปีที่ 1',
      'ห้อง (เช่น ชั้นประถมศึกษาปีที่ 1/1)': 'ชั้นประถมศึกษาปีที่ 1/1',
      'ชื่อผู้ใช้ (Username)': '1204',
      'รหัสผ่าน (Password)': '123456',
      'อีเมล': 'std1204@kps.ac.th',
      'เบอร์โทร': '089-123-4568',
    },
    {
      'รหัสนักเรียน/บุคลากร': '5106',
      'คำนำหน้า': 'นาย',
      'ชื่อ': 'กล้านรงค์',
      'นามสกุล': 'ศิรินโรจน์',
      'ชื่อ - นามสกุล': 'นายกล้านรงค์ ศิรินโรจน์',
      'บทบาท (student/teacher/director)': 'teacher',
      'ระดับชั้น (เช่น ชั้นประถมศึกษาปีที่ 1)': '',
      'ห้อง (เช่น ชั้นประถมศึกษาปีที่ 1/1)': '',
      'ชื่อผู้ใช้ (Username)': '5106',
      'รหัสผ่าน (Password)': '123456',
      'อีเมล': 'teacher5106@kps.ac.th',
      'เบอร์โทร': '089-510-6001',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อผู้ใช้งาน');
  XLSX.writeFile(wb, 'แบบฟอร์มนำเข้าข้อมูลผู้ใช้_รร_บ้านคลองพลูประชาสรรค์.xlsx');
}

export const downloadUserTemplate = downloadStudentTemplate;

export function exportUsersToExcel(users: User[]) {
  const data = users.map((u, idx) => {
    // derive prefix, firstName, lastName if not separated
    const prefix = u.titlePrefix || '';
    const firstName = u.firstName || '';
    const lastName = u.lastName || '';
    
    return {
      'ลำดับ': idx + 1,
      'รหัสผู้ใช้/ประจำตัว': u.studentId || u.employeeId || u.username,
      'คำนำหน้า': prefix,
      'ชื่อ': firstName,
      'นามสกุล': lastName,
      'ชื่อ - นามสกุล': u.fullName,
      'ชื่อผู้ใช้ (Username)': u.username,
      'บทบาท (Role)': u.role === 'director' ? 'ผู้อำนวยการ' : u.role === 'teacher' ? 'ครูผู้สอน' : 'นักเรียน',
      'ระดับชั้น': u.gradeLevel || '-',
      'ห้อง': u.classRoom || '-',
      'ตำแหน่ง/ฝ่าย': u.positionTitle || u.department || '-',
      'อีเมล': u.email || '-',
      'เบอร์โทรศัพท์': u.phone || '-',
      'สถานะ': u.active ? 'เปิดใช้งาน' : 'ระงับการใช้งาน',
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายชื่อผู้ใช้งาน');
  XLSX.writeFile(wb, `รายชื่อผู้ใช้งาน_รร_บ้านคลองพลูประชาสรรค์_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function parseUserExcel(file: File): Promise<Partial<User>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const users: Partial<User>[] = json.map((row, idx) => {
          const roleRaw = (row['บทบาท (student/teacher/director)'] || row['บทบาท'] || row['role'] || 'student').toString().toLowerCase().trim();
          const role = roleRaw.includes('teach') || roleRaw.includes('ครู')
            ? 'teacher'
            : roleRaw.includes('direct') || roleRaw.includes('ผอ') || roleRaw.includes('บริหาร')
            ? 'director'
            : 'student';

          const titlePrefix = (row['คำนำหน้า'] || row['prefix'] || '').toString().trim();
          const firstName = (row['ชื่อ'] || row['firstname'] || '').toString().trim();
          const lastName = (row['นามสกุล'] || row['lastname'] || '').toString().trim();

          let fullName = (row['ชื่อ - นามสกุล'] || row['คำนำหน้าและชื่อ-นามสกุล'] || row['ชื่อ-นามสกุล'] || row['fullName'] || '').toString().trim();
          
          if (!fullName && (firstName || lastName)) {
            fullName = `${titlePrefix ? titlePrefix : ''}${firstName} ${lastName}`.trim();
          } else if (!fullName) {
            fullName = `ผู้ใช้ ${idx + 1}`;
          }

          const username = (row['ชื่อผู้ใช้ (Username)'] || row['ชื่อผู้ใช้'] || row['username'] || row['รหัสนักเรียน/บุคลากร'] || row['รหัสผู้ใช้/ประจำตัว'] || `user_${Date.now()}_${idx}`).toString().trim();
          const password = (row['รหัสผ่าน (Password)'] || row['รหัสผ่าน'] || row['password'] || '123456').toString().trim();
          const code = (row['รหัสนักเรียน/บุคลากร'] || row['รหัสผู้ใช้/ประจำตัว'] || row['studentId'] || row['employeeId'] || username).toString().trim();

          return {
            id: `usr-import-${Date.now()}-${idx}`,
            titlePrefix: titlePrefix || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            fullName,
            username,
            password,
            role,
            gradeLevel: normalizeGradeLevel((row['ระดับชั้น (เช่น ชั้นประถมศึกษาปีที่ 1)'] || row['ระดับชั้น (เช่น ป.1)'] || row['ระดับชั้น'] || row['gradeLevel'] || '').toString().trim()),
            classRoom: (row['ห้อง (เช่น ชั้นประถมศึกษาปีที่ 1/1)'] || row['ห้อง (เช่น ป.1/1)'] || row['ห้อง'] || row['classRoom'] || '').toString().trim(),
            studentId: role === 'student' ? code : undefined,
            employeeId: role !== 'student' ? code : undefined,
            email: (row['อีเมล'] || row['email'] || '').toString().trim(),
            phone: (row['เบอร์โทร'] || row['เบอร์โทรศัพท์'] || row['phone'] || '').toString().trim(),
            active: true,
            createdAt: new Date().toISOString(),
          };
        });

        resolve(users);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// 2. Question Bank Import & Export
// ==========================================

export function downloadQuestionTemplate() {
  const sampleQuestions = [
    {
      'ข้อที่': 1,
      'โจทย์คำถาม': 'ข้อใดเป็นสัตว์เลี้ยงลูกด้วยนม?',
      'ตัวเลือก ก': 'วาฬ',
      'ตัวเลือก ข': 'ปลาฉลาม',
      'ตัวเลือก ค': 'กบ',
      'ตัวเลือก ง': 'นกแก้ว',
      'เฉลย (ก/ข/ค/ง หรือ 1/2/3/4)': 'ก',
      'คะแนน': 1,
      'คำอธิบายเฉลย': 'วาฬเป็นสัตว์เลี้ยงลูกด้วยนมที่อาศัยอยู่ในน้ำ',
      'ระดับความยาก (easy/medium/hard)': 'easy',
    },
    {
      'ข้อที่': 2,
      'โจทย์คำถาม': 'คำว่า "ประชาสรรค์" มีความหมายเกี่ยวกับอะไร?',
      'ตัวเลือก ก': 'การสร้างสรรค์ร่วมกันเพื่อประชาชน',
      'ตัวเลือก ข': 'การรวมกลุ่มเฉพาะบุคคล',
      'ตัวเลือก ค': 'การแข่งขันทางการค้า',
      'ตัวเลือก ง': 'การท่องเที่ยว',
      'เฉลย (ก/ข/ค/ง หรือ 1/2/3/4)': 'ก',
      'คะแนน': 1,
      'คำอธิบายเฉลย': 'ประชา หมายถึง ปวงชน, สรรค์ หมายถึง สร้างสรรค์',
      'ระดับความยาก (easy/medium/hard)': 'medium',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleQuestions);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'คลังข้อสอบ');
  XLSX.writeFile(wb, 'แบบฟอร์มนำเข้าข้อสอบ_LMS_KPS.xlsx');
}

export function parseQuestionExcel(file: File): Promise<Question[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const questions: Question[] = json.map((row, index) => {
          const optA = (row['ตัวเลือก ก'] || row['ก'] || row['option1'] || '').toString().trim();
          const optB = (row['ตัวเลือก ข'] || row['ข'] || row['option2'] || '').toString().trim();
          const optC = (row['ตัวเลือก ค'] || row['ค'] || row['option3'] || '').toString().trim();
          const optD = (row['ตัวเลือก ง'] || row['ง'] || row['option4'] || '').toString().trim();

          const rawAns = (row['เฉลย (ก/ข/ค/ง หรือ 1/2/3/4)'] || row['เฉลย'] || row['correctAnswer'] || 'ก').toString().trim().toLowerCase();
          let correctIdx = 0;
          if (rawAns === 'ก' || rawAns === '1' || rawAns === 'a') correctIdx = 0;
          else if (rawAns === 'ข' || rawAns === '2' || rawAns === 'b') correctIdx = 1;
          else if (rawAns === 'ค' || rawAns === '3' || rawAns === 'c') correctIdx = 2;
          else if (rawAns === 'ง' || rawAns === '4' || rawAns === 'd') correctIdx = 3;

          const options = [optA, optB, optC, optD].filter((o) => o !== '');

          return {
            id: `q-import-${Date.now()}-${index}`,
            text: (row['โจทย์คำถาม'] || row['คำถาม'] || `คำถามข้อที่ ${index + 1}`).toString().trim(),
            type: 'choice_single',
            options: options.length >= 2 ? options : ['ตัวเลือก 1', 'ตัวเลือก 2', 'ตัวเลือก 3', 'ตัวเลือก 4'],
            correctAnswer: correctIdx,
            points: Number(row['คะแนน'] || 1),
            explanation: (row['คำอธิบายเฉลย'] || row['คำอธิบาย'] || '').toString().trim() || undefined,
            difficulty: ['easy', 'medium', 'hard'].includes(row['ระดับความยาก (easy/medium/hard)'])
              ? row['ระดับความยาก (easy/medium/hard)']
              : 'medium',
          };
        });

        resolve(questions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseQuestionPlainText(rawText: string): Question[] {
  const blocks = rawText.split(/\n\s*\n/).filter((b) => b.trim() !== '');
  const questions: Question[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return;

    let text = lines[0].replace(/^\d+[\.\)]\s*/, '');
    const options: string[] = [];
    let correctAnswer = 0;
    let explanation = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^[ก-งA-Da-d1-4][\.\)]\s*/.test(line)) {
        options.push(line.replace(/^[ก-งA-Da-d1-4][\.\)]\s*/, ''));
      } else if (/^(เฉลย|คำตอบ|Answer|Ans):\s*/i.test(line)) {
        const ansChar = line.replace(/^(เฉลย|คำตอบ|Answer|Ans):\s*/i, '').trim().toLowerCase();
        if (ansChar === 'ก' || ansChar === '1' || ansChar === 'a') correctAnswer = 0;
        else if (ansChar === 'ข' || ansChar === '2' || ansChar === 'b') correctAnswer = 1;
        else if (ansChar === 'ค' || ansChar === '3' || ansChar === 'c') correctAnswer = 2;
        else if (ansChar === 'ง' || ansChar === '4' || ansChar === 'd') correctAnswer = 3;
      } else if (/^(คำอธิบาย|เหตุผล|Explanation):\s*/i.test(line)) {
        explanation = line.replace(/^(คำอธิบาย|เหตุผล|Explanation):\s*/i, '').trim();
      }
    }

    if (text && options.length >= 2) {
      questions.push({
        id: `q-text-${Date.now()}-${idx}`,
        text,
        type: 'choice_single',
        options,
        correctAnswer: correctAnswer < options.length ? correctAnswer : 0,
        points: 1,
        explanation: explanation || undefined,
        difficulty: 'medium',
      });
    }
  });

  return questions;
}

// ==========================================
// 3. Export Exam Results to Excel
// ==========================================

export function exportExamResultsToExcel(param1: string | ExamSubmission[], param2?: string | ExamSubmission[]) {
  let examTitle = 'ผลการสอบ';
  let submissions: ExamSubmission[] = [];

  if (typeof param1 === 'string') {
    examTitle = param1;
    submissions = (Array.isArray(param2) ? param2 : []) as ExamSubmission[];
  } else if (Array.isArray(param1)) {
    submissions = param1 as ExamSubmission[];
    if (typeof param2 === 'string') {
      examTitle = param2;
    }
  }

  if (submissions.length === 0) {
    alert('ไม่พบข้อมูลผลการสอบสำหรับส่งออก Excel');
    return;
  }

  const data = submissions.map((sub, index) => ({
    'ลำดับ': index + 1,
    'รหัสนักเรียน': sub.studentCode || '',
    'ชื่อ-นามสกุล': sub.studentName || '',
    'ระดับชั้น': sub.gradeLevel || '',
    'ห้อง': sub.classRoom || '',
    'ชุดข้อสอบ': sub.examTitle || examTitle,
    'วิชา': sub.courseName || '',
    'คะแนนที่ได้': sub.score ?? 0,
    'คะแนนเต็ม': sub.totalPoints ?? 0,
    'ร้อยละ (%)': typeof sub.percentage === 'number' ? sub.percentage.toFixed(2) : '0.00',
    'ผลการสอบ': sub.passed ? 'ผ่าน' : 'ไม่ผ่าน',
    'เวลาที่ใช้ (นาที)': typeof sub.timeSpentSeconds === 'number' ? (sub.timeSpentSeconds / 60).toFixed(1) : '-',
    'วันที่ส่งข้อสอบ': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('th-TH') : '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ผลการทดสอบ');
  XLSX.writeFile(wb, `ผลการสอบ_${examTitle.replace(/[\/\\?%*:|"<>]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
