import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolLogo } from './SchoolLogo';
import { ProfileModal } from './ProfileModal';
import { 
  GraduationCap, 
  User as UserIcon, 
  LogOut, 
  Key, 
  Building2, 
  RefreshCw, 
  ChevronDown, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  Camera,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenAiModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAiModal }) => {
  const { currentUser, schoolInfo, logout, refreshAllData, selectedAcademicYear, selectedSemester, setAcademicYearAndSemester } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState(false);

  const academicYears = ['2568', '2569', '2570', '2571', '2572', '2573', '2574', '2575'];

  // Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'password' | 'school'>('profile');

  const handleSync = async () => {
    setIsSyncing(true);
    await refreshAllData();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice(true);
      setTimeout(() => setSyncNotice(false), 2000);
    }, 600);
  };

  const openProfileTab = (tab: 'profile' | 'password' | 'school') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
    setShowUserMenu(false);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'director':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            ผู้อำนวยการ (Super Admin)
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
            ครูผู้สอน / บุคลากร
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            นักเรียน ({currentUser?.gradeLevel} {currentUser?.classRoom || ''})
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: School Logo & System Title */}
            <div className="flex items-center gap-3 min-w-0">
              <SchoolLogo size="sm" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์'}
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ONLINE
                  </span>
                </div>
                
                {/* Academic Year Badge with Quick Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowYearMenu(!showYearMenu)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer mt-0.5"
                    title="คลิกเพื่อสลับปีการศึกษาหรือภาคเรียน"
                  >
                    <Calendar className="w-3 h-3 text-amber-700" />
                    <span>ปีการศึกษา {schoolInfo.academicYear} • เทอม {schoolInfo.semester}</span>
                    <ChevronDown className="w-2.5 h-2.5 text-amber-600 ml-0.5" />
                  </button>

                  {showYearMenu && (
                    <div 
                      className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn"
                      onMouseLeave={() => setShowYearMenu(false)}
                    >
                      <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                        <span>สลับปีการศึกษา/ภาคเรียน</span>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">2568 เป็นต้นไป</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-1">ปีการศึกษา</label>
                          <div className="grid grid-cols-4 gap-1">
                            {academicYears.map((yr) => (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => {
                                  setAcademicYearAndSemester(yr, schoolInfo.semester || '1');
                                  setShowYearMenu(false);
                                }}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors text-center ${
                                  schoolInfo.academicYear === yr
                                    ? 'bg-amber-500 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {yr}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-1">ภาคเรียน</label>
                          <div className="grid grid-cols-2 gap-1">
                            {['1', '2'].map((sem) => (
                              <button
                                key={sem}
                                type="button"
                                onClick={() => {
                                  setAcademicYearAndSemester(schoolInfo.academicYear || '2568', sem);
                                  setShowYearMenu(false);
                                }}
                                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors text-center ${
                                  schoolInfo.semester === sem
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                ภาคเรียนที่ {sem}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              
              {/* AI Assistant Button */}
              <button
                onClick={onOpenAiModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200 shadow-2xs cursor-pointer"
                title="สร้างข้อสอบและเนื้อหาด้วย AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">AI ช่วยสร้างข้อสอบ</span>
              </button>

              {/* Logout Button directly in Navbar */}
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 transition-colors border border-rose-200 shadow-2xs cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>

              {/* Sync Firestore Button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer relative"
                title="ซิงค์ข้อมูลกับ Firebase Firestore"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
                {syncNotice && (
                  <span className="absolute -bottom-7 right-0 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap z-50">
                    ซิงค์ข้อมูลแล้ว
                  </span>
                )}
              </button>

              {/* Current User Profile Dropdown */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                  >
                    <img
                      src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                      alt={currentUser.fullName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500 shadow-2xs"
                    />
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {currentUser.fullName}
                      </div>
                      <div className="mt-0.5">{getRoleBadge(currentUser.role)}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden lg:block" />
                  </button>

                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50"
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <div className="font-bold text-xs text-slate-900">{currentUser.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">ชื่อผู้ใช้: @{currentUser.username}</div>
                        <div className="mt-1.5">{getRoleBadge(currentUser.role)}</div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => openProfileTab('profile')}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-indigo-600" />
                          <span>เปลี่ยนรูปโปรไฟล์ & ข้อมูลส่วนตัว</span>
                        </button>

                        <button
                          onClick={() => openProfileTab('password')}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                        >
                          <Key className="w-4 h-4 text-amber-600" />
                          <span>เปลี่ยนรหัสผ่าน</span>
                        </button>

                        {currentUser.role === 'director' && (
                          <button
                            onClick={() => openProfileTab('school')}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
                          >
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span>ตั้งค่าข้อมูล & โลโก้โรงเรียน</span>
                          </button>
                        )}

                        <div className="border-t border-slate-100 my-1"></div>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      </header>

      {/* Global Profile / Password / School Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </>
  );
};
