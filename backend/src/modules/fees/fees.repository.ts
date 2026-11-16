import type { Prisma, PrismaClient } from '@prisma/client';
import type { CreateFeeStructureInput, FeeFilterQuery, PaymentMethod } from './fees.types';

export class FeesRepository {
  constructor(private readonly prisma: () => PrismaClient) {}

  async findFeeStructures(courseId?: string) {
    return this.prisma().feeStructure.findMany({
      where: {
        deletedAt: null,
        courseId,
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
        _count: { select: { studentFees: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFeeStructureById(id: string) {
    return this.prisma().feeStructure.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
      },
    });
  }

  async createFeeStructure(data: CreateFeeStructureInput) {
    return this.prisma().feeStructure.create({
      data: {
        courseId: data.courseId,
        semesterId: data.semesterId,
        name: data.name,
        academicYear: data.academicYear,
        totalAmount: data.totalAmount,
        components: data.components as unknown as Prisma.InputJsonValue,
        dueDate: new Date(data.dueDate),
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, number: true, academicYear: true } },
      },
    });
  }

  async softDeleteFeeStructure(id: string) {
    return this.prisma().feeStructure.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findStudentsForStructure(courseId: string, semesterId?: string, studentIds?: string[]) {
    const where: Prisma.StudentWhereInput = { courseId };
    if (semesterId) where.semesterId = semesterId;
    if (studentIds && studentIds.length > 0) where.id = { in: studentIds };
    return this.prisma().student.findMany({
      where,
      select: { id: true },
    });
  }

  async batchAssignStudentFees(
    records: Array<{
      studentId: string;
      feeStructureId: string;
      amountDue: number;
      discount: number;
      dueDate: Date;
    }>,
  ) {
    return this.prisma().$transaction(async (tx) => {
      const created = [];
      for (const r of records) {
        const item = await tx.studentFee.upsert({
          where: {
            studentId_feeStructureId: {
              studentId: r.studentId,
              feeStructureId: r.feeStructureId,
            },
          },
          create: {
            studentId: r.studentId,
            feeStructureId: r.feeStructureId,
            amountDue: r.amountDue,
            discount: r.discount,
            dueDate: r.dueDate,
            status: 'PENDING',
          },
          update: {},
        });
        created.push(item);
      }
      return created;
    });
  }

  async findStudentFees(filter: FeeFilterQuery) {
    const where: Prisma.StudentFeeWhereInput = {
      status: filter.status,
      studentId: filter.studentId,
    };

    if (filter.courseId || filter.semesterId) {
      where.feeStructure = {
        courseId: filter.courseId,
        semesterId: filter.semesterId,
      };
    }

    return this.prisma().studentFee.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { id: true, code: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
        feeStructure: true,
        payments: {
          select: { id: true, amount: true, method: true, receiptNumber: true, paidAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findStudentFeeById(id: string) {
    return this.prisma().studentFee.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { firstName: true, lastName: true, email: true } },
            course: { select: { id: true, code: true, name: true } },
            semester: { select: { id: true, number: true } },
            section: { select: { id: true, name: true } },
          },
        },
        feeStructure: true,
        payments: {
          include: {
            recordedBy: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { paidAt: 'desc' },
        },
      },
    });
  }

  async findStudentByUserId(userId: string) {
    return this.prisma().student.findUnique({
      where: { userId },
      select: { id: true, rollNumber: true },
    });
  }

  async recordPayment(
    data: {
      studentFeeId: string;
      amount: number;
      method: PaymentMethod;
      reference?: string;
      receiptNumber: string;
      note?: string;
      recordedById: string;
    },
    newStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE',
  ) {
    return this.prisma().$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          studentFeeId: data.studentFeeId,
          amount: data.amount,
          method: data.method,
          reference: data.reference,
          receiptNumber: data.receiptNumber,
          note: data.note,
          recordedById: data.recordedById,
        },
      });

      await tx.studentFee.update({
        where: { id: data.studentFeeId },
        data: { status: newStatus },
      });

      return payment;
    });
  }
}
