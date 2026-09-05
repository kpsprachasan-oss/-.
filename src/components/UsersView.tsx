import React, { useState, useRef } from 'react';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { LmsService } from '../lib/firebase';
import {
  downloadUserTemplate,
  parseUserExcel,
  exportUsersToExcel
} from '../utils/excelHelper';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Key,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  X,
  Lock,
  Camera,
  Eye,
  EyeOff,
  Filter,
  ShieldAlert
} from 'lucide-react';

interface UsersViewProps {
  onRefreshUsers: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ onRefreshUsers }) => {
  const { currentUser, users, changePassword, refreshAllData } = useAuth();
  const isDirector = currentUser?.role === 'director';
  const isTeacher = currentUser?.role === 'teacher';

  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit / Create User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [titlePrefix, setTitlePrefix] = useState('เด็กชาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ชั้นประถมศึกษาปีที่ 1');
  const [classRoom, setClassRoom] = useState('ชั้นประถมศึกษาปีที่ 1/1');
  const [department, setDepartment] = useState('ฝ่ายวิชาการ');
  const [positionTitle, setPositionTitle] = useState('');
  const [avatar, setAvatar] = useState('');
  const userPhotoInputRef = useRef<HTMLInputElement>(null);

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [targetResetUser, setTargetResetUser] = useState<User | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('123456');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [resetErrorMessage, setResetErrorMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetRoleFilter, setResetRoleFilter] = useState<'all' | 'teacher' | 'student'>('all');
  const [resetUserSearch, setResetUserSearch] = useState('');
  const [showResetPasswordPlain, setShowResetPasswordPlain] = useState(false);
  const [showTargetCurrentPassword, setShowTargetCurrentPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  // Import Excel Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedImportUsers, setParsedImportUsers] = useState<Partial<User>[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [importError, setImportError] = useState('');

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('123456');
    setTitlePrefix('เด็กชาย');
    setFirstName('');
    setLastName('');
    setFullName('');
    setRole('student');
    setEmail('');
    setPhone('');
    setStudentId('');
    setEmployeeId('');
    setGradeLevel('ชั้นประถมศึกษาปีที่ 1');
    setClassRoom('ชั้นประถมศึกษาปีที่ 1/1');
    setDepartment('ฝ่ายวิชาการ');
    setPositionTitle('นักเรียนชั้นประถมศึกษาปีที่ 1');
    setAvatar('');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    // Teachers cannot edit director or other teachers
    if (isTeacher && user.role !== 'student') {
      alert('ครูผู้สอนมีสิทธิ์จัดการและแก้ไขข้อมูลเฉพาะนักเรียนเท่านั้น');
      return;
    }

    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setTitlePrefix(user.titlePrefix || (user.role === 'student' ? 'เด็กชาย' : 'นาย'));
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setFullName(user.fullName);
    setRole(user.role);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setStudentId(user.studentId || '');
    setEmployeeId(user.employeeId || '');
    setGradeLevel(user.gradeLevel || 'ชั้นประถมศึกษาปีที่ 1');
    setClassRoom(user.classRoom || 'ชั้นประถมศึกษาปีที่ 1/1');
    setDepartment(user.department || 'ฝ่ายวิชาการ');
    setPositionTitle(user.positionTitle || '');
    setAvatar(user.avatar || '');
    setIsEditModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAvatar(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    let computedFullName = fullName.trim();
    if (!computedFullName && (firstName.trim() || lastName.trim())) {
      computedFullName = `${titlePrefix ? titlePrefix : ''}${firstName.trim()} ${lastName.trim()}`.trim();
    }
    if (!computedFullName) {
      computedFullName = `ผู้ใช้ ${username.trim()}`;
    }

    const userPayload: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      username: username.trim(),
      password: editingUser ? (password.trim() ? password.trim() : editingUser.password) : (password.trim() || '123456'),
      titlePrefix: titlePrefix || undefined,
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      fullName: computedFullName,
      role: isTeacher ? 'student' : role,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      studentId: role === 'student' ? (studentId.trim() || username.trim()) : undefined,
      employeeId: role !== 'student' ? (employeeId.trim() || username.trim()) : undefined,
      gradeLevel: role === 'student' ? gradeLevel : undefined,
      classRoom: role === 'student' ? classRoom : undefined,
      department: role !== 'student' ? department.trim() : undefined,
      positionTitle: positionTitle.trim() || (role === 'director' ? 'ผู้อำนวยการโรงเรียน' : role === 'teacher' ? 'ครูผู้สอน' : `นักเรียน${gradeLevel}`),
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username.trim()}`,
      active: true,
      createdAt: editingUser?.createdAt || new Date().toISOString(),
    };

    await LmsService.saveUser(userPayload);
    await refreshAllData();
    setIsEditModalOpen(false);
    onRefreshUsers();
  };

  const handleDeleteUserClick = async (user: User) => {
    if (!isDirector) {
      alert('เฉพาะผู้อำนวยการโรงเรียนเท่านั้นที่มีสิทธิ์ลบผู้ใช้งาน');
      return;
    }
    if (user.id === currentUser?.id) {
      alert('ไม่สามารถลบบัญชีของตนเองที่กำลังใช้งานอยู่ได้');
      return;
    }
    if (confirm(`คุณต้องการลบผู้ใช้งาน "${user.fullName}" (${user.username}) ใช่หรือไม่?`)) {
      await LmsService.deleteUser(user.id);
      await refreshAllData();
      onRefreshUsers();
    }
  };

  // Password Reset Modal Handlers
  const handleOpenResetPassword = (user?: User) => {
    // Strictly restrict password resetting to Super Admin (Director)
    if (!isDirector) {
      alert('เฉพาะผู้อำนวยการ (Super Admin) เท่านั้นที่มีสิทธิ์รีเซ็ตรหัสผ่านผู้ใช้งานในระบบ');
      return;
    }
    const target = user || filteredUsers[0] || users[0] || null;
    setTargetResetUser(target);
    setNewResetPassword('123456');
    setResetSuccessMessage('');
    setResetErrorMessage('');
    setIsResetModalOpen(true);
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirector) {
      setResetErrorMessage('ไม่มีสิทธิ์ดำเนินการ เฉพาะ Super Admin เท่านั้น');
      return;
    }
    if (!targetResetUser || !newResetPassword.trim()) return;

    setIsResetting(true);
    setResetErrorMessage('');
    setResetSuccessMessage('');

    const res = await changePassword(targetResetUser.id, newResetPassword.trim());
    setIsResetting(false);

    if (res.success) {
      setResetSuccessMessage(`รีเซ็ตรหัสผ่านของ ${targetResetUser.fullName} (@${targetResetUser.username}) เรียบร้อยแล้ว เป็น: ${newResetPassword.trim()}`);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccessMessage('');
      }, 2000);
    } else {
      setResetErrorMessage(res.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้');
    }
  };

  // Excel Import handlers
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImport(true);
    setImportError('');
    try {
      const parsed = await parseUserExcel(file);
      if (parsed.length === 0) {
        setImportError('ไม่พบข้อมูลผู้ใช้งานในไฟล์ กรุณาตรวจสอบไฟล์');
      } else {
        setParsedImportUsers(parsed);
      }
    } catch (err: any) {
      setImportError('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleConfirmImportUsers = async () => {
    if (parsedImportUsers.length === 0) return;
    
    // For teachers, ensure imported users are forced to students
    for (const u of parsedImportUsers) {
      const fullUser: User = {
        id: u.id || `usr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        fullName: u.fullName || 'ผู้ใช้งาน',
        username: u.username || `user_${Date.now()}`,
        password: u.password || '123456',
        role: isTeacher ? 'student' : (u.role || 'student'),
        gradeLevel: u.gradeLevel || 'ชั้นประถมศึกษาปีที่ 1',
        classRoom: u.classRoom || 'ชั้นประถมศึกษาปีที่ 1/1',
        studentId: u.studentId || u.username,
        employeeId: u.employeeId,
        department: u.department || 'ฝ่ายวิชาการ',
        positionTitle: u.positionTitle || (u.role === 'teacher' ? 'ครูผู้สอน' : 'นักเรียน'),
        email: u.email,
        phone: u.phone,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await LmsService.saveUser(fullUser);
    }
    await refreshAllData();
    setIsImportModalOpen(false);
    setParsedImportUsers([]);
    onRefreshUsers();
    alert(`นำเข้าผู้ใช้งานสำเร็จทั้งหมด ${parsedImportUsers.length} รายการ`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesGrade = gradeFilter === 'all' || u.gradeLevel === gradeFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId && u.studentId.includes(searchQuery)) ||
      (u.employeeId && u.employeeId.includes(searchQuery)) ||
      (u.classRoom && u.classRoom.includes(searchQuery));
    return matchesRole && matchesGrade && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header with Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {isDirector ? 'จัดการข้อมูลผู้ใช้งาน (User Management)' : 'รายชื่อนักเรียน & บุคลากร'}
            </h1>
            {isDirector && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Super Admin
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDirector
              ? 'โรงเรียนบ้านคลองพลูประชาสรรค์ (สิทธิ์เฉพาะผู้อำนวยการ Super Admin ในการรีเซ็ตรหัสผ่านและจัดการข้อมูลทุกบัญชี)'
              : 'โรงเรียนบ้านคลองพลูประชาสรรค์ (สิทธิ์ครูผู้สอน: ดูรายชื่อและจัดการข้อมูลนักเรียน)'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Super Admin Quick Reset Password Button */}
          {isDirector && (
            <button
              onClick={() => handleOpenResetPassword()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.99]"
              title="รีเซ็ตรหัสผ่านผู้ใช้งานในระบบ (สิทธิ์เฉพาะ Super Admin)"
            >
              <Key className="w-4 h-4" />
              <span>รีเซ็ตรหัสผ่าน (Super Admin)</span>
            </button>
          )}

          <button
            onClick={() => exportUsersToExcel(users)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            ส่งออก Excel
          </button>

          <button
            onClick={() => { setParsedImportUsers([]); setIsImportModalOpen(true); }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            นำเข้า Excel
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {isDirector ? 'เพิ่มผู้ใช้งาน' : 'เพิ่มนักเรียน'}
          </button>
        </div>
      </div>

      {/* Permission Notice Banner */}
      {isDirector ? (
        <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-center gap-2.5 text-xs text-purple-900">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            <strong>สิทธิ์ผู้อำนวยการ (Super Admin):</strong> คุณเป็นผู้เดียวที่มีสิทธิ์ <strong>รีเซ็ตรหัสผ่าน</strong> ของคณะครูและนักเรียนทุกคนในระบบ
          </span>
        </div>
      ) : (
        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-900">
          <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>สิทธิ์ครูผู้สอน:</strong> สามารถดูรายชื่อผู้ใช้งานและจัดการข้อมูลนักเรียน (การรีเซ็ตรหัสผ่านสงวนสิทธิ์เฉพาะผู้อำนวยการ Super Admin เท่านั้น)
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสนักเรียน, ชื่อผู้ใช้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { key: 'all', label: 'ทั้งหมด' },
              { key: 'director', label: 'ผู้อำนวยการ' },
              { key: 'teacher', label: 'ครูอาจารย์' },
              { key: 'student', label: 'นักเรียน' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  roleFilter === tab.key
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grade Filter for Students */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
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

        </div>

        <div className="text-xs text-slate-500 font-medium">
          พบ <span className="font-bold text-slate-800">{filteredUsers.length}</span> ผู้ใช้งาน
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                <th className="py-3 px-3">รหัส / Username</th>
                <th className="py-3 px-3">คำนำหน้า</th>
                <th className="py-3 px-3">ชื่อ</th>
                <th className="py-3 px-3">นามสกุล</th>
                <th className="py-3 px-3">ชื่อ - นามสกุล</th>
                <th className="py-3 px-3">ระดับชั้น / ห้อง / ฝ่าย</th>
                <th className="py-3 px-3">บทบาท & ตำแหน่ง</th>
                <th className="py-3 px-3">ข้อมูลติดต่อ</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((user, index) => {
                const isUserDirector = user.role === 'director';
                const isUserTeacher = user.role === 'teacher';
                const isUserStudent = user.role === 'student';

                // ONLY Super Admin (Director) can reset passwords
                const canResetPassword = isDirector;
                const canEditUser = isDirector || (isTeacher && isUserStudent);
                const canDeleteUser = isDirector && user.id !== currentUser?.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Index */}
                    <td className="py-3 px-3 text-center font-medium text-slate-400">
                      {index + 1}
                    </td>

                    {/* Username & ID */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                          alt={user.fullName}
                          className="w-7 h-7 rounded-full object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 font-mono text-[12px]">{user.studentId || user.employeeId || user.username}</div>
                          <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Prefix */}
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {user.titlePrefix || '-'}
                    </td>

                    {/* First Name */}
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {user.firstName || user.fullName.split(' ')[0] || '-'}
                    </td>

                    {/* Last Name */}
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {user.lastName || user.fullName.split(' ').slice(1).join(' ') || '-'}
                    </td>

                    {/* Full Name */}
                    <td className="py-3 px-3 font-bold text-indigo-950 whitespace-nowrap">
                      {user.fullName}
                    </td>

                    {/* Department / Class */}
                    <td className="py-3 px-3">
                      {isUserStudent ? (
                        <div className="whitespace-nowrap">
                          <span className="font-semibold text-slate-900">{user.classRoom || user.gradeLevel}</span>
                          <span className="text-[10px] text-slate-400 ml-1">({user.gradeLevel})</span>
                        </div>
                      ) : (
                        <div className="text-slate-600 line-clamp-1">{user.department || 'ฝ่ายวิชาการ'}</div>
                      )}
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isUserDirector
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : isUserTeacher
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isUserDirector && <ShieldCheck className="w-3 h-3" />}
                        {isUserTeacher && <Briefcase className="w-3 h-3" />}
                        {isUserStudent && <GraduationCap className="w-3 h-3" />}
                        {user.positionTitle || (isUserDirector ? 'ผู้อำนวยการ' : isUserTeacher ? 'ครูผู้สอน' : `นักเรียน ${user.gradeLevel || ''}`)}
                      </span>
                    </td>

                    {/* Contacts */}
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      <div>{user.email || '-'}</div>
                      <div className="text-[10px] text-slate-400">{user.phone || ''}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Password Reset Button: Strictly Super Admin Only */}
                        {canResetPassword ? (
                          <button
                            onClick={() => handleOpenResetPassword(user)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="รีเซ็ตรหัสผ่านบัญชีนี้ (สิทธิ์เฉพาะ Super Admin)"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-700" />
                            <span>รีเซ็ตรหัส</span>
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] text-slate-400 bg-slate-100 border border-slate-200" title="เฉพาะ Super Admin เท่านั้นที่สามารถรีเซ็ตรหัสผ่านได้">
                            เฉพาะ Super Admin
                          </span>
                        )}

                        {canEditUser && (
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDeleteUser && (
                          <button
                            onClick={() => handleDeleteUserClick(user)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================== */}
      {/* 1. RESET PASSWORD MODAL (Super Admin Exclusivity) */}
      {/* ============================================== */}
      {isResetModalOpen && targetResetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100/50">
              <div className="flex items-center gap-2 text-amber-900">
                <div className="p-2 bg-amber-200/80 rounded-xl text-amber-800">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">รีเซ็ตและเปลี่ยนรหัสผ่าน (Super Admin)</h3>
                  <p className="text-[11px] text-amber-800 font-medium">สิทธิ์เฉพาะผู้อำนวยการ: เปลี่ยนรหัสผ่านของคณะครูและนักเรียนทุกคนได้</p>
                </div>
              </div>
              <button onClick={() => setIsResetModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Category Filter & Search for Target User */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    เลือกผู้ใช้งานที่ต้องการเปลี่ยนรหัสผ่าน
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setResetRoleFilter('all')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        resetRoleFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ทั้งหมด ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetRoleFilter('teacher')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        resetRoleFilter === 'teacher' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      คณะครู ({users.filter((u) => u.role === 'teacher').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetRoleFilter('student')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                        resetRoleFilter === 'student' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      นักเรียน ({users.filter((u) => u.role === 'student').length})
                    </button>
                  </div>
                </div>

                {/* Quick search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหาชื่อ, รหัสนักเรียน/บุคลากร..."
                    value={resetUserSearch}
                    onChange={(e) => setResetUserSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Select User Dropdown */}
                <select
                  value={targetResetUser.id}
                  onChange={(e) => {
                    const u = users.find((x) => x.id === e.target.value);
                    if (u) {
                      setTargetResetUser(u);
                      setShowTargetCurrentPassword(false);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium shadow-2xs"
                >
                  {users
                    .filter((u) => {
                      if (resetRoleFilter === 'teacher' && u.role !== 'teacher') return false;
                      if (resetRoleFilter === 'student' && u.role !== 'student') return false;
                      if (resetUserSearch.trim()) {
                        const q = resetUserSearch.toLowerCase().trim();
                        const matchName = u.fullName.toLowerCase().includes(q);
                        const matchUser = u.username.toLowerCase().includes(q);
                        const matchStudentId = u.studentId?.toLowerCase().includes(q);
                        const matchEmployeeId = u.employeeId?.toLowerCase().includes(q);
                        return matchName || matchUser || matchStudentId || matchEmployeeId;
                      }
                      return true;
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.role === 'director' ? '👑 [ผู้อำนวยการ]' : u.role === 'teacher' ? '💼 [ครู]' : '🎓 [นักเรียน]'} {u.fullName} (@{u.username}) {u.classRoom ? `- ${u.classRoom}` : u.department ? `- ${u.department}` : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Target User Info Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={targetResetUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetResetUser.username}`}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full bg-white border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{targetResetUser.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Username: <strong className="text-indigo-700 font-bold">@{targetResetUser.username}</strong>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    targetResetUser.role === 'director'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : targetResetUser.role === 'teacher'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {targetResetUser.role === 'director'
                      ? 'ผู้อำนวยการ'
                      : targetResetUser.role === 'teacher'
                      ? `คณะครู (${targetResetUser.department || 'ฝ่ายวิชาการ'})`
                      : `นักเรียน (${targetResetUser.gradeLevel || targetResetUser.classRoom || 'ป.1-ป.6'})`}
                  </span>
                </div>

                {/* Current Password Reveal Section */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    รหัสผ่านปัจจุบัน:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded text-xs">
                      {showTargetCurrentPassword ? (targetResetUser.password || '123456') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTargetCurrentPassword(!showTargetCurrentPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showTargetCurrentPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่านปัจจุบัน'}
                    >
                      {showTargetCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Input & Quick Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    กำหนดรหัสผ่านใหม่ *
                  </label>
                  <span className="text-[10px] text-slate-400">เลือกค่าด่วนด้านล่างได้ทันที</span>
                </div>

                <div className="relative">
                  <input
                    type={showResetPasswordPlain ? 'text' : 'password'}
                    required
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="เช่น 123456 หรือรหัสใหม่"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono font-bold text-slate-900 bg-amber-50/40 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordPlain(!showResetPasswordPlain)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    title={showResetPasswordPlain ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showResetPasswordPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setNewResetPassword('123456')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    123456 (ค่าเริ่มต้น)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewResetPassword(targetResetUser.studentId || targetResetUser.username)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    ใช้รหัสประจำตัว ({targetResetUser.studentId || targetResetUser.username})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
                      setNewResetPassword(randomPass);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    สุ่มเลข 6 หลัก
                  </button>
                  {targetResetUser.phone && (
                    <button
                      type="button"
                      onClick={() => setNewResetPassword(targetResetUser.phone!.replace(/[^0-9]/g, ''))}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      ใช้เบอร์โทร
                    </button>
                  )}
                </div>
              </div>

              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex flex-col gap-1 border border-emerald-200 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{resetSuccessMessage}</span>
                  </div>
                </div>
              )}

              {resetErrorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetErrorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  <span>{isResetting ? 'กำลังบันทึก...' : 'บันทึกเปลี่ยนรหัสผ่าน'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 2. CREATE / EDIT USER MODAL */}
      {/* ============================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้งาน' : isTeacher ? 'เพิ่มข้อมูลนักเรียนใหม่' : 'เพิ่มผู้ใช้งานใหม่'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Photo Upload in User Form */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${username || 'new'}`}
                  alt="User Avatar"
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 bg-white"
                />
                <div>
                  <button
                    type="button"
                    onClick={() => userPhotoInputRef.current?.click()}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>อัปโหลดรูปประจำตัว</span>
                  </button>
                  <input
                    ref={userPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">รองรับ JPG/PNG</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ใช้งาน (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น 1209, 5106"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {editingUser ? 'รหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)' : 'รหัสผ่านเริ่มต้น *'}
                    </label>
                    {editingUser?.password && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        เดิม: {editingUser.password}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showEditUserPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={editingUser ? `รหัสเดิม: ${editingUser.password || '123456'} (หรือพิมพ์ใหม่)` : '123456'}
                      className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showEditUserPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showEditUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Title Prefix */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    คำนำหน้าชื่อ
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว', 'นาง', 'ครู'].includes(titlePrefix) ? titlePrefix : 'other'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== 'other') {
                          setTitlePrefix(val);
                          setFullName(`${val}${firstName} ${lastName}`.trim());
                        }
                      }}
                      className="w-28 px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                    >
                      <option value="เด็กชาย">เด็กชาย</option>
                      <option value="เด็กหญิง">เด็กหญิง</option>
                      <option value="นาย">นาย</option>
                      <option value="นางสาว">นางสาว</option>
                      <option value="นาง">นาง</option>
                      <option value="ครู">ครู</option>
                      <option value="other">ระบุเอง</option>
                    </select>
                    <input
                      type="text"
                      value={titlePrefix}
                      onChange={(e) => {
                        setTitlePrefix(e.target.value);
                        setFullName(`${e.target.value}${firstName} ${lastName}`.trim());
                      }}
                      placeholder="เช่น ด.ช., ผอ."
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อจริง (First Name) *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setFullName(`${titlePrefix ? titlePrefix : ''}${e.target.value} ${lastName}`.trim());
                    }}
                    placeholder="เช่น กานดา, สมชาย"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    นามสกุล (Last Name) *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setFullName(`${titlePrefix ? titlePrefix : ''}${firstName} ${e.target.value}`.trim());
                    }}
                    placeholder="เช่น ใจดี, ประชาสรรค์"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Full Name Display / Editable */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุลเต็ม (แสดงผลในระบบ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น เด็กหญิงกานดา ใจดี"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 font-semibold bg-slate-50"
                  />
                </div>

                {/* Role selection - only director can assign teacher/director */}
                {isDirector && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      บทบาทผู้ใช้ (Role)
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="student">นักเรียน (Student)</option>
                      <option value="teacher">ครูผู้สอน (Teacher)</option>
                      <option value="director">ผู้อำนวยการ (Director)</option>
                    </select>
                  </div>
                )}

                {role === 'student' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ระดับชั้น
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option value="ชั้นประถมศึกษาปีที่ 1">ชั้นประถมศึกษาปีที่ 1</option>
                        <option value="ชั้นประถมศึกษาปีที่ 2">ชั้นประถมศึกษาปีที่ 2</option>
                        <option value="ชั้นประถมศึกษาปีที่ 3">ชั้นประถมศึกษาปีที่ 3</option>
                        <option value="ชั้นประถมศึกษาปีที่ 4">ชั้นประถมศึกษาปีที่ 4</option>
                        <option value="ชั้นประถมศึกษาปีที่ 5">ชั้นประถมศึกษาปีที่ 5</option>
                        <option value="ชั้นประถมศึกษาปีที่ 6">ชั้นประถมศึกษาปีที่ 6</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ห้องเรียน
                      </label>
                      <input
                        type="text"
                        value={classRoom}
                        onChange={(e) => setClassRoom(e.target.value)}
                        placeholder="เช่น ชั้นประถมศึกษาปีที่ 1/1"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ตำแหน่ง / วิทยฐานะ
                      </label>
                      <input
                        type="text"
                        value={positionTitle}
                        onChange={(e) => setPositionTitle(e.target.value)}
                        placeholder="เช่น ครู คศ.2, ครูผู้ช่วย"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        กลุ่มงาน / ฝ่าย
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="เช่น ฝ่ายวิชาการ"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@kps.ac.th"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingUser ? 'บันทึกการแก้ไข' : 'บันทึกผู้ใช้'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================== */}
      {/* 3. IMPORT EXCEL MODAL */}
      {/* ============================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">นำเข้าข้อมูลผู้ใช้งานจากไฟล์ Excel</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-900">
                  <div className="font-bold">ต้องการแบบฟอร์มมาตรฐาน?</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    ดาวน์โหลดแม่แบบไฟล์ Excel เพื่อกรอกข้อมูลนักเรียนและบุคลากร
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadUserTemplate}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดแม่แบบ</span>
                </button>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">เลือกไฟล์ Excel (.xlsx หรือ .xls)</div>
                <p className="text-[11px] text-slate-400 mt-1">ไฟล์รายชื่อนักเรียนหรือบุคลากร</p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportFileChange}
                  className="mt-3 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Preview parsed users */}
              {parsedImportUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>ตัวอย่างข้อมูลที่ตรวจพบ ({parsedImportUsers.length} รายการ)</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">✓ พร้อมนำเข้าสู่ระบบ</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">ลำดับ</th>
                          <th className="py-2 px-2.5">รหัส/ผู้ใช้</th>
                          <th className="py-2 px-2.5">คำนำหน้า</th>
                          <th className="py-2 px-2.5">ชื่อ</th>
                          <th className="py-2 px-2.5">นามสกุล</th>
                          <th className="py-2 px-2.5">ชื่อ - นามสกุล</th>
                          <th className="py-2 px-2.5">บทบาท/ชั้น</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedImportUsers.slice(0, 15).map((u, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-2.5 text-slate-400 font-mono">{i + 1}</td>
                            <td className="py-2 px-2.5 font-mono font-bold text-slate-800">{u.username}</td>
                            <td className="py-2 px-2.5 text-slate-600">{u.titlePrefix || '-'}</td>
                            <td className="py-2 px-2.5 font-semibold text-slate-900">{u.firstName || '-'}</td>
                            <td className="py-2 px-2.5 font-semibold text-slate-900">{u.lastName || '-'}</td>
                            <td className="py-2 px-2.5 font-bold text-indigo-900">{u.fullName}</td>
                            <td className="py-2 px-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {u.role === 'teacher' ? 'ครูผู้สอน' : u.role === 'director' ? 'ผู้อำนวยการ' : `นักเรียน ${u.gradeLevel || ''}`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedImportUsers.length > 15 && (
                      <div className="p-2 bg-slate-50 text-center text-[11px] text-slate-500 border-t border-slate-100">
                        ...และอีก {parsedImportUsers.length - 15} รายการ
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  disabled={parsedImportUsers.length === 0}
                  onClick={handleConfirmImportUsers}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ยืนยันนำเข้า {parsedImportUsers.length} รายการ
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
