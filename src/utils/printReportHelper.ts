import { Exam, ExamSubmission, SchoolInfo, User } from '../types';

/**
 * Generates clean standalone HTML for Class Summary Report
 */
export function generateClassSummaryHtml(params: {
  schoolInfo: SchoolInfo;
  activeExam: Exam;
  selectedClassRoom: string;
  selectedYear: string;
  filteredSubmissions: ExamSubmission[];
  stats: {
    totalStudents: number;
    avgScore: string;
    maxScore: number;
    minScore: number;
    passPercent: number;
    passCount: number;
  };
}): string {
  const { schoolInfo, activeExam, selectedClassRoom, selectedYear, filteredSubmissions, stats } = params;

  const schoolDisplayName = (schoolInfo as any)?.schoolName || (schoolInfo as any)?.name || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const schoolSub = (schoolInfo as any)?.schoolSubName || (schoolInfo as any)?.affiliation || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา';
  const directorTitle = (schoolInfo as any)?.directorTitle || `ผู้อำนวยการ${schoolDisplayName}`;
  const directorName = schoolInfo?.directorName || 'นายปรัชญา คลองพลู';

  const rowsHtml = filteredSubmissions.map((sub, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; font-family: monospace;">${sub.studentCode || '-'}</td>
      <td>${sub.studentName}</td>
      <td style="text-align: center;">${sub.classRoom || sub.gradeLevel || '-'}</td>
      <td style="text-align: center; font-weight: bold;">${sub.score} / ${sub.totalPoints}</td>
      <td style="text-align: center;">${sub.percentage}%</td>
      <td style="text-align: center; font-weight: bold; color: ${sub.passed ? '#047857' : '#b91c1c'};">
        ${sub.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานสรุปผลการประเมิน - ${activeExam?.title || 'แบบทดสอบ'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 16px;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 6px;
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    .subtitle {
      font-size: 12px;
      color: #475569;
      margin: 0 0 6px 0;
    }
    h2 {
      font-size: 14px;
      font-weight: 700;
      margin: 6px 0 0 0;
      color: #1e293b;
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      font-size: 12px;
    }
    .meta-right {
      text-align: right;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 16px;
      text-align: center;
      background: #ffffff;
    }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }
    .stat-val {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .stat-val-indigo { color: #4338ca; }
    .stat-val-emerald { color: #047857; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 6px 8px;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 700;
      text-align: center;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .signatures {
      margin-top: 36px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: center;
      font-size: 12px;
      page-break-inside: avoid;
    }
    .sign-space {
      margin-top: 45px;
    }
    .no-print-bar {
      background: #1e1b4b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
    }
    .btn:hover {
      background: #4338ca;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>📄 หน้าต่างพิมพ์รายงานเอกสารมาตรฐาน A4</strong>
      <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
        คำแนะนำ: ในหน้าต่างพิมพ์ ให้เลือกปลายทางเป็น <strong>"Save as PDF" (บันทึกเป็น PDF)</strong> หรือเลือกเครื่องพิมพ์
      </div>
    </div>
    <button class="btn" onclick="window.print()">🖨️ สั่งพิมพ์ / บันทึก PDF</button>
  </div>

  <div class="header">
    ${schoolInfo?.logoUrl ? `<img src="${schoolInfo.logoUrl}" alt="Logo" class="logo" />` : ''}
    <h1>${schoolDisplayName}</h1>
    <div class="subtitle">สังกัด${schoolSub} • ${schoolInfo?.address || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}</div>
    <h2>รายงานสรุปผลการประเมินผลสัมฤทธิ์ทางการเรียนออนไลน์ ${selectedYear !== 'all' ? `ประจำปีการศึกษา ${selectedYear}` : ''}</h2>
  </div>

  <div class="meta-box">
    <div>
      <div><strong>รหัสและชื่อวิชา:</strong> ${activeExam?.courseCode || ''} ${activeExam?.courseName || ''}</div>
      <div><strong>ชื่อแบบทดสอบ:</strong> ${activeExam?.title || ''}</div>
      <div><strong>ระดับชั้น/ห้อง:</strong> ${activeExam?.gradeLevel || ''} (ห้อง: ${selectedClassRoom === 'all' ? 'ทุกห้องเรียน' : selectedClassRoom})</div>
    </div>
    <div class="meta-right">
      <div><strong>ภาคเรียนที่/ปีการศึกษา:</strong> ${activeExam?.semester || schoolInfo?.semester || '1'}/${activeExam?.academicYear || schoolInfo?.academicYear || '2568'}</div>
      <div><strong>คะแนนเต็ม:</strong> ${activeExam?.totalPoints || 0} คะแนน (เกณฑ์ผ่าน ${activeExam?.passingScorePercentage || 60}%)</div>
      <div><strong>ครูผู้สอน:</strong> ${activeExam?.createdByName || 'ครูประจำวิชา'}</div>
    </div>
  </div>

  <div class="stats-grid">
    <div>
      <div class="stat-label">จำนวนผู้เข้าสอบ</div>
      <div class="stat-val">${stats.totalStudents} คน</div>
    </div>
    <div>
      <div class="stat-label">คะแนนเฉลี่ย (Mean)</div>
      <div class="stat-val stat-val-indigo">${stats.avgScore}</div>
    </div>
    <div>
      <div class="stat-label">คะแนนสูงสุด / ต่ำสุด</div>
      <div class="stat-val">${stats.maxScore} / ${stats.minScore}</div>
    </div>
    <div>
      <div class="stat-label">อัตราการผ่านเกณฑ์</div>
      <div class="stat-val stat-val-emerald">${stats.passPercent}% (${stats.passCount} คน)</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px;">ที่</th>
        <th style="width: 90px;">รหัสนักเรียน</th>
        <th>ชื่อ - นามสกุล</th>
        <th style="width: 120px;">ระดับชั้น / ห้องเรียน</th>
        <th style="width: 90px;">คะแนนที่ได้</th>
        <th style="width: 75px;">ร้อยละ (%)</th>
        <th style="width: 90px;">ผลการประเมิน</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 15px; color: #94a3b8;">ยังไม่มีข้อมูลการส่งข้อสอบ</td></tr>'}
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <p>ลงชื่อ..............................................................</p>
      <div class="sign-space">
        <p style="font-weight: bold; margin: 0;">(${activeExam?.createdByName || 'ครูประจำวิชา'})</p>
        <p style="color: #64748b; margin: 2px 0 0 0;">ครูผู้สอน / ผู้ตรวจข้อสอบ</p>
      </div>
    </div>
    <div>
      <p>ลงชื่อ..............................................................</p>
      <div class="sign-space">
        <p style="font-weight: bold; margin: 0;">(${directorName})</p>
        <p style="color: #64748b; margin: 2px 0 0 0;">${directorTitle}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generates clean standalone HTML for Student Individual Transcript
 */
export function generateStudentTranscriptHtml(params: {
  schoolInfo: SchoolInfo;
  activeStudent: User;
  selectedYear: string;
  studentSubs: ExamSubmission[];
}): string {
  const { schoolInfo, activeStudent, selectedYear, studentSubs } = params;

  const schoolDisplayName = (schoolInfo as any)?.schoolName || (schoolInfo as any)?.name || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const schoolSub = (schoolInfo as any)?.schoolSubName || (schoolInfo as any)?.affiliation || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา';
  const directorTitle = (schoolInfo as any)?.directorTitle || `ผู้อำนวยการ${schoolDisplayName}`;
  const directorName = schoolInfo?.directorName || 'นายปรัชญา คลองพลู';

  const rowsHtml = studentSubs.map((sub, idx) => `
    <tr>
      <td style="text-align: center;">${idx + 1}</td>
      <td style="text-align: center; font-weight: bold;">${sub.academicYear || schoolInfo?.academicYear || '2568'}/${sub.semester || schoolInfo?.semester || '1'}</td>
      <td><strong>${sub.courseCode || ''}</strong> - ${sub.courseName || ''}</td>
      <td>${sub.examTitle || ''}</td>
      <td style="text-align: center; font-weight: bold;">${sub.score} / ${sub.totalPoints}</td>
      <td style="text-align: center;">${sub.percentage}%</td>
      <td style="text-align: center; font-weight: bold; color: ${sub.passed ? '#047857' : '#b91c1c'};">
        ${sub.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
      </td>
      <td style="text-align: center;">${new Date(sub.submittedAt).toLocaleDateString('th-TH')}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบบันทึกผลสัมฤทธิ์รายบุคคล - ${activeStudent?.fullName || 'นักเรียน'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Sarabun', sans-serif;
      font-size: 13px;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 16px;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 6px;
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 4px 0;
    }
    .subtitle {
      font-size: 12px;
      color: #475569;
      margin: 0 0 6px 0;
    }
    h2 {
      font-size: 14px;
      font-weight: 700;
      margin: 6px 0 0 0;
      color: #1e293b;
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .meta-right {
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 6px 8px;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 700;
      text-align: center;
    }
    tr:nth-child(even) {
      background-color: #fafafa;
    }
    .signatures {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      text-align: center;
      font-size: 12px;
      page-break-inside: avoid;
    }
    .sign-space {
      margin-top: 45px;
    }
    .no-print-bar {
      background: #1e1b4b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
    }
    .btn:hover {
      background: #4338ca;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div>
      <strong>📄 ใบบันทึกผลสัมฤทธิ์ทางการเรียนรายบุคคล (A4)</strong>
      <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">
        คำแนะนำ: ในหน้าต่างพิมพ์ ให้เลือกปลายทางเป็น <strong>"Save as PDF" (บันทึกเป็น PDF)</strong> หรือเลือกเครื่องพิมพ์
      </div>
    </div>
    <button class="btn" onclick="window.print()">🖨️ สั่งพิมพ์ / บันทึก PDF</button>
  </div>

  <div class="header">
    ${schoolInfo?.logoUrl ? `<img src="${schoolInfo.logoUrl}" alt="Logo" class="logo" />` : ''}
    <h1>${schoolDisplayName}</h1>
    <div class="subtitle">สังกัด${schoolSub} • ${schoolInfo?.address || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}</div>
    <h2>ใบรายงานผลการประเมินสมรรถนะและการทดสอบออนไลน์รายบุคคล ${selectedYear !== 'all' ? `(ปีการศึกษา ${selectedYear})` : ''}</h2>
  </div>

  <div class="meta-box">
    <div>
      <div><strong>ชื่อ - สกุล นักเรียน:</strong> ${activeStudent?.fullName || ''}</div>
      <div><strong>รหัสประจำตัวนักเรียน:</strong> ${activeStudent?.studentId || activeStudent?.username || ''}</div>
      <div><strong>ระดับชั้น / ห้องเรียน:</strong> ${activeStudent?.gradeLevel || ''} ${activeStudent?.classRoom ? `(${activeStudent.classRoom})` : ''}</div>
    </div>
    <div class="meta-right">
      <div><strong>โรงเรียน:</strong> ${schoolDisplayName}</div>
      <div><strong>ปีการศึกษาที่แสดง:</strong> ${selectedYear === 'all' ? 'ประวัติทุกปีการศึกษา' : `ปีการศึกษา ${selectedYear}`}</div>
      <div><strong>วันที่พิมพ์รายงาน:</strong> ${new Date().toLocaleDateString('th-TH')}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px;">ที่</th>
        <th style="width: 80px;">ปีการศึกษา</th>
        <th>ชื่อวิชา / รหัสวิชา</th>
        <th>ชื่อชุดข้อสอบ</th>
        <th style="width: 85px;">คะแนนที่ได้</th>
        <th style="width: 75px;">ร้อยละ (%)</th>
        <th style="width: 85px;">ผลการประเมิน</th>
        <th style="width: 100px;">วันที่ทำข้อสอบ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 15px; color: #94a3b8;">ยังไม่มีประวัติการทำแบบทดสอบ</td></tr>'}
    </tbody>
  </table>

  <div class="signatures">
    <div>
      <p>ลงชื่อ..............................................................</p>
      <div class="sign-space">
        <p style="font-weight: bold; margin: 0;">(ครูประจำชั้น / ครูที่ปรึกษา ${activeStudent?.classRoom || activeStudent?.gradeLevel || ''})</p>
        <p style="color: #64748b; margin: 2px 0 0 0;">ครูที่ปรึกษา</p>
      </div>
    </div>
    <div>
      <p>ลงชื่อ..............................................................</p>
      <div class="sign-space">
        <p style="font-weight: bold; margin: 0;">(${directorName})</p>
        <p style="color: #64748b; margin: 2px 0 0 0;">${directorTitle}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers reliable printing using a hidden iframe with fallback to window/blob
 */
export function executePrint(htmlContent: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // 1. Try hidden iframe printing
      let iframe = document.getElementById('kps-print-iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'kps-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc && iframe.contentWindow) {
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve(true);
          } catch (e) {
            console.warn('Iframe print failed, falling back to blob tab:', e);
            openPrintInNewTab(htmlContent);
            resolve(true);
          }
        }, 500);
        return;
      }

      // Fallback
      openPrintInNewTab(htmlContent);
      resolve(true);
    } catch (err) {
      console.error('Print execution error:', err);
      openPrintInNewTab(htmlContent);
      resolve(false);
    }
  });
}

/**
 * Opens printable document in a new tab/blob
 */
export function openPrintInNewTab(htmlContent: string) {
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Popup blocked, trigger direct download
      downloadReportFile('รายงานผลสัมฤทธิ์ทางการเรียน_LMS_KPS.html', htmlContent);
    }
  } catch (e) {
    console.error('Failed to open print tab:', e);
    downloadReportFile('รายงานผลสัมฤทธิ์ทางการเรียน_LMS_KPS.html', htmlContent);
  }
}

/**
 * Direct file download for HTML report
 */
export function downloadReportFile(filename: string, htmlContent: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
