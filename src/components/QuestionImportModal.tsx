import React, { useState } from 'react';
import { Question } from '../types';
import { downloadQuestionTemplate, parseQuestionExcel, parseQuestionPlainText } from '../utils/excelHelper';
import {
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Plus
} from 'lucide-react';

interface QuestionImportModalProps {
  onClose: () => void;
  onImportQuestions: (questions: Question[]) => void;
}

export const QuestionImportModal: React.FC<QuestionImportModalProps> = ({
  onClose,
  onImportQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'text'>('excel');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Text parser state
  const [plainText, setPlainText] = useState(`1. ข้อใดต่อไปนี้จัดเป็น "สารบริสุทธิ์"?
ก. น้ำกลั่น
ข. น้ำเกลือ
ค. น้ำเชื่อม
ง. อากาศ
เฉลย: ก
คำอธิบาย: น้ำกลั่นเป็นสารประกอบที่มีจุดเดือดคงที่

2. โครงสร้างใดทำหน้าที่ควบคุมการทำงานของเซลล์?
ก. คลอโรพลาสต์
ข. นิวเคลียส
ค. ไมโทคอนเดรีย
ง. ผนังเซลล์
เฉลย: ข
คำอธิบาย: นิวเคลียสบรรจุสารพันธุกรรม DNA`);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const qs = await parseQuestionExcel(file);
      if (qs.length === 0) {
        setErrorMessage('ไม่พบข้อมูลข้อสอบในไฟล์ กรุณาใช้ไฟล์แบบฟอร์มที่ถูกต้อง');
      } else {
        setParsedQuestions(qs);
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + (err.message || 'รูปแบบไม่ถูกต้อง'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseText = () => {
    try {
      const qs = parseQuestionPlainText(plainText);
      if (qs.length === 0) {
        setErrorMessage('ไม่สามารถแปลงข้อสอบได้ กรุณาตรวจดูรูปแบบข้อและตัวเลือก');
      } else {
        setParsedQuestions(qs);
        setErrorMessage('');
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการแปลงข้อความ: ' + err.message);
    }
  };

  const handleConfirmImport = () => {
    if (parsedQuestions.length > 0) {
      onImportQuestions(parsedQuestions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">นำเข้าข้อสอบเข้าสู่ชุดข้อสอบ</h3>
              <p className="text-xs text-slate-500">รองรับไฟล์ Excel (.xlsx/.csv) หรือวางข้อความจัดรูปแบบ</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-4">
          <button
            onClick={() => { setActiveTab('excel'); setParsedQuestions([]); }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'excel'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            นำเข้าผ่านไฟล์ Excel (.xlsx)
          </button>

          <button
            onClick={() => { setActiveTab('text'); setParsedQuestions([]); }}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            นำเข้าผ่านการวางข้อความ (Quick Text)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {activeTab === 'excel' ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">ขั้นตอนที่ 1: ดาวน์โหลดแบบฟอร์มนำเข้า</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    ดาวน์โหลดแม่แบบ Excel ที่มีหัวตารางพร้อมตัวอย่างข้อสอบ 4 ตัวเลือก
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadQuestionTemplate}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition-colors border border-indigo-200 flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  ดาวน์โหลดแบบฟอร์ม Excel
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">ขั้นตอนที่ 2: อัปโหลดไฟล์ Excel ของท่าน</h4>
                <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Upload className="w-8 h-8 text-indigo-600 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</span>
                  <span className="text-[11px] text-slate-400 mt-1">รองรับ .xlsx, .xls, .csv</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  วางข้อความข้อสอบ (ระบบจะแยกข้อ ตัวเลือก และเฉลยอัตโนมัติ)
                </label>
                <button
                  onClick={handleParseText}
                  className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  แปลงข้อความเป็นข้อสอบ
                </button>
              </div>

              <textarea
                rows={8}
                value={plainText}
                onChange={(e) => setPlainText(e.target.value)}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Parsed Questions */}
          {parsedQuestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ตรวจสอบข้อสอบที่ตรวจพบ ({parsedQuestions.length} ข้อ)
                </h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <div className="font-semibold text-slate-900 mb-1">
                      {idx + 1}. {q.text}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
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

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedQuestions.length > 0 ? `พร้อมนำเข้า ${parsedQuestions.length} ข้อ` : 'ยังไม่มีข้อสอบที่นำเข้า'}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={parsedQuestions.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs ${
                parsedQuestions.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              นำเข้า {parsedQuestions.length} ข้อสู่ชุดข้อสอบ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
