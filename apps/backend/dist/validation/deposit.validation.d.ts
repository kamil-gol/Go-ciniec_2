/**
 * Deposit Validation Schemas (Zod)
 */
import { z } from 'zod';
export declare const DepositStatusEnum: z.ZodEnum<["PENDING", "PAID", "OVERDUE", "CANCELLED", "PARTIALLY_PAID"]>;
export declare const PaymentMethodEnum: z.ZodEnum<["CASH", "TRANSFER", "BLIK", "CARD"]>;
export declare const createDepositSchema: z.ZodObject<{
    amount: z.ZodNumber;
    dueDate: z.ZodEffects<z.ZodString, string, string>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amount: number;
    dueDate: string;
    notes?: string | undefined;
}, {
    amount: number;
    dueDate: string;
    notes?: string | undefined;
}>;
export declare const updateDepositSchema: z.ZodEffects<z.ZodObject<{
    amount: z.ZodOptional<z.ZodNumber>;
    dueDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
}, {
    notes?: string | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
}>, {
    notes?: string | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
}, {
    notes?: string | undefined;
    amount?: number | undefined;
    dueDate?: string | undefined;
}>;
export declare const markPaidSchema: z.ZodObject<{
    paymentMethod: z.ZodEnum<["CASH", "TRANSFER", "BLIK", "CARD"]>;
    paidAt: z.ZodEffects<z.ZodString, string, string>;
    amountPaid: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    paidAt: string;
    paymentMethod: "CASH" | "TRANSFER" | "BLIK" | "CARD";
    notes?: string | undefined;
    amountPaid?: number | undefined;
}, {
    paidAt: string;
    paymentMethod: "CASH" | "TRANSFER" | "BLIK" | "CARD";
    notes?: string | undefined;
    amountPaid?: number | undefined;
}>;
export declare const depositFiltersSchema: z.ZodObject<{
    reservationId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "PAID", "OVERDUE", "CANCELLED", "PARTIALLY_PAID"]>>;
    overdue: z.ZodOptional<z.ZodBoolean>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    paid: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["dueDate", "amount", "createdAt", "status"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "status" | "amount" | "dueDate";
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    status?: "PENDING" | "CANCELLED" | "PAID" | "OVERDUE" | "PARTIALLY_PAID" | undefined;
    reservationId?: string | undefined;
    paid?: boolean | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    overdue?: boolean | undefined;
}, {
    search?: string | undefined;
    status?: "PENDING" | "CANCELLED" | "PAID" | "OVERDUE" | "PARTIALLY_PAID" | undefined;
    reservationId?: string | undefined;
    paid?: boolean | undefined;
    dateFrom?: string | undefined;
    dateTo?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "status" | "amount" | "dueDate" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    overdue?: boolean | undefined;
}>;
//# sourceMappingURL=deposit.validation.d.ts.map