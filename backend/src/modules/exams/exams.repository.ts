import type { Prisma, PrismaClient } from '@prisma/client';
import type { CreateExamInput, ExamFilterQuery, ExamResultItem, UpdateExamInput } from './exams.types';

export class ExamsRepository {
  constructor(private readonly prisma: () => PrismaClient) {}

  async findExams(filter: ExamFilterQuery) {
    const where: Prisma.ExamWhereInput = {
      deletedAt: null,
      semesterId: filter.semesterId,
      subjectId: filter.subjectId,
      sectionId: filter.sectionId,
      type: filter.type,
    };

    if (filter.upcoming) {
      where.examDate = { gte: new Date() };
    }

    return this.prisma().exam.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        semester: {
          select: {
            id: true,
            number: true,
            academicYear: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
        section: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
      orderBy: [{ examDate: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async findExamsForStudent(studentId: string, sectionId: string, semesterId: string) {
    return this.prisma().exam.findMany({
      where: {
        deletedAt: null,
        semesterId,
        OR: [{ sectionId }, { sectionId: null }],
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        semester: {
          select: {
            id: true,
            number: true,
            academicYear: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
        section: { select: { id: true, name: true } },
        results: {
          where: { studentId },
          select: {
            id: true,
            marksObtained: true,
            grade: true,
            remarks: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ examDate: 'asc' }, { startMinute: 'asc' }],
    });
  }

  async findExamById(id: string) {
    return this.prisma().exam.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        semester: {
          select: {
            id: true,
            number: true,
            academicYear: true,
            course: { select: { id: true, name: true, code: true } },
          },
        },
        section: { select: { id: true, name: true } },
        results: {
          include: {
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
          },
          orderBy: { student: { rollNumber: 'asc' } },
        },
      },
    });
  }

  async findStudentByUserId(userId: string) {
    return this.prisma().student.findUnique({
      where: { userId },
      select: { id: true, sectionId: true, semesterId: true, courseId: true },
    });
  }

  async createExam(data: CreateExamInput) {
    return this.prisma().exam.create({
      data: {
        semesterId: data.semesterId,
        subjectId: data.subjectId,
        sectionId: data.sectionId,
        title: data.title,
        type: data.type,
        examDate: new Date(data.examDate),
        startMinute: data.startMinute,
        endMinute: data.endMinute,
        room: data.room,
        maxMarks: data.maxMarks ?? 100,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  async updateExam(id: string, data: UpdateExamInput) {
    return this.prisma().exam.update({
      where: { id },
      data: {
        title: data.title,
        type: data.type,
        examDate: data.examDate ? new Date(data.examDate) : undefined,
        startMinute: data.startMinute,
        endMinute: data.endMinute,
        room: data.room,
        maxMarks: data.maxMarks,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
        section: { select: { id: true, name: true } },
      },
    });
  }

  async softDeleteExam(id: string) {
    return this.prisma().exam.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async recordResultsBatch(examId: string, results: ExamResultItem[]) {
    return this.prisma().$transaction(async (tx) => {
      const recorded = [];
      for (const item of results) {
        const res = await tx.examResult.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: item.studentId,
            },
          },
          create: {
            examId,
            studentId: item.studentId,
            marksObtained: item.marksObtained,
            grade: item.grade,
            remarks: item.remarks,
          },
          update: {
            marksObtained: item.marksObtained,
            grade: item.grade,
            remarks: item.remarks,
          },
        });
        recorded.push(res);
      }
      return recorded;
    });
  }

  async findStudentAllResults(studentId: string) {
    return this.prisma().examResult.findMany({
      where: { studentId },
      include: {
        exam: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            semester: { select: { id: true, number: true, academicYear: true } },
          },
        },
      },
      orderBy: { exam: { examDate: 'desc' } },
    });
  }
}
