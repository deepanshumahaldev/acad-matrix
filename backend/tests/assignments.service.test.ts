import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BadRequestError, ForbiddenError } from '../src/common/errors';
import { AssignmentsService } from '../src/modules/assignments/assignments.service';
import type { AssignmentsRepository } from '../src/modules/assignments/assignments.repository';
import { FakeAudit } from './helpers/fakes';

function createMockAssignmentsRepo() {
  const assignments = new Map<string, any>();
  const submissions = new Map<string, any>();
  const allocations = new Map<string, any>();
  const students = new Map<string, any>();
  const faculties = new Map<string, any>();

  const repo: Partial<AssignmentsRepository> = {
    findAssignments: async () => Array.from(assignments.values()),
    findAssignmentById: async (id: string) => assignments.get(id) ?? null,
    findAllocationById: async (id: string) => allocations.get(id) ?? null,
    findStudentByUserId: async (userId: string) => students.get(userId) ?? null,
    findFacultyByUserId: async (userId: string) => faculties.get(userId) ?? null,
    createAssignment: async (data: any) => {
      const id = randomUUID();
      const a = { id, ...data, deletedAt: null };
      assignments.set(id, a);
      return a;
    },
    updateAssignment: async (id: string, data: any) => {
      const a = { ...assignments.get(id), ...data };
      assignments.set(id, a);
      return a;
    },
    softDeleteAssignment: async (id: string) => {
      const a = { ...assignments.get(id), deletedAt: new Date() };
      assignments.set(id, a);
      return a;
    },
    upsertSubmission: async (data: any) => {
      const id = randomUUID();
      const s = { id, ...data };
      submissions.set(id, s);
      return s;
    },
    findSubmissionById: async (id: string) => {
      const s = submissions.get(id);
      if (!s) return null;
      return {
        ...s,
        assignment: assignments.get(s.assignmentId),
      };
    },
    gradeSubmission: async (id: string, marks: number, feedback?: string) => {
      const s = { ...submissions.get(id), marks, feedback, status: 'GRADED' };
      submissions.set(id, s);
      return s;
    },
  };

  return { repo: repo as AssignmentsRepository, assignments, submissions, allocations, students, faculties };
}

describe('AssignmentsService', () => {
  it('creates assignment and enforces faculty allocation ownership', async () => {
    const { repo, allocations, faculties } = createMockAssignmentsRepo();
    const audit = new FakeAudit();
    const service = new AssignmentsService(repo, audit);

    const facultyId = randomUUID();
    const allocId = randomUUID();
    faculties.set('user-fac-1', { id: facultyId });
    allocations.set(allocId, { id: allocId, facultyId });

    // Faculty creates assignment for own allocation -> succeeds
    const created = await service.createAssignment(
      {
        allocationId: allocId,
        title: 'Homework 1',
        dueAt: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 100,
      },
      'user-fac-1',
      'FACULTY',
    );
    expect(created.title).toBe('Homework 1');
    expect(audit.entries.length).toBe(1);

    // Other faculty tries to create for same allocation -> forbidden
    faculties.set('user-fac-2', { id: 'other-fac' });
    await expect(
      service.createAssignment(
        {
          allocationId: allocId,
          title: 'Illegal HW',
          dueAt: new Date().toISOString(),
          maxMarks: 50,
        },
        'user-fac-2',
        'FACULTY',
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('marks submission late if past due date', async () => {
    const { repo, assignments, students } = createMockAssignmentsRepo();
    const audit = new FakeAudit();
    const service = new AssignmentsService(repo, audit);

    const studentId = randomUUID();
    students.set('user-stud-1', { id: studentId, sectionId: 'sec-1' });

    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    const assignId = randomUUID();
    assignments.set(assignId, { id: assignId, dueAt: pastDate, maxMarks: 100 });

    const submission = await service.submitAssignment(
      assignId,
      {
        assignmentId: assignId,
        fileKey: 'key/doc.pdf',
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
      'user-stud-1',
    );

    expect(submission.status).toBe('LATE');
  });

  it('validates marks when grading submission', async () => {
    const { repo, assignments, submissions, faculties } = createMockAssignmentsRepo();
    const audit = new FakeAudit();
    const service = new AssignmentsService(repo, audit);

    const facultyId = randomUUID();
    faculties.set('user-fac', { id: facultyId });

    const assignId = randomUUID();
    assignments.set(assignId, { id: assignId, createdById: facultyId, maxMarks: 50 });

    const subId = randomUUID();
    submissions.set(subId, { id: subId, assignmentId: assignId, marks: null });

    // Marks exceed maxMarks -> BadRequestError
    await expect(
      service.gradeSubmission(subId, { marks: 55 }, 'user-fac', 'FACULTY'),
    ).rejects.toThrow(BadRequestError);

    // Valid marks -> graded
    const graded = await service.gradeSubmission(subId, { marks: 45, feedback: 'Good job' }, 'user-fac', 'FACULTY');
    expect(graded.status).toBe('GRADED');
    expect(graded.marks).toBe(45);
  });
});
