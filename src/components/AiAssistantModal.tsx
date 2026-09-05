import React, { useState } from 'react';
import { Question } from '../types';
import { Sparkles, X, Bot, BookOpen, FileQuestion, Copy, Check, ArrowRight, Loader2 } from 'lucide-react';

interface AiAssistantModalProps {
  onClose: () => void;
  onApplyQuestions?: (questions: Question[]) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  onClose,
  onApplyQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'quiz' | 'lesson'>('quiz');
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ชั้นประถมศึกษาปีที่ 1');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [generatedLesson, setGeneratedLesson] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert('กรุณาระบุหัวข้อหรือสาระการเรียนรู้');
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'quiz') {
        const res = await fetch('/api/ai/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.trim(),
            gradeLevel,
            count: Number(questionCount),
            difficulty,
          }),
        });
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          setGeneratedQuestions(data.questions);
        } else {
          // Fallback demo questions if API key not supplied
          fallbackQuestions();
        }
      } else {
        const res = await fetch('/api/ai/generate-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic.trim(),
            gradeLevel,
          }),
        });
        const data = await res.json();
        if (data.content) {
          setGeneratedLesson(data.content);
        } else {
          fallbackLesson();
        }
      }
    } catch (e) {
      if (activeTab === 'quiz') fallbackQuestions();
      else fallbackLesson();
    } finally {
      setIsLoading(false);
    }
  };

  const fallbackQuestions = () => {
    setGeneratedQuestions([
      {
        id: `q-ai-${Date.now()}-1`,
        text: `ข้อใดคือวัตถุประสงค์หลักของหัวข้อ "${topic}" ในระดับชั้น ${gradeLevel}?`,
        type: 'choice_single',
        options: ['เพื่อความเข้าใจในหลักการพื้นฐาน', 'เพื่อการแข่งขันระดับชาติ', 'เพื่อการท่องเที่ยว', 'ไม่มีข้อถูก'],
        correctAnswer: 0,
        explanation: 'เป็นแนวคิดพื้นฐานตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน',
        points: 2,
        difficulty: 'medium',
      },
      {
        id: `q-ai-${Date.now()}-2`,
        text: `กระบวนการสำคัญที่เกี่ยวข้องกับ "${topic}" คือข้อใด?`,
        type: 'choice_single',
        options: ['การสังเคราะห์ด้วยแสง', 'การสลายสารอาหารระดับเซลล์', 'การแลกเปลี่ยนแก๊ส', 'การลำเลียงสาร'],
        correctAnswer: 0,
        explanation: 'เป็นกลไกหลักที่เกิดขึ้นในระบบชีวภาพ',
        points: 2,
        difficulty: 'medium',
      },
    ]);
  };

  const fallbackLesson = () => {
    setGeneratedLesson(`## สรุปเนื้อหาบทเรียน: ${topic} (${gradeLevel})\n\n### 1. วัตถุประสงค์การเรียนรู้\n- นักเรียนสามารถอธิบายหลักการพื้นฐานของ ${topic} ได้อย่างถูกต้อง\n- นำความรู้ไปประยุกต์ใช้ในชีวิตประจำวัน\n\n### 2. สาระสำคัญ\n${topic} เป็นหัวข้อสำคัญในหลักสูตรที่ช่วยให้นักเรียนเข้าใจกระบวนการธรรมชาติและการทำงานของระบบต่าง ๆ\n\n### 3. คำถามชวนคิด\n- เหตุใดเรื่องนี้จึงมีความสำคัญต่อนักเรียน?`);
  };

  const handleApply = () => {
    if (onApplyQuestions && generatedQuestions.length > 0) {
      onApplyQuestions(generatedQuestions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-indigo-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Gemini AI ผู้ช่วยครูอัจฉริยะ</h3>
              <p className="text-xs text-indigo-200">สร้างข้อสอบพร้อมเฉลย และเนื้อหาบทเรียนอัตโนมัติ</p>
            </div>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-4 bg-slate-50">
          <button
            onClick={() => { setActiveTab('quiz'); setGeneratedQuestions([]); }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            สร้างชุดข้อสอบ (Quiz Generator)
          </button>

          <button
            onClick={() => { setActiveTab('lesson'); setGeneratedLesson(''); }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'lesson'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            สร้างเนื้อหาบทเรียน (Lesson Generator)
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หัวข้อบทเรียน / สาระการเรียนรู้ที่ต้องการสร้าง *
            </label>
            <input
              type="text"
              required
              placeholder="เช่น การสังเคราะห์ด้วยแสงของพืช, พีทาโกรัส, Past Simple Tense..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับชั้น</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="ชั้นประถมศึกษาปีที่ 1">ชั้นประถมศึกษาปีที่ 1</option>
                <option value="ชั้นประถมศึกษาปีที่ 2">ชั้นประถมศึกษาปีที่ 2</option>
                <option value="ชั้นประถมศึกษาปีที่ 3">ชั้นประถมศึกษาปีที่ 3</option>
                <option value="ชั้นประถมศึกษาปีที่ 4">ชั้นประถมศึกษาปีที่ 4</option>
                <option value="ชั้นประถมศึกษาปีที่ 5">ชั้นประถมศึกษาปีที่ 5</option>
                <option value="ชั้นประถมศึกษาปีที่ 6">ชั้นประถมศึกษาปีที่ 6</option>
              </select>
            </div>

            {activeTab === 'quiz' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">จำนวนข้อ</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value={3}>3 ข้อ</option>
                    <option value={5}>5 ข้อ</option>
                    <option value={10}>10 ข้อ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับความยาก</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="easy">ง่าย</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="hard">ยาก / วิเคราะห์</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI กำลังประมวลผลและสร้างเนื้อหา...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>สั่งให้ AI สร้าง{activeTab === 'quiz' ? 'ข้อสอบ' : 'เนื้อหา'}</span>
              </>
            )}
          </button>

          {/* Results Preview */}
          {generatedQuestions.length > 0 && activeTab === 'quiz' && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-900">
                ข้อสอบที่ AI สร้างขึ้น ({generatedQuestions.length} ข้อ)
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="font-semibold text-slate-900">{idx + 1}. {q.text}</div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`px-2 py-1 rounded ${
                            q.correctAnswer === oIdx
                              ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                              : 'bg-white border border-slate-200'
                          }`}
                        >
                          {['ก', 'ข', 'ค', 'ง'][oIdx]}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generatedLesson && activeTab === 'lesson' && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">เนื้อหาบทเรียนที่ AI สร้างขึ้น</h4>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLesson);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs whitespace-pre-wrap font-sans text-slate-800 max-h-56 overflow-y-auto">
                {generatedLesson}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            ปิดหน้าต่าง
          </button>

          {activeTab === 'quiz' && generatedQuestions.length > 0 && onApplyQuestions && (
            <button
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <span>นำข้อสอบ {generatedQuestions.length} ข้อไปใช้งาน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
