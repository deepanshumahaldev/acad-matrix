import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ConflictError, ForbiddenError } from '../src/common/errors';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import type { AttendanceRepository } from '../src/modules/attendance/attendance.repository';
import { FakeAudit } from './helpers/fakes';

function createMockAttendanceRepo() {
  const sessions = new Map<string, any>();
  const allocations = new Map<string, any>();
  const students = new Map<string, any>();
  const records: any[] = [];

  const repo: Partial<AttendanceRepository> = {
    findSessions: async () => Array.from(sessions.values()),
    findSessionById: async (id: string) => sessions.get(id) ?? null,
    findSessionByUnique: async (allocationId, date, period) => {
      return Array.from(sessions.values()).find(
        (s) => s.allocationId === allocationId && s.date.getTime() === date.getTime() && s.period === period,
      ) ?? null;
    },
    findAllocationById: async (id: string) => allocations.get(id) ?? null,
    findStudentsBySectionId: async (sectionId) =>
      Array.from(students.values()).filter((st) => st.sectionId === sectionId),
    createSessionWithRecords: async (data, recs) => {
      const id = randomUUID();
      const s = { id, ...data };
      sessions.set(id, s);
      const alloc = allocations.get(data.allocationId);
      recs.forEach((r) => records.push({ ...r, sessionId: id, session: { ...s, allocation: alloc } }));
      return { ...s, records: recs } as any;
    },
    findRecordsByStudentId: async (studentId) => {
      return records.filter((r) => r.studentId === studentId);
    },
    findFacultyByUserId: async (userId) => ({ id: userId }),
  };

  return { repo: repo as AttendanceRepository, sessions, allocations, students, records };
}

describe('AttendanceService', () => {
  it('marks attendance, prevents duplicates for the same period/date, and computes percentage', async () => {
    const { repo, allocations, students } = createMockAttendanceRepo();
    const audit = new FakeAudit();
    const service = new AttendanceService(repo, audit);

    const facultyId = 'fac-1';
    const subId = randomUUID();
    const secId = randomUUID();
    const allocId = randomUUID();
    const stu1Id = randomUUID();
    const stu2Id = randomUUID();

    allocations.set(allocId, {
      id: allocId,
      facultyId,
      sectionId: secId,
      subject: { id: subId, code: 'CS101', name: 'Intro CS' },
    });

    students.set(stu1Id, { id: stu1Id, sectionId: secId });
    students.set(stu2Id, { id: stu2Id, sectionId: secId });

    // Session 1: Date 2026-11-16 Period 1
    await service.markAttendance(
      {
        allocationId: allocId,
        date: '2026-11-16',
        period: 1,
        records: [
          { studentId: stu1Id, status: 'PRESENT' },
          { studentId: stu2Id, status: 'ABSENT' },
        ],
      },
      facultyId,
      'FACULTY',
    );

    // Duplicate session on same date & period -> rejected
    await expect(
      service.markAttendance(
        {
          allocationId: allocId,
          date: '2026-11-16',
          period: 1,
          records: [
            { studentId: stu1Id, status: 'PRESENT' },
            { studentId: stu2Id, status: 'PRESENT' },
          ],
        },
        facultyId,
        'FACULTY',
      ),
    ).rejects.toThrow(ConflictError);

    // Session 2: Date 2026-11-17 Period 1
    await service.markAttendance(
      {
        allocationId: allocId,
        date: '2026-11-17',
        period: 1,
        records: [
          { studentId: stu1Id, status: 'PRESENT' },
          { studentId: stu2Id, status: 'PRESENT' },
        ],
      },
      facultyId,
      'FACULTY',
    );

    // Stu 1: attended 2 of 2 classes => 100%
    const summary1 = await service.getStudentAttendanceSummary(stu1Id);
    expect(summary1.totalClasses).toBe(2);
    expect(summary1.attendedClasses).toBe(2);
    expect(summary1.percentage).toBe(100);
    expect(summary1.isLowAttendance).toBe(false);

    // Stu 2: attended 1 of 2 classes => 50% (< 75% flag)
    const summary2 = await service.getStudentAttendanceSummary(stu2Id);
    expect(summary2.totalClasses).toBe(2);
    expect(summary2.attendedClasses).toBe(1);
    expect(summary2.percentage).toBe(50);
    expect(summary2.isLowAttendance).toBe(true);
  });
});
