// apps/frontend/lib/api.ts
// Re-export apiClient as 'api' for consistency
import { apiClient } from './api-client';

export const api = apiClient;
export default api;
