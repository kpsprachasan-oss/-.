import React, { useState } from 'react';
import { Course, CourseUnit, Lesson, LessonAttachment } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Video,
  FileText,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Clock,
  Play,
  Save,
  Download
} from 'lucide-react';

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
  onUpdateCourse: (updated: Course) => Promise<void>;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  onUpdateCourse,
}) => {
  const { currentUser } = useAuth();
  const isTeacherOrDirector = currentUser?.role === 'director' || currentUser?.role === 'teacher';

  const [activeUnitId, setActiveUnitId] = useState<string>(course.units[0]?.id || '');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(
    course.units[0]?.lessons[0] || null
  );

  // Edit Unit State
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');

  // Edit Lesson State
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'text' | 'video' | 'document'>('text');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonDuration, setLessonDuration] = useState(45);

  const currentUnit = course.units.find((u) => u.id === activeUnitId) || course.units[0];

  const handleAddUnit = async () => {
    if (!newUnitTitle.trim()) return;
    const newUnit: CourseUnit = {
      id: `unit-${Date.now()}`,
      title: newUnitTitle.trim(),
      order: course.units.length + 1,
      lessons: [],
    };
    const updated: Course = {
      ...course,
      units: [...course.units, newUnit],
    };
    await onUpdateCourse(updated);
    setNewUnitTitle('');
    setIsAddingUnit(false);
    setActiveUnitId(newUnit.id);
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle.trim() || !currentUnit) return;

    let updatedUnits = [...course.units];
    const unitIdx = updatedUnits.findIndex((u) => u.id === currentUnit.id);
    if (unitIdx < 0) return;

    const newLessonObj: Lesson = {
      id: activeLesson ? activeLesson.id : `lsn-${Date.now()}`,
      title: lessonTitle.trim(),
      type: lessonType,
      order: activeLesson ? activeLesson.order : currentUnit.lessons.length + 1,
      content: lessonContent,
      videoUrl: lessonVideoUrl,
      durationMinutes: lessonDuration,
      attachments: activeLesson?.attachments || [],
      completedStudentIds: activeLesson?.completedStudentIds || [],
    };

    if (activeLesson) {
      // Edit existing
      const lsnIdx = updatedUnits[unitIdx].lessons.findIndex((l) => l.id === activeLesson.id);
      if (lsnIdx >= 0) {
        updatedUnits[unitIdx].lessons[lsnIdx] = newLessonObj;
      }
    } else {
      // Add new
      updatedUnits[unitIdx].lessons.push(newLessonObj);
    }

    const updatedCourse: Course = {
      ...course,
      units: updatedUnits,
    };

    await onUpdateCourse(updatedCourse);
    setActiveLesson(newLessonObj);
    setIsEditingLesson(false);
  };

  const handleMarkComplete = async (lessonId: string) => {
    if (!currentUser) return;
    let updatedUnits = [...course.units];
    updatedUnits = updatedUnits.map((u) => ({
      ...u,
      lessons: u.lessons.map((l) => {
        if (l.id === lessonId) {
          const completed = l.completedStudentIds || [];
          const exists = completed.includes(currentUser.id);
          const newCompleted = exists
            ? completed.filter((id) => id !== currentUser.id)
            : [...completed, currentUser.id];
          return { ...l, completedStudentIds: newCompleted };
        }
        return l;
      }),
    }));

    const updatedCourse: Course = { ...course, units: updatedUnits };
    await onUpdateCourse(updatedCourse);
    if (activeLesson && activeLesson.id === lessonId) {
      setActiveLesson({
        ...activeLesson,
        completedStudentIds: activeLesson.completedStudentIds?.includes(currentUser.id)
          ? activeLesson.completedStudentIds.filter((id) => id !== currentUser.id)
          : [...(activeLesson.completedStudentIds || []), currentUser.id],
      });
    }
  };

  const getEmbedYouTubeUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const isCompletedByMe = activeLesson?.completedStudentIds?.includes(currentUser?.id || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {course.code}
                </span>
                <span className="text-xs text-slate-500 font-medium">{course.gradeLevel}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{course.name}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left Sidebar: Units & Lessons List */}
          <div className="md:col-span-4 border-r border-slate-200 bg-slate-50/70 p-4 overflow-y-auto max-h-[400px] md:max-h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                โครงสร้างเนื้อหา ({course.units.length} หน่วย)
              </h3>
              {isTeacherOrDirector && (
                <button
                  onClick={() => setIsAddingUnit(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มหน่วย
                </button>
              )}
            </div>

            {isAddingUnit && (
              <div className="mb-3 p-3 bg-white rounded-xl border border-indigo-200 shadow-xs space-y-2">
                <label className="text-xs font-medium text-slate-700">ชื่อหน่วยการเรียนรู้</label>
                <input
                  type="text"
                  placeholder="เช่น หน่วยที่ 3: แรงและการเคลื่อนที่"
                  value={newUnitTitle}
                  onChange={(e) => setNewUnitTitle(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => setIsAddingUnit(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleAddUnit}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
                  >
                    บันทึกหน่วย
                  </button>
                </div>
              </div>
            )}

            {/* Units Accordion */}
            <div className="space-y-3">
              {course.units.map((unit, uIdx) => (
                <div key={unit.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <button
                    onClick={() => setActiveUnitId(unit.id)}
                    className={`w-full p-3 text-left flex items-center justify-between text-xs font-bold transition-colors ${
                      activeUnitId === unit.id ? 'bg-indigo-50/80 text-indigo-950' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="line-clamp-1">{unit.title}</span>
                    <span className="text-[10px] font-normal text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">
                      {unit.lessons.length} บท
                    </span>
                  </button>

                  {/* Lessons list */}
                  {activeUnitId === unit.id && (
                    <div className="p-2 border-t border-slate-100 space-y-1 bg-slate-50/40">
                      {unit.lessons.map((lesson) => {
                        const isDone = lesson.completedStudentIds?.includes(currentUser?.id || '');
                        const isSelected = activeLesson?.id === lesson.id;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => {
                              setActiveLesson(lesson);
                              setIsEditingLesson(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-medium shadow-xs'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {lesson.type === 'video' ? (
                                <Video className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>
                            {isDone && (
                              <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                            )}
                          </button>
                        );
                      })}

                      {isTeacherOrDirector && (
                        <button
                          onClick={() => {
                            setActiveLesson(null);
                            setLessonTitle('');
                            setLessonType('text');
                            setLessonContent('');
                            setLessonVideoUrl('');
                            setIsEditingLesson(true);
                          }}
                          className="w-full mt-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 text-center flex items-center justify-center gap-1 border border-indigo-200/50"
                        >
                          <Plus className="w-3 h-3" />
                          เพิ่มบทเรียนในหน่วยนี้
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Main Panel: Lesson Content Viewer / Editor */}
          <div className="md:col-span-8 p-6 overflow-y-auto flex flex-col justify-between">
            {isEditingLesson ? (
              /* Lesson Editor */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-base text-slate-900">
                    {activeLesson ? 'แก้ไขบทเรียน' : 'สร้างบทเรียนใหม่'}
                  </h3>
                  <button
                    onClick={() => setIsEditingLesson(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    ยกเลิก
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อบทเรียน</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="เช่น บทที่ 1: การจำแนกสารบริสุทธิ์"
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทสื่อ</label>
                    <select
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="text">บทความ / เอกสารคำสอน</option>
                      <option value="video">วิดีโอ YouTube บรรยาย</option>
                      <option value="document">ใบงาน / สื่อดาวน์โหลด</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ระยะเวลาเรียนโดยประมาณ (นาที)</label>
                    <input
                      type="number"
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {lessonType === 'video' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ลิงก์ YouTube Video</label>
                    <input
                      type="text"
                      value={lessonVideoUrl}
                      onChange={(e) => setLessonVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เนื้อหาบทเรียน (รองรับ Markdown)</label>
                  <textarea
                    rows={8}
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    placeholder="พิมพ์เนื้อหาการสอน หรือวางเนื้อหาที่นี่..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingLesson(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveLesson}
                    className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    บันทึกบทเรียน
                  </button>
                </div>
              </div>
            ) : activeLesson ? (
              /* Lesson Viewer */
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {currentUnit?.title}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activeLesson.durationMinutes || 45} นาที
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{activeLesson.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {isTeacherOrDirector && (
                      <button
                        onClick={() => {
                          setLessonTitle(activeLesson.title);
                          setLessonType(activeLesson.type);
                          setLessonContent(activeLesson.content);
                          setLessonVideoUrl(activeLesson.videoUrl || '');
                          setLessonDuration(activeLesson.durationMinutes || 45);
                          setIsEditingLesson(true);
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        แก้ไข
                      </button>
                    )}

                    <button
                      onClick={() => handleMarkComplete(activeLesson.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                        isCompletedByMe
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {isCompletedByMe ? 'เรียนจบแล้ว (เสร็จสมบูรณ์)' : 'บันทึกว่าเรียนแล้ว'}
                    </button>
                  </div>
                </div>

                {/* Video Embed if available */}
                {activeLesson.videoUrl && getEmbedYouTubeUrl(activeLesson.videoUrl) && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black shadow-md">
                    <iframe
                      src={getEmbedYouTubeUrl(activeLesson.videoUrl)!}
                      title={activeLesson.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Lesson Text Content */}
                <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed whitespace-pre-line bg-slate-50/40 p-5 rounded-2xl border border-slate-200">
                  {activeLesson.content || 'ไม่มีเนื้อหาในบทเรียนนี้'}
                </div>

                {/* Attachments & Downloads */}
                {activeLesson.attachments && activeLesson.attachments.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <h4 className="text-xs font-bold text-indigo-900 mb-2">เอกสารประกอบการเรียนและใบงาน</h4>
                    <div className="space-y-2">
                      {activeLesson.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-indigo-200/60 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-slate-800">{att.name}</span>
                            {att.size && <span className="text-slate-400 text-[10px]">({att.size})</span>}
                          </div>
                          <a
                            href={att.url}
                            className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            ดาวน์โหลด
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <BookOpen className="w-12 h-12 mb-2 text-slate-300" />
                <p className="text-sm">กรุณาเลือกบทเรียนจากแถบด้านซ้ายเพื่อเริ่มศึกษา</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
