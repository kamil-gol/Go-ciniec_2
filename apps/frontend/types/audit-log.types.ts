// apps/frontend/types/audit-log.types.ts

export type AuditAction = 'ARCHIVE' | 'UNARCHIVE' | 'CREATE' | 'UPDATE' | 'DELETE';
export type EntityType = 'RESERVATION' | 'CLIENT' | 'ROOM' | 'MENU' | 'USER';

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
  };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: AuditLogUser;
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
  byUser: Array<{ userId: string; user: AuditLogUser; count: number }>;
}
