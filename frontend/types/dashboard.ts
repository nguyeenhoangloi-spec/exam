export type DashboardSummaryItem = {
  total: number;
  description: string;
  route: string;
};

export type DashboardOverview = {
  summary: {
    students: DashboardSummaryItem;
    lecturers: DashboardSummaryItem;
    subjects: DashboardSummaryItem;
    examRooms: DashboardSummaryItem;
    upcomingExams: DashboardSummaryItem;
    pendingQuestions: DashboardSummaryItem;
  };
  today: { examCount: number; pendingQuestionCount: number };
  examChart: Array<{ key: string; label: string; count: number }>;
  questionStatus: Array<{
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
    count: number;
  }>;
  upcomingExams: Array<{
    id: number;
    periodName: string;
    subjectCode: string;
    subjectName: string;
    examDate: string;
    startTime: string;
    endTime: string;
    roomCodes: string[];
    studentCount: number;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  }>;
  pendingQuestions: Array<{
    id: string;
    code: string;
    content: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    submittedAt: string;
    createdById: number;
    subject: { subjectCode: string; subjectName: string };
    chapter: { code: string; name: string };
    createdBy: { id: number; username: string; role: string };
  }>;
  examProgress: Array<{
    id: number;
    name: string;
    status: string;
    totalSchedules: number;
    roomProgress: number;
    supervisorProgress: number;
    paperProgress: number;
    incompleteSchedules: number;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string;
    description: string;
    createdAt: string;
    actor?: { id: number; username: string } | null;
  }>;
  generatedAt: string;
};
