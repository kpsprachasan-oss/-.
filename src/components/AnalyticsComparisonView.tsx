import React, { useState, useEffect } from 'react';
import { Course, Exam, ExamSubmission, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { exportExamResultsToExcel } from '../utils/excelHelper';
import { getStudentGrade, canStudentAccessExam } from '../utils/gradeHelper';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Printer,
  Download,
  Filter,
  Search,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  Lock,
  GraduationCap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

interface AnalyticsComparisonViewProps {
  courses: Course[];
  exams: Exam[];
  submissions: ExamSubmission[];
  users: User[];
  onOpenPrintModal?: (examId?: string, studentId?: string, reportType?: 'class_summary' | 'student_transcript') => void;
}

export const AnalyticsComparisonView: React.FC<AnalyticsComparisonViewProps> = ({
  courses,
  exams,
  submissions,
  users,
  onOpenPrintModal,
}) => {
  const { currentUser, schoolInfo } = useAuth();
  const isStudent = currentUser?.role === 'student';
  const studentGrade = isStudent ? getStudentGrade(currentUser) : '';

  const [activeTab, setActiveTab] = useState<'individual' | 'grade_class'>(
    isStudent ? 'individual' : 'grade_class'
  );

  // Filter exams available
  const availableExams = exams.filter((e) => {
    if (isStudent) {
      return canStudentAccessExam(currentUser, e.gradeLevel);
    }
    return true;
  });

  // Grade & Class comparison filter
  const [selectedExamId, setSelectedExamId] = useState<string>(availableExams[0]?.id || exams[0]?.id || '');
  const [selectedGrade, setSelectedGrade] = useState<string>(isStudent && studentGrade ? studentGrade : 'ม.1');

  // Individual comparison filter
  const students = isStudent
    ? users.filter((u) => u.id === currentUser?.id)
    : users.filter((u) => u.role === 'student');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    isStudent ? (currentUser?.id || '') : students[0]?.id || ''
  );

  useEffect(() => {
    if (isStudent && currentUser) {
      setSelectedStudentId(currentUser.id);
      if (availableExams.length > 0 && !availableExams.find((e) => e.id === selectedExamId)) {
        setSelectedExamId(availableExams[0].id);
      }
    }
  }, [isStudent, currentUser, availableExams, selectedExamId]);

  const activeExam = availableExams.find((e) => e.id === selectedExamId) || exams.find((e) => e.id === selectedExamId) || availableExams[0] || exams[0];
  const activeStudent = isStudent ? currentUser : (students.find((s) => s.id === selectedStudentId) || students[0] || currentUser);

  // ============================================
  // Grade & Classroom Comparison Analytics Math
  // ============================================
  const examSubmissions = submissions.filter((s) => s.examId === activeExam?.id);

  // Group by Classroom (e.g. ม.1/1, ม.1/2)
  const classRooms = Array.from(new Set(examSubmissions.map((s) => s.classRoom || 'ม.1/1'))).sort();
  const classComparisonData = classRooms.map((room) => {
    const roomSubs = examSubmissions.filter((s) => s.classRoom === room);
    const count = roomSubs.length;
    const scores = roomSubs.map((s) => s.score);
    const percentages = roomSubs.map((s) => s.percentage);
    const passedCount = roomSubs.filter((s) => s.passed).length;

    const avgScore = count > 0 ? (scores.reduce((a, b) => a + b, 0) / count).toFixed(1) : 0;
    const avgPct = count > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / count) : 0;
    const maxScore = count > 0 ? Math.max(...scores) : 0;
    const minScore = count > 0 ? Math.min(...scores) : 0;
    const passRate = count > 0 ? Math.round((passedCount / count) * 100) : 0;

    // Standard Deviation calculation
    const mean = Number(avgScore);
    const variance = count > 1
      ? scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / (count - 1)
      : 0;
    const sd = Math.sqrt(variance).toFixed(2);

    return {
      room,
      นักเรียนที่สอบ: count,
      คะแนนเฉลี่ย: Number(avgScore),
      ร้อยละเฉลี่ย: avgPct,
      คะแนนสูงสุด: maxScore,
      คะแนนต่ำสุด: minScore,
      ส่วนเบี่ยงเบนมาตรฐาน: Number(sd),
      อัตราการผ่าน: passRate,
    };
  });

  // Overall statistics for active exam
  const totalExamTakers = examSubmissions.length;
  const overallAvgScore = totalExamTakers > 0
    ? (examSubmissions.reduce((a, s) => a + s.score, 0) / totalExamTakers).toFixed(1)
    : 0;
  const overallPassRate = totalExamTakers > 0
    ? Math.round((examSubmissions.filter((s) => s.passed).length / totalExamTakers) * 100)
    : 0;

  // ============================================
  // Individual Student Comparison Analytics Math
  // ============================================
  const studentSubs = submissions.filter((s) => s.studentId === activeStudent?.id);
  const studentClassSubs = submissions.filter((s) => s.classRoom === activeStudent?.classRoom);

  // Subject competency Radar Chart data
  const subjectRadarData = courses.map((course) => {
    const studentCourseSubs = studentSubs.filter((s) => s.courseId === course.id);
    const studentScore = studentCourseSubs.length > 0
      ? Math.round(studentCourseSubs.reduce((a, s) => a + s.percentage, 0) / studentCourseSubs.length)
      : 75; // baseline

    const allCourseSubs = submissions.filter((s) => s.courseId === course.id);
    const classAvg = allCourseSubs.length > 0
      ? Math.round(allCourseSubs.reduce((a, s) => a + s.percentage, 0) / allCourseSubs.length)
      : 70;

    return {
      subject: course.code,
      subjectName: course.name,
      คะแนนนักเรียน: studentScore,
      ค่าเฉลี่ยระดับชั้น: classAvg,
    };
  });

  // Historical test progress line chart
  const studentTrendData = studentSubs.map((sub) => ({
    name: sub.examTitle.length > 15 ? sub.examTitle.substring(0, 15) + '...' : sub.examTitle,
    คะแนน: sub.percentage,
    เกณฑ์ผ่าน: 60,
  }));

  const handleExportExcel = () => {
    if (activeExam && examSubmissions.length > 0) {
      exportExamResultsToExcel(activeExam.title, examSubmissions);
    } else {
      alert('ยังไม่มีผลการสอบในชุดนี้สำหรับส่งออก');
    }
  };

  const handlePrintReport = () => {
    if (onOpenPrintModal) {
      const rType = activeTab === 'individual' ? 'student_transcript' : 'class_summary';
      onOpenPrintModal(selectedExamId, selectedStudentId, rType);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900">วิเคราะห์และเปรียบเทียบผลการทดสอบ</h1>
          <p className="text-xs text-slate-500">
            วิเคราะห์ผลสัมฤทธิ์ทางการเรียน เปรียบเทียบรายบุคคล รายห้อง และระดับชั้น
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            ส่งออกไฟล์ Excel (.xlsx)
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงานสรุปผล
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex gap-2 max-w-md no-print">
        <button
          onClick={() => setActiveTab('grade_class')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'grade_class'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          เปรียบเทียบระดับชั้น & ห้องเรียน
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'individual'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          เปรียบเทียบผลสอบรายบุคคล
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. GRADE-LEVEL & CLASSROOM COMPARISON VIEW */}
      {/* ======================================================== */}
      {activeTab === 'grade_class' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>เลือกชุดข้อสอบ:</span>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {availableExams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.courseCode} - {e.title} ({e.gradeLevel})
                    </option>
                  ))}
                  {availableExams.length === 0 && (
                    <option value="">ไม่พบชุดข้อสอบในระดับชั้นนี้</option>
                  )}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              มีนักเรียนส่งข้อสอบแล้ว <span className="font-bold text-slate-800">{totalExamTakers}</span> คน
            </div>
          </div>

          {/* Key Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium mb-1">ผู้เข้าสอบทั้งหมด</div>
              <div className="text-2xl font-bold text-slate-900">{totalExamTakers} คน</div>
              <div className="text-[11px] text-slate-400 mt-1">คะแนนเต็ม {activeExam?.totalPoints} คะแนน</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium mb-1">คะแนนเฉลี่ยรวม</div>
              <div className="text-2xl font-bold text-indigo-600">{overallAvgScore}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                คิดเป็น {activeExam?.totalPoints ? Math.round((Number(overallAvgScore) / activeExam.totalPoints) * 100) : 0}%
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium mb-1">อัตราการผ่านเกณฑ์</div>
              <div className="text-2xl font-bold text-emerald-600">{overallPassRate}%</div>
              <div className="text-[11px] text-slate-400 mt-1">เกณฑ์ผ่าน {activeExam?.passingScorePercentage}%</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium mb-1">คะแนนสูงสุด / ต่ำสุด</div>
              <div className="text-2xl font-bold text-slate-900">
                {examSubmissions.length > 0 ? Math.max(...examSubmissions.map((s) => s.score)) : 0}
                <span className="text-sm font-normal text-slate-400"> / {examSubmissions.length > 0 ? Math.min(...examSubmissions.map((s) => s.score)) : 0}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Max / Min คะแนน</div>
            </div>
          </div>

          {/* Bar Chart: Comparison between classrooms */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  เปรียบเทียบผลคะแนนเฉลี่ยและอัตราผ่านรายห้องเรียน ({activeExam?.gradeLevel})
                </h3>
                <p className="text-xs text-slate-500">
                  วิเคราะห์ผลสัมฤทธิ์ระหว่างห้อง {classRooms.join(', ')}
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="room" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend />
                  <Bar dataKey="ร้อยละเฉลี่ย" fill="#4f46e5" radius={[6, 6, 0, 0]} name="ร้อยละคะแนนเฉลี่ย (%)" />
                  <Bar dataKey="อัตราการผ่าน" fill="#10b981" radius={[6, 6, 0, 0]} name="อัตราผ่านเกณฑ์ (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Classroom Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                ตารางสถิติเปรียบเทียบผลการทดสอบแยกตามห้องเรียน
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ห้องเรียน</th>
                    <th className="py-3 px-4 text-center">จำนวนผู้สอบ (คน)</th>
                    <th className="py-3 px-4 text-center">คะแนนเฉลี่ย (Mean)</th>
                    <th className="py-3 px-4 text-center">ร้อยละเฉลี่ย (%)</th>
                    <th className="py-3 px-4 text-center">สูงสุด (Max)</th>
                    <th className="py-3 px-4 text-center">ต่ำสุด (Min)</th>
                    <th className="py-3 px-4 text-center">ส่วนเบี่ยงเบนมาตรฐาน (SD)</th>
                    <th className="py-3 px-4 text-center">อัตราผ่าน (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classComparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{row.room}</td>
                      <td className="py-3 px-4 text-center">{row.นักเรียนที่สอบ}</td>
                      <td className="py-3 px-4 text-center font-semibold text-indigo-600">{row.คะแนนเฉลี่ย}</td>
                      <td className="py-3 px-4 text-center">{row.ร้อยละเฉลี่ย}%</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-medium">{row.คะแนนสูงสุด}</td>
                      <td className="py-3 px-4 text-center text-rose-600 font-medium">{row.คะแนนต่ำสุด}</td>
                      <td className="py-3 px-4 text-center font-mono">{row.ส่วนเบี่ยงเบนมาตรฐาน}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {row.อัตราการผ่าน}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Submissions List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                รายชื่อและผลการสอบของนักเรียนทุกคนในชุดนี้ ({examSubmissions.length} คน)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ลำดับ</th>
                    <th className="py-3 px-4">รหัสนักเรียน</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-3 px-4 text-center">ระดับชั้น/ห้อง</th>
                    <th className="py-3 px-4 text-center">คะแนนที่ได้</th>
                    <th className="py-3 px-4 text-center">คิดเป็นร้อยละ</th>
                    <th className="py-3 px-4 text-center">ผลการสอบ</th>
                    <th className="py-3 px-4 text-center">เวลาที่ใช้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {examSubmissions.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium">{sub.studentCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.studentName}</td>
                      <td className="py-3 px-4 text-center">{sub.gradeLevel} {sub.classRoom}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">
                        {sub.score} / {sub.totalPoints}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{sub.percentage}%</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.passed ? '✓ ผ่าน' : '✕ ตก'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {Math.round(sub.timeSpentSeconds / 60)} นาที
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. INDIVIDUAL STUDENT COMPARISON VIEW */}
      {/* ======================================================== */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          
          {/* Student Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">
                {isStudent ? 'รายงานผลการเรียนของ:' : 'เลือกนักเรียนที่ต้องการวิเคราะห์:'}
              </span>
              {isStudent ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-bold">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{currentUser?.fullName} ({currentUser?.studentId || 'รหัสประจำตัว'})</span>
                </div>
              ) : (
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentId} - {s.fullName} ({s.gradeLevel} {s.classRoom})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                ระดับชั้น: <span className="font-bold text-slate-900">{activeStudent?.gradeLevel} {activeStudent?.classRoom}</span>
              </span>
            </div>
          </div>

          {/* Student Profile & Radar Competency Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Student Overview Card (4 cols) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="text-center space-y-2">
                <img
                  src={activeStudent?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeStudent?.username}`}
                  alt={activeStudent?.fullName}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-indigo-200 shadow-xs"
                />
                <h3 className="font-bold text-base text-slate-900">{activeStudent?.fullName}</h3>
                <div className="text-xs text-slate-500">
                  รหัสประจำตัว: {activeStudent?.studentId} • ห้อง {activeStudent?.classRoom}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ทำแบบทดสอบแล้ว:</span>
                  <span className="font-bold text-slate-900">{studentSubs.length} ชุด</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ผ่านเกณฑ์:</span>
                  <span className="font-bold text-emerald-600">
                    {studentSubs.filter((s) => s.passed).length} ชุด
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">คะแนนเฉลี่ยสะสม:</span>
                  <span className="font-bold text-indigo-600">
                    {studentSubs.length > 0
                      ? Math.round(studentSubs.reduce((a, s) => a + s.percentage, 0) / studentSubs.length)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ระดับคุณภาพ:</span>
                  <span className="font-bold text-emerald-700">
                    {studentSubs.length > 0 && studentSubs.every((s) => s.percentage >= 80)
                      ? 'ดีเยี่ยม (ระดับ 4)'
                      : 'ผ่านเกณฑ์มาตรฐาน'}
                  </span>
                </div>
              </div>
            </div>

            {/* Radar Chart: Student vs Class Average across subjects (8 cols) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-base text-slate-900 mb-1">
                เรดาร์วิเคราะห์สมรรถนะรายวิชา เปรียบเทียบกับค่าเฉลี่ยระดับชั้น
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                เปรียบเทียบคะแนนสัมฤทธิ์ของ {activeStudent?.fullName} กับเกณฑ์เฉลี่ยของเพื่อนร่วมชั้น
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={subjectRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" fontSize={11} stroke="#475569" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                    <Radar
                      name={activeStudent?.fullName || 'นักเรียน'}
                      dataKey="คะแนนนักเรียน"
                      stroke="#4f46e5"
                      fill="#4f46e5"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="ค่าเฉลี่ยระดับชั้น"
                      dataKey="ค่าเฉลี่ยระดับชั้น"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Student Submissions History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                ประวัติผลการสอบรายชุดของ {activeStudent?.fullName}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">ชื่อแบบทดสอบ</th>
                    <th className="py-3 px-4">วิชา</th>
                    <th className="py-3 px-4 text-center">คะแนนที่ได้</th>
                    <th className="py-3 px-4 text-center">ร้อยละ (%)</th>
                    <th className="py-3 px-4 text-center">ผลการสอบ</th>
                    <th className="py-3 px-4 text-center">เวลาที่ใช้</th>
                    <th className="py-3 px-4 text-center">วันที่สอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {studentSubs.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-900">{sub.examTitle}</td>
                      <td className="py-3 px-4 text-slate-600">{sub.courseCode}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">
                        {sub.score} / {sub.totalPoints}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{sub.percentage}%</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.passed ? '✓ ผ่านเกณฑ์' : '✕ ไม่ผ่าน'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {Math.round(sub.timeSpentSeconds / 60)} นาที
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
