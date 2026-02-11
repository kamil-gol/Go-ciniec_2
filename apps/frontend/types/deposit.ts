export enum DepositStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
}

export interface DepositPayment {
  id: string;
  depositId: string;
  amount: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  reservationId: string;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string;
  status: DepositStatus;
  paid: boolean;
  paidAt?: string;
  title?: string;
  description?: string;
  reminderSentAt?: string;
  receiptNumber?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
  reservation?: {
    id: string;
    date: string;
    client: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    hall: {
      name: string;
    };
    eventType: {
      name: string;
    };
  };
  paymentHistory?: DepositPayment[];
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
  upcomingDueCount: number;
}

export interface CreateDepositRequest {
  reservationId: string;
  amount: number;
  dueDate: string;
  title?: string;
  description?: string;
}

export interface AddPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface DepositFilters {
  status?: DepositStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  overdue?: boolean;
}
