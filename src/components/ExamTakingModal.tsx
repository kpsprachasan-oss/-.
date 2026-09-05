import React, { useState, useEffect, useRef } from 'react';
import { Exam, ExamSubmission } from '../types';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Award,
  HelpCircle,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

interface ExamTakingModalProps {
  exam: Exam;
  onClose: () => void;
  onSubmitExam: (submission: ExamSubmission) => Promise<void>;
}

export const ExamTakingModal: React.FC<ExamTakingModalProps> = ({
  exam,
  onClose,
  onSubmitExam,
}) => {
  const { currentUser, schoolInfo } = useAuth();

  // Test state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.timeLimitMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const startTimeRef = useRef<Date>(new Date());
  const timerRef = useRef<any>(null);

  // Tab switch anti-cheat listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          setShowWarningModal(true);
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isSubmitted]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isSubmitted]);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleFinalSubmit = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const endTime = new Date();
    const timeSpent = Math.round((endTime.getTime() - startTimeRef.current.getTime()) / 1000);

    // Calculate score
    let totalScore = 0;
    const itemResults: Record<string, { isCorrect: boolean; points: number }> = {};

    exam.questions.forEach((q) => {
      const selected = answers[q.id];
      const isCorrect = selected !== undefined && Number(selected) === Number(q.correctAnswer);
      const points = isCorrect ? (q.points || 1) : 0;
      totalScore += points;
      itemResults[q.id] = { isCorrect, points };
    });

    const percentage = exam.totalPoints > 0 ? Math.round((totalScore / exam.totalPoints) * 100) : 0;
    const passed = percentage >= exam.passingScorePercentage;

    const submission: ExamSubmission = {
      id: `sub-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      courseId: exam.courseId,
      courseName: exam.courseName,
      courseCode: exam.courseCode,
      academicYear: exam.academicYear || schoolInfo.academicYear || '2568',
      semester: exam.semester || schoolInfo.semester || '1',
      studentId: currentUser?.id || 'std-unknown',
      studentName: currentUser?.fullName || 'นักเรียน',
      studentCode: currentUser?.studentId || '6701',
      gradeLevel: currentUser?.gradeLevel || exam.gradeLevel,
      classRoom: currentUser?.classRoom || 'ชั้นประถมศึกษาปีที่ 1/1',
      answers,
      itemResults,
      score: totalScore,
      totalPoints: exam.totalPoints,
      percentage,
      passed,
      startedAt: startTimeRef.current.toISOString(),
      submittedAt: endTime.toISOString(),
      timeSpentSeconds: timeSpent,
      tabSwitchCount,
      attemptNumber: 1,
    };

    setSubmissionResult(submission);
    await onSubmitExam(submission);

    // Trigger celebratory confetti if passed!
    if (passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const currentQ = exam.questions[currentIdx];
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header / Status Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                  {exam.courseCode}
                </span>
                <span className="text-xs text-slate-400">{exam.gradeLevel}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">{exam.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            {!isSubmitted && (
              <div
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs ${
                  timeLeftSeconds < 180 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-indigo-300'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            {/* Anti-cheat tab warning flag */}
            {tabSwitchCount > 0 && !isSubmitted && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>สลับหน้าจอ {tabSwitchCount} ครั้ง</span>
              </div>
            )}

            {isSubmitted && (
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Anti-cheat modal popup */}
        {showWarningModal && !isSubmitted && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl border-2 border-amber-500">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">แจ้งเตือนระบบรักษาความปลอดภัย</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบตรวจพบว่าท่านได้สลับหน้าต่างหรือออกจากหน้าจอข้อสอบ (ครั้งที่ {tabSwitchCount})<br />
                พฤติกรรมนี้ถูกบันทึกไว้ในรายงานการสอบของท่าน กรุณาทำข้อสอบในหน้านี้อย่างต่อเนื่อง
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs"
              >
                รับทราบและทำข้อสอบต่อ
              </button>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showConfirmSubmit && !isSubmitted && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <h3 className="text-base font-bold text-slate-900">ยืนยันการส่งข้อสอบ?</h3>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>ตอบแล้ว:</span>
                  <span className="font-bold text-indigo-600">{answeredCount} จาก {exam.questions.length} ข้อ</span>
                </div>
                <div className="flex justify-between">
                  <span>ยังไม่ได้ตอบ:</span>
                  <span className="font-bold text-rose-600">{exam.questions.length - answeredCount} ข้อ</span>
                </div>
                <div className="flex justify-between">
                  <span>เวลาที่เหลือ:</span>
                  <span className="font-bold text-slate-800">{formatTime(timeLeftSeconds)}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                เมื่อส่งข้อสอบแล้ว ท่านจะไม่สามารถกลับมาแก้ไขคำตอบได้อีก
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  กลับไปตรวจทาน
                </button>
                <button
                  onClick={() => {
                    setShowConfirmSubmit(false);
                    handleFinalSubmit();
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  ยืนยันส่งข้อสอบ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isSubmitted ? (
          /* Active Exam View */
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
            
            {/* Question Workspace (8 cols) */}
            <div className="md:col-span-8 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
              {currentQ ? (
                <div className="space-y-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white">
                        ข้อที่ {currentIdx + 1} / {exam.questions.length}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">({currentQ.points} คะแนน)</span>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(currentQ.id)}
                      className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        flagged[currentQ.id]
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <Flag className={`w-3.5 h-3.5 ${flagged[currentQ.id] ? 'fill-amber-600 text-amber-600' : ''}`} />
                      <span>{flagged[currentQ.id] ? 'ติดธงไว้ตรวจทาน' : 'ติดธงข้อนี้'}</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                    {currentQ.text}
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {currentQ.options.map((opt, oIdx) => {
                      const isSelected = answers[currentQ.id] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectOption(currentQ.id, oIdx)}
                          className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center gap-3.5 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {['ก', 'ข', 'ค', 'ง'][oIdx]}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Bottom Nav Buttons */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((p) => p - 1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  ข้อก่อนหน้า
                </button>

                {currentIdx < exam.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx((p) => p + 1)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    ข้อถัดไป
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    ส่งข้อสอบและตรวจคำตอบ
                  </button>
                )}
              </div>
            </div>

            {/* Question Palette Sidebar (4 cols) */}
            <div className="md:col-span-4 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    ผังข้อสอบ (Question Palette)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ตอบแล้ว {answeredCount} / {exam.questions.length} ข้อ
                  </p>
                </div>

                {/* Grid of question numbers */}
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = currentIdx === idx;
                    const isFlag = flagged[q.id];

                    let bgClass = 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400';
                    if (isAnswered) bgClass = 'bg-indigo-600 text-white border-indigo-600 font-bold';
                    if (isFlag) bgClass = 'bg-amber-500 text-white border-amber-500 font-bold';
                    if (isCurrent) bgClass += ' ring-2 ring-indigo-400 ring-offset-1';

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`h-10 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all ${bgClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-indigo-600"></span>
                    <span>ตอบแล้ว ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-amber-500"></span>
                    <span>ติดธงไว้ ({Object.values(flagged).filter(Boolean).length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-xs bg-white border border-slate-300"></span>
                    <span>ยังไม่ได้ตอบ ({exam.questions.length - answeredCount})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                ส่งข้อสอบ (ตรวจคำตอบทันที)
              </button>
            </div>

          </div>
        ) : (
          /* Results & Answer Review */
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            
            {/* Score Card */}
            <div
              className={`p-6 sm:p-8 rounded-3xl text-center border shadow-sm ${
                submissionResult?.passed
                  ? 'bg-gradient-to-b from-emerald-50 to-teal-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-gradient-to-b from-rose-50 to-orange-50/50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="inline-flex p-3 rounded-2xl bg-white shadow-sm mb-3">
                {submissionResult?.passed ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-rose-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold">
                {submissionResult?.passed ? 'ขอแสดงความยินดี! คุณสอบผ่านเกณฑ์' : 'ผลการประเมิน: ยังไม่ผ่านเกณฑ์'}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                {exam.title} • เกณฑ์ผ่าน {exam.passingScorePercentage}%
              </p>

              <div className="mt-6 flex justify-center items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                  {submissionResult?.score}
                </span>
                <span className="text-xl font-bold text-slate-500">/ {submissionResult?.totalPoints} คะแนน</span>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-sm font-extrabold ${
                    submissionResult?.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {submissionResult?.percentage}%
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
                <div>
                  เวลาที่ใช้: <span className="font-bold text-slate-800">{Math.round((submissionResult?.timeSpentSeconds || 0) / 60)} นาที</span>
                </div>
                <div>
                  ถูกต้อง: <span className="font-bold text-emerald-700">
                    {Object.values(submissionResult?.itemResults || {}).filter((r: any) => r?.isCorrect).length} ข้อ
                  </span>
                </div>
                <div>
                  ไม่ถูกต้อง: <span className="font-bold text-rose-700">
                    {Object.values(submissionResult?.itemResults || {}).filter((r: any) => !r?.isCorrect).length} ข้อ
                  </span>
                </div>
              </div>
            </div>

            {/* Explanations Accordion */}
            {exam.allowReviewAnswers && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  เฉลยละเอียดรายข้อ
                </h3>

                <div className="space-y-3">
                  {exam.questions.map((q, idx) => {
                    const studentAns = submissionResult?.answers[q.id];
                    const itemRes = submissionResult?.itemResults[q.id];
                    const isCorrect = itemRes?.isCorrect;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2 ${
                          isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-slate-900 text-sm">
                            {idx + 1}. {q.text}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isCorrect ? `✓ ได้ ${q.points} คะแนน` : '✕ 0 คะแนน'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = studentAns === oIdx;
                            const isActualCorrect = Number(q.correctAnswer) === oIdx;

                            let optClass = 'bg-white border-slate-200 text-slate-700';
                            if (isSelected && isCorrect) optClass = 'bg-emerald-100 border-emerald-300 text-emerald-950 font-bold';
                            else if (isSelected && !isCorrect) optClass = 'bg-rose-100 border-rose-300 text-rose-950 font-bold';
                            else if (isActualCorrect) optClass = 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold';

                            return (
                              <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${optClass}`}>
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {['ก', 'ข', 'ค', 'ง'][oIdx]}
                                </span>
                                <span>{opt}</span>
                                {isSelected && (
                                  <span className="ml-auto text-[10px] text-indigo-700 font-bold">(คำตอบของคุณ)</span>
                                )}
                                {isActualCorrect && !isSelected && (
                                  <span className="ml-auto text-[10px] text-emerald-700 font-bold">(คำตอบที่ถูก)</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 text-xs leading-relaxed">
                            <span className="font-bold text-indigo-900">คำอธิบายเฉลย: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                ปิดหน้าต่างและกลับสู่หน้าหลัก
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
