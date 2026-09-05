import React, { useState } from 'react';
import { Course, Exam, Question } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Save,
  Shuffle
} from 'lucide-react';
import { QuestionImportModal } from './QuestionImportModal';

interface ExamEditorModalProps {
  exam: Exam | null;
  courses: Course[];
  onClose: () => void;
  onSaveExam: (exam: Exam) => Promise<void>;
  onOpenAiModal?: () => void;
}

export const ExamEditorModal: React.FC<ExamEditorModalProps> = ({
  exam,
  courses,
  onClose,
  onSaveExam,
  onOpenAiModal,
}) => {
  const { currentUser, schoolInfo } = useAuth();

  const [title, setTitle] = useState(exam?.title || '');
  const [courseId, setCourseId] = useState(exam?.courseId || courses[0]?.id || '');
  const [academicYear, setAcademicYear] = useState(exam?.academicYear || schoolInfo.academicYear || '2568');
  const [semester, setSemester] = useState(exam?.semester || schoolInfo.semester || '1');
  const [description, setDescription] = useState(exam?.description || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(exam?.timeLimitMinutes || 30);
  const [passingScorePercentage, setPassingScorePercentage] = useState(exam?.passingScorePercentage || 60);
  const [randomizeQuestions, setRandomizeQuestions] = useState(exam ? exam.randomizeQuestions : true);
  const [randomizeChoices, setRandomizeChoices] = useState(exam ? exam.randomizeChoices : true);
  const [allowReviewAnswers, setAllowReviewAnswers] = useState(exam ? exam.allowReviewAnswers : true);
  const [maxAttempts, setMaxAttempts] = useState(exam?.maxAttempts || 2);
  const [status, setStatus] = useState<'published' | 'draft'>(exam?.status === 'archived' ? 'published' : exam?.status || 'published');

  const [questions, setQuestions] = useState<Question[]>(exam?.questions || []);
  const [showImportModal, setShowImportModal] = useState(false);

  // Manual Question Edit State
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [qPoints, setQPoints] = useState(2);
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const selectedCourse = courses.find((c) => c.id === courseId) || courses[0];

  const handleOpenAddQuestion = () => {
    setEditingQuestionIdx(null);
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect(0);
    setQExplanation('');
    setQPoints(2);
    setQDifficulty('medium');
    setIsAddingQuestion(true);
  };

  const handleOpenEditQuestion = (q: Question, idx: number) => {
    setEditingQuestionIdx(idx);
    setQText(q.text);
    setQOptA(q.options[0] || '');
    setQOptB(q.options[1] || '');
    setQOptC(q.options[2] || '');
    setQOptD(q.options[3] || '');
    setQCorrect(typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);
    setQExplanation(q.explanation || '');
    setQPoints(q.points || 2);
    setQDifficulty(q.difficulty || 'medium');
    setIsAddingQuestion(true);
  };

  const handleSaveQuestion = () => {
    if (!qText.trim()) return;
    const opts = [qOptA.trim(), qOptB.trim(), qOptC.trim(), qOptD.trim()].filter(Boolean);
    if (opts.length < 2) {
      alert('กรุณากรอกตัวเลือกอย่างน้อย 2 ตัวเลือก');
      return;
    }

    const newQ: Question = {
      id: editingQuestionIdx !== null ? questions[editingQuestionIdx].id : `q-${Date.now()}`,
      text: qText.trim(),
      type: 'choice_single',
      options: opts,
      correctAnswer: qCorrect,
      explanation: qExplanation.trim(),
      points: qPoints,
      difficulty: qDifficulty,
    };

    if (editingQuestionIdx !== null) {
      const copy = [...questions];
      copy[editingQuestionIdx] = newQ;
      setQuestions(copy);
    } else {
      setQuestions([...questions, newQ]);
    }
    setIsAddingQuestion(false);
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleImportQuestions = (imported: Question[]) => {
    setQuestions([...questions, ...imported]);
  };

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('กรุณากรอกชื่อชุดข้อสอบ');
      return;
    }

    const updatedExam: Exam = {
      id: exam ? exam.id : `ex-${Date.now()}`,
      title: title.trim(),
      courseId,
      courseName: selectedCourse ? selectedCourse.name : '',
      courseCode: selectedCourse ? selectedCourse.code : '',
      gradeLevel: selectedCourse ? selectedCourse.gradeLevel : 'ชั้นประถมศึกษาปีที่ 1',
      academicYear: academicYear.trim() || '2568',
      semester: semester.trim() || '1',
      description: description.trim(),
      timeLimitMinutes: Number(timeLimitMinutes),
      passingScorePercentage: Number(passingScorePercentage),
      randomizeQuestions,
      randomizeChoices,
      allowReviewAnswers,
      maxAttempts: Number(maxAttempts),
      status,
      questions,
      totalPoints,
      createdBy: exam ? exam.createdBy : currentUser?.id || 'admin',
      createdByName: exam ? exam.createdByName : currentUser?.fullName || 'ครูผู้สอน',
      createdAt: exam ? exam.createdAt : new Date().toISOString(),
    };

    await onSaveExam(updatedExam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {exam ? 'แก้ไขชุดข้อสอบ' : 'สร้างชุดข้อสอบออนไลน์ใหม่'}
            </h2>
            <p className="text-xs text-slate-500">
              กำหนดคุณสมบัติการสอบ ระยะเวลา เกณฑ์ผ่าน และจัดการข้อสอบ
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* General Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อแบบทดสอบ / ชุดข้อสอบ *</label>
              <input
                type="text"
                required
                placeholder="เช่น แบบทดสอบวัดผลกลางภาค วิชาวิทยาศาสตร์ (ว21101)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ประจำรายวิชา *</label>
              <select
                value={courseId}
                onChange={(e) => {
                  const val = e.target.value;
                  setCourseId(val);
                  const found = courses.find((c) => c.id === val);
                  if (found) {
                    if (found.academicYear) setAcademicYear(found.academicYear);
                    if (found.semester) setSemester(found.semester);
                  }
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.gradeLevel}) [ปี {c.academicYear || '2568'}/{c.semester || '1'}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ปีการศึกษา *</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="2569">2569</option>
                  <option value="2568">2568</option>
                  <option value="2567">2567</option>
                  <option value="2566">2566</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ภาคเรียน *</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Test Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">เวลาทำข้อสอบ (นาที)</label>
              <input
                type="number"
                min="1"
                max="300"
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">เกณฑ์ผ่าน (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={passingScorePercentage}
                onChange={(e) => setPassingScorePercentage(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">จำนวนครั้งที่ทำได้</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">สถานะ</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="published">เผยแพร่ (เปิดสอบ)</option>
                <option value="draft">แบบร่าง (ยังไม่เปิดสอบ)</option>
              </select>
            </div>
          </div>

          {/* Anti-Cheat & Options Checkboxes */}
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>สุ่มสลับลำดับข้อสอบ</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={randomizeChoices}
                onChange={(e) => setRandomizeChoices(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>สุ่มสลับลำดับตัวเลือก (ก ข ค ง)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={allowReviewAnswers}
                onChange={(e) => setAllowReviewAnswers(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>อนุญาตให้ดูเฉลยละเอียดหลังส่งข้อสอบ</span>
            </label>
          </div>

          {/* Question List Section */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  รายการข้อสอบ ({questions.length} ข้อ • รวม {totalPoints} คะแนน)
                </h3>
                <p className="text-[11px] text-slate-500">
                  เพิ่มข้อสอบทีละข้อ หรือนำเข้าพร้อมกันจำนวนมากจาก Excel
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  นำเข้าข้อสอบ (Excel/Text)
                </button>

                <button
                  type="button"
                  onClick={handleOpenAddQuestion}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มข้อสอบ
                </button>
              </div>
            </div>

            {/* Manual Question Form */}
            {isAddingQuestion && (
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-950">
                    {editingQuestionIdx !== null ? `แก้ไขข้อที่ ${editingQuestionIdx + 1}` : 'เพิ่มข้อสอบใหม่'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingQuestion(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    ยกเลิก
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">โจทย์คำถาม *</label>
                  <textarea
                    rows={2}
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder="พิมพ์โจทย์คำถาม..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={qCorrect === 0}
                      onChange={() => setQCorrect(0)}
                    />
                    <input
                      type="text"
                      placeholder="ตัวเลือก ก"
                      value={qOptA}
                      onChange={(e) => setQOptA(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white ${
                        qCorrect === 0 ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={qCorrect === 1}
                      onChange={() => setQCorrect(1)}
                    />
                    <input
                      type="text"
                      placeholder="ตัวเลือก ข"
                      value={qOptB}
                      onChange={(e) => setQOptB(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white ${
                        qCorrect === 1 ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={qCorrect === 2}
                      onChange={() => setQCorrect(2)}
                    />
                    <input
                      type="text"
                      placeholder="ตัวเลือก ค"
                      value={qOptC}
                      onChange={(e) => setQOptC(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white ${
                        qCorrect === 2 ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={qCorrect === 3}
                      onChange={() => setQCorrect(3)}
                    />
                    <input
                      type="text"
                      placeholder="ตัวเลือก ง"
                      value={qOptD}
                      onChange={(e) => setQOptD(e.target.value)}
                      className={`w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white ${
                        qCorrect === 3 ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">คะแนนข้อนี้</label>
                    <input
                      type="number"
                      min="1"
                      value={qPoints}
                      onChange={(e) => setQPoints(Number(e.target.value))}
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">ระดับความยาก</label>
                    <select
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value as any)}
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="easy">ง่าย</option>
                      <option value="medium">ปานกลาง</option>
                      <option value="hard">ยาก</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">คำอธิบายเฉลย</label>
                    <input
                      type="text"
                      placeholder="เหตุผลของคำตอบที่ถูกต้อง..."
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuestion(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuestion}
                    className="px-4 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
                  >
                    บันทึกข้อสอบ
                  </button>
                </div>
              </div>
            )}

            {/* Questions Table */}
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-all flex items-start justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{q.text}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {q.points} คะแนน
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-slate-600 pl-7">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`px-2 py-1 rounded truncate ${
                            q.correctAnswer === oIdx
                              ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                              : 'bg-slate-50 border border-slate-100'
                          }`}
                        >
                          {['ก', 'ข', 'ค', 'ง'][oIdx]}. {opt}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="text-[11px] text-slate-500 pl-7 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                        <span>เฉลย: {q.explanation}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditQuestion(q, idx)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                  ยังไม่มีข้อสอบในชุดนี้ คลิก "เพิ่มข้อสอบ" หรือ "นำเข้าข้อสอบ (Excel/Text)" เพื่อเริ่มใส่ข้อสอบ
                </div>
              )}
            </div>

          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-medium">
              รวมทั้งหมด {questions.length} ข้อ ({totalPoints} คะแนน)
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4" />
                บันทึกชุดข้อสอบ
              </button>
            </div>
          </div>

        </form>

      </div>

      {/* Import Modal */}
      {showImportModal && (
        <QuestionImportModal
          onClose={() => setShowImportModal(false)}
          onImportQuestions={handleImportQuestions}
        />
      )}

    </div>
  );
};
