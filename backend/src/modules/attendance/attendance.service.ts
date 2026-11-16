import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { AttendanceRepository } from './attendance.repository';
import type {
  AttendanceSubjectSummary,
  MarkAttendanceInput,
  StudentAttendanceSummary,
  UpdateAttendanceInput,
} from './attendance.types';

export class AttendanceService {
  constructor(
    private readonly repo: AttendanceRepository,
    private readonly audit: AuditLogger,
  ) {}

  async listSessions(params: { allocationId?: string; sectionId?: string; date?: string; facultyId?: string }) {
    return this.repo.findSessions(params);
  }

  async getSessionById(id: string) {
    const session = await this.repo.findSessionById(id);
    if (!session) throw new NotFoundError('Attendance session not found');
    return session;
  }

  async getRosterForAllocation(allocationId: string) {
    const allocation = await this.repo.findAllocationById(allocationId);
    if (!allocation) throw new NotFoundError('Subject allocation not found');
    const students = await this.repo.findStudentsBySectionId(allocation.sectionId);
    return { allocation, students };
  }

  async markAttendance(input: MarkAttendanceInput, userId: string, userRole: string, actorId?: string, ip?: string) {
    const allocation = await this.repo.findAllocationById(input.allocationId);
    if (!allocation) throw new NotFoundError('Subject allocation not found');

    let markedById: string;
    if (userRole === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty || faculty.id !== allocation.facultyId) {
        throw new ForbiddenError('You can only mark attendance for your allocated subjects');
      }
      markedById = faculty.id;
    } else {
      markedById = allocation.facultyId;
    }

    const sessionDate = new Date(input.date);
    const existing = await this.repo.findSessionByUnique(input.allocationId, sessionDate, input.period);
    if (existing) {
      throw new ConflictError(
        `Attendance has already been marked for this subject on ${input.date} (Period ${input.period})`,
      );
    }

    const session = await this.repo.createSessionWithRecords(
      {
        allocationId: input.allocationId,
        markedById,
        date: sessionDate,
        period: input.period,
        topic: input.topic,
      },
      input.records,
    );

    await this.audit.log({
      actorId,
      action: 'ATTENDANCE_MARKED',
      entity: 'AttendanceSession',
      entityId: session.id,
      metadata: { date: input.date, period: input.period, recordsCount: input.records.length },
      ipAddress: ip,
    });

    return session;
  }

  async updateAttendance(
    id: string,
    input: UpdateAttendanceInput,
    userId: string,
    userRole: string,
    actorId?: string,
    ip?: string,
  ) {
    const session = await this.getSessionById(id);
    if (userRole === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty || faculty.id !== session.markedById) {
        throw new ForbiddenError('You can only edit attendance marked by yourself');
      }
    }

    const updated = await this.repo.updateSessionWithRecords(id, input.topic, input.records);
    await this.audit.log({
      actorId,
      action: 'ATTENDANCE_UPDATED',
      entity: 'AttendanceSession',
      entityId: id,
      ipAddress: ip,
    });
    return updated;
  }

  async getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary> {
    const records = await this.repo.findRecordsByStudentId(studentId);

    const subjectMap = new Map<
      string,
      { code: string; name: string; total: number; attended: number; absent: number }
    >();

    let totalClasses = 0;
    let attendedClasses = 0;
    let absentClasses = 0;

    for (const r of records) {
      const sub = r.session.allocation.subject;
      const existing = subjectMap.get(sub.id) ?? {
        code: sub.code,
        name: sub.name,
        total: 0,
        attended: 0,
        absent: 0,
      };

      existing.total += 1;
      totalClasses += 1;

      if (r.status === 'PRESENT' || r.status === 'LATE') {
        existing.attended += 1;
        attendedClasses += 1;
      } else {
        existing.absent += 1;
        absentClasses += 1;
      }

      subjectMap.set(sub.id, existing);
    }

    const bySubject: AttendanceSubjectSummary[] = Array.from(subjectMap.entries()).map(([subjectId, stats]) => {
      const percentage = stats.total > 0 ? Number(((stats.attended / stats.total) * 100).toFixed(1)) : 100.0;
      return {
        subjectId,
        subjectCode: stats.code,
        subjectName: stats.name,
        totalClasses: stats.total,
        attendedClasses: stats.attended,
        absentClasses: stats.absent,
        percentage,
        isLowAttendance: percentage < 75,
      };
    });

    const percentage = totalClasses > 0 ? Number(((attendedClasses / totalClasses) * 100).toFixed(1)) : 100.0;

    return {
      totalClasses,
      attendedClasses,
      absentClasses,
      percentage,
      isLowAttendance: percentage < 75,
      bySubject,
    };
  }

  async getMyAttendance(userId: string) {
    const student = await this.repo.findStudentByUserId(userId);
    if (!student) throw new NotFoundError('Student profile not found');
    const summary = await this.getStudentAttendanceSummary(student.id);
    const history = await this.repo.findRecordsByStudentId(student.id);
    return { summary, history };
  }
}
