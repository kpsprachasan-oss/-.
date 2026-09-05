import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { User, Course, Exam, ExamSubmission, Announcement, SchoolInfo, LineNotificationRecord } from '../types';
import { initialUsers, initialCourses, initialExams, initialSubmissions, initialAnnouncements, initialSchoolInfo } from './seedData';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Connect to specific databaseId if provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const STORAGE_KEYS = {
  USERS: 'lms_kps_users_v7',
  COURSES: 'lms_kps_courses_v7',
  EXAMS: 'lms_kps_exams_v7',
  SUBMISSIONS: 'lms_kps_submissions_v7',
  ANNOUNCEMENTS: 'lms_kps_announcements_v7',
  SCHOOL_INFO: 'lms_kps_school_info_v7',
  LINE_NOTIFICATIONS: 'lms_kps_line_notifications_v7',
  IS_INITIALIZED: 'lms_kps_initialized_v7_academicyear',
};

// Helper for local caching to guarantee instant UI rendering and offline resilience
function getLocalStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }
}

// ----------------------------------------------------
// Firestore Sync & Service functions
// ----------------------------------------------------

export class LmsService {
  private static isFirestoreAvailable = true;

  // Initialize data in both Firestore and LocalStorage
  public static async initializeData(): Promise<void> {
    const alreadyInit = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);

