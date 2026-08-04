export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  status: string;
  student?: Student;
  teacher?: Teacher;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  _count?: {
    classes?: number;
    teachers?: number;
    subjects?: number;
  };
}

export interface ClassItem {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  department?: Department;
  _count?: {
    students?: number;
  };
}

export interface Student {
  id: number;
  studentCode: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phone?: string;
  classId: number;
  class?: ClassItem;
  userId: number;
  user?: User;
}

export interface Teacher {
  id: number;
  teacherCode: string;
  fullName: string;
  degree: string;
  email: string;
  phone?: string;
  departmentId: number;
  department?: Department;
  userId: number;
  user?: User;
}

export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  departmentId: number;
  department?: Department;
  chapters?: Chapter[];
  _count?: {
    questions?: number;
    examSchedules?: number;
  };
}

export interface Chapter {
  id: string;
  subjectId: number;
  code: string;
  name: string;
  order: number;
}

export interface ExamPeriod {
  id: number;
  name: string;
  semester: string;
  schoolYear: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ExamSchedule {
  id: number;
  examPeriodId: number;
  examPeriod?: ExamPeriod;
  subjectId: number;
  subject?: Subject;
  examDate: string;
  startTime: string;
  endTime: string;
  examType: string;
  status: string;
  note?: string;
  examScheduleRooms?: any[];
}

export interface ExamRoom {
  id: number;
  roomCode: string;
  roomName: string;
  building: string;
  capacity: number;
  roomType: string;
  status: string;
  code?: string;
  name?: string;
  location?: string;
}

export interface QuestionOption {
  id?: string;
  label: string;
  content: string;
  isCorrect: boolean;
  order: number;
  optionLabel?: string;
  optionContent?: string;
}

export interface Question {
  id: string;
  code: string;
  subjectId: number;
  subject?: Subject;
  chapterId: string;
  chapter?: Chapter;
  content: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'ESSAY';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE';
  score: number;
  explanation?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  options: QuestionOption[];
  createdById: number;
  createdBy?: Pick<User, 'id' | 'username' | 'role'>;
  keywords?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: { examPaperQuestions: number };
  statistic?: { usedCount: number; totalAnswers: number; correctAnswers: number; lastUsedAt?: string; correctRate?: number | null };
}

export interface ExamPaperQuestion {
  id: number;
  questionOrder: number;
  score: number;
  question: Question;
}

export interface ExamPaper {
  id: number;
  paperCode: string;
  title: string;
  durationMinutes: number;
  totalScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdBy?: Pick<User, 'id' | 'username' | 'role'>;
  examSchedule?: ExamSchedule;
  questions?: ExamPaperQuestion[];
  _count?: {
    questions?: number;
  };
}

export interface PersonalScheduleItem {
  id: number;
  examNumber: string;
  registrationNumber?: string;
  seatNumber: number;
  status: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  examDate: string;
  startTime: string;
  endTime: string;
  examType: string;
  roomCode: string;
  roomName: string;
  building: string;
  periodName: string;
}

export interface TeacherAssignmentItem {
  id: number;
  role: string;
  note?: string;
  subjectCode: string;
  subjectName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  roomCode: string;
  roomName: string;
  building: string;
  periodName: string;
}
