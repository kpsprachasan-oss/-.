import { User } from '../types';

/**
 * Standard Thai Primary School Grade Levels (ป.1 - ป.6)
 */
export const PRIMARY_GRADE_LEVELS = [
  'ชั้นประถมศึกษาปีที่ 1',
  'ชั้นประถมศึกษาปีที่ 2',
  'ชั้นประถมศึกษาปีที่ 3',
  'ชั้นประถมศึกษาปีที่ 4',
  'ชั้นประถมศึกษาปีที่ 5',
  'ชั้นประถมศึกษาปีที่ 6',
] as const;

/**
 * Normalizes grade strings into canonical grade level names
 * e.g., "ป.1", "ประถมศึกษาปีที่ 1/1", "ชั้นประถมศึกษาปีที่ 1" -> "ชั้นประถมศึกษาปีที่ 1"
 */
export const normalizeGrade = (rawGrade?: string | null): string => {
  if (!rawGrade) return '';
  const text = rawGrade.trim();

  if (text.includes('1') && (text.includes('ป.') || text.includes('ประถม') || text.includes('ปีที่'))) {
    return 'ชั้นประถมศึกษาปีที่ 1';
  }
  if (text.includes('2') && (text.includes('ป.') || text.includes('ประถม') || text.includes('ปีที่'))) {
    return 'ชั้นประถมศึกษาปีที่ 2';
  }
  if (text.includes('3') && (text.includes('ป.') || text.includes('ประถม') || text.includes('ปีที่'))) {
    return 'ชั้นประถมศึกษาปีที่ 3';
  }
  if (text.includes('4') && (text.includes('ป.') || text.includes('ประถม') || text.includes('ปีที่'))) {
    return 'ชั้นประถมศึกษาปีที่ 4';
  }
  if (text.includes('5') && (text.includes('ป.') || text.includes('ประถม') || text.includes('ปีที่'))) {
    return 'ชั้นประถมศึกษาปีที่ 5';
  }
  if (text.includes('6') && (text.includes('ป.') || text.includes('ประถม') || text.includes('ปีที่'))) {
    return 'ชั้นประถมศึกษาปีที่ 6';
  }

  return text;
};

/**
 * Extracts student's primary canonical grade level from their user profile
 */
export const getStudentGrade = (user?: User | null): string => {
  if (!user) return '';
  if (user.gradeLevel) {
    const norm = normalizeGrade(user.gradeLevel);
    if (norm) return norm;
  }
  if (user.classRoom) {
    const norm = normalizeGrade(user.classRoom);
    if (norm) return norm;
  }
  if (user.positionTitle) {
    const norm = normalizeGrade(user.positionTitle);
    if (norm) return norm;
  }
  return '';
};

/**
 * Checks if two grade representations match the same canonical grade
 */
export const isSameGrade = (gradeA?: string | null, gradeB?: string | null): boolean => {
  if (!gradeA || !gradeB) return false;
  return normalizeGrade(gradeA) === normalizeGrade(gradeB);
};

/**
 * Checks whether a user (specifically a student) has permission to access a course
 */
export const canStudentAccessCourse = (user: User | null, courseGradeLevel?: string, enrolledStudentIds?: string[]): boolean => {
  if (!user) return false;
  // Teachers and Director have full access
  if (user.role === 'director' || user.role === 'teacher') return true;

  // Student specific check
  const studentGrade = getStudentGrade(user);
  if (enrolledStudentIds && enrolledStudentIds.includes(user.id)) return true;
  if (!studentGrade) return true; // If no grade recorded, allow fallback
  if (!courseGradeLevel) return true; // If general course, allow

  return isSameGrade(studentGrade, courseGradeLevel);
};

/**
 * Checks whether a user (specifically a student) has permission to take an exam
 */
export const canStudentAccessExam = (user: User | null, examGradeLevel?: string): boolean => {
  if (!user) return false;
  // Teachers and Director have full access
  if (user.role === 'director' || user.role === 'teacher') return true;

  // Student specific check
  const studentGrade = getStudentGrade(user);
  if (!studentGrade) return true;
  if (!examGradeLevel) return true;

  return isSameGrade(studentGrade, examGradeLevel);
};
