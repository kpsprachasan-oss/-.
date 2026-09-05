import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Course, Exam, ExamSubmission, User, Announcement } from '../types';
import {
  Users,
  BookOpen,
  FileQuestion,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  Share2,
  Zap,
  Send,
  Bell,
  GraduationCap
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ActiveTab } from './Sidebar';
import { getStudentGrade, canStudentAccessCourse, canStudentAccessExam } from '../utils/gradeHelper';

interface DashboardViewProps {
  courses: Course[];
  exams: Exam[];
  submissions: ExamSubmission[];
  users?: User[];
  announcements?: any[];
  setActiveTab?: (tab: ActiveTab) => void;
  onNavigate?: (tab: ActiveTab) => void;
  onTakeExam?: (exam: Exam) => void;
  onSelectCourse?: (course: Course) => void;
  onOpenLineNotify?: (type?: 'exam' | 'announcement' | 'custom' | 'result', examId?: string, announcementId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses,
  exams,
  submissions,
  announcements = [],
  setActiveTab: propSetActiveTab,
  onNavigate,
  onTakeExam,
  onSelectCourse,
  onOpenLineNotify,
}) => {
  const { currentUser, users: authUsers, schoolInfo } = useAuth();
  const users = authUsers || [];
  const role = currentUser?.role || 'student';
  const studentGrade = role === 'student' ? getStudentGrade(currentUser) : '';

  const navigateTab = (tab: ActiveTab) => {
    if (propSetActiveTab) {
      propSetActiveTab(tab);
    } else if (onNavigate) {
      onNavigate(tab);
    }
  };
  const setActiveTab = navigateTab;

  const totalStudents = users.filter((u) => u.role === 'student').length;
  const totalTeachers = users.filter((u) => u.role === 'teacher').length;
  const publishedCourses = courses.filter((c) => c.status === 'published');
  const publishedExams = exams.filter((e) => e.status === 'published');

  // Overall pass rate calculation
  const totalSubs = submissions.length;
  const passedSubs = submissions.filter((s) => s.passed).length;
  const schoolPassRate = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0;
  const avgScorePct = totalSubs > 0
    ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / totalSubs)
    : 0;

  // Grade comparison data for chart
  const gradeLevels = [
    'ชั้นประถมศึกษาปีที่ 1',
    'ชั้นประถมศึกษาปีที่ 2',
    'ชั้นประถมศึกษาปีที่ 3',
    'ชั้นประถมศึกษาปีที่ 4',
    'ชั้นประถมศึกษาปีที่ 5',
    'ชั้นประถมศึกษาปีที่ 6',
  ];
  const gradeChartData = gradeLevels.map((grade) => {
    const subs = submissions.filter((s) => s.gradeLevel === grade);
    const passed = subs.filter((s) => s.passed).length;
    const avg = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + s.percentage, 0) / subs.length) : 0;
    const rate = subs.length > 0 ? Math.round((passed / subs.length) * 100) : 0;
    return {
      grade,
      คะแนนเฉลี่ย: avg,
      อัตราผ่าน: rate,
      จำนวนส่ง: subs.length,
    };
  });

  // Student specific data
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser?.id);
  const myPassed = mySubmissions.filter((s) => s.passed).length;
  const myAvgPct = mySubmissions.length > 0
    ? Math.round(mySubmissions.reduce((acc, s) => acc + s.percentage, 0) / mySubmissions.length)
    : 0;

  const myCourses = courses.filter((c) =>
    role === 'student'
      ? canStudentAccessCourse(currentUser, c.gradeLevel, c.enrolledStudentIds)
      : c.teacherId === currentUser?.id || role === 'director'
  );

  const availableExamsForStudent = publishedExams.filter((e) =>
    canStudentAccessExam(currentUser, e.gradeLevel)
  );

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-8">
          <Sparkles className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-indigo-100 backdrop-blur-xs mb-3">
            <span>{schoolInfo.schoolName}</span>
            <span>•</span>
            <span>ภาคเรียนที่ {schoolInfo.semester}/{schoolInfo.academicYear}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            ยินดีต้อนรับ, {currentUser?.fullName}
          </h1>

          <p className="text-indigo-100 text-sm leading-relaxed">
            {role === 'director' && 'ศูนย์ควบคุมและติดตามผลการเรียนรู้ การจัดการข้อสอบ และการวัดผลสัมฤทธิ์ทางการศึกษาทุกระดับชั้น'}
            {role === 'teacher' && 'จัดการรายวิชา นำเข้าบทเรียน ออกข้อสอบ และประเมินผลการเรียนรู้ของนักเรียน'}
            {role === 'student' && 'เข้าเรียนบทเรียนออนไลน์ ทำแบบทดสอบ และตรวจสอบผลสัมฤทธิ์ทางการเรียนของตนเอง'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {role === 'director' && (
              <>
                <button
                  onClick={() => onOpenLineNotify ? onOpenLineNotify() : setActiveTab('announcements')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05b34c] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  ส่งแจ้งเตือน LINE Notify
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-indigo-950 hover:bg-indigo-50 transition-colors shadow-xs"
                >
                  ดูรายงานวิเคราะห์ผลสอบระดับโรงเรียน
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-700/60 hover:bg-indigo-700 text-white transition-colors border border-indigo-500/30"
                >
                  พิมพ์ใบสรุปผลและเกียรติบัตร
                </button>
              </>
            )}

            {role === 'teacher' && (
              <>
                <button
                  onClick={() => onOpenLineNotify ? onOpenLineNotify() : setActiveTab('announcements')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05b34c] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  ส่งแจ้งเตือน LINE Notify
                </button>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-indigo-950 hover:bg-indigo-50 transition-colors shadow-xs"
                >
                  สร้าง / นำเข้าข้อสอบใหม่
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-700/60 hover:bg-indigo-700 text-white transition-colors border border-indigo-500/30"
                >
                  จัดการเนื้อหาบทเรียน
                </button>
              </>
            )}

            {role === 'student' && (
              <>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-indigo-950 hover:bg-indigo-50 transition-colors shadow-xs"
                >
                  เข้าสู่ห้องสอบออนไลน์ ({availableExamsForStudent.length} ชุด)
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-700/60 hover:bg-indigo-700 text-white transition-colors border border-indigo-500/30"
                >
                  เข้าเรียนรายวิชา
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards - Professional Polish Design */}
      {role === 'director' || role === 'teacher' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Total Students / นักเรียน</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{totalStudents}</span>
              <span className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                ครู {totalTeachers} ท่าน
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-[85%]"></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Active Courses / รายวิชา</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{publishedCourses.length}</span>
              <span className="text-slate-600 text-xs font-medium bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                ป.1 - ป.6
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full w-[70%]"></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Exams Completed / การสอบ</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{totalSubs}</span>
              <span className="text-blue-700 text-xs font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {publishedExams.length} ชุดข้อสอบ
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[60%]"></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Avg. Pass Rate / อัตราผ่าน</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-blue-600">{schoolPassRate}%</span>
              <span className="text-slate-600 text-xs font-medium">เฉลี่ย {avgScorePct}%</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${schoolPassRate}%` }}></div>
            </div>
          </div>
        </div>
      ) : (
        /* Student Metrics */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Enrolled Courses</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{myCourses.length}</span>
              <span className="text-slate-500 text-xs font-medium">
                {currentUser?.gradeLevel?.startsWith('ชั้น') ? currentUser?.gradeLevel : `ชั้น ${currentUser?.gradeLevel || 'ประถมศึกษา'}`}
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-[75%]"></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Exams Taken</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{mySubmissions.length}</span>
              <span className="text-emerald-700 text-xs font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                ผ่าน {myPassed} ชุด
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full w-[80%]"></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">My Avg. Score</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-blue-600">{myAvgPct}%</span>
              <span className="text-slate-500 text-xs font-medium">{myAvgPct >= 80 ? 'ดีเยี่ยม' : 'ผ่านเกณฑ์'}</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${myAvgPct}%` }}></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-all">
            <span className="text-slate-500 text-xs font-medium">Available Exams</span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-amber-600">{availableExamsForStudent.length}</span>
              <span className="text-amber-700 text-xs font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                พร้อมทำ
              </span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[60%]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Teacher / Director: LINE Notify Quick Broadcast Hub */}
      {(role === 'director' || role === 'teacher') && (
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#06C755] flex items-center justify-center text-white shadow-lg shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">ศูนย์ส่งการแจ้งเตือน LINE Notify / LINE Alert</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06C755]/20 text-[#06C755] border border-[#06C755]/40">
                  {schoolInfo.lineNotifyToken ? '🟢 เชื่อมต่อแล้ว' : '🟡 รอตั้งค่า Token'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                กดส่งแจ้งเตือนการสอบ กำหนดการ หรือประกาศสำคัญตรงเข้ากลุ่ม LINE นักเรียนและผู้ปกครองได้ทันที
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onOpenLineNotify ? onOpenLineNotify('exam') : setActiveTab('announcements')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              แจ้งเตือนการสอบ
            </button>
            <button
              onClick={() => onOpenLineNotify ? onOpenLineNotify('announcement') : setActiveTab('announcements')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              บรอดแคสต์ประกาศ
            </button>
            <button
              onClick={() => onOpenLineNotify ? onOpenLineNotify('custom') : setActiveTab('announcements')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              ข้อความด่วน
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Charts / Available Exams */}
        <div className="lg:col-span-2 space-y-6">
          
          {role === 'director' || role === 'teacher' ? (
            /* Grade Comparison Chart */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">เปรียบเทียบผลสัมฤทธิ์รายระดับชั้น (ชั้น ป.1 - ป.6)</h2>
                  <p className="text-xs text-slate-600">คะแนนเฉลี่ย และอัตราการผ่านเกณฑ์แยกตามระดับชั้น</p>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  ดูรายงานเชิงลึก
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="grade" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="คะแนนเฉลี่ย" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="อัตราผ่าน" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600"></span>
                  <span>คะแนนเฉลี่ย (%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
                  <span>อัตราผ่านเกณฑ์ (%)</span>
                </div>
              </div>
            </div>
          ) : (
            /* Student: Available Exams */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">แบบทดสอบที่เปิดให้ทำ</h2>
                  <p className="text-xs text-slate-600">คลิกเพื่อเริ่มทำข้อสอบและวัดผลออนไลน์</p>
                </div>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  ดูทั้งหมด
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {availableExamsForStudent.map((exam) => {
                  const mySub = mySubmissions.find((s) => s.examId === exam.id);
                  return (
                    <div
                      key={exam.id}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                            {exam.courseCode}
                          </span>
                          <span className="text-xs text-slate-600 font-medium">{exam.gradeLevel}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900">{exam.title}</h4>
                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.timeLimitMinutes} นาที
                          </span>
                          <span>•</span>
                          <span>{exam.questions.length} ข้อ ({exam.totalPoints} คะแนน)</span>
                          <span>•</span>
                          <span>เกณฑ์ผ่าน {exam.passingScorePercentage}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {mySub ? (
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-800">
                              ได้ {mySub.score}/{mySub.totalPoints} ({mySub.percentage}%)
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                mySub.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {mySub.passed ? '✓ ผ่านเกณฑ์' : '✕ ไม่ผ่าน'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onTakeExam(exam)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs whitespace-nowrap"
                          >
                            เริ่มทำแบบทดสอบ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Enrolled Courses Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">รายวิชาเรียนออนไลน์</h2>
                <p className="text-xs text-slate-600">บทเรียน เอกสารประกอบ และสื่อการสอน</p>
              </div>
              <button
                onClick={() => setActiveTab('courses')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                ดูทั้งหมด
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myCourses.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  onClick={() => onSelectCourse ? onSelectCourse(course) : setActiveTab('courses')}
                  className="cursor-pointer group rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all bg-white"
                >
                  <div className="h-28 bg-slate-100 relative overflow-hidden">
                    <img
                      src={course.coverImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600'}
                      alt={course.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs">
                        {course.code}
                      </span>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-600 text-white shadow-xs">
                        {course.gradeLevel}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5">
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {course.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{course.teacherName}</p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{course.units.length} หน่วยการเรียนรู้</span>
                      <span className="text-indigo-600 font-medium group-hover:translate-x-0.5 transition-transform flex items-center">
                        เข้าเรียน <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Recent Submissions & Director Tips */}
        <div className="space-y-6">
          
          {/* Recent Submissions Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {role === 'student' ? 'ผลการสอบล่าสุดของฉัน' : 'ผลการสอบล่าสุด (Recent Submissions)'}
              </h2>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {(role === 'student' ? mySubmissions : submissions).slice(0, 4).map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {role === 'student' ? sub.examTitle : sub.studentName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {sub.gradeLevel} {sub.classRoom} • {sub.courseCode}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">
                      {sub.score}/{sub.totalPoints}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        sub.passed ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}
                    >
                      {sub.percentage}% {sub.passed ? '✓ ผ่าน' : '✕ ตก'}
                    </span>
                  </div>
                </div>
              ))}
              {(role === 'student' ? mySubmissions : submissions).length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400">
                  {role === 'student' ? 'คุณยังไม่มีประวัติการส่งข้อสอบ' : 'ยังไม่มีการส่งข้อสอบในระบบ'}
                </div>
              )}
            </div>
          </div>

          {/* Director's / System Tips & Firebase Health Panel */}
          <div className="bg-[#1e293b] text-white rounded-2xl p-5 shadow-md border border-slate-700/40 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>คำแนะนำระบบ LMS-KPS</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">v2.5</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-blue-400 text-[11px] mb-1">1. การตรวจข้อสอบอัตโนมัติ</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ระบบตรวจข้อสอบปรนัยและคำนวณสถิติ Mean, SD, อัตราผ่าน ให้อัตโนมัติทันที
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-blue-400 text-[11px] mb-1">2. นำเข้าข้อสอบผ่าน Excel</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ครูสามารถดาวน์โหลดแม่แบบ Excel และอัปโหลดข้อสอบทั้งชุดได้ในคลิกเดียว
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="font-bold text-blue-400 text-[11px] mb-1">3. พิมพ์รายงาน A4 มาตรฐาน</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  ออกใบสรุปผลการสอบประจำห้องเรียน และ Transcript รายบุคคลพร้อมช่องลงนาม ผอ.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                  Firebase Firestore Status
                </p>
                <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-[11px]">
                  <span className="text-slate-300">สถานะฐานข้อมูล</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    พร้อมใช้งาน
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">เครื่องมือด่วน</h2>
            
            <div className="space-y-2">
              {(role === 'director' || role === 'teacher') && (
                <button
                  onClick={() => onOpenLineNotify ? onOpenLineNotify() : setActiveTab('announcements')}
                  className="w-full text-left p-3 rounded-xl border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/20">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">ส่งแจ้งเตือน LINE Notify</div>
                      <div className="text-[10px] text-slate-500">บรอดแคสต์ข้อสอบ & ประกาศด่วน</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              )}

              <button
                onClick={() => setActiveTab('reports')}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">พิมพ์เกียรติบัตร & ใบรายงานผล</div>
                    <div className="text-[10px] text-slate-500">เอกสารแบบทางการขนาด A4</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
