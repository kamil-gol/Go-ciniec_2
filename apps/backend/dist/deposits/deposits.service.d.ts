import { PrismaService } from '../prisma/prisma.service';
export declare class DepositsService {
    private prisma;
    constructor(prisma: PrismaService);
    markAsPaid(depositId: string, paymentMethod: 'CASH' | 'TRANSFER' | 'BLIK', paidAt: string): Promise<any>;
    markAsUnpaid(depositId: string): Promise<any>;
}
//# sourceMappingURL=deposits.service.d.ts.map