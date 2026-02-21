/**
 * Deposit Controller - with userId for audit
 */
import { Request, Response } from 'express';
export declare const listDeposits: (req: Request, res: Response) => Promise<void>;
export declare const getDepositStats: (_req: Request, res: Response) => Promise<void>;
export declare const getOverdueDeposits: (_req: Request, res: Response) => Promise<void>;
export declare const getDeposit: (req: Request, res: Response) => Promise<void>;
export declare const downloadDepositPdf: (req: Request, res: Response) => Promise<void>;
export declare const sendDepositEmail: (req: Request, res: Response) => Promise<void>;
export declare const getReservationDeposits: (req: Request, res: Response) => Promise<void>;
export declare const createDeposit: (req: Request, res: Response) => Promise<void>;
export declare const updateDeposit: (req: Request, res: Response) => Promise<void>;
export declare const deleteDeposit: (req: Request, res: Response) => Promise<void>;
export declare const markDepositAsPaid: (req: Request, res: Response) => Promise<void>;
export declare const markDepositAsUnpaid: (req: Request, res: Response) => Promise<void>;
export declare const cancelDeposit: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=deposit.controller.d.ts.map