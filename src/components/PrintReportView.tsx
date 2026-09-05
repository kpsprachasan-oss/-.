import React, { useState, useMemo, useEffect } from 'react';
import { Course, Exam, ExamSubmission, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { exportExamResultsToExcel } from '../utils/excelHelper';
import {
  generateClassSummaryHtml,
  generateStudentTranscriptHtml,
  executePrint,
  openPrintInNewTab,
  downloadReportFile
} from '../utils/printReportHelper';
import {
  Printer,
  X,
  FileText,
  Calendar,
  Filter,
  Download,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PrintReportViewProps {
  exams: Exam[];
  submissions: ExamSubmission[];
  users: User[];
  courses: Course[];
  initialReportType?: 'class_summary' | 'student_transcript';
  initialExamId?: string;
  initialStudentId?: string;
  initialClassRoom?: string;
  onClose?: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  exams,
  submissions,
  users,
  courses,
  initialReportType,
  initialExamId,
  initialStudentId,
  initialClassRoom,
  onClose,
}) => {
  const { schoolInfo } = useAuth();
  const [reportType, setReportType] = useState<'class_summary' | 'student_transcript'>(
    initialReportType || 'class_summary'
  );
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    initialExamId || exams[0]?.id || ''
  );
  const [selectedClassRoom, setSelectedClassRoom] = useState<string>(
    initialClassRoom || 'all'
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const students = useMemo(() => users.filter((u) => u.role === 'student'), [users]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );

  // Sync props if changed
  useEffect(() => {
    if (initialReportType) setReportType(initialReportType);
  }, [initialReportType]);

  useEffect(() => {
    if (initialExamId) setSelectedExamId(initialExamId);
  }, [initialExamId]);

  useEffect(() => {
    if (initialStudentId) setSelectedStudentId(initialStudentId);
  }, [initialStudentId]);

  useEffect(() => {
    if (initialClassRoom) setSelectedClassRoom(initialClassRoom);
  }, [initialClassRoom]);

  // Extract all distinct academic years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    if (schoolInfo?.academicYear) years.add(schoolInfo.academicYear);
    exams.forEach(e => { if (e.academicYear) years.add(e.academicYear); });
    submissions.forEach(s => { if (s.academicYear) years.add(s.academicYear); });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [schoolInfo, exams, submissions]);

  // Extract available classrooms
  const availableClassrooms = useMemo(() => {
    const cls = new Set<string>();
    students.forEach(s => { if (s.classRoom) cls.add(s.classRoom); });
    return Array.from(cls).sort();
  }, [students]);

  // Filter exams by year/semester
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      if (selectedYear !== 'all' && (e.academicYear || schoolInfo?.academicYear) !== selectedYear) return false;
      if (selectedSemester !== 'all' && (e.semester || schoolInfo?.semester) !== selectedSemester) return false;
      return true;
    });
  }, [exams, selectedYear, selectedSemester, schoolInfo]);

  const activeExam = useMemo(() => {
    return filteredExams.find(e => e.id === selectedExamId) || filteredExams[0] || exams[0];
  }, [filteredExams, selectedExamId, exams]);

  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Submissions filtered by exam and classroom
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchExam = s.examId === activeExam?.id;
      const matchClass = selectedClassRoom === 'all' || s.classRoom === selectedClassRoom;
      return matchExam && matchClass;
    });
  }, [submissions, activeExam, selectedClassRoom]);

  // Calculate quick stats
  const totalStudents = filteredSubmissions.length;
  const avgScore = totalStudents > 0
    ? (filteredSubmissions.reduce((a, s) => a + s.score, 0) / totalStudents).toFixed(2)
    : '0';
  const passCount = filteredSubmissions.filter((s) => s.passed).length;
  const passPercent = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;
  const maxScore = totalStudents > 0 ? Math.max(...filteredSubmissions.map((s) => s.score)) : 0;
  const minScore = totalStudents > 0 ? Math.min(...filteredSubmissions.map((s) => s.score)) : 0;

  // Student specific submissions filtered by year if selected
  const studentSubs = useMemo(() => {
    return submissions.filter((s) => {
      if (s.studentId !== activeStudent?.id) return false;
      if (selectedYear !== 'all' && (s.academicYear || schoolInfo?.academicYear) !== selectedYear) return false;
      if (selectedSemester !== 'all' && (s.semester || schoolInfo?.semester) !== selectedSemester) return false;
      return true;
    });
  }, [submissions, activeStudent, selectedYear, selectedSemester, schoolInfo]);

  // Generate current document HTML
  const getCurrentHtml = () => {
    if (reportType === 'class_summary') {
      return generateClassSummaryHtml({
        schoolInfo,
        activeExam,
        selectedClassRoom,
        selectedYear,
        filteredSubmissions,
        stats: {
          totalStudents,
          avgScore,
          maxScore,
          minScore,
          passPercent,
          passCount,
        },
      });
    } else {
      return generateStudentTranscriptHtml({
        schoolInfo,
        activeStudent,
        selectedYear,
        studentSubs,
      });
    }
  };

  // Primary Action: Print or Save as PDF
  const handlePrint = async () => {
    setIsPrinting(true);
    setStatusMessage('กำลังเปิดหน้าต่างพิมพ์เอกสาร... (หากต้องการบันทึกเป็น PDF ให้เลือกปลายทางเป็น Save as PDF)');
    
    try {
      const html = getCurrentHtml();
      await executePrint(html);
    } catch (err) {
      console.error('Print trigger error:', err);
      // Fallback
      window.print();
    } finally {
      setIsPrinting(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Secondary Action: Open standalone print tab
  const handleOpenStandalone = () => {
    const html = getCurrentHtml();
    openPrintInNewTab(html);
  };

  // Secondary Action: Download HTML document
  const handleDownloadHtml = () => {
    const html = getCurrentHtml();
    const filename = reportType === 'class_summary'
      ? `รายงานสรุปผล_${activeExam?.title || 'แบบทดสอบ'}_${new Date().toISOString().slice(0, 10)}.html`
      : `ผลสัมฤทธิ์_${activeStudent?.fullName || 'นักเรียน'}_${new Date().toISOString().slice(0, 10)}.html`;
    downloadReportFile(filename, html);
    setStatusMessage('ดาวน์โหลดไฟล์เอกสารรายงาน (.HTML) เรียบร้อยแล้ว สามารถเปิดพิมพ์ได้ทุกเบราว์เซอร์');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Secondary Action: Export to Excel
  const handleExportExcel = () => {
    if (reportType === 'class_summary') {
      exportExamResultsToExcel(activeExam?.title || 'ผลการทดสอบ', filteredSubmissions);
      setStatusMessage('ส่งออกข้อมูลเป็นไฟล์ Excel (.xlsx) เรียบร้อยแล้ว');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const schoolDisplayName = (schoolInfo as any)?.schoolName || (schoolInfo as any)?.name || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const schoolSub = (schoolInfo as any)?.schoolSubName || (schoolInfo as any)?.affiliation || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา';
  const directorTitle = (schoolInfo as any)?.directorTitle || `ผู้อำนวยการ${schoolDisplayName}`;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto print-modal-overlay"
    >
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print-modal-content">
        
        {/* Modal Header Controls (Hidden in print) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 no-print shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">พิมพ์เอกสารรายงานผลการประเมิน</h2>
              <p className="text-xs text-slate-400">จัดรูปแบบมาตรฐานพิมพ์หรือบันทึก PDF (A4) จำแนกตามปีการศึกษาและรายบุคคล</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Print Button */}
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
              title="สั่งพิมพ์ หรือ บันทึกเป็น PDF ผ่านเบราว์เซอร์"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'กำลังเตรียมพิมพ์...' : 'พิมพ์ / บันทึก PDF'}</span>
            </button>

            {/* Standalone Tab Button */}
            <button
              onClick={handleOpenStandalone}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="เปิดดูรายงานในหน้าต่าง/แท็บใหม่เพื่อความสะดวกในการพิมพ์"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดแท็บพิมพ์</span>
            </button>

            {/* Download HTML Button */}
            <button
              onClick={handleDownloadHtml}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="บันทึกเป็นไฟล์เอกสาร HTML สำหรับเปิดดูหรือพิมพ์ภายหลัง"
            >
              <Download className="w-3.5 h-3.5" />
              <span>บันทึกไฟล์</span>
            </button>

            {/* Excel Export (Class summary only) */}
            {reportType === 'class_summary' && (
              <button
                onClick={handleExportExcel}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ส่งออกผลคะแนนเป็น Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel</span>
              </button>
            )}

            {/* Close / Return to Dashboard Button */}
            <button
              onClick={() => {
                if (onClose) {
                  onClose();
                }
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer ml-1 transition-colors flex items-center gap-1"
              title="ปิดและกลับหน้า Dashboard"
              aria-label="ปิด"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guidance and Tips Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 text-amber-900 text-xs flex items-center justify-between gap-2 no-print shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>คำแนะนำ:</strong> ในหน้าต่างสั่งพิมพ์ ให้เลือก <strong>ปลายทาง (Destination)</strong> เป็น <strong>"บันทึกเป็น PDF" (Save as PDF)</strong> เพื่อเซฟเป็นไฟล์เอกสาร หรือเลือกเครื่องพิมพ์ของโรงเรียน
            </span>
          </div>
          {statusMessage && (
            <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
              {statusMessage}
            </span>
          )}
        </div>

        {/* Options Toolbar (Hidden in print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">รูปแบบเอกสาร:</span>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-medium shadow-2xs"
              >
                <option value="class_summary">แบบสรุปผลการทดสอบประจำห้องเรียน (Class Summary)</option>
                <option value="student_transcript">ใบบันทึกผลสัมฤทธิ์รายบุคคล (Student Transcript)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-600">ปีการศึกษา:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="all">ทุกปีการศึกษา</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>ปีการศึกษา {y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-600">ภาคเรียน:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="all">ทุกภาคเรียน</option>
                <option value="1">ภาคเรียนที่ 1</option>
                <option value="2">ภาคเรียนที่ 2</option>
              </select>
            </div>
          </div>

          {reportType === 'class_summary' ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">ชุดข้อสอบ:</span>
                <select
                  value={activeExam?.id || ''}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg max-w-[240px] truncate"
                >
                  {filteredExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      [{e.academicYear || schoolInfo?.academicYear}] {e.courseCode} - {e.title}
                    </option>
                  ))}
                  {filteredExams.length === 0 && (
                    <option value="">ไม่มีข้อสอบในปีการศึกษานี้</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">ห้องเรียน:</span>
                <select
                  value={selectedClassRoom}
                  onChange={(e) => setSelectedClassRoom(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="all">ทุกห้องเรียน</option>
                  {availableClassrooms.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">เลือกนักเรียน:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-medium"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.studentId} - {s.fullName} ({s.classRoom || s.gradeLevel})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PRINTABLE SHEET CONTAINER (A4 STYLED) */}
        {/* ======================================================== */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print-content">
          
          {/* School Header */}
          <div className="text-center pb-6 border-b-2 border-slate-800 space-y-1">
            {schoolInfo.logoUrl && (
              <img
                src={schoolInfo.logoUrl}
                alt="School Logo"
                className="w-16 h-16 mx-auto object-contain mb-2"
              />
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {schoolDisplayName}
            </h1>
            <p className="text-xs text-slate-600">
              สังกัด{schoolSub} • {schoolInfo.address || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}
            </p>
            <h2 className="text-sm font-bold text-slate-800 pt-2 uppercase tracking-wide">
              {reportType === 'class_summary'
                ? `รายงานสรุปผลการประเมินผลสัมฤทธิ์ทางการเรียนออนไลน์ ${selectedYear !== 'all' ? `ประจำปีการศึกษา ${selectedYear}` : ''}`
                : `ใบรายงานผลการประเมินสมรรถนะและการทดสอบออนไลน์รายบุคคล ${selectedYear !== 'all' ? `(ปีการศึกษา ${selectedYear})` : ''}`}
            </h2>
          </div>

          {/* ====================================================== */}
          {/* FORMAT 1: CLASSROOM SUMMARY REPORT */}
          {/* ====================================================== */}
          {reportType === 'class_summary' && (
            <div className="space-y-6 pt-6 text-xs">
              
              {/* Exam Info metadata */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-300 rounded-xl">
                <div className="space-y-1">
                  <div><span className="font-bold">รหัสและชื่อวิชา: </span>{activeExam?.courseCode} {activeExam?.courseName}</div>
                  <div><span className="font-bold">ชื่อแบบทดสอบ: </span>{activeExam?.title}</div>
                  <div><span className="font-bold">ระดับชั้น/ห้อง: </span>{activeExam?.gradeLevel} (ห้อง: {selectedClassRoom === 'all' ? 'ทุกห้องเรียน' : selectedClassRoom})</div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-bold">ภาคเรียนที่/ปีการศึกษา: </span>{activeExam?.semester || schoolInfo.semester}/{activeExam?.academicYear || schoolInfo.academicYear}</div>
                  <div><span className="font-bold">คะแนนเต็ม: </span>{activeExam?.totalPoints} คะแนน (เกณฑ์ผ่าน {activeExam?.passingScorePercentage}%)</div>
                  <div><span className="font-bold">ครูผู้สอน: </span>{activeExam?.createdByName || 'ครูประจำวิชา'}</div>
                </div>
              </div>

              {/* Statistics Summary Box */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 border border-slate-300 rounded-xl">
                <div>
                  <div className="text-slate-500 font-medium">จำนวนผู้เข้าสอบ</div>
                  <div className="font-bold text-sm text-slate-900">{totalStudents} คน</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">คะแนนเฉลี่ย (Mean)</div>
                  <div className="font-bold text-sm text-indigo-700">{avgScore}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">คะแนนสูงสุด / ต่ำสุด</div>
                  <div className="font-bold text-sm text-slate-900">{maxScore} / {minScore}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">อัตราการผ่านเกณฑ์</div>
                  <div className="font-bold text-sm text-emerald-700">{passPercent}% ({passCount} คน)</div>
                </div>
              </div>

              {/* Students Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="border border-slate-300 p-2 text-center w-10">ที่</th>
                    <th className="border border-slate-300 p-2 text-center w-24">รหัสนักเรียน</th>
                    <th className="border border-slate-300 p-2 text-left">ชื่อ - นามสกุล</th>
                    <th className="border border-slate-300 p-2 text-center w-36">ระดับชั้น / ห้องเรียน</th>
                    <th className="border border-slate-300 p-2 text-center w-24">คะแนนที่ได้</th>
                    <th className="border border-slate-300 p-2 text-center w-20">ร้อยละ (%)</th>
                    <th className="border border-slate-300 p-2 text-center w-24">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub, idx) => (
                    <tr key={sub.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 text-center font-mono">{sub.studentCode}</td>
                      <td className="border border-slate-300 p-2 font-medium">{sub.studentName}</td>
                      <td className="border border-slate-300 p-2 text-center">{sub.classRoom || sub.gradeLevel}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{sub.score} / {sub.totalPoints}</td>
                      <td className="border border-slate-300 p-2 text-center">{sub.percentage}%</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        <span className={sub.passed ? 'text-emerald-700' : 'text-rose-700'}>
                          {sub.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">
                        ยังไม่มีข้อมูลการส่งข้อสอบในเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-12">
                  <p>ลงชื่อ..............................................................</p>
                  <div>
                    <p className="font-bold">({activeExam?.createdByName || 'ครูประจำวิชา'})</p>
                    <p className="text-slate-500">ครูผู้สอน / ผู้ตรวจข้อสอบ</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p>ลงชื่อ..............................................................</p>
                  <div>
                    <p className="font-bold">({schoolInfo.directorName})</p>
                    <p className="text-slate-500">{directorTitle}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ====================================================== */}
          {/* FORMAT 2: STUDENT INDIVIDUAL TRANSCRIPT REPORT */}
          {/* ====================================================== */}
          {reportType === 'student_transcript' && (
            <div className="space-y-6 pt-6 text-xs">
              
              {/* Student Metadata Card */}
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div><span className="font-bold">ชื่อ - สกุล นักเรียน: </span>{activeStudent?.fullName}</div>
                  <div><span className="font-bold">รหัสประจำตัวนักเรียน: </span>{activeStudent?.studentId}</div>
                  <div><span className="font-bold">ระดับชั้น / ห้องเรียน: </span>{activeStudent?.gradeLevel} {activeStudent?.classRoom ? `(${activeStudent.classRoom})` : ''}</div>
                </div>
                <div className="space-y-1 text-right">
                  <div><span className="font-bold">โรงเรียน: </span>{schoolDisplayName}</div>
                  <div><span className="font-bold">ปีการศึกษาที่แสดง: </span>{selectedYear === 'all' ? 'ประวัติทุกปีการศึกษา' : `ปีการศึกษา ${selectedYear}`}</div>
                  <div><span className="font-bold">วันที่พิมพ์รายงาน: </span>{new Date().toLocaleDateString('th-TH')}</div>
                </div>
              </div>

              {/* Submissions Table */}
              <table className="w-full border-collapse border border-slate-400 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400">
                    <th className="border border-slate-300 p-2 text-center w-10">ที่</th>
                    <th className="border border-slate-300 p-2 text-center w-20">ปีการศึกษา</th>
                    <th className="border border-slate-300 p-2 text-left">ชื่อวิชา / รหัสวิชา</th>
                    <th className="border border-slate-300 p-2 text-left">ชื่อชุดข้อสอบ</th>
                    <th className="border border-slate-300 p-2 text-center w-24">คะแนนที่ได้</th>
                    <th className="border border-slate-300 p-2 text-center w-20">ร้อยละ (%)</th>
                    <th className="border border-slate-300 p-2 text-center w-24">ผลการประเมิน</th>
                    <th className="border border-slate-300 p-2 text-center w-24">วันที่ทำแบบทดสอบ</th>
                  </tr>
                </thead>
                <tbody>
                  {studentSubs.map((sub, idx) => (
                    <tr key={sub.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{sub.academicYear || schoolInfo.academicYear}/{sub.semester || schoolInfo.semester}</td>
                      <td className="border border-slate-300 p-2 font-medium">{sub.courseCode} - {sub.courseName}</td>
                      <td className="border border-slate-300 p-2">{sub.examTitle}</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{sub.score} / {sub.totalPoints}</td>
                      <td className="border border-slate-300 p-2 text-center">{sub.percentage}%</td>
                      <td className="border border-slate-300 p-2 text-center font-bold">
                        <span className={sub.passed ? 'text-emerald-700' : 'text-rose-700'}>
                          {sub.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))}
                  {studentSubs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400">
                        นักเรียนยังไม่มีประวัติการส่งข้อสอบในเงื่อนไขปีการศึกษาที่เลือก
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-16 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-12">
                  <p>ลงชื่อ..............................................................</p>
                  <div>
                    <p className="font-bold">(ครูประจำชั้น / ครูที่ปรึกษา {activeStudent?.classRoom || activeStudent?.gradeLevel})</p>
                    <p className="text-slate-500">ครูที่ปรึกษา</p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p>ลงชื่อ..............................................................</p>
                  <div>
                    <p className="font-bold">({schoolInfo.directorName})</p>
                    <p className="text-slate-500">{directorTitle}</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

