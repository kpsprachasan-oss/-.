import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, SchoolInfo } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { sendLineNotification } from '../utils/lineNotify';
import {
  X,
  Upload,
  Camera,
  Key,
  Building2,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Zap,
  ExternalLink
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'password' | 'school';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { currentUser, schoolInfo, updateUserProfile, changePassword, updateSchoolInfo, users } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'school'>(initialTab);

  // Profile Upload State
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser?.avatar || '');
  const [fullName, setFullName] = useState<string>(currentUser?.fullName || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [passwordTargetMode, setPasswordTargetMode] = useState<'self' | 'other'>('self');
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // School Settings State (Director Only)
  const [schoolName, setSchoolName] = useState(schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์');
  const [schoolSubName, setSchoolSubName] = useState(schoolInfo.schoolSubName || 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษา');
  const [academicYear, setAcademicYear] = useState(schoolInfo.academicYear || '2568');
  const [semester, setSemester] = useState(schoolInfo.semester || '1');
  const [schoolPhone, setSchoolPhone] = useState(schoolInfo.phone || '');
  const [schoolEmail, setSchoolEmail] = useState(schoolInfo.email || '');
  const [schoolAddress, setSchoolAddress] = useState(schoolInfo.address || '');
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(schoolInfo.logoUrl || '');
  const [lineNotifyToken, setLineNotifyToken] = useState(schoolInfo.lineNotifyToken || '');
  const [lineNotifyGroupName, setLineNotifyGroupName] = useState(schoolInfo.lineNotifyGroupName || 'LINE กลุ่มโรงเรียนบ้านคลองพลูประชาสรรค์');
  const [lineNotifyCustomWebhook, setLineNotifyCustomWebhook] = useState(schoolInfo.lineNotifyCustomWebhook || '');
  const [testingLine, setTestingLine] = useState(false);
  const [schoolSuccess, setSchoolSuccess] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setProfileError('ขนาดไฟล์รูปภาพต้องไม่เกิน 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
        setProfileError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSchoolLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSchoolLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const ok = await updateUserProfile(currentUser.id, {
        fullName: fullName.trim(),
        avatar: avatarPreview,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (ok) {
        setProfileSuccess('อัปเดตข้อมูลโปรไฟล์และรูปภาพเรียบร้อยแล้ว');
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch {
      setProfileError('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const targetUserId = (passwordTargetMode === 'other' && selectedTargetUserId) ? selectedTargetUserId : currentUser.id;
    const targetUser = users.find((u) => u.id === targetUserId) || currentUser;

    if (newPassword.length < 4) {
      setPasswordError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await changePassword(targetUserId, newPassword);
      if (res.success) {
        setPasswordSuccess(`เปลี่ยนรหัสผ่านของ ${targetUser.fullName} (@${targetUser.username}) สำเร็จเรียบร้อย`);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3500);
      } else {
        setPasswordError(res.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
      }
    } catch {
      setPasswordError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SchoolInfo = {
      ...schoolInfo,
      schoolName: schoolName.trim(),
      schoolSubName: schoolSubName.trim(),
      academicYear: academicYear.trim(),
      semester: semester.trim(),
      phone: schoolPhone.trim(),
      email: schoolEmail.trim(),
      address: schoolAddress.trim(),
      logoUrl: schoolLogoUrl,
      lineNotifyToken: lineNotifyToken.trim(),
      lineNotifyGroupName: lineNotifyGroupName.trim(),
      lineNotifyCustomWebhook: lineNotifyCustomWebhook.trim(),
      lineNotifyEnabled: !!lineNotifyToken.trim(),
    };

    await updateSchoolInfo(updated);
    setSchoolSuccess('บันทึกการตั้งค่าข้อมูลโรงเรียนและการเชื่อมต่อ LINE Notify สำเร็จ');
    setTimeout(() => setSchoolSuccess(''), 3500);
  };

  const handleTestLineNotify = async () => {
    if (!lineNotifyToken.trim() && !lineNotifyCustomWebhook.trim()) {
      setSchoolSuccess('กรุณาระบุ LINE Notify Token หรือ Webhook URL ก่อนทดสอบ');
      return;
    }

    setTestingLine(true);
    const testMsg = `\n🔔 [ทดสอบสัญญาณระบบ LINE Notify]\n🏫 ${schoolName}\n─────────────────────\nสถานะ: การเชื่อมต่อระบบ LMS สำเร็จเรียบร้อย\nเวลาที่ส่ง: ${new Date().toLocaleString('th-TH')}\nทดสอบโดย: ${currentUser?.fullName}`;
    
    const res = await sendLineNotification({
      message: testMsg,
      token: lineNotifyToken.trim(),
      webhookUrl: lineNotifyCustomWebhook.trim(),
    });
    setTestingLine(false);

    if (res.success) {
      setSchoolSuccess('✅ ทดสอบส่งข้อความแจ้งเตือนเข้า LINE สำเร็จเรียบร้อย!');
    } else {
      setSchoolSuccess(`ℹ️ ${res.message}`);
    }
    setTimeout(() => setSchoolSuccess(''), 4500);
  };

  const handleUsePresetAvatar = (seed: string) => {
    setAvatarPreview(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">การตั้งค่าบัญชีและโปรไฟล์</h3>
              <p className="text-[11px] text-slate-400">@{currentUser.username} - {currentUser.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>รูปโปรไฟล์ & ข้อมูลส่วนตัว</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </button>

          {currentUser.role === 'director' && (
            <button
              onClick={() => setActiveTab('school')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'school'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>ข้อมูล & โลโก้โรงเรียน</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: PROFILE & AVATAR */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <div className="relative group">
                  <img
                    src={avatarPreview || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`}
                    alt={currentUser.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 hover:bg-black/60 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Camera className="w-5 h-5 mb-1" />
                    <span>อัปโหลด</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{currentUser.fullName}</h4>
                    <p className="text-xs text-slate-500 font-mono">ชื่อผู้ใช้: {currentUser.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>เลือกไฟล์รูปภาพ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUsePresetAvatar(Math.random().toString(36).substring(7))}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>สุ่มอวตาร</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 3MB)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุล
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    placeholder="example@kps.ac.th"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บทบาท / ระดับชั้น
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      currentUser.role === 'director'
                        ? 'ผู้อำนวยการโรงเรียน (Super Admin)'
                        : currentUser.role === 'teacher'
                        ? currentUser.positionTitle || 'ครูผู้สอน'
                        : `นักเรียนชั้น ${currentUser.gradeLevel || ''} ห้อง ${currentUser.classRoom || ''}`
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 text-slate-600 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการเปลี่ยนแปลงโปรไฟล์</span>
              </button>
            </form>
          )}

          {/* TAB 2: PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Super Admin User Switcher Option */}
              {currentUser.role === 'director' && (
                <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      สิทธิ์ Super Admin: เปลี่ยนรหัสผ่าน
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordTargetMode('self');
                          setSelectedTargetUserId('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          passwordTargetMode === 'self'
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-100/60'
                        }`}
                      >
                        บัญชีตนเอง
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordTargetMode('other');
                          if (!selectedTargetUserId && users.length > 0) {
                            const firstNonSelf = users.find((u) => u.id !== currentUser.id) || users[0];
                            setSelectedTargetUserId(firstNonSelf.id);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          passwordTargetMode === 'other'
                            ? 'bg-purple-700 text-white shadow-2xs'
                            : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-100/60'
                        }`}
                      >
                        ครู / นักเรียน ({users.length - 1})
                      </button>
                    </div>
                  </div>

                  {passwordTargetMode === 'other' && (
                    <div className="space-y-1.5 pt-1">
                      <label className="block text-[11px] font-bold text-purple-900">
                        เลือกครูหรือนักเรียนที่ต้องการเปลี่ยนรหัสผ่าน:
                      </label>
                      <select
                        value={selectedTargetUserId}
                        onChange={(e) => setSelectedTargetUserId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                      >
                        {users
                          .filter((u) => u.id !== currentUser.id)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.role === 'teacher' ? '💼 [ครู]' : '🎓 [นักเรียน]'} {u.fullName} (@{u.username}) {u.classRoom ? `- ${u.classRoom}` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">
                    {passwordTargetMode === 'other'
                      ? `กำลังตั้งรหัสผ่านใหม่ให้: ${users.find((u) => u.id === selectedTargetUserId)?.fullName || 'ผู้ใช้งานที่เลือก'}`
                      : 'คำแนะนำความปลอดภัย'}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {passwordTargetMode === 'other'
                      ? 'รหัสผ่านใหม่จะมีผลทันที ผู้ใช้งานสามารถนำรหัสนี้ไปเข้าสู่ระบบได้ทันที'
                      : 'รหัสผ่านควรมีความยาวอย่างน้อย 4-6 ตัวอักษรขึ้นไป และไม่ควรเปิดเผยให้ผู้อื่นทราบ'}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    รหัสผ่านใหม่ (New Password) *
                  </label>
                  {passwordTargetMode === 'other' && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPassword('123456');
                        setConfirmPassword('123456');
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      ใช้ค่าเริ่มต้น 123456
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="กรอกรหัสผ่านใหม่"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ยืนยันรหัสผ่านใหม่ (Confirm Password) *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                />
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>ยืนยันเปลี่ยนรหัสผ่าน</span>
              </button>
            </form>
          )}

          {/* TAB 3: SCHOOL SETTINGS (Director Only) */}
          {activeTab === 'school' && currentUser.role === 'director' && (
            <form onSubmit={handleSaveSchoolSettings} className="space-y-4">
              
              {/* School Logo Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  {schoolLogoUrl ? (
                    <img
                      src={schoolLogoUrl}
                      alt={schoolName}
                      className="w-14 h-14 object-contain rounded-lg"
                    />
                  ) : (
                    <SchoolLogo size="md" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="font-bold text-xs text-slate-800">ตราสัญลักษณ์โรงเรียน (Logo)</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-600" />
                      <span>อัปโหลดรูปโลโก้</span>
                    </button>
                    {schoolLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setSchoolLogoUrl('')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        ใช้ตรามาตรฐาน (คพล)
                      </button>
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSchoolLogoFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อโรงเรียน
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ปีการศึกษา
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ภาคเรียนที่
                  </label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์โรงเรียน
                  </label>
                  <input
                    type="text"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมลทางการโรงเรียน
                  </label>
                  <input
                    type="email"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ที่อยู่โรงเรียน
                  </label>
                  <input
                    type="text"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* LINE Notify & Messaging Integration Card */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#06C755] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      LINE
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        การเชื่อมต่อ LINE Notify / LINE Alert
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          {lineNotifyToken ? 'กำหนด Token แล้ว' : 'พร้อมใช้งาน'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        สำหรับส่งแจ้งเตือนการสอบและประกาศไปยังกลุ่มนักเรียน/ผู้ปกครอง
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://notify-bot.line.me/my/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs cursor-pointer"
                  >
                    <span>ขอรับ Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      LINE Notify Access Token (ถ้ามี):
                    </label>
                    <input
                      type="password"
                      placeholder="ใส่รหัส Personal Access Token จาก LINE Notify"
                      value={lineNotifyToken}
                      onChange={(e) => setLineNotifyToken(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ชื่อกลุ่ม LINE เป้าหมาย:
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น LINE กลุ่ม ป.1 - ป.6 โรงเรียนบ้านคลองพลูประชาสรรค์"
                      value={lineNotifyGroupName}
                      onChange={(e) => setLineNotifyGroupName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Custom Webhook URL (ทางเลือก):
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-webhook-endpoint..."
                      value={lineNotifyCustomWebhook}
                      onChange={(e) => setLineNotifyCustomWebhook(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-slate-500">
                    💡 หากไม่ใช้ Token ระบบรองรับการกด <strong>"แชร์ไปยัง LINE"</strong> และคัดลอกข้อความเพื่อส่งเข้ากลุ่มได้ทันทีทุกอุปกรณ์
                  </p>
                  {(lineNotifyToken || lineNotifyCustomWebhook) && (
                    <button
                      type="button"
                      disabled={testingLine}
                      onClick={handleTestLineNotify}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{testingLine ? 'กำลังทดสอบ...' : 'ทดสอบสัญญาณ LINE'}</span>
                    </button>
                  )}
                </div>
              </div>

              {schoolSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{schoolSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกข้อมูลโรงเรียน</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