    if (!alreadyInit) {
      setLocalStorage(STORAGE_KEYS.USERS, initialUsers);
      setLocalStorage(STORAGE_KEYS.COURSES, initialCourses);
      setLocalStorage(STORAGE_KEYS.EXAMS, initialExams);
      setLocalStorage(STORAGE_KEYS.SUBMISSIONS, initialSubmissions);
      setLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
      setLocalStorage(STORAGE_KEYS.SCHOOL_INFO, initialSchoolInfo);
      localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');

      // Attempt to seed Firestore in the background
      try {
        await this.syncAllToFirestore();
      } catch (err) {
        console.warn('Firestore seeding notice:', err);
      }
    } else {
      // Try to sync down from Firestore if remote data exists
      try {
        await this.fetchFromFirestore();
      } catch (err) {
        console.warn('Firestore fetch notice:', err);
      }
    }
  }

  // Push local seeds to Firestore
  public static async syncAllToFirestore(): Promise<void> {
    try {
      const users = this.getUsers();
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), u, { merge: true });
      }

      const courses = this.getCourses();
      for (const c of courses) {
        await setDoc(doc(db, 'courses', c.id), c, { merge: true });
      }

      const exams = this.getExams();
      for (const e of exams) {
        await setDoc(doc(db, 'exams', e.id), e, { merge: true });
      }

      const submissions = this.getSubmissions();
      for (const s of submissions) {
        await setDoc(doc(db, 'submissions', s.id), s, { merge: true });
      }

      const announcements = this.getAnnouncements();
      for (const a of announcements) {
        await setDoc(doc(db, 'announcements', a.id), a, { merge: true });
      }

      const schoolInfo = this.getSchoolInfo();
      await setDoc(doc(db, 'settings', 'schoolInfo'), schoolInfo, { merge: true });
    } catch (err) {
      console.warn('Sync to Firestore notice:', err);
    }
  }

  // Fetch Firestore documents and sync to local state
  public static async fetchFromFirestore(): Promise<void> {
    try {
      // Users
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        const remoteUsers: User[] = [];
        usersSnap.forEach((doc) => remoteUsers.push(doc.data() as User));
        if (remoteUsers.length > 0) setLocalStorage(STORAGE_KEYS.USERS, remoteUsers);
      }

      // Courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      if (!coursesSnap.empty) {
        const remoteCourses: Course[] = [];
        coursesSnap.forEach((doc) => remoteCourses.push(doc.data() as Course));
        if (remoteCourses.length > 0) setLocalStorage(STORAGE_KEYS.COURSES, remoteCourses);
      }

      // Exams
      const examsSnap = await getDocs(collection(db, 'exams'));
      if (!examsSnap.empty) {
        const remoteExams: Exam[] = [];
        examsSnap.forEach((doc) => remoteExams.push(doc.data() as Exam));
        if (remoteExams.length > 0) setLocalStorage(STORAGE_KEYS.EXAMS, remoteExams);
      }

      // Submissions
      const subSnap = await getDocs(collection(db, 'submissions'));
      if (!subSnap.empty) {
        const remoteSubs: ExamSubmission[] = [];
        subSnap.forEach((doc) => remoteSubs.push(doc.data() as ExamSubmission));
        if (remoteSubs.length > 0) setLocalStorage(STORAGE_KEYS.SUBMISSIONS, remoteSubs);
      }
    } catch (err) {
      console.warn('Firestore fetch catch:', err);
    }
  }

  // ---------------- Users ----------------
  public static getUsers(): User[] {
    return getLocalStorage<User[]>(STORAGE_KEYS.USERS, initialUsers);
  }

  public static async saveUser(user: User): Promise<void> {
    const list = this.getUsers();
    const index = list.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      list[index] = user;
    } else {
      list.unshift(user);
    }
    setLocalStorage(STORAGE_KEYS.USERS, list);

    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (e) {
      console.warn('Firestore saveUser error:', e);
    }
  }

  public static async deleteUser(userId: string): Promise<void> {
    const list = this.getUsers().filter((u) => u.id !== userId);
    setLocalStorage(STORAGE_KEYS.USERS, list);
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (e) {
      console.warn('Firestore deleteUser error:', e);
    }
  }

  public static async batchAddUsers(newUsers: User[]): Promise<void> {
    const current = this.getUsers();
    const map = new Map<string, User>();
    current.forEach((u) => map.set(u.id, u));
    newUsers.forEach((u) => map.set(u.id, u));

    const updated = Array.from(map.values());
    setLocalStorage(STORAGE_KEYS.USERS, updated);

    try {
      const batch = writeBatch(db);
      for (const u of newUsers) {
        batch.set(doc(db, 'users', u.id), u, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore batchAddUsers error:', e);
    }
  }

  // ---------------- Courses ----------------
  public static getCourses(): Course[] {
    return getLocalStorage<Course[]>(STORAGE_KEYS.COURSES, initialCourses);
  }

  public static async saveCourse(course: Course): Promise<void> {
    const list = this.getCourses();
    const idx = list.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      list[idx] = course;
    } else {
      list.unshift(course);
    }
    setLocalStorage(STORAGE_KEYS.COURSES, list);
    try {
      await setDoc(doc(db, 'courses', course.id), course, { merge: true });
    } catch (e) {
      console.warn('Firestore saveCourse error:', e);
    }
  }

  public static async deleteCourse(courseId: string): Promise<void> {
    const list = this.getCourses().filter((c) => c.id !== courseId);
    setLocalStorage(STORAGE_KEYS.COURSES, list);
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (e) {
      console.warn('Firestore deleteCourse error:', e);
    }
  }

  // ---------------- Exams ----------------
  public static getExams(): Exam[] {
    return getLocalStorage<Exam[]>(STORAGE_KEYS.EXAMS, initialExams);
  }

  public static async saveExam(exam: Exam): Promise<void> {
    const list = this.getExams();
    const idx = list.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      list[idx] = exam;
    } else {
      list.unshift(exam);
    }
    setLocalStorage(STORAGE_KEYS.EXAMS, list);
    try {
      await setDoc(doc(db, 'exams', exam.id), exam, { merge: true });
    } catch (e) {
      console.warn('Firestore saveExam error:', e);
    }
  }

  public static async deleteExam(examId: string): Promise<void> {
    const list = this.getExams().filter((e) => e.id !== examId);
    setLocalStorage(STORAGE_KEYS.EXAMS, list);
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (e) {
      console.warn('Firestore deleteExam error:', e);
    }
  }

  // ---------------- Submissions ----------------
  public static getSubmissions(): ExamSubmission[] {
    return getLocalStorage<ExamSubmission[]>(STORAGE_KEYS.SUBMISSIONS, initialSubmissions);
  }

  public static async saveSubmission(sub: ExamSubmission): Promise<void> {
    const list = this.getSubmissions();
    list.unshift(sub);
    setLocalStorage(STORAGE_KEYS.SUBMISSIONS, list);
    try {
      await setDoc(doc(db, 'submissions', sub.id), sub, { merge: true });
    } catch (e) {
      console.warn('Firestore saveSubmission error:', e);
    }
  }

  // ---------------- Announcements ----------------
  public static getAnnouncements(): Announcement[] {
    return getLocalStorage<Announcement[]>(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
  }

  public static async saveAnnouncement(ann: Announcement): Promise<void> {
    const list = this.getAnnouncements();
    const idx = list.findIndex((a) => a.id === ann.id);
    if (idx >= 0) {
      list[idx] = ann;
    } else {
      list.unshift(ann);
    }
    setLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    try {
      await setDoc(doc(db, 'announcements', ann.id), ann, { merge: true });
    } catch (e) {
      console.warn('Firestore saveAnnouncement error:', e);
    }
  }

  public static async deleteAnnouncement(annId: string): Promise<void> {
    const list = this.getAnnouncements().filter((a) => a.id !== annId);
    setLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, list);
    try {
      await deleteDoc(doc(db, 'announcements', annId));
    } catch (e) {
      console.warn('Firestore deleteAnnouncement error:', e);
    }
  }

  // ---------------- School Settings ----------------
  public static getSchoolInfo(): SchoolInfo {
    return getLocalStorage<SchoolInfo>(STORAGE_KEYS.SCHOOL_INFO, initialSchoolInfo);
  }

  public static async saveSchoolInfo(info: SchoolInfo): Promise<void> {
    setLocalStorage(STORAGE_KEYS.SCHOOL_INFO, info);
    try {
      await setDoc(doc(db, 'settings', 'schoolInfo'), info, { merge: true });
    } catch (e) {
      console.warn('Firestore saveSchoolInfo error:', e);
    }
  }

  // ---------------- LINE Notifications ----------------
  public static getLineNotifications(): LineNotificationRecord[] {
    const defaultList: LineNotificationRecord[] = [
      {
        id: 'ln-demo-1',
        type: 'exam',
        title: 'แจ้งเตือนการสอบวัดผลกลางภาค วิชาภาษาไทย (ท11101)',
        message: 'วิชา: ท11101 ภาษาไทยพื้นฐาน ป.1\nกำหนดการ: 15-20 ก.ค. 2568\nกรุณาเข้าทำแบบทดสอบให้ตรงเวลา',
        targetAudience: 'นักเรียนชั้นประถมศึกษาปีที่ 1',
        senderName: 'นายกล้านรงค์ ศิรินโรจน์',
        senderRole: 'teacher',
        status: 'sent',
        sentAt: '2026-08-27T09:30:00Z',
        channelName: 'LINE กลุ่ม ป.1/1 ประชาสัมพันธ์',
      },
      {
        id: 'ln-demo-2',
        type: 'announcement',
        title: 'ประกาศกำหนดการเปิดระบบทดสอบออนไลน์ ภาคเรียนที่ 1/2568',
        message: 'โรงเรียนบ้านคลองพลูประชาสรรค์ ขอแจ้งกำหนดการทดสอบและกิจกรรมการเรียนรู้แบบผสมผสาน',
        targetAudience: 'นักเรียนและผู้ปกครองทุกคน',
        senderName: 'นายไพบูลย์ วงค์เมืองคำ',
        senderRole: 'director',
        status: 'sent',
        sentAt: '2026-08-26T14:15:00Z',
        channelName: 'LINE แจ้งข่าวสารโรงเรียนบ้านคลองพลูประชาสรรค์',
      }
    ];
    return getLocalStorage<LineNotificationRecord[]>(STORAGE_KEYS.LINE_NOTIFICATIONS, defaultList);
  }

  public static async saveLineNotification(record: LineNotificationRecord): Promise<void> {
    const list = this.getLineNotifications();
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.unshift(record);
    }
    setLocalStorage(STORAGE_KEYS.LINE_NOTIFICATIONS, list);
    try {
      await setDoc(doc(db, 'line_notifications', record.id), record, { merge: true });
    } catch (e) {
      console.warn('Firestore saveLineNotification error:', e);
    }
  }

  public static async deleteLineNotification(id: string): Promise<void> {
    const list = this.getLineNotifications().filter((r) => r.id !== id);
    setLocalStorage(STORAGE_KEYS.LINE_NOTIFICATIONS, list);
    try {
      await deleteDoc(doc(db, 'line_notifications', id));
    } catch (e) {
      console.warn('Firestore deleteLineNotification error:', e);
    }
  }

  // Reset database back to default seed
  public static async resetToSeed(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.IS_INITIALIZED);
    await this.initializeData();
  }
}

export const lmsService = LmsService;
