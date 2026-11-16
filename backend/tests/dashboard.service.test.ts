import { describe, expect, it } from 'vitest';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';
import type { DashboardRepository } from '../src/modules/dashboard/dashboard.repository';

describe('DashboardService', () => {
  it('returns aggregated admin metrics and stats', async () => {
    const mockRepo: Partial<DashboardRepository> = {
      getAdminStats: async () => ({
        counts: { students: 120, faculty: 15, departments: 4, courses: 6, openTickets: 3 },
        fees: { totalCollected: 450000, totalPending: 50000 },
        todaySessionsCount: 8,
        recentAuditLogs: [],
      }),
    };

    const service = new DashboardService(mockRepo as DashboardRepository);
    const data = await service.getDashboard('admin-user-id', 'ADMIN');

    expect(data.role).toBe('ADMIN');
    if (data.role === 'ADMIN') {
      expect(data.counts.students).toBe(120);
      expect(data.fees.totalCollected).toBe(450000);
      expect(data.todaySessionsCount).toBe(8);
    }
  });

  it('returns faculty schedule and pending grading counts', async () => {
    const mockRepo: Partial<DashboardRepository> = {
      findFacultyByUserId: async (uid) => ({ id: `fac-${uid}` }),
      getFacultyStats: async () => ({
        todaySchedule: [],
        pendingGradingCount: 4,
        activeAssignments: [],
        recentAttendanceCount: 12,
      }),
    };

    const service = new DashboardService(mockRepo as DashboardRepository);
    const data = await service.getDashboard('fac-user-id', 'FACULTY');

    expect(data.role).toBe('FACULTY');
    if (data.role === 'FACULTY') {
      expect(data.pendingGradingCount).toBe(4);
      expect(data.recentAttendanceCount).toBe(12);
    }
  });

  it('returns student attendance gauge, fee balance, and schedule', async () => {
    const mockRepo: Partial<DashboardRepository> = {
      findStudentByUserId: async () => ({
        id: 'stud-1',
        sectionId: 'sec-1',
        semesterId: 'sem-1',
        courseId: 'crs-1',
      }),
      getStudentStats: async () => ({
        todaySchedule: [],
        attendance: {
          totalClasses: 40,
          attendedClasses: 28,
          overallPercentage: 70.0,
          isLowAttendance: true,
        },
        fees: {
          netDue: 50000,
          totalPaid: 30000,
          balanceRemaining: 20000,
        },
        upcomingAssignments: [],
        upcomingExams: [],
      }),
    };

    const service = new DashboardService(mockRepo as DashboardRepository);
    const data = await service.getDashboard('stud-user-id', 'STUDENT');

    expect(data.role).toBe('STUDENT');
    if (data.role === 'STUDENT') {
      expect(data.attendance.isLowAttendance).toBe(true);
      expect(data.attendance.overallPercentage).toBe(70.0);
      expect(data.fees.balanceRemaining).toBe(20000);
    }
  });
});
