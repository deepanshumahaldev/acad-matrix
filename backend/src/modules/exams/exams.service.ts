import { BadRequestError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { ExamsRepository } from './exams.repository';
import type { CreateExamInput, ExamFilterQuery, RecordExamResultsInput, UpdateExamInput } from './exams.types';

export class ExamsService {
  constructor(
    private readonly repo: ExamsRepository,
    private readonly audit: AuditLogger,
  ) {}

  async listExams(query: ExamFilterQuery, userId: string, role: string) {
    if (role === 'STUDENT') {
      const student = await this.repo.findStudentByUserId(userId);
      if (!student) return [];
      return this.repo.findExamsForStudent(student.id, student.sectionId, student.semesterId);
    }
    return this.repo.findExams(query);
  }

  async getExamById(id: string) {
    const exam = await this.repo.findExamById(id);
    if (!exam || exam.deletedAt) throw new NotFoundError('Exam not found');
    return exam;
  }

  async createExam(input: CreateExamInput, userId: string, _role: string, ip?: string) {
    if (input.startMinute >= input.endMinute) {
      throw new BadRequestError('startMinute must be before endMinute');
    }

    const exam = await this.repo.createExam(input);

    await this.audit.log({
      actorId: userId,
      action: 'EXAM_CREATED',
      entity: 'Exam',
      entityId: exam.id,
      metadata: { title: input.title, type: input.type, examDate: input.examDate },
      ipAddress: ip,
    });

    return exam;
  }

  async updateExam(id: string, input: UpdateExamInput, userId: string, _role: string, ip?: string) {
    await this.getExamById(id);

    if (input.startMinute !== undefined && input.endMinute !== undefined && input.startMinute >= input.endMinute) {
      throw new BadRequestError('startMinute must be before endMinute');
    }

    const updated = await this.repo.updateExam(id, input);

    await this.audit.log({
      actorId: userId,
      action: 'EXAM_UPDATED',
      entity: 'Exam',
      entityId: id,
      ipAddress: ip,
    });

    return updated;
  }

  async deleteExam(id: string, userId: string, _role: string, ip?: string) {
    await this.getExamById(id);
    const deleted = await this.repo.softDeleteExam(id);

    await this.audit.log({
      actorId: userId,
      action: 'EXAM_DELETED',
      entity: 'Exam',
      entityId: id,
      ipAddress: ip,
    });

    return deleted;
  }

  async recordResults(examId: string, input: RecordExamResultsInput, userId: string, _role: string, ip?: string) {
    const exam = await this.getExamById(examId);

    for (const item of input.results) {
      if (item.marksObtained < 0 || item.marksObtained > exam.maxMarks) {
        throw new BadRequestError(`Marks obtained (${item.marksObtained}) must be between 0 and ${exam.maxMarks}`);
      }
    }

    const results = await this.repo.recordResultsBatch(examId, input.results);

    await this.audit.log({
      actorId: userId,
      action: 'EXAM_RESULTS_RECORDED',
      entity: 'Exam',
      entityId: examId,
      metadata: { count: input.results.length },
      ipAddress: ip,
    });

    return results;
  }

  async getMyResults(userId: string) {
    const student = await this.repo.findStudentByUserId(userId);
    if (!student) throw new NotFoundError('Student profile not found');
    return this.repo.findStudentAllResults(student.id);
  }
}
