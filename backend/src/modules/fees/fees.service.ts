import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import type { AuditLogger } from '../../common/services/audit';
import type { FeesRepository } from './fees.repository';
import type {
  AssignFeeStructureInput,
  CreateFeeStructureInput,
  FeeFilterQuery,
  RecordPaymentInput,
} from './fees.types';

export class FeesService {
  constructor(
    private readonly repo: FeesRepository,
    private readonly audit: AuditLogger,
  ) {}

  async createFeeStructure(input: CreateFeeStructureInput, userId: string, ip?: string) {
    const componentSum = input.components.reduce((sum, c) => sum + c.amount, 0);
    if (Math.abs(componentSum - input.totalAmount) > 0.01) {
      throw new BadRequestError(`Total amount (${input.totalAmount}) does not match sum of components (${componentSum})`);
    }

    const structure = await this.repo.createFeeStructure(input);

    await this.audit.log({
      actorId: userId,
      action: 'FEE_STRUCTURE_CREATED',
      entity: 'FeeStructure',
      entityId: structure.id,
      metadata: { name: input.name, totalAmount: input.totalAmount },
      ipAddress: ip,
    });

    return structure;
  }

  async listFeeStructures(courseId?: string) {
    return this.repo.findFeeStructures(courseId);
  }

  async assignFeeStructure(input: AssignFeeStructureInput, userId: string, ip?: string) {
    const structure = await this.repo.findFeeStructureById(input.feeStructureId);
    if (!structure || structure.deletedAt) {
      throw new NotFoundError('Fee structure not found');
    }

    const students = await this.repo.findStudentsForStructure(
      structure.courseId,
      structure.semesterId || undefined,
      input.studentIds,
    );

    if (students.length === 0) {
      throw new BadRequestError('No matching students found for this fee structure');
    }

    const discount = input.discount ?? 0;
    const totalAmountNum = Number(structure.totalAmount);
    if (discount > totalAmountNum) {
      throw new BadRequestError('Discount cannot exceed total fee amount');
    }

    const records = students.map((s) => ({
      studentId: s.id,
      feeStructureId: structure.id,
      amountDue: totalAmountNum,
      discount,
      dueDate: structure.dueDate,
    }));

    const assigned = await this.repo.batchAssignStudentFees(records);

    await this.audit.log({
      actorId: userId,
      action: 'FEE_ASSIGNED',
      entity: 'FeeStructure',
      entityId: structure.id,
      metadata: { studentCount: assigned.length, discount },
      ipAddress: ip,
    });

    return { assignedCount: assigned.length };
  }

  async listStudentFees(filter: FeeFilterQuery, userId: string, role: string) {
    if (role === 'STUDENT') {
      const student = await this.repo.findStudentByUserId(userId);
      if (!student) return [];
      return this.repo.findStudentFees({ ...filter, studentId: student.id });
    }
    return this.repo.findStudentFees(filter);
  }

  async getStudentFeeById(id: string, userId: string, role: string) {
    const fee = await this.repo.findStudentFeeById(id);
    if (!fee) throw new NotFoundError('Student fee record not found');

    if (role === 'STUDENT') {
      const student = await this.repo.findStudentByUserId(userId);
      if (!student || student.id !== fee.studentId) {
        throw new ForbiddenError('You can only view your own fee records');
      }
    }

    return fee;
  }

  async recordPayment(input: RecordPaymentInput, userId: string, ip?: string) {
    const fee = await this.repo.findStudentFeeById(input.studentFeeId);
    if (!fee) throw new NotFoundError('Student fee record not found');

    const totalDue = Number(fee.amountDue) - Number(fee.discount);
    const alreadyPaid = fee.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceRemaining = Math.max(0, totalDue - alreadyPaid);

    if (input.amount > balanceRemaining + 0.01) {
      throw new BadRequestError(
        `Payment amount (${input.amount}) exceeds outstanding balance (${balanceRemaining.toFixed(2)})`,
      );
    }

    const newTotalPaid = alreadyPaid + input.amount;
    let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING';

    if (newTotalPaid >= totalDue - 0.01) {
      newStatus = 'PAID';
    } else if (newTotalPaid > 0) {
      newStatus = 'PARTIAL';
    } else if (new Date(fee.dueDate) < new Date()) {
      newStatus = 'OVERDUE';
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await this.repo.recordPayment(
      {
        studentFeeId: input.studentFeeId,
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        receiptNumber,
        note: input.note,
        recordedById: userId,
      },
      newStatus,
    );

    await this.audit.log({
      actorId: userId,
      action: 'PAYMENT_RECORDED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: {
        receiptNumber,
        amount: input.amount,
        studentFeeId: input.studentFeeId,
        method: input.method,
      },
      ipAddress: ip,
    });

    return payment;
  }

  async getStudentSummary(userId: string) {
    const student = await this.repo.findStudentByUserId(userId);
    if (!student) throw new NotFoundError('Student profile not found');

    const fees = await this.repo.findStudentFees({ studentId: student.id });

    let totalDue = 0;
    let totalDiscount = 0;
    let totalPaid = 0;

    for (const f of fees) {
      const due = Number(f.amountDue);
      const disc = Number(f.discount);
      const paid = f.payments.reduce((s, p) => s + Number(p.amount), 0);
      totalDue += due;
      totalDiscount += disc;
      totalPaid += paid;
    }

    const netDue = totalDue - totalDiscount;
    const balanceRemaining = Math.max(0, netDue - totalPaid);

    return {
      totalDue,
      totalDiscount,
      netDue,
      totalPaid,
      balanceRemaining,
      fees,
    };
  }
}
