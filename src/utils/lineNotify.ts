import { Exam, Announcement, ExamSubmission, SchoolInfo, LineNotificationRecord } from '../types';

/**
 * Format Exam Notification for LINE
 */
export function formatExamLineMessage(
  exam: Exam,
  schoolInfo?: Partial<SchoolInfo> | null,
  customNote?: string
): string {
  const schoolName = schoolInfo?.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  let msg = `\n📝 [แจ้งเตือนการสอบออนไลน์]\n`;
  msg += `🏫 ${schoolName}\n`;
  msg += `─────────────────────\n`;
  msg += `📚 วิชา: ${exam.courseCode} ${exam.courseName}\n`;
  msg += `🎯 ข้อสอบ: ${exam.title}\n`;
  msg += `🎒 ระดับชั้น: ${exam.gradeLevel || 'ทุกระดับชั้น'}\n`;
  msg += `⏱️ เวลาสอบ: ${exam.timeLimitMinutes} นาที\n`;
  msg += `💯 คะแนนเต็ม: ${exam.totalPoints} คะแนน (เกณฑ์ผ่าน ${exam.passingScorePercentage}%)\n`;
  if (exam.startDate || exam.endDate) {
    msg += `📅 กำหนดการ: ${exam.startDate || 'เปิดสอบแล้ว'} ถึง ${exam.endDate || 'จนกว่าจะปิดระบบ'}\n`;
  }
  msg += `👨‍🏫 ครูผู้สอน: ${exam.createdByName || 'ครูประจำวิชา'}\n`;
  
  if (customNote && customNote.trim()) {
    msg += `─────────────────────\n`;
    msg += `📌 ข้อความเพิ่มเติม: ${customNote.trim()}\n`;
  }

  msg += `─────────────────────\n`;
  msg += `👉 ให้นักเรียนเข้าทำแบบทดสอบผ่านระบบ LMS:\n`;
  msg += `🔗 ${appUrl}\n`;
  msg += `⏰ โปรดเข้าทำข้อสอบให้ตรงเวลาที่กำหนด`;

  return msg;
}

/**
 * Convenience alias for formatExamLineMessage
 */
