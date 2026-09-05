export type UserRole = 'director' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  titlePrefix?: string; // e.g. 'นาย', 'นางสาว', 'เด็กชาย', 'เด็กหญิง', 'ครู'
  firstName?: string;
  lastName?: string;
  role: UserRole;
  email?: string;
  phone?: string;
  gradeLevel?: string; // e.g. 'ชั้นประถมศึกษาปีที่ 1', 'ชั้นประถมศึกษาปีที่ 2', ..., 'ชั้นประถมศึกษาปีที่ 6'
  classRoom?: string; // e.g. 'ชั้นประถมศึกษาปีที่ 1/1', 'ห้อง 1'
  studentId?: string; // e.g. '1209'
  employeeId?: string; // e.g. '5106', 'DIR-4197'
  department?: string; // e.g. 'ฝ่ายวิชาการ', 'กลุ่มสาระการเรียนรู้'
  avatar?: string;
  positionTitle?: string; // e.g. 'ผู้อำนวยการโรงเรียน', 'ครู คศ.2', 'นักเรียนชั้น ป.1'
  active: boolean;
  createdAt: string;
}

export type QuestionType = 'choice_single' | 'choice_multiple' | 'true_false' | 'fill_blank' | 'short_essay';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[]; // ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง']
  correctAnswer: string | number | number[]; // index or string answer
  explanation?: string;
  points: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  gradeLevel: string;
  academicYear?: string;
  semester?: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercentage: number;
  randomizeQuestions: boolean;
  randomizeChoices: boolean;
  allowReviewAnswers: boolean;
  maxAttempts: number;
  startDate?: string;
  endDate?: string;
  status: 'published' | 'draft' | 'archived';
  questions: Question[];
  totalPoints: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface ExamAnswer {
  questionId: string;
  selectedAnswer: any;
  isCorrect?: boolean;
  pointsEarned: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  academicYear?: string;
  semester?: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  gradeLevel: string;
  classRoom: string;
  answers: Record<string, any>; // questionId -> answer
  itemResults: Record<string, { isCorrect: boolean; points: number }>;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
  tabSwitchCount?: number;
  attemptNumber: number;
}

export interface LessonAttachment {
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'image' | 'link' | 'video';
  size?: string;
}

export interface Lesson {
  id: string;
  title: string;
  order: number;
  type: 'text' | 'video' | 'document' | 'quiz';
  content: string;
  videoUrl?: string;
  durationMinutes?: number;
  attachments?: LessonAttachment[];
  completedStudentIds?: string[];
}

export interface CourseUnit {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  gradeLevel: string; // e.g. 'ม.1'
  subjectGroup: string; // e.g. 'วิทยาศาสตร์และเทคโนโลยี', 'คณิตศาสตร์', 'ภาษาไทย'
  description: string;
  teacherId: string;
  teacherName: string;
  coverImage?: string;
  units: CourseUnit[];
  enrolledStudentIds: string[];
  status: 'published' | 'draft';
  academicYear: string;
  semester: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  authorName: string;
  authorRole: UserRole;
  targetRole?: 'all' | 'teacher' | 'student';
  targetAudience?: 'all' | 'teachers' | 'students';
  priority?: 'normal' | 'urgent';
  category?: 'urgent' | 'exam' | 'general' | 'activity';
  isPinned?: boolean;
  createdAt: string;
}

export interface LineNotificationRecord {
  id: string;
  type: 'exam' | 'announcement' | 'custom' | 'urgent' | 'result';
  title: string;
  message: string;
  targetAudience: string;
  senderName: string;
  senderRole: UserRole;
  status: 'sent' | 'shared' | 'copied';
  sentAt: string;
  examId?: string;
  announcementId?: string;
  channelName?: string;
}

export interface SchoolInfo {
  schoolName: string;
  schoolSubName: string;
  academicYear: string;
  semester: string;
  directorName: string;
  directorTitle: string;
  logoUrl?: string;
  phone: string;
  email: string;
  address: string;
  lineNotifyToken?: string;
  lineNotifyEnabled?: boolean;
  lineNotifyGroupName?: string;
  lineNotifyCustomWebhook?: string;
}
