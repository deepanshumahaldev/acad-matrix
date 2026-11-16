export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface FeeComponent {
  label: string;
  amount: number;
}

export interface CreateFeeStructureInput {
  courseId: string;
  semesterId?: string;
  name: string;
  academicYear: string;
  totalAmount: number;
  components: FeeComponent[];
  dueDate: string; // YYYY-MM-DD
}

export interface AssignFeeStructureInput {
  feeStructureId: string;
  studentIds?: string[];
  discount?: number;
}

export interface RecordPaymentInput {
  studentFeeId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}

export interface FeeFilterQuery {
  courseId?: string;
  semesterId?: string;
  status?: FeeStatus;
  studentId?: string;
}
