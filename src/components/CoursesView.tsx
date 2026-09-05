import React, { useState, useEffect } from 'react';
import { Course, User } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Layers,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  FileSpreadsheet,
  Sparkles,
  GraduationCap,
  Lock,
  AlertCircle
} from 'lucide-react';
import { CourseDetailModal } from './CourseDetailModal';
import { getStudentGrade, isSameGrade, canStudentAccessCourse } from '../utils/gradeHelper';

interface CoursesViewProps {
  courses: Course[];
  onSaveCourse: (course: Course) => Promise<void>;
  onDeleteCourse: (courseId: string) => Promise<void>;
  onOpenAiModal?: () => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({
  courses,
  onSaveCourse,
  onDeleteCourse,
  onOpenAiModal,
}) => {
  const { currentUser, users, schoolInfo } = useAuth();
  const isStudent = currentUser?.role === 'student';
  const isTeacherOrDirector = currentUser?.role === 'director' || currentUser?.role === 'teacher';
  const studentGrade = isStudent ? getStudentGrade(currentUser) : '';

  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    return isStudent && studentGrade ? studentGrade : 'all';
  });
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string>('');

  // Keep student grade locked if user is a student
  useEffect(() => {
    if (isStudent && studentGrade) {
      setSelectedGrade(studentGrade);
    }
  }, [isStudent, studentGrade]);

  // Create / Edit Course Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('ชั้นประถมศึกษาปีที่ 1');
  const [subjectGroup, setSubjectGroup] = useState('วิทยาศาสตร์และเทคโนโลยี');
  const [teacherId, setTeacherId] = useState(currentUser?.id || '');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const teachers = users.filter((u) => u.role === 'teacher' || u.role === 'director');

  const subjectGroups = [
    'วิทยาศาสตร์และเทคโนโลยี',
    'คณิตศาสตร์',
    'ภาษาไทย',
    'ภาษาต่างประเทศ',
    'สังคมศึกษา ศาสนา และวัฒนธรรม',
    'สุขศึกษาและพลศึกษา',
    'ศิลปะ',
    'การงานอาชีพ',
  ];

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setCode('');
    setName('');
    setGradeLevel('ชั้นประถมศึกษาปีที่ 1');
    setSubjectGroup('วิทยาศาสตร์และเทคโนโลยี');
    setTeacherId(currentUser?.id || teachers[0]?.id || '');
    setDescription('');
    setCoverImage('https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (c: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(c);
    setCode(c.code);
    setName(c.name);
    setGradeLevel(c.gradeLevel);
    setSubjectGroup(c.subjectGroup);
    setTeacherId(c.teacherId);
    setDescription(c.description);
    setCoverImage(c.coverImage || '');
    setIsEditModalOpen(true);
  };

  const handleSaveCourseForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const teacher = teachers.find((t) => t.id === teacherId);

    const newOrUpdated: Course = {
      id: editingCourse ? editingCourse.id : `crs-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      gradeLevel,
      subjectGroup,
      teacherId,
      teacherName: teacher ? teacher.fullName : 'ครูผู้สอน',
      description: description.trim(),
      coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600',
      status: 'published',
      academicYear: schoolInfo.academicYear,
      semester: schoolInfo.semester,
      units: editingCourse ? editingCourse.units : [],
      enrolledStudentIds: editingCourse ? editingCourse.enrolledStudentIds : [],
      createdAt: editingCourse ? editingCourse.createdAt : new Date().toISOString(),
    };

    await onSaveCourse(newOrUpdated);
    setIsEditModalOpen(false);
  };

  const handleDeleteCourseClick = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณต้องการลบรายวิชานี้ใช่หรือไม่?')) {
      await onDeleteCourse(courseId);
    }
  };

  const handleSelectCourse = (course: Course) => {
    if (isStudent && !canStudentAccessCourse(currentUser, course.gradeLevel, course.enrolledStudentIds)) {
      setAccessDeniedMessage(`ขออภัย คุณสามารถเข้าเรียนได้เฉพาะรายวิชาของระดับชั้น ${studentGrade || 'ตนเอง'} เท่านั้น`);
      return;
    }
    setAccessDeniedMessage('');
    setSelectedCourseForDetail(course);
  };

  const filteredCourses = courses.filter((c) => {
    // If user is student, strictly enforce their grade level
    if (isStudent && !canStudentAccessCourse(currentUser, c.gradeLevel, c.enrolledStudentIds)) {
      return false;
    }
    const matchesGrade = isStudent
      ? canStudentAccessCourse(currentUser, c.gradeLevel, c.enrolledStudentIds)
      : selectedGrade === 'all' || isSameGrade(c.gradeLevel, selectedGrade);
    const matchesGroup = selectedGroup === 'all' || c.subjectGroup === selectedGroup;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header with Search & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {isStudent ? 'รายวิชาเรียนออนไลน์ของฉัน' : 'จัดการรายวิชาและบทเรียนออนไลน์'}
            </h1>
            {isStudent && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                {studentGrade || currentUser?.classRoom || 'ระดับชั้นของฉัน'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStudent
              ? `เข้าเรียน ศึกษาบทเรียน และทำกิจกรรมการเรียนรู้สำหรับ ${studentGrade || 'ระดับชั้นของคุณ'}`
              : 'ระบบจัดการหลักสูตร เนื้อหา สื่อการสอน และติดตามการเรียนของนักเรียน'}
          </p>
        </div>

        {isTeacherOrDirector && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAiModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI ช่วยสร้างเนื้อหา
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              สร้างรายวิชาใหม่
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
              <span className="font-bold">ระดับชั้นของนักเรียน: </span>
              <span className="font-extrabold text-indigo-700">{studentGrade || 'ชั้นประถมศึกษา'}</span>
              <span className="text-slate-500 ml-1.5 text-[11px]">
                (ระบบจำกัดการเข้าถึงเฉพาะรายวิชาของระดับชั้นนี้เพื่อความถูกต้องตามหลักสูตร)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <Lock className="w-3 h-3" />
            <span>เฉพาะห้องเรียนตนเอง</span>
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
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหารหัสวิชา, ชื่อวิชา หรือชื่อครู..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
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
              <span className="text-slate-500 font-medium text-xs">ระดับชั้น:</span>
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

          {/* Group filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium text-xs">กลุ่มสาระฯ:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px]"
            >
              <option value="all">ทุกกลุ่มสาระฯ</option>
              {subjectGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="text-xs text-slate-500 font-medium">
          พบทั้งหมด <span className="font-bold text-slate-800">{filteredCourses.length}</span> รายวิชา
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCourses.map((course) => {
          const totalLessons = course.units.reduce((acc, u) => acc + u.lessons.length, 0);
          return (
            <div
              key={course.id}
              onClick={() => handleSelectCourse(course)}
              className="cursor-pointer group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Cover Image */}
                <div className="h-36 bg-slate-100 relative overflow-hidden">
                  <img
                    src={course.coverImage || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600'}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                      {course.code}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-600 text-white shadow-xs">
                      {course.gradeLevel}
                    </span>
                  </div>

                  {isTeacherOrDirector && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(course, e)}
                        className="p-1.5 rounded-lg bg-white/90 text-slate-700 hover:text-indigo-600 hover:bg-white shadow-xs backdrop-blur-xs"
                        title="แก้ไขข้อมูลวิชา"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCourseClick(course.id, e)}
                        className="p-1.5 rounded-lg bg-white/90 text-rose-600 hover:bg-rose-50 shadow-xs backdrop-blur-xs"
                        title="ลบรายวิชา"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info Body */}
                <div className="p-4">
                  <div className="text-[11px] font-semibold text-indigo-600 mb-1">
                    {course.subjectGroup}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {course.description || 'ไม่มีคำอธิบายรายวิชา'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-medium text-slate-700 truncate">{course.teacherName}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-medium text-[11px]">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {course.units.length} หน่วย ({totalLessons} บท)
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">
            {isStudent
              ? `ไม่พบรายวิชาสำหรับ ${studentGrade || 'ระดับชั้นของคุณ'}`
              : 'ไม่พบรายวิชาที่ตรงกับเงื่อนไข'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isStudent
              ? 'หากไม่พบรายวิชาที่ต้องการเรียน กรุณาติดต่อคุณครูผู้สอนหรือครูประจำชั้น'
              : 'ลองเปลี่ยนระดับชั้น กลุ่มสาระฯ หรือคำค้นหา'}
          </p>
        </div>
      )}

      {/* Course Detail / Syllabus Viewer Modal */}
      {selectedCourseForDetail && (
        <CourseDetailModal
          course={selectedCourseForDetail}
          onClose={() => setSelectedCourseForDetail(null)}
          onUpdateCourse={async (updated) => {
            await onSaveCourse(updated);
            setSelectedCourseForDetail(updated);
          }}
        />
      )}

      {/* Create / Edit Course Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">
                {editingCourse ? 'แก้ไขข้อมูลรายวิชา' : 'สร้างรายวิชาใหม่'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCourseForm} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสวิชา *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ว21101"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อรายวิชา *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น วิทยาศาสตร์พื้นฐาน 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ระดับชั้น</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">กลุ่มสาระการเรียนรู้</label>
                  <select
                    value={subjectGroup}
                    onChange={(e) => setSubjectGroup(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {subjectGroups.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ครูผู้สอนประจำวิชา</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.positionTitle || 'ครู'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ลิงก์รูปภาพหน้าปก</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">คำอธิบายรายวิชา</label>
                <textarea
                  rows={3}
                  placeholder="วัตถุประสงค์และสาระสำคัญของรายวิชา..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  บันทึกรายวิชา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
