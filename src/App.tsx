import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LmsService } from './lib/firebase';
import { Course, Exam, ExamSubmission, Announcement, User } from './types';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CoursesView } from './components/CoursesView';
import { ExamsView } from './components/ExamsView';
import { AnalyticsComparisonView } from './components/AnalyticsComparisonView';
import { UsersView } from './components/UsersView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { ExamTakingModal } from './components/ExamTakingModal';
import { PrintReportView } from './components/PrintReportView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { LineNotifyModal } from './components/LineNotifyModal';

const LMSApp: React.FC = () => {
  const { currentUser, users, schoolInfo, isLoading: isAuthLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Active Overlays / Modals
  const [activeTakingExam, setActiveTakingExam] = useState<Exam | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    reportType?: 'class_summary' | 'student_transcript';
    examId?: string;
    studentId?: string;
    classRoom?: string;
  }>({
    isOpen: false,
  });
  const [lineNotifyModalState, setLineNotifyModalState] = useState<{
    isOpen: boolean;
    type?: 'exam' | 'announcement' | 'custom' | 'result';
    examId?: string;
    announcementId?: string;
  }>({
    isOpen: false,
    type: 'exam',
  });

  const handleOpenPrintModal = (
    examId?: string,
    studentId?: string,
    reportType?: 'class_summary' | 'student_transcript'
  ) => {
    setPrintModalState({
      isOpen: true,
      reportType: reportType || 'class_summary',
      examId,
      studentId,
    });
  };

  const handleOpenLineNotify = (
    type?: 'exam' | 'announcement' | 'custom' | 'result',
    examId?: string,
    announcementId?: string
  ) => {
    setLineNotifyModalState({
      isOpen: true,
      type: type || 'exam',
      examId,
      announcementId,
    });
  };

  // Load initial data
  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [crs, exs, subs, anns] = await Promise.all([
        LmsService.getCourses(),
        LmsService.getExams(),
        LmsService.getSubmissions(),
        LmsService.getAnnouncements(),
      ]);
      setCourses(crs);
      setExams(exs);
      setSubmissions(subs);
      setAnnouncements(anns);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers for Course CRUD
  const handleSaveCourse = async (course: Course) => {
    await LmsService.saveCourse(course);
    const updated = await LmsService.getCourses();
    setCourses(updated);
  };

  const handleDeleteCourse = async (courseId: string) => {
    await LmsService.deleteCourse(courseId);
    const updated = await LmsService.getCourses();
    setCourses(updated);
  };

  // Handlers for Exam CRUD
  const handleSaveExam = async (exam: Exam) => {
    await LmsService.saveExam(exam);
    const updated = await LmsService.getExams();
    setExams(updated);
  };

  const handleDeleteExam = async (examId: string) => {
    await LmsService.deleteExam(examId);
    const updated = await LmsService.getExams();
    setExams(updated);
  };

  // Handler for Exam Submission
  const handleSubmitExam = async (submission: ExamSubmission) => {
    await LmsService.saveSubmission(submission);
    const updated = await LmsService.getSubmissions();
    setSubmissions(updated);
  };

  // Handlers for Announcements
  const handleSaveAnnouncement = async (announcement: Announcement) => {
    await LmsService.saveAnnouncement(announcement);
    const updated = await LmsService.getAnnouncements();
    setAnnouncements(updated);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await LmsService.deleteAnnouncement(id);
    const updated = await LmsService.getAnnouncements();
    setAnnouncements(updated);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-pulse text-sm font-medium">กำลังโหลดข้อมูลระบบ LMS-KPS...</div>
      </div>
    );
  }

  // If user is logged out, show the Login Screen
  if (!currentUser) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans">
      
      {/* Top Navigation */}
      <Navbar onOpenAiModal={() => setIsAiModalOpen(true)} />

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Left Sidebar Menu */}
        <Sidebar 
          activeTab={activeTab as any} 
          setActiveTab={(tab) => setActiveTab(tab)} 
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onOpenProfileUpload={() => setIsProfileModalOpen(true)}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 min-w-0">
          
          {activeTab === 'dashboard' && (
            <DashboardView
              courses={courses}
              exams={exams}
              submissions={submissions}
              users={users}
              announcements={announcements}
              setActiveTab={(tab) => setActiveTab(tab)}
              onNavigate={(tab) => setActiveTab(tab)}
              onTakeExam={(exam) => setActiveTakingExam(exam)}
              onOpenLineNotify={handleOpenLineNotify}
            />
          )}

          {activeTab === 'courses' && (
            <CoursesView
              courses={courses}
              onSaveCourse={handleSaveCourse}
              onDeleteCourse={handleDeleteCourse}
              onOpenAiModal={() => setIsAiModalOpen(true)}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsView
              exams={exams}
              courses={courses}
              submissions={submissions}
              onSaveExam={handleSaveExam}
              onDeleteExam={handleDeleteExam}
              onTakeExam={(exam) => setActiveTakingExam(exam)}
              onOpenAiModal={() => setIsAiModalOpen(true)}
              onOpenLineNotify={handleOpenLineNotify}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsComparisonView
              courses={courses}
              exams={exams}
              submissions={submissions}
              users={users}
              onOpenPrintModal={handleOpenPrintModal}
            />
          )}

          {activeTab === 'reports' && (
            <PrintReportView
              exams={exams}
              submissions={submissions}
              users={users}
              courses={courses}
              onClose={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'users' && (
            <UsersView onRefreshUsers={loadAllData} />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsView
              announcements={announcements}
              onSaveAnnouncement={handleSaveAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              onOpenLineNotify={handleOpenLineNotify}
            />
          )}

        </main>
      </div>

      {/* Modal: Print Report / Transcript Modal Overlay */}
      {printModalState.isOpen && (
        <PrintReportView
          exams={exams}
          submissions={submissions}
          users={users}
          courses={courses}
          initialReportType={printModalState.reportType}
          initialExamId={printModalState.examId}
          initialStudentId={printModalState.studentId}
          initialClassRoom={printModalState.classRoom}
          onClose={() => setPrintModalState({ isOpen: false })}
        />
      )}

      {/* Modal: Taking Online Exam */}
      {activeTakingExam && (
        <ExamTakingModal
          exam={activeTakingExam}
          onClose={() => setActiveTakingExam(null)}
          onSubmitExam={handleSubmitExam}
        />
      )}

      {/* Modal: Profile Picture Upload / Account Settings */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab="profile"
      />

      {/* Modal: AI Assistant */}
      {isAiModalOpen && (
        <AiAssistantModal
          onClose={() => setIsAiModalOpen(false)}
          onApplyQuestions={(qs) => {
            alert(`นำเข้าข้อสอบจาก AI สำเร็จ ${qs.length} ข้อ`);
          }}
        />
      )}

      {/* Modal: LINE Notify Hub */}
      <LineNotifyModal
        isOpen={lineNotifyModalState.isOpen}
        onClose={() => setLineNotifyModalState(prev => ({ ...prev, isOpen: false }))}
        exams={exams}
        announcements={announcements}
        submissions={submissions}
        initialType={lineNotifyModalState.type}
        initialExamId={lineNotifyModalState.examId}
        initialAnnouncementId={lineNotifyModalState.announcementId}
        onOpenSettings={() => setIsProfileModalOpen(true)}
      />

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LMSApp />
    </AuthProvider>
  );
}
