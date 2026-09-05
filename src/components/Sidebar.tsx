import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolLogo } from './SchoolLogo';
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  BarChart3,
  Printer,
  Users,
  Bell,
  Sparkles,
  ShieldCheck,
  Briefcase,
  GraduationCap
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'courses' | 'exams' | 'analytics' | 'reports' | 'users' | 'announcements';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAiModal?: () => void;
  onOpenProfileUpload?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiModal,
  onOpenProfileUpload,
}) => {
  const { currentUser, schoolInfo } = useAuth();
  const role = currentUser?.role || 'student';

  const menuItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'ภาพรวมระบบ (Dashboard)',
      icon: LayoutDashboard,
      roles: ['director', 'teacher', 'student'],
    },
    {
      id: 'courses' as ActiveTab,
      label: role === 'student' ? 'รายวิชาของฉัน' : 'จัดการรายวิชาและบทเรียน',
      icon: BookOpen,
      roles: ['director', 'teacher', 'student'],
    },
    {
      id: 'exams' as ActiveTab,
      label: role === 'student' ? 'ห้องสอบออนไลน์' : 'คลังข้อสอบและการสอบ',
      icon: FileQuestion,
      roles: ['director', 'teacher', 'student'],
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'วิเคราะห์เปรียบเทียบผลสอบ',
      icon: BarChart3,
      roles: ['director', 'teacher', 'student'],
    },
    {
      id: 'reports' as ActiveTab,
      label: 'พิมพ์รายงาน & ปพ. / เกียรติบัตร',
      icon: Printer,
      roles: ['director', 'teacher', 'student'],
    },
    {
      id: 'users' as ActiveTab,
      label: role === 'director' ? 'จัดการนักเรียน ครู & รีเซ็ตรหัส' : 'รายชื่อนักเรียน & ข้อมูลผู้ใช้',
      icon: Users,
      roles: ['director', 'teacher'],
    },
    {
      id: 'announcements' as ActiveTab,
      label: 'ข่าวประชาสัมพันธ์',
      icon: Bell,
      roles: ['director', 'teacher', 'student'],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="no-print w-full md:w-64 bg-[#0f172a] text-white border-r border-slate-800 shrink-0 flex flex-col rounded-2xl shadow-sm overflow-hidden min-h-[calc(100vh-6rem)]">
      {/* Brand Header with School Logo */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-1 bg-white rounded-xl shadow-xs shrink-0">
            <SchoolLogo size="sm" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight truncate">
              {schoolInfo.schoolName || 'รร.บ้านคลองพลูประชาสรรค์'}
            </h1>
            <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
              LMS-KPS ออนไลน์
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-3.5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            ระบบเมนูหลัก
          </div>

          <nav className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
          {/* AI Helper Banner */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Exam & Lesson Generator</span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
              ช่วยครูสร้างข้อสอบและสรุปบทเรียนอัตโนมัติ
            </p>
            <button
              onClick={onOpenAiModal}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              เปิดใช้งาน AI
            </button>
          </div>

          {/* User Profile Footer with Click to Upload Avatar */}
          {currentUser && (
            <div
              onClick={onOpenProfileUpload}
              title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
              className="p-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors group"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                  alt={currentUser.fullName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-600 shrink-0 group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {currentUser.fullName}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                  {role === 'director' && <ShieldCheck className="w-3 h-3 text-purple-400" />}
                  {role === 'teacher' && <Briefcase className="w-3 h-3 text-indigo-400" />}
                  {role === 'student' && <GraduationCap className="w-3 h-3 text-emerald-400" />}
                  <span>
                    {role === 'director'
                      ? 'ผู้อำนวยการ'
                      : role === 'teacher'
                      ? currentUser.positionTitle || 'ครูผู้สอน'
                      : `นักเรียน ${currentUser.gradeLevel || ''}`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
