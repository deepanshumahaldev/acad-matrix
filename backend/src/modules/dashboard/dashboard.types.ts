export interface AdminDashboardData {
  role: 'ADMIN';
  counts: {
    students: number;
    faculty: number;
    departments: number;
    courses: number;
    openTickets: number;
  };
  fees: {
    totalCollected: number;
    totalPending: number;
  };
  todaySessionsCount: number;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    createdAt: string;
    actor?: { firstName: string; lastName: string; email: string } | null;
  }>;
}

export interface FacultyDashboardData {
  role: 'FACULTY';
  todaySchedule: Array<{
    id: string;
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    room: string;
    subject: { name: string; code: string };
    section: { name: string };
  }>;
  pendingGradingCount: number;
  activeAssignments: Array<{
    id: string;
    title: string;
    dueAt: string;
    submissionsCount: number;
    subject: { name: string; code: string };
  }>;
  recentAttendanceCount: number;
}

export interface StudentDashboardData {
  role: 'STUDENT';
  todaySchedule: Array<{
    id: string;
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    room: string;
    subject: { name: string; code: string };
  }>;
  attendance: {
    totalClasses: number;
    attendedClasses: number;
    overallPercentage: number;
    isLowAttendance: boolean;
  };
  fees: {
    netDue: number;
    totalPaid: number;
    balanceRemaining: number;
  };
  upcomingAssignments: Array<{
    id: string;
    title: string;
    dueAt: string;
    subject: { name: string; code: string };
    status: string;
  }>;
  upcomingExams: Array<{
    id: string;
    title: string;
    examDate: string;
    startMinute: number;
    endMinute: number;
    room?: string | null;
    subject: { name: string; code: string };
  }>;
}

export type DashboardData = AdminDashboardData | FacultyDashboardData | StudentDashboardData;