export function formatExamMessage(
  exam: Exam,
  schoolName?: string,
  customNote?: string
): string {
  return formatExamLineMessage(exam, { schoolName: schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์' } as SchoolInfo, customNote);
}

/**
 * Format Announcement Notification for LINE
 */
export function formatAnnouncementLineMessage(
  announcement: Announcement,
  schoolInfo?: Partial<SchoolInfo> | null,
  customNote?: string
): string {
  const schoolName = schoolInfo?.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  let categoryLabel = 'ข่าวประชาสัมพันธ์';
  if (announcement.category === 'urgent') categoryLabel = '🚨 ข่าวด่วนที่สุด';
  if (announcement.category === 'exam') categoryLabel = '📝 กำหนดการสอบ';
  if (announcement.category === 'activity') categoryLabel = '🎪 กิจกรรมโรงเรียน';

  let targetLabel = 'นักเรียนและผู้ปกครองทุกคน';
  if (announcement.targetAudience === 'students') targetLabel = 'นักเรียนทุกระดับชั้น';
  if (announcement.targetAudience === 'teachers') targetLabel = 'คณะครูและบุคลากร';

  let msg = `\n📢 [ประกาศสำคัญจากโรงเรียน]\n`;
  msg += `🏫 ${schoolName}\n`;
  msg += `─────────────────────\n`;
  msg += `🏷️ หมวดหมู่: ${categoryLabel}\n`;
  msg += `📌 เรื่อง: ${announcement.title}\n`;
  msg += `👥 ถึง: ${targetLabel}\n`;
  msg += `👤 ผู้ประกาศ: ${announcement.authorName}\n`;
  msg += `─────────────────────\n`;
  msg += `📄 รายละเอียด:\n${announcement.content}\n`;

  if (customNote && customNote.trim()) {
    msg += `─────────────────────\n`;
    msg += `📌 หมายเหตุ: ${customNote.trim()}\n`;
  }

  msg += `─────────────────────\n`;
  msg += `🔗 อ่านเพิ่มเติมและเข้าสู่ระบบ:\n`;
  msg += `🌐 ${appUrl}`;

  return msg;
}

/**
 * Convenience alias for formatAnnouncementLineMessage
 */
export function formatAnnouncementMessage(
  announcement: Announcement,
  schoolName?: string,
  customNote?: string
): string {
  return formatAnnouncementLineMessage(announcement, { schoolName: schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์' } as SchoolInfo, customNote);
}

/**
 * Format Custom Reminder / Broadcast for LINE
 */
export function formatCustomLineMessage(
  title: string,
  content: string,
  targetAudience: string,
  senderName: string,
  schoolInfo: SchoolInfo
): string {
  const schoolName = schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const appUrl = window.location.origin;
  const nowStr = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });

  let msg = `\n⚡ [ข้อความแจ้งเตือนด่วน]\n`;
  msg += `🏫 ${schoolName}\n`;
  msg += `─────────────────────\n`;
  msg += `📌 เรื่อง: ${title}\n`;
  msg += `👥 กลุ่มเป้าหมาย: ${targetAudience}\n`;
  msg += `👨‍🏫 ผู้ส่ง: ${senderName}\n`;
  msg += `📅 วันที่แจ้ง: ${nowStr}\n`;
  msg += `─────────────────────\n`;
  msg += `💬 ข้อความ:\n${content}\n`;
  msg += `─────────────────────\n`;
  msg += `🔗 เข้าสู่ระบบ LMS: ${appUrl}`;

  return msg;
}

/**
 * Format Exam Result Summary for LINE
 */
export function formatExamResultLineMessage(
  exam: Exam,
  submissions: ExamSubmission[],
  schoolInfo: SchoolInfo
): string {
  const schoolName = schoolInfo.schoolName || 'โรงเรียนบ้านคลองพลูประชาสรรค์';
  const examSubs = submissions.filter((s) => s.examId === exam.id);
  const totalStudents = examSubs.length;
  const passedStudents = examSubs.filter((s) => s.passed).length;
  const passRate = totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0;
  const avgScore = totalStudents > 0
    ? (examSubs.reduce((acc, s) => acc + s.score, 0) / totalStudents).toFixed(1)
    : '0';
  const maxScore = totalStudents > 0 ? Math.max(...examSubs.map((s) => s.score)) : 0;

  let msg = `\n📊 [สรุปผลการทดสอบออนไลน์]\n`;
  msg += `🏫 ${schoolName}\n`;
  msg += `─────────────────────\n`;
  msg += `📚 วิชา: ${exam.courseCode} ${exam.courseName}\n`;
  msg += `🎯 ชุดข้อสอบ: ${exam.title}\n`;
  msg += `🎒 ระดับชั้น: ${exam.gradeLevel || 'ทุกระดับชั้น'}\n`;
  msg += `─────────────────────\n`;
  msg += `👥 จำนวนผู้ส่งข้อสอบ: ${totalStudents} คน\n`;
  msg += `✅ ผ่านเกณฑ์: ${passedStudents} คน (${passRate}%)\n`;
  msg += `🏆 คะแนนสูงสุด: ${maxScore} / ${exam.totalPoints} คะแนน\n`;
  msg += `📈 คะแนนเฉลี่ย: ${avgScore} / ${exam.totalPoints} คะแนน\n`;
  msg += `─────────────────────\n`;
  msg += `🔍 นักเรียนสามารถตรวจสอบคะแนนและเฉลยรายข้อได้ที่ระบบ LMS`;

  return msg;
}

/**
 * Send notification to LINE Notify API or Webhook
 */
export async function sendLineNotification(params: {
  message: string;
  token?: string;
  webhookUrl?: string;
}): Promise<{ success: boolean; method: 'direct' | 'webhook' | 'shared' | 'error'; message: string }> {
  const { message, token, webhookUrl } = params;

  // 1. Try Custom Webhook if provided
  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          message: message,
          text: message,
          timestamp: new Date().toISOString(),
        }),
      });
      if (resp.ok) {
        return {
          success: true,
          method: 'webhook',
          message: 'ส่งข้อความผ่าน Webhook สำเร็จเรียบร้อย',
        };
      }
    } catch (e) {
      console.warn('Webhook error:', e);
    }
  }

  // 2. Direct LINE Notify API dispatch
  if (token && token.trim()) {
    try {
      // Direct call to LINE Notify API
      const formData = new URLSearchParams();
      formData.append('message', message);

      const resp = await fetch('https://notify-api.line.me/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: formData.toString(),
      });

      if (resp.ok) {
        return {
          success: true,
          method: 'direct',
          message: 'ส่งแจ้งเตือนเข้า LINE Notify สำเร็จเรียบร้อย',
        };
      } else {
        const errJson = await resp.json().catch(() => ({}));
        return {
          success: false,
          method: 'error',
          message: `LINE Notify ตอบกลับ: ${errJson.message || resp.statusText} (${resp.status})`,
        };
      }
    } catch (err: any) {
      // In web browser, direct calls to notify-api.line.me may be blocked by CORS policy.
      // We gracefully report and offer Line Share fallback.
      return {
        success: false,
        method: 'error',
        message: 'เบราว์เซอร์ติด CORS หรือไม่สามารถเชื่อมต่อ LINE Notify ได้โดยตรง กรุณาใช้ปุ่ม "แชร์ไปยัง LINE" หรือ "คัดลอกข้อความ"',
      };
    }
  }

  return {
    success: false,
    method: 'error',
    message: 'ยังไม่ได้ระบุ LINE Notify Token กรุณาตั้งค่าในข้อมูลโรงเรียน หรือใช้ปุ่ม "แชร์ไปยัง LINE"',
  };
}

/**
 * Open LINE Social Share with prefilled text
 */
export function openLineShare(message: string): void {
  const encoded = encodeURIComponent(message.trim());
  const lineUrl = `https://line.me/R/msg/text/?${encoded}`;
  window.open(lineUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Convenience alias for openLineShare
 */
export const shareToLineDirectly = openLineShare;

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}
