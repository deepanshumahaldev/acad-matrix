import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BadRequestError } from '../src/common/errors';
import { FeesService } from '../src/modules/fees/fees.service';
import type { FeesRepository } from '../src/modules/fees/fees.repository';
import { FakeAudit } from './helpers/fakes';

function createMockFeesRepo() {
  const structures = new Map<string, any>();
  const studentFees = new Map<string, any>();
  const payments = new Map<string, any>();
  const students = new Map<string, any>();

  const repo: Partial<FeesRepository> = {
    findFeeStructures: async () => Array.from(structures.values()),
    findFeeStructureById: async (id: string) => structures.get(id) ?? null,
    createFeeStructure: async (data: any) => {
      const id = randomUUID();
      const s = { id, ...data, deletedAt: null };
      structures.set(id, s);
      return s;
    },
    findStudentsForStructure: async (_courseId, _semesterId, studentIds) => {
      return (studentIds ?? ['stud-1']).map((id) => ({ id }));
    },
    batchAssignStudentFees: async (records: any[]) => {
      for (const r of records) {
        studentFees.set(r.studentId, { id: randomUUID(), ...r, status: 'PENDING', payments: [] });
      }
      return records;
    },
    findStudentFees: async () => Array.from(studentFees.values()),
    findStudentFeeById: async (id: string) => {
      for (const sf of studentFees.values()) {
        if (sf.id === id) return sf;
      }
      return null;
    },
    recordPayment: async (data: any, newStatus: any) => {
      const id = randomUUID();
      const p = { id, ...data, paidAt: new Date() };
      payments.set(id, p);
      for (const sf of studentFees.values()) {
        if (sf.id === data.studentFeeId) {
          sf.status = newStatus;
          sf.payments.push(p);
        }
      }
      return p;
    },
  };

  return { repo: repo as FeesRepository, structures, studentFees, payments, students };
}

describe('FeesService', () => {
  it('validates totalAmount equals sum of components', async () => {
    const { repo } = createMockFeesRepo();
    const audit = new FakeAudit();
    const service = new FeesService(repo, audit);

    // Sum is 40000 + 10000 = 50000, but totalAmount is 60000 -> BadRequestError
    await expect(
      service.createFeeStructure(
        {
          courseId: randomUUID(),
          name: 'Annual Tuition',
          academicYear: '2026-27',
          totalAmount: 60000,
          components: [
            { label: 'Tuition', amount: 40000 },
            { label: 'Library', amount: 10000 },
          ],
          dueDate: '2026-10-01',
        },
        'admin-user',
      ),
    ).rejects.toThrow(BadRequestError);

    // Matching sum -> succeeds
    const structure = await service.createFeeStructure(
      {
        courseId: randomUUID(),
        name: 'Annual Tuition',
        academicYear: '2026-27',
        totalAmount: 50000,
        components: [
          { label: 'Tuition', amount: 40000 },
          { label: 'Library', amount: 10000 },
        ],
        dueDate: '2026-10-01',
      },
      'admin-user',
    );
    expect(structure.totalAmount).toBe(50000);
  });

  it('records partial and full payment, updating fee status', async () => {
    const { repo, studentFees } = createMockFeesRepo();
    const audit = new FakeAudit();
    const service = new FeesService(repo, audit);

    const feeId = randomUUID();
    studentFees.set('stud-1', {
      id: feeId,
      studentId: 'stud-1',
      amountDue: 50000,
      discount: 5000, // Net due = 45000
      dueDate: new Date(Date.now() + 86400000),
      status: 'PENDING',
      payments: [],
    });

    // 1. Partial payment 20000 -> status PARTIAL
    const payment1 = await service.recordPayment(
      {
        studentFeeId: feeId,
        amount: 20000,
        method: 'UPI',
        reference: 'UPI12345',
      },
      'admin-user',
    );
    expect(payment1.amount).toBe(20000);
    expect(studentFees.get('stud-1').status).toBe('PARTIAL');

    // 2. Overpayment attempt: Remaining is 25000, attempting 30000 -> BadRequestError
    await expect(
      service.recordPayment(
        {
          studentFeeId: feeId,
          amount: 30000,
          method: 'CASH',
        },
        'admin-user',
      ),
    ).rejects.toThrow(BadRequestError);

    // 3. Exact remaining payment 25000 -> status PAID
    await service.recordPayment(
      {
        studentFeeId: feeId,
        amount: 25000,
        method: 'BANK_TRANSFER',
      },
      'admin-user',
    );
    expect(studentFees.get('stud-1').status).toBe('PAID');
  });
});
