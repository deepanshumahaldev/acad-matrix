export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
export type FeeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export interface FeeComponent {
  label: string;
  amount: number;
}

export interface FeeStructureItem {
  id: string;
  courseId: string;
  semesterId?: string | null;
  name: string;
  academicYear: string;
  totalAmount: number;
  components: FeeComponent[];
  dueDate: string;
  course?: { id: string; name: string; code: string };
  semester?: { id: string; number: number; academicYear: string } | null;
  _count?: { studentFees: number };
}

export interface StudentFeeItem {
  id: string;
  studentId: string;
  feeStructureId: string;
  amountDue: number;
  discount: number;
  dueDate: string;
  status: FeeStatus;
  createdAt: string;
  student?: {
    id: string;
    rollNumber: string;
    user: { firstName: string; lastName: string; email: string };
    course?: { code: string; name: string };
    section?: { name: string };
  };
  feeStructure?: FeeStructureItem;
  payments?: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  studentFeeId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string | null;
  receiptNumber: string;
  note?: string | null;
  paidAt: string;
  recordedBy?: { firstName: string; lastName: string; email: string };
}

export interface StudentFeeSummary {
  totalDue: number;
  totalDiscount: number;
  netDue: number;
  totalPaid: number;
  balanceRemaining: number;
  fees: StudentFeeItem[];
}

export interface CreateFeeStructurePayload {
  courseId: string;
  semesterId?: string;
  name: string;
  academicYear: string;
  totalAmount: number;
  components: FeeComponent[];
  dueDate: string;
}

export interface AssignFeePayload {
  feeStructureId: string;
  studentIds?: string[];
  discount?: number;
}

export interface RecordPaymentPayload {
  studentFeeId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  note?: string;
}
