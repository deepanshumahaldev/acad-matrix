import type { Prisma, PrismaClient } from '@prisma/client';
import type { StudentAttendanceItem } from './attendance.types';

export class AttendanceRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  async findSessions(params: { allocationId?: string; sectionId?: string; date?: string; facultyId?: string }) {
    const where: Prisma.AttendanceSessionWhereInput = {
      ...(params.allocationId ? { allocationId: params.allocationId } : {}),
      ...(params.date ? { date: new Date(params.date) } : {}),
      ...(params.facultyId ? { markedById: params.facultyId } : {}),
      ...(params.sectionId ? { allocation: { sectionId: params.sectionId } } : {}),
    };

    return this.getDb().attendanceSession.findMany({
      where,
      orderBy: [{ date: 'desc' }, { period: 'desc' }],
      include: {
        allocation: {
          include: {
            subject: true,
            section: true,
            faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        _count: { select: { records: true } },
      },
    });
  }

  async findSessionById(id: string) {
    return this.getDb().attendanceSession.findUnique({
      where: { id },
      include: {
        allocation: {
          include: {
            subject: true,
            section: true,
            faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        records: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
          orderBy: { student: { rollNumber: 'asc' } },
        },
      },
    });
  }

  async findSessionByUnique(allocationId: string, date: Date, period: number) {
    return this.getDb().attendanceSession.findUnique({
      where: { allocationId_date_period: { allocationId, date, period } },
    });
  }

  async findAllocationById(id: string) {
    return this.getDb().subjectAllocation.findUnique({
      where: { id },
      include: { subject: true, section: true, faculty: true },
    });
  }

  async findStudentsBySectionId(sectionId: string) {
    return this.getDb().student.findMany({
      where: { sectionId, user: { status: 'ACTIVE', deletedAt: null } },
      orderBy: { rollNumber: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });
  }

  async createSessionWithRecords(
    sessionData: { allocationId: string; markedById: string; date: Date; period: number; topic?: string },
    records: StudentAttendanceItem[],
  ) {
    return this.getDb().$transaction(async (tx) => {
      const session = await tx.attendanceSession.create({
        data: sessionData,
      });

      await tx.attendanceRecord.createMany({
        data: records.map((r) => ({
          sessionId: session.id,
          studentId: r.studentId,
          status: r.status,
          remark: r.remark,
        })),
      });

      return tx.attendanceSession.findUniqueOrThrow({
        where: { id: session.id },
        include: {
          allocation: { include: { subject: true, section: true } },
          records: { include: { student: { include: { user: true } } } },
        },
      });
    });
  }

  async updateSessionWithRecords(id: string, topic?: string, records?: StudentAttendanceItem[]) {
    return this.getDb().$transaction(async (tx) => {
      if (topic !== undefined) {
        await tx.attendanceSession.update({ where: { id }, data: { topic } });
      }

      if (records && records.length > 0) {
        for (const r of records) {
          await tx.attendanceRecord.upsert({
            where: { sessionId_studentId: { sessionId: id, studentId: r.studentId } },
            update: { status: r.status, remark: r.remark },
            create: { sessionId: id, studentId: r.studentId, status: r.status, remark: r.remark },
          });
        }
      }

      return tx.attendanceSession.findUniqueOrThrow({
        where: { id },
        include: {
          allocation: { include: { subject: true, section: true } },
          records: { include: { student: { include: { user: true } } } },
        },
      });
    });
  }

  async findRecordsByStudentId(studentId: string) {
    return this.getDb().attendanceRecord.findMany({
      where: { studentId },
      orderBy: { session: { date: 'desc' } },
      include: {
        session: {
          include: {
            allocation: {
              include: { subject: true, section: true },
            },
          },
        },
      },
    });
  }

  async findStudentByUserId(userId: string) {
    return this.getDb().student.findUnique({ where: { userId } });
  }

  async findFacultyByUserId(userId: string) {
    return this.getDb().faculty.findUnique({ where: { userId } });
  }
}
