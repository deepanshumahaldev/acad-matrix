import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BadRequestError } from '../src/common/errors';
import { ExamsService } from '../src/modules/exams/exams.service';
import type { ExamsRepository } from '../src/modules/exams/exams.repository';
import { FakeAudit } from './helpers/fakes';

function createMockExamsRepo() {
  const exams = new Map<string, any>();
  const results = new Map<string, any>();
  const students = new Map<string, any>();

  const repo: Partial<ExamsRepository> = {
    findExams: async () => Array.from(exams.values()),
    findExamById: async (id: string) => exams.get(id) ?? null,
    findStudentByUserId: async (userId: string) => students.get(userId) ?? null,
    createExam: async (data: any) => {
      const id = randomUUID();
      const e = { id, ...data, deletedAt: null };
      exams.set(id, e);
      return e;
    },
    updateExam: async (id: string, data: any) => {
      const e = { ...exams.get(id), ...data };
      exams.set(id, e);
      return e;
    },
    softDeleteExam: async (id: string) => {
      const e = { ...exams.get(id), deletedAt: new Date() };
      exams.set(id, e);
      return e;
    },
    recordResultsBatch: async (examId: string, items: any[]) => {
      const recorded: any[] = [];
      for (const item of items) {
        const key = `${examId}-${item.studentId}`;
        const res = { id: randomUUID(), examId, ...item };
        results.set(key, res);
        recorded.push(res);
      }
      return recorded;
    },
    findStudentAllResults: async (studentId: string) => {
      return Array.from(results.values()).filter((r) => r.studentId === studentId);
    },
  };

  return { repo: repo as ExamsRepository, exams, results, students };
}

describe('ExamsService', () => {
  it('validates startMinute < endMinute when creating an exam', async () => {
    const { repo } = createMockExamsRepo();
    const audit = new FakeAudit();
    const service = new ExamsService(repo, audit);

    await expect(
      service.createExam(
        {
          semesterId: randomUUID(),
          subjectId: randomUUID(),
          title: 'Mid Term',
          type: 'MID_TERM',
          examDate: '2026-12-01',
          startMinute: 600,
          endMinute: 540, // invalid: end before start
          maxMarks: 100,
        },
        'admin-user',
        'ADMIN',
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it('records exam results and validates marks bounds', async () => {
    const { repo, exams } = createMockExamsRepo();
    const audit = new FakeAudit();
    const service = new ExamsService(repo, audit);

    const examId = randomUUID();
    exams.set(examId, { id: examId, title: 'Finals', maxMarks: 100 });

    const stud1 = randomUUID();
    const stud2 = randomUUID();

    // Invalid: student marks > maxMarks
    await expect(
      service.recordResults(
        examId,
        {
          results: [
            { studentId: stud1, marksObtained: 105 },
          ],
        },
        'faculty-user',
        'FACULTY',
      ),
    ).rejects.toThrow(BadRequestError);

    // Valid batch
    const recorded = await service.recordResults(
      examId,
      {
        results: [
          { studentId: stud1, marksObtained: 85, grade: 'A' },
          { studentId: stud2, marksObtained: 72, grade: 'B' },
        ],
      },
      'faculty-user',
      'FACULTY',
    );

    expect(recorded.length).toBe(2);
    expect(audit.entries.length).toBe(1);
  });
});
