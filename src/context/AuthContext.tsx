import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SchoolInfo } from '../types';
import { LmsService } from '../lib/firebase';
import { initialUsers, initialSchoolInfo } from '../lib/seedData';

interface AuthContextType {
  currentUser: User | null;
  schoolInfo: SchoolInfo;
  users: User[];
  selectedAcademicYear: string;
  selectedSemester: string;
  setAcademicYearAndSemester: (year: string, semester: string) => void;
  login: (username: string, password?: string, academicYear?: string, semester?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchUser: (user: User) => void;
  changePassword: (userId: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<boolean>;
  updateSchoolInfo: (info: SchoolInfo) => Promise<void>;
  refreshAllData: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(initialSchoolInfo);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(true);

  // Selected Academic Year & Semester (Default starting at 2568 ภาคเรียนที่ 1)
  const [selectedAcademicYear, setSelectedAcademicYearState] = useState<string>(() => {
    return localStorage.getItem('lms_selected_academic_year') || initialSchoolInfo.academicYear || '2568';
  });
  const [selectedSemester, setSelectedSemesterState] = useState<string>(() => {
    return localStorage.getItem('lms_selected_semester') || initialSchoolInfo.semester || '1';
  });

  const setAcademicYearAndSemester = (year: string, semester: string) => {
    setSelectedAcademicYearState(year);
    setSelectedSemesterState(semester);
    localStorage.setItem('lms_selected_academic_year', year);
    localStorage.setItem('lms_selected_semester', semester);
    setSchoolInfo((prev) => ({
      ...prev,
      academicYear: year,
      semester: semester,
    }));
  };

  const refreshAllData = async () => {
    try {
      await LmsService.initializeData();
      const currentUsers = LmsService.getUsers();
      setUsers(currentUsers);
      const info = LmsService.getSchoolInfo();
      
      // Merge with persisted academic year if set
      const savedYear = localStorage.getItem('lms_selected_academic_year') || info.academicYear || '2568';
      const savedSem = localStorage.getItem('lms_selected_semester') || info.semester || '1';
      setSelectedAcademicYearState(savedYear);
      setSelectedSemesterState(savedSem);
      
      setSchoolInfo({
        ...info,
        academicYear: savedYear,
        semester: savedSem,
      });

      // Keep current user updated
      const savedUserId = localStorage.getItem('lms_current_user_id');
      if (savedUserId) {
        const found = currentUsers.find((u) => u.id === savedUserId);
        if (found) {
          setCurrentUser(found);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('lms_current_user_id');
        }
      }
    } catch (e) {
      console.error('Error refreshing data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const login = async (
    username: string,
    password?: string,
    academicYear?: string,
    semester?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const allUsers = LmsService.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const user = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername || (u.studentId && u.studentId.toLowerCase() === cleanUsername)
    );

    if (!user) {
      return { success: false, message: 'ไม่พบชื่อผู้ใช้หรือรหัสนักเรียนนี้ในระบบ' };
    }

    if (!user.active) {
      return { success: false, message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    // Apply chosen Academic Year & Semester if provided
    if (academicYear) {
      const year = academicYear;
      const sem = semester || '1';
      setSelectedAcademicYearState(year);
      setSelectedSemesterState(sem);
      localStorage.setItem('lms_selected_academic_year', year);
      localStorage.setItem('lms_selected_semester', sem);
      setSchoolInfo((prev) => ({
        ...prev,
        academicYear: year,
        semester: sem,
      }));
    }

    setCurrentUser(user);
    localStorage.setItem('lms_current_user_id', user.id);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lms_current_user_id');
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('lms_current_user_id', user.id);
  };

  // Rule: Teachers can ONLY reset passwords for students. Directors can reset for all. Users can change their own.
  const changePassword = async (
    userId: string,
    newPass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const allUsers = LmsService.getUsers();
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'ไม่พบผู้ใช้งานเป้าหมาย' };

    // Permission checks
    if (currentUser) {
      const isSelf = currentUser.id === userId;
      const isDirector = currentUser.role === 'director';
      const isTeacher = currentUser.role === 'teacher';

      if (!isSelf && !isDirector) {
        if (isTeacher && target.role !== 'student') {
          return {
            success: false,
            message: 'ไม่อนุญาต: ครูผู้สอนสามารถรีเซ็ตรหัสผ่านได้เฉพาะนักเรียนเท่านั้น',
          };
        }
        if (!isTeacher) {
          return {
            success: false,
            message: 'ไม่อนุญาต: คุณไม่มีสิทธิ์ในการรีเซ็ตรหัสผ่านของผู้ใช้งานรายอื่น',
          };
        }
      }
    }

    const updated = { ...target, password: newPass };
    await LmsService.saveUser(updated);
    await refreshAllData();
    return { success: true };
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    const allUsers = LmsService.getUsers();
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return false;

    const updated = { ...target, ...updates };
    await LmsService.saveUser(updated);
    await refreshAllData();
    return true;
  };

  const updateSchoolInfo = async (info: SchoolInfo) => {
    await LmsService.saveSchoolInfo(info);
    setSchoolInfo(info);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        schoolInfo,
        users,
        selectedAcademicYear,
        selectedSemester,
        setAcademicYearAndSemester,
        login,
        logout,
        switchUser,
        changePassword,
        updateUserProfile,
        updateSchoolInfo,
        refreshAllData,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
