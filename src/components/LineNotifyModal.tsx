import React, { useState, useEffect } from 'react';
import { Exam, Announcement, ExamSubmission, SchoolInfo, LineNotificationRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  formatExamLineMessage,
  formatAnnouncementLineMessage,
  formatCustomLineMessage,
  formatExamResultLineMessage,
  sendLineNotification,
  openLineShare,
  copyToClipboard,
} from '../utils/lineNotify';
import {
  Send,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  Bell,
  FileText,
  Calendar,
  Clock,
  Sparkles,
  Users,
  Settings,
  History,
  MessageSquare,
  Zap,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface LineNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  announcements: Announcement[];
  submissions: ExamSubmission[];
  initialType?: 'exam' | 'announcement' | 'custom' | 'result';
  initialExamId?: string;
  initialAnnouncementId?: string;
  onSaveNotificationHistory?: (record: LineNotificationRecord) => Promise<void>;
  notificationHistory?: LineNotificationRecord[];
  onOpenSettings?: () => void;
}

export const LineNotifyModal: React.FC<LineNotifyModalProps> = ({
  isOpen,
  onClose,
  exams,
  announcements,
  submissions,
  initialType = 'exam',
  initialExamId,
  initialAnnouncementId,
  onSaveNotificationHistory,
  notificationHistory = [],
  onOpenSettings,
}) => {
  const { currentUser, schoolInfo } = useAuth();

  const [activeTab, setActiveTab] = useState<'exam' | 'announcement' | 'custom' | 'result' | 'history'>(initialType);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || exams[0]?.id || '');
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string>(initialAnnouncementId || announcements[0]?.id || '');
  const [customNote, setCustomNote] = useState('');
  
  // Custom message form state
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customTarget, setCustomTarget] = useState('นักเรียนทุกระดับชั้น (ป.1 - ป.6)');

  // Feedback states
  const [isSending, setIsSending] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      if (initialType) setActiveTab(initialType);
      if (initialExamId) setSelectedExamId(initialExamId);
      if (initialAnnouncementId) setSelectedAnnouncementId(initialAnnouncementId);
      setFeedbackStatus(null);
      setCopied(false);
    }
  }, [isOpen, initialType, initialExamId, initialAnnouncementId]);

  if (!isOpen) return null;

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const activeAnnouncement = announcements.find((a) => a.id === selectedAnnouncementId) || announcements[0];

  // Generate Current Message Preview
  let currentPreviewMessage = '';
  if (activeTab === 'exam' && activeExam) {
    currentPreviewMessage = formatExamLineMessage(activeExam, schoolInfo, customNote);
  } else if (activeTab === 'announcement' && activeAnnouncement) {
    currentPreviewMessage = formatAnnouncementLineMessage(activeAnnouncement, schoolInfo, customNote);
  } else if (activeTab === 'custom') {
    currentPreviewMessage = formatCustomLineMessage(
      customTitle || 'แจ้งเตือนสำคัญจากคุณครู',
      customContent || 'ขอให้นักเรียนทุกคนเตรียมตัวสำหรับการเรียนการสอนและกิจกรรมในสัปดาห์นี้',
      customTarget,
      currentUser?.fullName || 'ครูผู้สอน',
      schoolInfo
    );
  } else if (activeTab === 'result' && activeExam) {
    currentPreviewMessage = formatExamResultLineMessage(activeExam, submissions, schoolInfo);
  }

  // Handle Direct Sending via API/Webhook
  const handleSendDirect = async () => {
    if (!currentPreviewMessage.trim()) return;

    setIsSending(true);
    setFeedbackStatus(null);

    const token = schoolInfo.lineNotifyToken;
    const webhookUrl = schoolInfo.lineNotifyCustomWebhook;

    const res = await sendLineNotification({
      message: currentPreviewMessage,
      token,
      webhookUrl,
    });

    setIsSending(false);

    if (res.success) {
      setFeedbackStatus({
        type: 'success',
        message: '✅ ส่งการแจ้งเตือนเข้าสู่ระบบ LINE สำเร็จเรียบร้อย!',
      });

      // Record to history
      if (onSaveNotificationHistory) {
        const record: LineNotificationRecord = {
          id: `ln-${Date.now()}`,
          type: activeTab === 'result' ? 'result' : activeTab === 'exam' ? 'exam' : activeTab === 'announcement' ? 'announcement' : 'custom',
          title: activeTab === 'exam' ? `แจ้งเตือนการสอบ: ${activeExam?.title}` : activeTab === 'announcement' ? `ประกาศ: ${activeAnnouncement?.title}` : customTitle || 'ข้อความแจ้งเตือนด่วน',
          message: currentPreviewMessage,
          targetAudience: activeTab === 'exam' ? (activeExam?.gradeLevel || 'ทุกระดับชั้น') : activeTab === 'announcement' ? (activeAnnouncement?.targetAudience || 'ทุกคน') : customTarget,
          senderName: currentUser?.fullName || 'ผู้ดูแลระบบ',
          senderRole: currentUser?.role || 'teacher',
          status: 'sent',
          sentAt: new Date().toISOString(),
          examId: activeTab === 'exam' || activeTab === 'result' ? activeExam?.id : undefined,
          announcementId: activeTab === 'announcement' ? activeAnnouncement?.id : undefined,
          channelName: schoolInfo.lineNotifyGroupName || 'LINE Notify Official',
        };
        await onSaveNotificationHistory(record);
      }
    } else {
      setFeedbackStatus({
        type: 'info',
        message: `${res.message} (สามารถกด "แชร์ไปยัง LINE" หรือ "คัดลอกข้อความ" เพื่อส่งลงกลุ่มได้ทันที)`,
      });
    }
  };

  // Handle Share to LINE
  const handleShareToLine = async () => {
    if (!currentPreviewMessage.trim()) return;
    openLineShare(currentPreviewMessage);

    // Save record as shared
    if (onSaveNotificationHistory) {
      const record: LineNotificationRecord = {
        id: `ln-${Date.now()}`,
        type: activeTab === 'result' ? 'result' : activeTab === 'exam' ? 'exam' : activeTab === 'announcement' ? 'announcement' : 'custom',
        title: activeTab === 'exam' ? `แจ้งเตือนการสอบ: ${activeExam?.title}` : activeTab === 'announcement' ? `ประกาศ: ${activeAnnouncement?.title}` : customTitle || 'ข้อความแจ้งเตือนด่วน',
        message: currentPreviewMessage,
        targetAudience: activeTab === 'exam' ? (activeExam?.gradeLevel || 'ทุกระดับชั้น') : activeTab === 'announcement' ? (activeAnnouncement?.targetAudience || 'ทุกคน') : customTarget,
        senderName: currentUser?.fullName || 'ผู้ดูแลระบบ',
        senderRole: currentUser?.role || 'teacher',
        status: 'shared',
        sentAt: new Date().toISOString(),
        examId: activeTab === 'exam' || activeTab === 'result' ? activeExam?.id : undefined,
        announcementId: activeTab === 'announcement' ? activeAnnouncement?.id : undefined,
        channelName: 'LINE Share',
      };
      await onSaveNotificationHistory(record);
    }

    setFeedbackStatus({
      type: 'success',
      message: 'เปิดหน้าต่างแชร์ข้อความไปยังแอปพลิเคชัน LINE เรียบร้อยแล้ว',
    });
  };

  // Handle Copy Message
  const handleCopy = async () => {
    if (!currentPreviewMessage.trim()) return;
    const ok = await copyToClipboard(currentPreviewMessage);
    if (ok) {
      setCopied(true);
      setFeedbackStatus({
        type: 'success',
        message: 'คัดลอกข้อความพร้อมรูปแบบจัดหน้าเรียบร้อย สามารถนำไปวาง (Paste) ใน LINE กลุ่มได้ทันที',
      });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-[#06C755] to-teal-600 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">ส่งแจ้งเตือนผ่าน LINE Notify / LINE Alert</h2>
                <span className="bg-white/25 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  LMS Connect
                </span>
              </div>
              <p className="text-xs text-emerald-50">
                แจ้งเตือนกำหนดการสอบ ประกาศสำคัญ หรือส่งข้อความด่วนถึงนักเรียนและผู้ปกครองได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => { setActiveTab('exam'); setFeedbackStatus(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'exam'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              แจ้งเตือนการสอบ
            </button>

            <button
              onClick={() => { setActiveTab('announcement'); setFeedbackStatus(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'announcement'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              ประกาศสำคัญ
            </button>

            <button
              onClick={() => { setActiveTab('custom'); setFeedbackStatus(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              ข้อความด่วนกำหนดเอง
            </button>

            <button
              onClick={() => { setActiveTab('result'); setFeedbackStatus(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'result'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              สรุปผลการสอบ
            </button>

            <button
              onClick={() => { setActiveTab('history'); setFeedbackStatus(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              ประวัติการส่ง ({notificationHistory.length})
            </button>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              ตั้งค่า LINE Token
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {feedbackStatus && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                feedbackStatus.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : feedbackStatus.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {feedbackStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className="flex-1 leading-relaxed font-medium">{feedbackStatus.message}</span>
            </div>
          )}

          {activeTab === 'history' ? (
            /* History View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  บันทึกประวัติการส่งข้อความแจ้งเตือนล่าสุด
                </h3>
                <span className="text-xs text-slate-500">
                  ทั้งหมด {notificationHistory.length} รายการ
                </span>
              </div>

              {notificationHistory.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">ยังไม่มีประวัติการส่งข้อความ</p>
                  <p className="text-xs text-slate-400 mt-1">
                    เมื่อคุณกดส่งแจ้งเตือนการสอบหรือประกาศ ประวัติจะถูกบันทึกที่นี่โดยอัตโนมัติ
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {notificationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.type === 'exam'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : item.type === 'announcement'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : item.type === 'result'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {item.type === 'exam'
                              ? 'ข้อสอบ'
                              : item.type === 'announcement'
                              ? 'ประกาศ'
                              : item.type === 'result'
                              ? 'ผลสอบ'
                              : 'ข้อความด่วน'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                        </div>
                        <span className="text-[11px] text-slate-600 font-mono">
                          {new Date(item.sentAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <pre className="text-[11px] font-sans text-slate-600 bg-slate-50 p-2.5 rounded-lg whitespace-pre-wrap max-h-24 overflow-y-auto border border-slate-100">
                        {item.message}
                      </pre>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span>👤 ผู้ส่ง: <strong className="text-slate-700">{item.senderName}</strong></span>
                          <span>🎯 กลุ่ม: <strong className="text-slate-700">{item.targetAudience}</strong></span>
                        </div>
                        <button
                          onClick={() => {
                            copyToClipboard(item.message);
                            setFeedbackStatus({
                              type: 'success',
                              message: 'คัดลอกข้อความจากประวัติเรียบร้อยแล้ว',
                            });
                          }}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          คัดลอกซ้ำ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Composer & Preview Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-6 space-y-4">
                
                {/* 1. Exam Selection */}
                {activeTab === 'exam' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        เลือกชุดข้อสอบที่ต้องการแจ้งเตือน:
                      </label>
                      <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        {exams.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            [{ex.gradeLevel || 'ทั่วไป'}] {ex.courseCode} - {ex.title} ({ex.questions.length} ข้อ / {ex.totalPoints} คะแนน)
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeExam && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                        <div><strong className="text-slate-800">วิชา:</strong> {activeExam.courseCode} {activeExam.courseName}</div>
                        <div><strong className="text-slate-800">ระดับชั้น:</strong> {activeExam.gradeLevel || 'ทุกระดับชั้น'}</div>
                        <div><strong className="text-slate-800">ระยะเวลาทำข้อสอบ:</strong> {activeExam.timeLimitMinutes} นาที</div>
                        <div><strong className="text-slate-800">เกณฑ์การผ่าน:</strong> {activeExam.passingScorePercentage}% ({Math.ceil((activeExam.totalPoints * activeExam.passingScorePercentage) / 100)} คะแนน)</div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ข้อความกำกับหรือคำสั่งเพิ่มเติมจากครู (ถ้ามี):
                      </label>
                      <textarea
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="เช่น ให้นักเรียนเตรียมสมุดทดเลข หรือ ให้ส่งก่อนเวลา 16.30 น."
                        rows={2}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Announcement Selection */}
                {activeTab === 'announcement' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        เลือกประกาศที่ต้องการบรอดแคสต์:
                      </label>
                      <select
                        value={selectedAnnouncementId}
                        onChange={(e) => setSelectedAnnouncementId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        {announcements.map((ann) => (
                          <option key={ann.id} value={ann.id}>
                            [{ann.category === 'urgent' ? 'ด่วนที่สุด' : ann.category === 'exam' ? 'สอบ' : 'ทั่วไป'}] {ann.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {activeAnnouncement && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                        <div><strong className="text-slate-800">หัวข้อ:</strong> {activeAnnouncement.title}</div>
                        <div><strong className="text-slate-800">ผู้ประกาศ:</strong> {activeAnnouncement.authorName}</div>
                        <div><strong className="text-slate-800">กลุ่มเป้าหมาย:</strong> {activeAnnouncement.targetAudience === 'all' ? 'ทุกคน' : activeAnnouncement.targetAudience === 'students' ? 'นักเรียน' : 'ครู'}</div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ข้อความเน้นย้ำเพิ่มเติม:
                      </label>
                      <textarea
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder="เช่น แจ้งให้นักเรียนรับทราบและกดไลก์/ตอบรับในกลุ่ม"
                        rows={2}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Custom Quick Alert */}
                {activeTab === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        หัวข้อเรื่อง / กิจกรรม:
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="เช่น แจ้งเตือนส่งใบงานวิชาคณิตศาสตร์, นัดหมายติวสอบออนไลน์"
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        กลุ่มเป้าหมาย / ห้องเรียน:
                      </label>
                      <select
                        value={customTarget}
                        onChange={(e) => setCustomTarget(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        <option value="นักเรียนทุกระดับชั้น (ป.1 - ป.6)">นักเรียนทุกระดับชั้น (ป.1 - ป.6)</option>
                        <option value="นักเรียนชั้นประถมศึกษาปีที่ 1 (ป.1)">นักเรียนชั้นประถมศึกษาปีที่ 1 (ป.1)</option>
                        <option value="นักเรียนชั้นประถมศึกษาปีที่ 2 (ป.2)">นักเรียนชั้นประถมศึกษาปีที่ 2 (ป.2)</option>
                        <option value="นักเรียนชั้นประถมศึกษาปีที่ 3 (ป.3)">นักเรียนชั้นประถมศึกษาปีที่ 3 (ป.3)</option>
                        <option value="นักเรียนชั้นประถมศึกษาปีที่ 4 (ป.4)">นักเรียนชั้นประถมศึกษาปีที่ 4 (ป.4)</option>
                        <option value="นักเรียนชั้นประถมศึกษาปีที่ 5 (ป.5)">นักเรียนชั้นประถมศึกษาปีที่ 5 (ป.5)</option>
                        <option value="นักเรียนชั้นประถมศึกษาปีที่ 6 (ป.6)">นักเรียนชั้นประถมศึกษาปีที่ 6 (ป.6)</option>
                        <option value="ผู้ปกครองและนักเรียนทุกคน">ผู้ปกครองและนักเรียนทุกคน</option>
                        <option value="คณะครูและบุคลากรโรงเรียน">คณะครูและบุคลากรโรงเรียน</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        เนื้อหาข้อความแจ้งเตือน:
                      </label>
                      <textarea
                        value={customContent}
                        onChange={(e) => setCustomContent(e.target.value)}
                        placeholder="ระบุข้อความที่ต้องการแจ้งเตือนนักเรียน..."
                        rows={4}
                        className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* 4. Exam Result Summary */}
                {activeTab === 'result' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        เลือกชุดข้อสอบที่ต้องการสรุปผล:
                      </label>
                      <select
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        {exams.map((ex) => {
                          const count = submissions.filter(s => s.examId === ex.id).length;
                          return (
                            <option key={ex.id} value={ex.id}>
                              [{ex.gradeLevel || 'ทั่วไป'}] {ex.courseCode} - {ex.title} (ส่งแล้ว {count} คน)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {activeExam && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                        <div className="font-bold text-slate-800">{activeExam.courseCode} {activeExam.title}</div>
                        {(() => {
                          const examSubs = submissions.filter(s => s.examId === activeExam.id);
                          const total = examSubs.length;
                          const passed = examSubs.filter(s => s.passed).length;
                          const max = total > 0 ? Math.max(...examSubs.map(s => s.score)) : 0;
                          return (
                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                                <div className="text-[10px] text-slate-500">ผู้ส่งข้อสอบ</div>
                                <div className="text-sm font-bold text-indigo-600">{total} คน</div>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                                <div className="text-[10px] text-slate-500">ผ่านเกณฑ์</div>
                                <div className="text-sm font-bold text-emerald-600">{passed} คน</div>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                                <div className="text-[10px] text-slate-500">คะแนนสูงสุด</div>
                                <div className="text-sm font-bold text-amber-600">{max} / {activeExam.totalPoints}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Token Configuration Status Card */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs space-y-1 text-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      สถานะการเชื่อมต่อ LINE
                    </div>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                      {schoolInfo.lineNotifyToken ? 'Token พร้อมใช้งาน' : 'พร้อมส่งผ่าน LINE Share'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    ช่องทาง: <strong>{schoolInfo.lineNotifyGroupName || 'LINE กลุ่มโรงเรียนบ้านคลองพลูประชาสรรค์'}</strong>
                  </p>
                </div>

              </div>

              {/* Right Column: Live LINE Chat Bubble Preview */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#06C755] animate-pulse"></span>
                    ตัวอย่างข้อความจริงในแอป LINE:
                  </label>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-slate-600 hover:text-emerald-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}
                  </button>
                </div>

                {/* Smartphone LINE Chat Screen Mockup */}
                <div className="flex-1 bg-[#849EB8] p-4 rounded-2xl border border-slate-300 shadow-inner flex flex-col justify-start relative overflow-hidden min-h-[340px]">
                  
                  {/* Chat Header Bar */}
                  <div className="bg-[#2C3E50]/80 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl mb-3 flex items-center justify-between">
                    <span>LINE Notify Bot</span>
                    <span className="text-[10px] text-slate-300">
                      {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div className="flex items-start gap-2.5 max-w-[95%] self-start animate-fadeIn">
                    <div className="w-8 h-8 rounded-full bg-[#06C755] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-1">
                      LINE
                    </div>

                    <div className="bg-white text-slate-800 rounded-2xl rounded-tl-xs p-3.5 shadow-md text-xs space-y-1.5 border border-slate-100 max-w-full">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-[11px] font-bold text-emerald-800">
                        <span>LINE Notify</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-slate-800 break-words">
                        {currentPreviewMessage}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        {activeTab !== 'history' && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>ส่งแจ้งเตือนทันทีไปยังกลุ่มแชตนักเรียนและผู้ปกครอง</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                {copied ? 'คัดลอกเรียบร้อย' : 'คัดลอกข้อความ'}
              </button>

              <button
                onClick={handleShareToLine}
                className="px-4 py-2 bg-[#06C755] hover:bg-[#05b34c] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                แชร์ไปยัง LINE กลุ่ม
              </button>

              {schoolInfo.lineNotifyToken && (
                <button
                  onClick={handleSendDirect}
                  disabled={isSending}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  {isSending ? 'กำลังส่งข้อมูล...' : 'ส่งผ่าน LINE Notify Token'}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
