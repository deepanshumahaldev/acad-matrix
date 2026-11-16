import type { Prisma, PrismaClient } from '@prisma/client';

export class AssignmentsRepository {
  constructor(private readonly getDb: () => PrismaClient) {}

  async findAssignments(params: {
    allocationId?: string;
    sectionId?: string;
    facultyId?: string;
    upcoming?: boolean;
  }) {
    const where: Prisma.AssignmentWhereInput = {
      deletedAt: null,
      ...(params.allocationId ? { allocationId: params.allocationId } : {}),
      ...(params.facultyId ? { createdById: params.facultyId } : {}),
      ...(params.sectionId ? { allocation: { sectionId: params.sectionId } } : {}),
      ...(params.upcoming ? { dueAt: { gte: new Date() } } : {}),
    };

    return this.getDb().assignment.findMany({
      where,
      orderBy: { dueAt: 'desc' },
      include: {
        allocation: {
          include: {
            subject: true,
            section: true,
            faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });
  }

  async findAssignmentById(id: string) {
    return this.getDb().assignment.findUnique({
      where: { id },
      include: {
        allocation: {
          include: {
            subject: true,
            section: true,
            faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        submissions: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });
  }

  async findAssignmentsForStudent(sectionId: string, studentId: string) {
    return this.getDb().assignment.findMany({
      where: {
        deletedAt: null,
        allocation: { sectionId },
      },
      orderBy: { dueAt: 'asc' },
      include: {
        allocation: {
          include: {
            subject: true,
            faculty: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        submissions: {
          where: { studentId },
          take: 1,
        },
      },
    });
  }

  async createAssignment(data: Prisma.AssignmentUncheckedCreateInput) {
    return this.getDb().assignment.create({
      data,
      include: {
        allocation: {
          include: { subject: true, section: true },
        },
      },
    });
  }

  async updateAssignment(id: string, data: Prisma.AssignmentUncheckedUpdateInput) {
    return this.getDb().assignment.update({
      where: { id },
      data,
      include: {
        allocation: { include: { subject: true, section: true } },
      },
    });
  }

  async softDeleteAssignment(id: string) {
    return this.getDb().assignment.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findSubmission(assignmentId: string, studentId: string) {
    return this.getDb().submission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });
  }

  async findSubmissionById(id: string) {
    return this.getDb().submission.findUnique({
      where: { id },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
    });
  }

  async upsertSubmission(data: Prisma.SubmissionUncheckedCreateInput) {
    return this.getDb().submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: data.assignmentId,
          studentId: data.studentId,
        },
      },
      update: {
        fileKey: data.fileKey,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        note: data.note,
        status: data.status,
        submittedAt: new Date(),
      },
      create: data,
    });
  }

  async gradeSubmission(id: string, marks: number, feedback?: string, graderId?: string) {
    return this.getDb().submission.update({
      where: { id },
      data: {
        marks,
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedById: graderId,
      },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
    });
  }

  async findAllocationById(id: string) {
    return this.getDb().subjectAllocation.findUnique({
      where: { id },
      include: { faculty: true, section: true, subject: true },
    });
  }

  async findStudentByUserId(userId: string) {
    return this.getDb().student.findUnique({ where: { userId } });
  }

  async findFacultyByUserId(userId: string) {
    return this.getDb().faculty.findUnique({ where: { userId } });
  }

  async findStudentUserIdsInSection(sectionId: string) {
    const students = await this.getDb().student.findMany({
      where: { sectionId, user: { status: 'ACTIVE', deletedAt: null } },
      select: { userId: true },
    });
    return students.map((s) => s.userId);
  }
}
