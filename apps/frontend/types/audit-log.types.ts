// apps/frontend/types/audit-log.types.ts

export type AuditAction =
  // Basic CRUD
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE'
  // Status
  | 'STATUS_CHANGE' | 'ARCHIVE' | 'UNARCHIVE' | 'RESTORE'
  // Menu
  | 'MENU_UPDATE' | 'MENU_REMOVE' | 'MENU_SELECTED' | 'MENU_RECALCULATED' | 'MENU_DIRECT_REMOVED'
  // Payment
  | 'PAYMENT_UPDATE' | 'MARK_PAID'
  // Queue
  | 'QUEUE_ADD' | 'QUEUE_UPDATE' | 'QUEUE_REMOVE' | 'QUEUE_SWAP' | 'QUEUE_MOVE'
  | 'QUEUE_REORDER' | 'QUEUE_REBUILD' | 'QUEUE_PROMOTE' | 'QUEUE_AUTO_CANCEL'
  // Attachments
  | 'ATTACHMENT_UPLOAD' | 'ATTACHMENT_ADD' | 'ATTACHMENT_UPDATE' | 'ATTACHMENT_ARCHIVE' | 'ATTACHMENT_DELETE'
  // Auth
  | 'LOGIN' | 'LOGOUT';

export type EntityType =
  | 'RESERVATION' | 'CLIENT' | 'ROOM' | 'HALL' | 'MENU'
  | 'USER' | 'DEPOSIT' | 'EVENT_TYPE' | 'ATTACHMENT'
  | 'QUEUE' | 'DISH' | 'MENU_TEMPLATE';

export interface AuditLogUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  details: {
    reason?: string;
    description?: string;
    changes?: Record<string, any>;
    [key: string]: any;
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser | null;
}

export interface AuditLogFilters {
  action?: AuditAction;
  entityType?: EntityType;
  userId?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogStatistics {
  totalLogs: number;
  byEntityType: Array<{ entityType: EntityType; count: number }>;
  byAction: Array<{ action: AuditAction; count: number }>;
  byUser: Array<{ userId: string; user: AuditLogUser | null; count: number }>;
}
