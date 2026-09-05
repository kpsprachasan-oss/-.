import React, { useState } from 'react';
import { Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Plus,
  Pin,
  Trash2,
  Calendar,
  AlertCircle,
  Tag,
  CheckCircle,
  X,
  MessageSquare,
  Share2,
  Send
} from 'lucide-react';
import { shareToLineDirectly, formatAnnouncementMessage } from '../utils/lineNotify';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  onSaveAnnouncement: (announcement: Announcement) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onOpenLineNotify?: (type?: 'exam' | 'announcement' | 'custom' | 'result', examId?: string, announcementId?: string) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  announcements,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  onOpenLineNotify,
}) => {
  const { currentUser, schoolInfo } = useAuth();
  const isTeacherOrDirector = currentUser?.role === 'director' || currentUser?.role === 'teacher';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'urgent' | 'exam' | 'general' | 'activity'>('general');
  const [isPinned, setIsPinned] = useState(false);
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'teachers'>('all');
  const [notifyViaLine, setNotifyViaLine] = useState(true);

  const handleOpenCreate = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setIsPinned(false);
    setTargetAudience('all');
    setNotifyViaLine(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      category,
      isPinned,
      authorId: currentUser?.id || 'admin',
      authorName: currentUser?.fullName || 'ผู้ดูแลระบบ',
      authorRole: currentUser?.role || 'director',
      targetAudience,
      createdAt: new Date().toISOString(),
    };

    await onSaveAnnouncement(newAnnouncement);
    setIsModalOpen(false);

    // If teacher opted to push to LINE Notify immediately
    if (notifyViaLine && onOpenLineNotify) {
      onOpenLineNotify('announcement', undefined, newAnnouncement.id);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'urgent':
        return { label: 'ด่วนที่สุด', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'exam':
        return { label: 'กำหนดการสอบ', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'activity':
        return { label: 'กิจกรรมโรงเรียน', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'ข่าวทั่วไป', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ประกาศและข่าวสารโรงเรียน</h1>
          <p className="text-xs text-slate-500">
            แจ้งกำหนดการสอบ ปฏิทินวิชาการ และข่าวสารสำคัญสำหรับครูและนักเรียน
          </p>
        </div>

        {isTeacherOrDirector && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenLineNotify ? onOpenLineNotify('announcement') : undefined}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#06C755] hover:bg-[#05b34c] text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              ส่งแจ้งเตือน LINE Notify
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              เขียนประกาศใหม่
            </button>
          </div>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {sortedAnnouncements.map((ann) => {
          const badge = getCategoryBadge(ann.category);
          return (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl border transition-all bg-white shadow-xs ${
                ann.isPinned ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  {ann.isPinned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white flex items-center gap-1">
                      <Pin className="w-3 h-3" />
                      ปักหมุด
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    สำหรับ: {ann.targetAudience === 'all' ? 'ทุกคน' : ann.targetAudience === 'students' ? 'นักเรียน' : 'ครู'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isTeacherOrDirector && (
                    <>
                      <button
                        onClick={() => onOpenLineNotify ? onOpenLineNotify('announcement', undefined, ann.id) : undefined}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="ส่งการแจ้งเตือนเข้ากลุ่ม LINE"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#06C755]" />
                        <span>แจ้งเตือน LINE</span>
                      </button>
                      <button
                        onClick={() => {
                          const msg = formatAnnouncementMessage(ann, schoolInfo?.schoolName);
                          shareToLineDirectly(msg);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#06C755] rounded-lg hover:bg-emerald-50 transition-colors"
                        title="แชร์ตรงเข้า LINE App"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('คุณต้องการลบประกาศนี้ใช่หรือไม่?')) {
                            onDeleteAnnouncement(ann.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="ลบประกาศ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-slate-900 mb-2">{ann.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>ประกาศโดย: <span className="font-semibold text-slate-700">{ann.authorName}</span> ({ann.authorRole})</span>
                <span>{new Date(ann.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          );
        })}

        {announcements.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">ยังไม่มีประกาศข่าวสาร</h3>
            <p className="text-xs text-slate-400 mt-1">ประกาศสำคัญและกำหนดการสอบจะแสดงที่นี่</p>
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-base text-slate-900">เขียนประกาศข่าวสารใหม่</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">หัวข้อประกาศ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น กำหนดการสอบกลางภาค ประจำภาคเรียนที่ 1/2569"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">หมวดหมู่</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="general">ข่าวประชาสัมพันธ์ทั่วไป</option>
                    <option value="exam">กำหนดการสอบ / วิชาการ</option>
                    <option value="urgent">ด่วนที่สุด</option>
                    <option value="activity">กิจกรรมโรงเรียน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">กลุ่มเป้าหมาย</label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">ทุกคน (ครูและนักเรียน)</option>
                    <option value="students">เฉพาะนักเรียน</option>
                    <option value="teachers">เฉพาะครูและบุคลากร</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">เนื้อหาประกาศ *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="รายละเอียดประกาศ กำหนดเวลา และคำแนะนำ..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>ปักหมุดไว้บนสุดของหน้าประกาศ</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyViaLine}
                    onChange={(e) => setNotifyViaLine(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                    <MessageSquare className="w-3.5 h-3.5 text-[#06C755]" />
                    <span>ส่งแจ้งเตือนผ่าน LINE Notify ทันทีเมื่อบันทึกประกาศ</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
                >
                  เผยแพร่ประกาศ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
