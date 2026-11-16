import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { AssignmentsRepository } from './assignments.repository';
import type {
  AssignmentFilterQuery,
  CreateAssignmentInput,
  GradeSubmissionInput,
  SubmitAssignmentInput,
  UpdateAssignmentInput,
} from './assignments.types';

export class AssignmentsService {
  constructor(
    private readonly repo: AssignmentsRepository,
    private readonly audit: AuditLogger,
  ) {}

  async listAssignments(query: AssignmentFilterQuery, userId: string, role: string) {
    if (role === 'STUDENT') {
      const student = await this.repo.findStudentByUserId(userId);
      if (!student) return [];
      return this.repo.findAssignmentsForStudent(student.sectionId, student.id);
    }

    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty) return [];
      return this.repo.findAssignments({ facultyId: faculty.id, ...query });
    }

    return this.repo.findAssignments(query);
  }

  async getAssignmentById(id: string) {
    const assignment = await this.repo.findAssignmentById(id);
    if (!assignment || assignment.deletedAt) throw new NotFoundError('Assignment not found');
    return assignment;
  }

  async createAssignment(input: CreateAssignmentInput, userId: string, role: string, ip?: string) {
    const allocation = await this.repo.findAllocationById(input.allocationId);
    if (!allocation) throw new NotFoundError('Subject allocation not found');

    let createdById: string;
    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty || faculty.id !== allocation.facultyId) {
        throw new ForbiddenError('You can only create assignments for your allocated subjects');
      }
      createdById = faculty.id;
    } else {
      createdById = allocation.facultyId;
    }

    const assignment = await this.repo.createAssignment({
      allocationId: input.allocationId,
      createdById,
      title: input.title,
      description: input.description,
      dueAt: new Date(input.dueAt),
      maxMarks: input.maxMarks ?? 100,
      attachmentKey: input.attachmentKey,
      attachmentName: input.attachmentName,
    });

    await this.audit.log({
      actorId: userId,
      action: 'ASSIGNMENT_CREATED',
      entity: 'Assignment',
      entityId: assignment.id,
      metadata: { title: input.title, dueAt: input.dueAt },
      ipAddress: ip,
    });

    return assignment;
  }

  async updateAssignment(id: string, input: UpdateAssignmentInput, userId: string, role: string, ip?: string) {
    const existing = await this.getAssignmentById(id);
    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty || faculty.id !== existing.createdById) {
        throw new ForbiddenError('You can only edit your own assignments');
      }
    }

    const updated = await this.repo.updateAssignment(id, {
      ...input,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
    });

    await this.audit.log({
      actorId: userId,
      action: 'ASSIGNMENT_UPDATED',
      entity: 'Assignment',
      entityId: id,
      ipAddress: ip,
    });

    return updated;
  }

  async deleteAssignment(id: string, userId: string, role: string, ip?: string) {
    const existing = await this.getAssignmentById(id);
    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty || faculty.id !== existing.createdById) {
        throw new ForbiddenError('You can only delete your own assignments');
      }
    }

    const deleted = await this.repo.softDeleteAssignment(id);
    await this.audit.log({
      actorId: userId,
      action: 'ASSIGNMENT_DELETED',
      entity: 'Assignment',
      entityId: id,
      ipAddress: ip,
    });

    return deleted;
  }

  async submitAssignment(assignmentId: string, input: SubmitAssignmentInput, userId: string, ip?: string) {
    const student = await this.repo.findStudentByUserId(userId);
    if (!student) throw new NotFoundError('Student profile not found');

    const assignment = await this.getAssignmentById(assignmentId);
    const isLate = new Date() > new Date(assignment.dueAt);

    const submission = await this.repo.upsertSubmission({
      assignmentId,
      studentId: student.id,
      fileKey: input.fileKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      note: input.note,
      status: isLate ? 'LATE' : 'SUBMITTED',
    });

    await this.audit.log({
      actorId: userId,
      action: 'ASSIGNMENT_SUBMITTED',
      entity: 'Submission',
      entityId: submission.id,
      metadata: { isLate },
      ipAddress: ip,
    });

    return submission;
  }

  async gradeSubmission(submissionId: string, input: GradeSubmissionInput, userId: string, role: string, ip?: string) {
    const submission = await this.repo.findSubmissionById(submissionId);
    if (!submission) throw new NotFoundError('Submission not found');

    if (role === 'FACULTY') {
      const faculty = await this.repo.findFacultyByUserId(userId);
      if (!faculty || faculty.id !== submission.assignment.createdById) {
        throw new ForbiddenError('You can only grade submissions for your assignments');
      }
    }

    if (input.marks < 0 || input.marks > submission.assignment.maxMarks) {
      throw new BadRequestError(`Marks must be between 0 and ${submission.assignment.maxMarks}`);
    }

    const graded = await this.repo.gradeSubmission(submissionId, input.marks, input.feedback, userId);

    await this.audit.log({
      actorId: userId,
      action: 'SUBMISSION_GRADED',
      entity: 'Submission',
      entityId: submissionId,
      metadata: { marks: input.marks },
      ipAddress: ip,
    });

    return graded;
  }
}
