import type { DayOfWeek, PrismaClient } from '@prisma/client';

const DAYS: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export class DashboardRepository {
  constructor(private readonly prisma: () => PrismaClient) {}

  getTodayDayOfWeek(): DayOfWeek {
    const day = new Date().getDay();
    return DAYS[day] || 'MONDAY';
  }

  async getAdminStats() {
    const db = this.prisma();
    const [students, faculty, departments, courses, openTickets, payments, studentFees, todaySessions, auditLogs] =
      await Promise.all([
        db.student.count(),
        db.faculty.count({ where: { user: { deletedAt: null } } }),
        db.department.count({ where: { deletedAt: null } }),
        db.course.count({ where: { deletedAt: null } }),
        db.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        db.payment.aggregate({ _sum: { amount: true } }),
        db.studentFee.findMany({ select: { amountDue: true, discount: true } }),
        db.attendanceSession.count({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        db.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { firstName: true, lastName: true, email: true } } },
        }),
      ]);

    const totalCollected = Number(payments._sum.amount ?? 0);
    const totalDue = studentFees.reduce((acc, sf) => acc + (Number(sf.amountDue) - Number(sf.discount)), 0);
    const totalPending = Math.max(0, totalDue - totalCollected);

    return {
      counts: { students, faculty, departments, courses, openTickets },
      fees: { totalCollected, totalPending },
      todaySessionsCount: todaySessions,
      recentAuditLogs: auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        createdAt: l.createdAt.toISOString(),
        actor: l.actor,
      })),
    };
  }

  async findFacultyByUserId(userId: string) {
    return this.prisma().faculty.findUnique({ where: { userId }, select: { id: true } });
  }

  async getFacultyStats(facultyId: string) {
    const db = this.prisma();
    const today = this.getTodayDayOfWeek();

    const [todaySchedule, assignments, pendingGradingCount, recentSessions] = await Promise.all([
      db.timetableSlot.findMany({
        where: { dayOfWeek: today, allocation: { facultyId } },
        include: {
          allocation: {
            select: {
              subject: { select: { name: true, code: true } },
              section: { select: { name: true } },
            },
          },
        },
        orderBy: { startMinute: 'asc' },
      }),
      db.assignment.findMany({
        where: { createdById: facultyId, deletedAt: null },
        take: 5,
        orderBy: { dueAt: 'desc' },
        include: {
          allocation: { select: { subject: { select: { name: true, code: true } } } },
          _count: { select: { submissions: true } },
        },
      }),
      db.submission.count({
        where: { assignment: { createdById: facultyId }, status: { in: ['SUBMITTED', 'LATE'] } },
      }),
      db.attendanceSession.count({
        where: { markedById: facultyId, date: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
    ]);

    return {
      todaySchedule: todaySchedule.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startMinute: s.startMinute,
        endMinute: s.endMinute,
        room: s.room,
        subject: s.allocation.subject,
        section: s.allocation.section,
      })),
      pendingGradingCount,
      activeAssignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueAt: a.dueAt.toISOString(),
        submissionsCount: a._count.submissions,
        subject: a.allocation.subject,
      })),
      recentAttendanceCount: recentSessions,
    };
  }

  async findStudentByUserId(userId: string) {
    return this.prisma().student.findUnique({
      where: { userId },
      select: { id: true, sectionId: true, semesterId: true, courseId: true },
    });
  }

  async getStudentStats(studentId: string, sectionId: string, semesterId: string) {
    const db = this.prisma();
    const today = this.getTodayDayOfWeek();

    const [todaySchedule, attendanceRecords, studentFees, upcomingAssignments, upcomingExams] =
      await Promise.all([
        db.timetableSlot.findMany({
          where: { dayOfWeek: today, allocation: { sectionId } },
          include: {
            allocation: { select: { subject: { select: { name: true, code: true } } } },
          },
          orderBy: { startMinute: 'asc' },
        }),
        db.attendanceRecord.findMany({
          where: { studentId },
          select: { status: true },
        }),
        db.studentFee.findMany({
          where: { studentId },
          include: { payments: { select: { amount: true } } },
        }),
        db.assignment.findMany({
          where: { allocation: { sectionId }, deletedAt: null },
          take: 5,
          orderBy: { dueAt: 'asc' },
          include: {
            allocation: { select: { subject: { select: { name: true, code: true } } } },
            submissions: { where: { studentId }, select: { status: true } },
          },
        }),
        db.exam.findMany({
          where: {
            deletedAt: null,
            semesterId,
            examDate: { gte: new Date() },
            OR: [{ sectionId }, { sectionId: null }],
          },
          take: 4,
          orderBy: [{ examDate: 'asc' }, { startMinute: 'asc' }],
          include: { subject: { select: { name: true, code: true } } },
        }),
      ]);

    const totalClasses = attendanceRecords.length;
    const attendedClasses = attendanceRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
    const overallPercentage = totalClasses > 0 ? Number(((attendedClasses / totalClasses) * 100).toFixed(1)) : 100;
    const isLowAttendance = totalClasses > 0 && overallPercentage < 75;

    let netDue = 0;
    let totalPaid = 0;
    for (const fee of studentFees) {
      netDue += Number(fee.amountDue) - Number(fee.discount);
      totalPaid += fee.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    }
    const balanceRemaining = Math.max(0, netDue - totalPaid);

    return {
      todaySchedule: todaySchedule.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startMinute: s.startMinute,
        endMinute: s.endMinute,
        room: s.room,
        subject: s.allocation.subject,
      })),
      attendance: { totalClasses, attendedClasses, overallPercentage, isLowAttendance },
      fees: { netDue, totalPaid, balanceRemaining },
      upcomingAssignments: upcomingAssignments.map((a) => ({
        id: a.id,
        title: a.title,
        dueAt: a.dueAt.toISOString(),
        subject: a.allocation.subject,
        status: a.submissions[0]?.status || (new Date() > a.dueAt ? 'MISSING' : 'PENDING'),
      })),
      upcomingExams: upcomingExams.map((e) => ({
        id: e.id,
        title: e.title,
        examDate: e.examDate.toISOString(),
        startMinute: e.startMinute,
        endMinute: e.endMinute,
        room: e.room,
        subject: e.subject,
      })),
    };
  }
}
