import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolLogo } from './SchoolLogo';
import { 
  User, 
  Key, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Calendar, 
  Sparkles,
  ChevronDown,
  Info
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login, schoolInfo, selectedAcademicYear, selectedSemester } = useAuth();
  
  // Academic Year options starting from 2568 onwards
  const academicYears = ['2568', '2569', '2570', '2571', '2572', '2573', '2574', '2575'];
  
  const [academicYear, setAcademicYear] = useState<string>(() => {
    return localStorage.getItem('lms_selected_academic_year') || selectedAcademicYear || '2568';
  });
  const [semester, setSemester] = useState<string>(() => {
    return localStorage.getItem('lms_selected_semester') || selectedSemester || '1';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickHelp, setShowQuickHelp] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setIsLoading(true);
    setError('');

    const res = await login(username.trim(), password.trim(), academicYear, semester);
    if (!res.success) {
      setError(res.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
    }
    setIsLoading(false);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header with School Branding using the official kps.jpg design */}
        <div className="p-8 pb-5 text-center bg-gradient-to-b from-amber-50/90 via-amber-50/30 to-white border-b border-slate-100 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl shadow-lg border border-amber-200/90 mb-3.5 transform hover:scale-105 transition-transform">
            <SchoolLogo size="lg" />
          </div>

          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            {schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}
          </h1>
          <p className="text-xs font-bold text-amber-800 mt-1">
            ระบบจัดการการเรียนรู้และคลังข้อสอบออนไลน์ (LMS-KPS)
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 bg-gradient-to-r from-amber-100 to-amber-200/80 rounded-full text-[11px] text-amber-900 font-bold border border-amber-300/80 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
            <span>ปีการศึกษา {academicYear} • ภาคเรียนที่ {semester}</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-7 pt-5 space-y-4.5">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            
            {/* 1. Academic Year & Semester Selector (เริ่มตั้งแต่ปี 2568) */}
            <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-2xl border border-slate-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>เลือกปีการศึกษา & ภาคเรียน</span>
                </label>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  เริ่มปี 2568 เป็นต้นไป
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Year Dropdown */}
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">
                    ปีการศึกษา
                  </label>
                  <div className="relative">
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      {academicYears.map((yr) => (
                        <option key={yr} value={yr}>
                          ปีการศึกษา {yr}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Semester Dropdown */}
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-1">
                    ภาคเรียน
                  </label>
                  <div className="relative">
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full pl-3 pr-7 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-2xs cursor-pointer"
                    >
                      <option value="1">ภาคเรียนที่ 1</option>
                      <option value="2">ภาคเรียนที่ 2</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ชื่อผู้ใช้งาน หรือ รหัสนักเรียน / รหัสบุคลากร *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="เช่น 4197, 5106, 1209"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-sans"
                />
              </div>
            </div>

            {/* 3. Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  รหัสผ่าน (Password) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickHelp(!showQuickHelp)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                  <span>แนะนำบัญชีทดสอบ</span>
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Demo Helper */}
            {showQuickHelp && (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1.5 animate-fadeIn">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>กดเพื่อกรอกข้อมูลทดสอบด่วน:</span>
                  <button
                    type="button"
                    onClick={() => setShowQuickHelp(false)}
                    className="text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    ปิด
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('4197', '114124')}
                    className="p-1.5 bg-white hover:bg-purple-50 text-purple-900 rounded-lg border border-purple-200 text-[11px] text-center font-bold transition-colors cursor-pointer"
                  >
                    👑 ผู้อำนวยการ<br />
                    <span className="text-[9px] text-slate-500 font-normal">4197 / 114124</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('5106', '123456')}
                    className="p-1.5 bg-white hover:bg-indigo-50 text-indigo-900 rounded-lg border border-indigo-200 text-[11px] text-center font-bold transition-colors cursor-pointer"
                  >
                    💼 ครู (วิชาการ)<br />
                    <span className="text-[9px] text-slate-500 font-normal">5106 / 123456</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('1209', '123456')}
                    className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 text-[11px] text-center font-bold transition-colors cursor-pointer"
                  >
                    🎓 นักเรียน ป.1<br />
                    <span className="text-[9px] text-slate-500 font-normal">1209 / 123456</span>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>กำลังเข้าสู่ระบบ...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ LMS-KPS ({academicYear}/{semester})</span>
                </>
              )}
            </button>
          </form>

          {/* Secure & Help Info Note */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 text-center text-xs text-slate-500">
            <div className="flex items-center justify-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ระบบรักษาความปลอดภัยข้อมูลโรงเรียนบ้านคลองพลูประชาสรรค์</span>
            </div>
            <p className="text-[11px] text-slate-400">
              หากลืมรหัสผ่านหรือต้องการความช่วยเหลือ กรุณาติดต่อครูประจำชั้นหรือผู้ดูแลระบบโรงเรียน
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
