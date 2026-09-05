import React, { useState, useEffect } from 'react';
import { Course, Exam, ExamSubmission } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileQuestion,
  Plus,
  Search,
  Clock,
  Award,
  Users,
  Play,
  Edit2,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  Shuffle,
  AlertCircle,
  MessageSquare,
  Share2,
  GraduationCap,
  Lock
} from 'lucide-react';
import { ExamEditorModal } from './ExamEditorModal';
import { shareToLineDirectly, formatExamMessage } from '../utils/lineNotify';
import { getStudentGrade, isSameGrade, canStudentAccessExam } from '../utils/gradeHelper';

interface ExamsViewProps {
  exams: Exam[];
  courses: Course[];
  submissions: ExamSubmission[];
  onSaveExam: (exam: Exam) => Promise<void>;
  onDeleteExam: (examId: string) => Promise<void>;
  onTakeExam: (exam: Exam) => void;
  onOpenAiModal?: () => void;
  onOpenLineNotify?: (type?: 'exam' | 'announcement' | 'custom' | 'result', examId?: string, announcementId?: string) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  courses,
  submissions,
  onSaveExam,
  onDeleteExam,
  onTakeExam,
  onOpenAiModal,
  onOpenLineNotify,
}) => {
  const { currentUser, schoolInfo } = useAuth();
  const isStudent = currentUser?.role === 'student';
  const isTeacherOrDirector = currentUser?.role === 'director' || currentUser?.role === 'teacher';
  const studentGrade = isStudent ? getStudentGrade(currentUser) : '';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(() => {
    return isStudent && studentGrade ? studentGrade : 'all';
  });
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('');

  // Keep student grade locked
  useEffect(() => {
    if (isStudent && studentGrade) {
      setSelectedGrade(studentGrade);
    }
  }, [isStudent, studentGrade]);

  const handleTakeExamClick = (exam: Exam) => {
    if (isStudent && !canStudentAccessExam(currentUser, exam.gradeLevel)) {
      setAccessDeniedMessage(`ขออภัย คุณสามารถเข้าสอบได้เฉพาะแบบทดสอบของระดับชั้น ${studentGrade || 'ตนเอง'} เท่านั้น`);
      return;
    }
    setAccessDeniedMessage('');
    onTakeExam(exam);
  };

  const filteredExams = exams.filter((e) => {
    // If student, only published exams of their own grade
    if (isStudent) {
      if (e.status !== 'published') return false;
      if (!canStudentAccessExam(currentUser, e.gradeLevel)) return false;
    }

    const matchesGrade = isStudent
      ? canStudentAccessExam(currentUser, e.gradeLevel)
      : selectedGrade === 'all' || isSameGrade(e.gradeLevel, selectedGrade);

    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGrade && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingExam(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExam(exam);
    setIsEditorOpen(true);
  };

  const handleDeleteClick = async (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบชุดข้อสอบนี้?')) {
      await onDeleteExam(examId);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {isStudent ? 'ห้องสอบและแบบทดสอบออนไลน์ของฉัน' : 'คลังข้อสอบและห้องสอบออนไลน์'}
            </h1>
            {isStudent && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {studentGrade || currentUser?.classRoom || 'ระดับชั้นของฉัน'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStudent
              ? `ทำแบบทดสอบวัดผลสัมฤทธิ์ทางการเรียนสำหรับ ${studentGrade || 'ระดับชั้นของคุณ'}`
              : 'สร้าง จัดการ นำเข้าข้อสอบจาก Excel และวัดผลสัมฤทธิ์ทางการเรียน'}
          </p>
        </div>

        {isTeacherOrDirector && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLineNotify ? onOpenLineNotify('exam') : undefined}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05b34c] text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              ส่งแจ้งเตือนการสอบผ่าน LINE
            </button>
            <button
              onClick={onOpenAiModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
            >
              AI ช่วยออกข้อสอบ
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              สร้างชุดข้อสอบใหม่
            </button>
          </div>
        )}
      </div>

      {/* Student Access Notice Banner */}
      {isStudent && (
        <div className="p-3.5 bg-gradient-to-r from-indigo-50 via-blue-50 to-amber-50 rounded-2xl border border-indigo-100 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-indigo-900 font-medium">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">ห้องสอบระดับชั้น: </span>
              <span className="font-extrabold text-indigo-700">{studentGrade || 'ชั้นประถมศึกษา'}</span>
              <span className="text-slate-500 ml-1.5 text-[11px]">
                (แสดงเฉพาะแบบทดสอบที่เปิดสอบสำหรับระดับชั้นนี้เท่านั้น)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <Lock className="w-3 h-3" />
            <span>ปลอดภัยตามระดับชั้น</span>
          </div>
        </div>
      )}

      {/* Access Denied Warning Toast/Alert */}
      {accessDeniedMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{accessDeniedMessage}</span>
          </div>
          <button
            onClick={() => setAccessDeniedMessage('')}
            className="text-rose-600 hover:text-rose-800 font-bold text-xs"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อข้อสอบ, รหัสวิชา..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Grade filter (Locked for students) */}
          {isStudent ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-semibold">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>ระดับชั้น: {studentGrade || 'ห้องเรียนของฉัน'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">ระดับชั้น:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">ทุกระดับชั้น</option>
                <option value="ชั้นประถมศึกษาปีที่ 1">ชั้นประถมศึกษาปีที่ 1</option>
                <option value="ชั้นประถมศึกษาปีที่ 2">ชั้นประถมศึกษาปีที่ 2</option>
                <option value="ชั้นประถมศึกษาปีที่ 3">ชั้นประถมศึกษาปีที่ 3</option>
                <option value="ชั้นประถมศึกษาปีที่ 4">ชั้นประถมศึกษาปีที่ 4</option>
                <option value="ชั้นประถมศึกษาปีที่ 5">ชั้นประถมศึกษาปีที่ 5</option>
                <option value="ชั้นประถมศึกษาปีที่ 6">ชั้นประถมศึกษาปีที่ 6</option>
              </select>
            </div>
          )}

        </div>

        <div className="text-xs text-slate-500 font-medium">
          พบ <span className="font-bold text-slate-800">{filteredExams.length}</span> ชุดข้อสอบ
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map((exam) => {
          const examSubs = submissions.filter((s) => s.examId === exam.id);
          const mySub = submissions.find((s) => s.examId === exam.id && s.studentId === currentUser?.id);
          const avgScore = examSubs.length > 0
            ? Math.round(examSubs.reduce((a, s) => a + s.percentage, 0) / examSubs.length)
            : 0;

          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                
                {/* Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {exam.courseCode}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {exam.gradeLevel}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      exam.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {exam.status === 'published' ? 'เปิดให้สอบ' : 'แบบร่าง'}
                  </span>
                </div>

                {/* Title & Course */}
                <div>
                  <h3 className="font-bold text-base text-slate-900 line-clamp-2">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{exam.courseName}</p>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">เวลา</div>
                    <div className="font-bold text-slate-800">{exam.timeLimitMinutes} น.</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">จำนวนข้อ</div>
                    <div className="font-bold text-slate-800">{exam.questions.length} ข้อ</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">เกณฑ์ผ่าน</div>
                    <div className="font-bold text-slate-800">{exam.passingScorePercentage}%</div>
                  </div>
                </div>

                {/* Teacher Statistics view */}
                {isTeacherOrDirector && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      ส่งแล้ว {examSubs.length} คน
                    </span>
                    <span className="font-semibold text-slate-700">
                      คะแนนเฉลี่ย: {avgScore}%
                    </span>
                  </div>
                )}

              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                
                {isTeacherOrDirector ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenLineNotify ? onOpenLineNotify('exam', exam.id) : undefined}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="ส่งแจ้งเตือนการสอบเข้า LINE กลุ่ม"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#06C755]" />
                        <span>แจ้งเตือน LINE</span>
                      </button>
                      <button
                        onClick={() => {
                          const msg = formatExamMessage(exam, schoolInfo?.schoolName);
                          shareToLineDirectly(msg);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#06C755] rounded-lg hover:bg-emerald-50 transition-colors"
                        title="แชร์ตรงเข้า LINE App"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleOpenEdit(exam, e)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-white transition-colors"
                        title="แก้ไขชุดข้อสอบ"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(exam.id, e)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                        title="ลบชุดข้อสอบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleTakeExamClick(exam)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      ทดลองทำข้อสอบ
                    </button>
                  </div>
                ) : (
                  /* Student View */
                  <div className="flex items-center justify-between w-full">
                    {mySub ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="text-xs">
                          <span className="text-slate-500">ผลสอบ: </span>
                          <span className="font-bold text-slate-900">{mySub.score}/{mySub.totalPoints}</span>
                          <span
                            className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              mySub.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {mySub.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleTakeExamClick(exam)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                        >
                          สอบใหม่ ({mySub.attemptNumber}/{exam.maxAttempts})
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTakeExamClick(exam)}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        เริ่มทำแบบทดสอบ
                      </button>
                    )}
                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

      {filteredExams.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">
            {isStudent ? `ไม่พบชุดข้อสอบสำหรับ ${studentGrade || 'ระดับชั้นของคุณ'}` : 'ไม่พบชุดข้อสอบ'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isStudent
              ? 'เมื่อคุณครูเปิดระบบข้อสอบสำหรับระดับชั้นนี้ รายการข้อสอบจะปรากฏที่นี่'
              : 'คลิก "สร้างชุดข้อสอบใหม่" เพื่อเริ่มสร้างข้อสอบออนไลน์'}
          </p>
        </div>
      )}

      {/* Exam Editor Modal */}
      {isEditorOpen && (
        <ExamEditorModal
          exam={editingExam}
          courses={courses}
          onClose={() => setIsEditorOpen(false)}
          onSaveExam={async (saved) => {
            await onSaveExam(saved);
            setIsEditorOpen(false);
          }}
          onOpenAiModal={onOpenAiModal}
        />
      )}

    </div>
  );
};
