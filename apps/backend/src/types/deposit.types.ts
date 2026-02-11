import { Decimal } from '@prisma/client/runtime/library';

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export enum DepositStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  BLIK = 'BLIK',
  OTHER = 'OTHER',
}

// ═══════════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface Deposit {
  id: string;
  reservationId: string;
  amount: Decimal;
  paidAmount: Decimal;
  remainingAmount: Decimal;
  dueDate: string; // Format: YYYY-MM-DD
  status: DepositStatus;
  paid: boolean;
  paidAt: Date | null;
  paymentMethod: PaymentMethod | null;
  title: string | null;
  description: string | null;
  reminderSentAt: Date | null;
  confirmationPdfUrl: string | null;
  receiptNumber: string | null;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositPayment {
  id: string;
  depositId: string;
  amount: Decimal;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  notes: string | null;
  receiptNumber: string | null;
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════
// REQUEST DTOs
// ═══════════════════════════════════════════════════════════════

export interface CreateDepositRequest {
  reservationId: string;
  amount: number;
  dueDate: string; // Format: YYYY-MM-DD
  title?: string;
  description?: string;
  internalNotes?: string;
}

export interface UpdateDepositRequest {
  amount?: number;
  dueDate?: string;
  title?: string;
  description?: string;
  status?: DepositStatus;
  internalNotes?: string;
}

export interface MarkDepositPaidRequest {
  paymentMethod: PaymentMethod;
  paidAt?: string; // ISO date string
  amount?: number; // For partial payments
  notes?: string;
  receiptNumber?: string;
}

export interface AddDepositPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string; // ISO date string, defaults to now
  notes?: string;
  receiptNumber?: string;
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE DTOs
// ═══════════════════════════════════════════════════════════════

export interface DepositWithRelations extends Deposit {
  reservation?: {
    id: string;
    date: string | null;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string;
    };
    hall: {
      id: string;
      name: string;
    } | null;
    eventType: {
      id: string;
      name: string;
    } | null;
    totalPrice: Decimal;
  };
  paymentHistory?: DepositPayment[];
}

export interface DepositListResponse {
  deposits: DepositWithRelations[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface DepositStatistics {
  totalDeposits: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  pendingCount: number;
  paidCount: number;
  overdueCount: number;
  partialCount: number;
  upcomingDueCount: number; // Due in next 7 days
}

// ═══════════════════════════════════════════════════════════════
// QUERY FILTERS
// ═══════════════════════════════════════════════════════════════

export interface DepositQueryFilters {
  status?: DepositStatus | DepositStatus[];
  paid?: boolean;
  reservationId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  overdueOnly?: boolean;
  upcomingOnly?: boolean; // Due in next 7 days
  search?: string; // Search in client name, receipt number
  page?: number;
  perPage?: number;
  sortBy?: 'dueDate' | 'amount' | 'createdAt' | 'paidAt';
  sortOrder?: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════

export interface DepositValidationError {
  field: string;
  message: string;
}

export interface DepositValidationResult {
  valid: boolean;
  errors: DepositValidationError[];
}
