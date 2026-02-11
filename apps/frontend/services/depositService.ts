import api from './api';
import type {
  Deposit,
  DepositStatistics,
  CreateDepositRequest,
  AddPaymentRequest,
  DepositFilters,
} from '../types/deposit';

interface DepositListResponse {
  deposits: Deposit[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const depositService = {
  // Get all deposits with filters
  async getDeposits(params?: {
    page?: number;
    perPage?: number;
    filters?: DepositFilters;
  }): Promise<DepositListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage) queryParams.append('perPage', params.perPage.toString());
    if (params?.filters?.status) queryParams.append('status', params.filters.status);
    if (params?.filters?.dateFrom) queryParams.append('dateFrom', params.filters.dateFrom);
    if (params?.filters?.dateTo) queryParams.append('dateTo', params.filters.dateTo);
    if (params?.filters?.search) queryParams.append('search', params.filters.search);
    if (params?.filters?.overdue) queryParams.append('overdue', 'true');

    const response = await api.get(`/deposits?${queryParams.toString()}`);
    return response.data;
  },

  // Get deposit by ID
  async getDeposit(id: string): Promise<Deposit> {
    const response = await api.get(`/deposits/${id}`);
    return response.data;
  },

  // Get deposits for a specific reservation
  async getReservationDeposits(reservationId: string): Promise<Deposit[]> {
    const response = await api.get(`/reservations/${reservationId}/deposits`);
    return response.data;
  },

  // Create new deposit
  async createDeposit(data: CreateDepositRequest): Promise<Deposit> {
    const response = await api.post('/deposits', data);
    return response.data;
  },

  // Update deposit
  async updateDeposit(id: string, data: Partial<CreateDepositRequest>): Promise<Deposit> {
    const response = await api.put(`/deposits/${id}`, data);
    return response.data;
  },

  // Delete deposit
  async deleteDeposit(id: string): Promise<void> {
    await api.delete(`/deposits/${id}`);
  },

  // Add payment to deposit
  async addPayment(depositId: string, data: AddPaymentRequest): Promise<Deposit> {
    const response = await api.post(`/deposits/${depositId}/payments`, data);
    return response.data;
  },

  // Get statistics
  async getStatistics(): Promise<DepositStatistics> {
    const response = await api.get('/deposits/statistics');
    return response.data;
  },

  // Get pending reminders
  async getPendingReminders(): Promise<Deposit[]> {
    const response = await api.get('/deposits/reminders/pending');
    return response.data;
  },

  // Mark reminder as sent
  async markReminderSent(depositId: string): Promise<void> {
    await api.put(`/deposits/${depositId}/reminder-sent`);
  },
};
