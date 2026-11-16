import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { ConflictError, NotFoundError } from '../src/common/errors';
import { UsersService } from '../src/modules/users/users.service';
import type { UsersRepository } from '../src/modules/users/users.repository';
import { FakeAudit, FakeEmail } from './helpers/fakes';

function createMockUsersRepo() {
  const users = new Map<string, any>();
  const faculty = new Map<string, any>();
  const students = new Map<string, any>();

  const repo: Partial<UsersRepository> = {
    findFaculty: async () => ({ data: Array.from(faculty.values()), total: faculty.size }),
    findFacultyById: async (id: string) => faculty.get(id) ?? null,
    findFacultyByEmployeeId: async (empId: string) =>
      Array.from(faculty.values()).find((f) => f.employeeId === empId) ?? null,
    findUserByEmail: async (email: string) =>
      Array.from(users.values()).find((u) => u.email === email) ?? null,
    createFaculty: async (data) => {
      const uId = randomUUID();
      const fId = randomUUID();
      const user = { id: uId, ...data.user, status: 'ACTIVE' };
      const fac = { id: fId, userId: uId, user, ...data.faculty, createdAt: new Date() };
      users.set(uId, user);
      faculty.set(fId, fac);
      return fac;
    },
    updateFaculty: async (id: string, data) => {
      const existing = faculty.get(id);
      if (!existing) throw new Error('Not found');
      if (data.user) Object.assign(existing.user, data.user);
      if (data.faculty) Object.assign(existing, data.faculty);
      return existing;
    },
    findStudents: async () => ({ data: Array.from(students.values()), total: students.size }),
    findStudentById: async (id: string) => students.get(id) ?? null,
    findStudentByRollNumber: async (roll: string) =>
      Array.from(students.values()).find((s) => s.rollNumber === roll) ?? null,
    createStudent: async (data) => {
      const uId = randomUUID();
      const sId = randomUUID();
      const user = { id: uId, ...data.user, status: 'ACTIVE' };
      const stu = { id: sId, userId: uId, user, ...data.student, createdAt: new Date() };
      users.set(uId, user);
      students.set(sId, stu);
      return stu;
    },
    updateStudent: async (id: string, data) => {
      const existing = students.get(id);
      if (!existing) throw new Error('Not found');
      if (data.user) Object.assign(existing.user, data.user);
      if (data.student) Object.assign(existing, data.student);
      return existing;
    },
    updateUserStatus: async (userId: string, status) => {
      const u = users.get(userId);
      if (!u) throw new Error('User not found');
      u.status = status;
      return { id: userId, email: u.email, status };
    },
    unlockUser: async (userId: string) => {
      const u = users.get(userId);
      if (!u) throw new Error('User not found');
      u.failedLoginAttempts = 0;
      u.lockedUntil = null;
      return { id: userId, email: u.email, failedLoginAttempts: 0, lockedUntil: null };
    },
  };

  return { repo: repo as UsersRepository, users, faculty, students };
}

describe('UsersService', () => {
  it('creates faculty, generates a temporary password, sends a welcome email, and writes audit', async () => {
    const { repo } = createMockUsersRepo();
    const email = new FakeEmail();
    const audit = new FakeAudit();
    const service = new UsersService(repo, email, audit);

    const result = await service.createFaculty(
      {
        email: 'prof.smith@AcadMatrix.test',
        firstName: 'John',
        lastName: 'Smith',
        employeeId: 'EMP-001',
        departmentId: randomUUID(),
      },
      'admin-id',
      '127.0.0.1',
    );

    expect(result.id).toBeDefined();
    expect(result.temporaryPassword).toMatch(/^Temp@/);
    expect(email.sent.length).toBe(1);
    expect(email.sent[0]!.to).toBe('prof.smith@AcadMatrix.test');
    expect(email.sent[0]!.subject).toContain('Welcome to AcadMatrix');
    expect(audit.actions()).toContain('FACULTY_CREATED');
  });

  it('rejects faculty creation when email or employeeId is duplicate', async () => {
    const { repo } = createMockUsersRepo();
    const email = new FakeEmail();
    const audit = new FakeAudit();
    const service = new UsersService(repo, email, audit);

    await service.createFaculty({
      email: 'prof.smith@AcadMatrix.test',
      firstName: 'John',
      lastName: 'Smith',
      employeeId: 'EMP-001',
      departmentId: randomUUID(),
    });

    await expect(
      service.createFaculty({
        email: 'prof.smith@AcadMatrix.test',
        firstName: 'Jane',
        lastName: 'Doe',
        employeeId: 'EMP-002',
        departmentId: randomUUID(),
      }),
    ).rejects.toThrow(ConflictError);

    await expect(
      service.createFaculty({
        email: 'other@AcadMatrix.test',
        firstName: 'Bob',
        lastName: 'Smith',
        employeeId: 'EMP-001',
        departmentId: randomUUID(),
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('creates student, prevents duplicate roll number, and sets status', async () => {
    const { repo } = createMockUsersRepo();
    const email = new FakeEmail();
    const audit = new FakeAudit();
    const service = new UsersService(repo, email, audit);

    const student = await service.createStudent({
      email: 'student1@AcadMatrix.test',
      firstName: 'Rahul',
      lastName: 'Kumar',
      rollNumber: 'CS2026001',
      courseId: randomUUID(),
      semesterId: randomUUID(),
      sectionId: randomUUID(),
      admissionYear: 2026,
    });

    expect(student.rollNumber).toBe('CS2026001');
    expect(email.sent.length).toBe(1);

    await expect(
      service.createStudent({
        email: 'student2@AcadMatrix.test',
        firstName: 'Amit',
        lastName: 'Sharma',
        rollNumber: 'CS2026001',
        courseId: randomUUID(),
        semesterId: randomUUID(),
        sectionId: randomUUID(),
        admissionYear: 2026,
      }),
    ).rejects.toThrow(ConflictError);

    const statusRes = await service.setStudentStatus(student.id, 'INACTIVE');
    expect(statusRes.status).toBe('INACTIVE');
  });

  it('imports faculty via CSV and returns row error reports', async () => {
    const { repo } = createMockUsersRepo();
    const email = new FakeEmail();
    const audit = new FakeAudit();
    const service = new UsersService(repo, email, audit);

    const deptId = randomUUID();
    const csvContent = `email,firstName,lastName,employeeId,departmentId\nprof1@test.com,Prof,One,EMP-10,${deptId}\nbad-row,Missing\nprof2@test.com,Prof,Two,EMP-20,${deptId}`;

    const res = await service.importFacultyCsv(csvContent);
    expect(res.totalRows).toBe(3);
    expect(res.successCount).toBe(2);
    expect(res.failureCount).toBe(1);
    expect(res.errors[0]!.row).toBe(3); // row 3 is bad-row
  });
});
