import { Role, UserStatus } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { EmailService } from '../../common/services/email';
import { welcomeTemporaryPasswordEmail } from '../../common/services/email';
import { generateTemporaryPassword } from '../../common/utils/crypto';
import { hashPassword } from '../../common/utils/password';
import { importFacultyFromRows, importStudentsFromRows, parseCsv } from './users.csv';
import type { UsersRepository } from './users.repository';
import type {
  CreateFacultyInput,
  CreateStudentInput,
  CsvImportResult,
  FacultyFilterQuery,
  StudentFilterQuery,
  UpdateFacultyInput,
  UpdateStudentInput,
} from './users.types';

export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly email: EmailService,
    private readonly audit: AuditLogger,
  ) {}

  // ───────────────────────── Faculty ─────────────────────────

  async listFaculty(query: FacultyFilterQuery) {
    return this.repo.findFaculty(query);
  }

  async getFacultyById(id: string) {
    const faculty = await this.repo.findFacultyById(id);
    if (!faculty) throw new NotFoundError('Faculty member not found');
    return faculty;
  }

  async createFaculty(input: CreateFacultyInput, actorId?: string, ipAddress?: string) {
    const existingEmail = await this.repo.findUserByEmail(input.email);
    if (existingEmail) throw new ConflictError('A user with this email already exists');

    const existingEmp = await this.repo.findFacultyByEmployeeId(input.employeeId);
    if (existingEmp) throw new ConflictError('Employee ID already in use');

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const faculty = await this.repo.createFaculty({
      user: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        passwordHash,
        role: Role.FACULTY,
        mustChangePassword: true,
      },
      faculty: {
        employeeId: input.employeeId,
        departmentId: input.departmentId,
        designation: input.designation,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : null,
      },
    });

    await this.email.send(
      welcomeTemporaryPasswordEmail(input.email, `${input.firstName} ${input.lastName}`, 'Faculty', tempPassword),
    );

    await this.audit.log({
      actorId,
      action: 'FACULTY_CREATED',
      entity: 'Faculty',
      entityId: faculty.id,
      metadata: { email: input.email, employeeId: input.employeeId },
      ipAddress,
    });

    return { ...faculty, temporaryPassword: tempPassword };
  }

  async updateFaculty(id: string, input: UpdateFacultyInput, actorId?: string, ipAddress?: string) {
    const existing = await this.repo.findFacultyById(id);
    if (!existing) throw new NotFoundError('Faculty member not found');

    const updated = await this.repo.updateFaculty(id, {
      user: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
      faculty: {
        departmentId: input.departmentId,
        designation: input.designation,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : undefined,
      },
    });

    await this.audit.log({
      actorId,
      action: 'FACULTY_UPDATED',
      entity: 'Faculty',
      entityId: id,
      ipAddress,
    });

    return updated;
  }

  async setFacultyStatus(id: string, status: UserStatus, actorId?: string, ipAddress?: string) {
    const existing = await this.repo.findFacultyById(id);
    if (!existing) throw new NotFoundError('Faculty member not found');

    const updated = await this.repo.updateUserStatus(existing.userId, status);
    await this.audit.log({
      actorId,
      action: 'FACULTY_STATUS_UPDATED',
      entity: 'Faculty',
      entityId: id,
      metadata: { status },
      ipAddress,
    });
    return updated;
  }

  // ───────────────────────── Students ─────────────────────────

  async listStudents(query: StudentFilterQuery) {
    return this.repo.findStudents(query);
  }

  async getStudentById(id: string) {
    const student = await this.repo.findStudentById(id);
    if (!student) throw new NotFoundError('Student not found');
    return student;
  }

  async createStudent(input: CreateStudentInput, actorId?: string, ipAddress?: string) {
    const existingEmail = await this.repo.findUserByEmail(input.email);
    if (existingEmail) throw new ConflictError('A user with this email already exists');

    const existingRoll = await this.repo.findStudentByRollNumber(input.rollNumber);
    if (existingRoll) throw new ConflictError('Roll number already in use');

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);

    const student = await this.repo.createStudent({
      user: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        passwordHash,
        role: Role.STUDENT,
        mustChangePassword: true,
      },
      student: {
        rollNumber: input.rollNumber,
        courseId: input.courseId,
        semesterId: input.semesterId,
        sectionId: input.sectionId,
        admissionYear: input.admissionYear,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
        guardianName: input.guardianName,
        guardianPhone: input.guardianPhone,
      },
    });

    await this.email.send(
      welcomeTemporaryPasswordEmail(input.email, `${input.firstName} ${input.lastName}`, 'Student', tempPassword),
    );

    await this.audit.log({
      actorId,
      action: 'STUDENT_CREATED',
      entity: 'Student',
      entityId: student.id,
      metadata: { email: input.email, rollNumber: input.rollNumber },
      ipAddress,
    });

    return { ...student, temporaryPassword: tempPassword };
  }

  async updateStudent(id: string, input: UpdateStudentInput, actorId?: string, ipAddress?: string) {
    const existing = await this.repo.findStudentById(id);
    if (!existing) throw new NotFoundError('Student not found');

    const updated = await this.repo.updateStudent(id, {
      user: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
      },
      student: {
        courseId: input.courseId,
        semesterId: input.semesterId,
        sectionId: input.sectionId,
        admissionYear: input.admissionYear,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        guardianName: input.guardianName,
        guardianPhone: input.guardianPhone,
      },
    });

    await this.audit.log({
      actorId,
      action: 'STUDENT_UPDATED',
      entity: 'Student',
      entityId: id,
      ipAddress,
    });

    return updated;
  }

  async setStudentStatus(id: string, status: UserStatus, actorId?: string, ipAddress?: string) {
    const existing = await this.repo.findStudentById(id);
    if (!existing) throw new NotFoundError('Student not found');

    const updated = await this.repo.updateUserStatus(existing.userId, status);
    await this.audit.log({
      actorId,
      action: 'STUDENT_STATUS_UPDATED',
      entity: 'Student',
      entityId: id,
      metadata: { status },
      ipAddress,
    });
    return updated;
  }

  // ───────────────────────── Account Unlock ─────────────────────────

  async unlockUser(userId: string, actorId?: string, ipAddress?: string) {
    const res = await this.repo.unlockUser(userId);
    await this.audit.log({
      actorId,
      action: 'USER_UNLOCKED',
      entity: 'User',
      entityId: userId,
      ipAddress,
    });
    return res;
  }

  // ───────────────────────── CSV Bulk Import ─────────────────────────

  async importFacultyCsv(csvData: string, actorId?: string, ipAddress?: string): Promise<CsvImportResult> {
    const rows = parseCsv(csvData);
    const result = await importFacultyFromRows(this, rows, actorId, ipAddress);
    await this.audit.log({
      actorId,
      action: 'FACULTY_CSV_IMPORTED',
      entity: 'Faculty',
      metadata: { totalRows: result.totalRows, successCount: result.successCount, failureCount: result.failureCount },
      ipAddress,
    });
    return result;
  }

  async importStudentsCsv(csvData: string, actorId?: string, ipAddress?: string): Promise<CsvImportResult> {
    const rows = parseCsv(csvData);
    const result = await importStudentsFromRows(this, rows, actorId, ipAddress);
    await this.audit.log({
      actorId,
      action: 'STUDENTS_CSV_IMPORTED',
      entity: 'Student',
      metadata: { totalRows: result.totalRows, successCount: result.successCount, failureCount: result.failureCount },
      ipAddress,
    });
    return result;
  }
}
