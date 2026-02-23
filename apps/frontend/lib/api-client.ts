/**
 * 🔌 API Client z auto-refresh interceptorem (#145)
 *
 * Centralna instancja axios dla całego frontendu.
 * - Request: automatycznie dołącza Bearer token
 * - Response 401: próbuje refresh → retry oryginalnego requesta
 * - Concurrent queue: jeden refresh naraz, reszta czeka
 */
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ═══════════════════════════════════════════════
// LOCAL STORAGE KEYS — must match existing login flow!
// ═══════════════════════════════════════════════
const LS_ACCESS_TOKEN = 'auth_token';      // existing login saves JWT here
const LS_REFRESH_TOKEN = 'refreshToken';   // new — saved by updated login

// ═══════════════════════════════════════════════
// AXIOS INSTANCE
// ═══════════════════════════════════════════════
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s
});

// ═══════════════════════════════════════════════
// REQUEST INTERCEPTOR — attach Bearer token
// ═══════════════════════════════════════════════
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip token attachment for auth endpoints (login, register, refresh, logout)
    const isAuthEndpoint = config.url?.match(/\/auth\/(login|register|refresh|logout)/);
    if (isAuthEndpoint) return config;

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(LS_ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════
// RESPONSE INTERCEPTOR — 401 auto-refresh with queue
// ═══════════════════════════════════════════════

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process queued requests after refresh completes.
 */
function processQueue(error: Error | null, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error || !token) {
      promise.reject(error || new Error('Refresh failed'));
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Attempt to refresh the access token.
 * Returns new access token on success, null on failure.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const refreshToken = localStorage.getItem(LS_REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    // Use raw axios (not apiClient) to avoid interceptor loop
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    localStorage.setItem(LS_ACCESS_TOKEN, accessToken);
    localStorage.setItem(LS_REFRESH_TOKEN, newRefreshToken);

    return accessToken;
  } catch {
    // Refresh failed — clear everything
    localStorage.removeItem(LS_ACCESS_TOKEN);
    localStorage.removeItem(LS_REFRESH_TOKEN);
    return null;
  }
}

/**
 * Force logout — clear tokens and redirect to login.
 */
function forceLogout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LS_ACCESS_TOKEN);
  localStorage.removeItem(LS_REFRESH_TOKEN);
  window.location.href = '/login';
}

apiClient.interceptors.response.use(
  // Success — pass through
  (response) => response,

  // Error handler
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 (Unauthorized)
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Don't retry auth endpoints (prevents infinite loop)
    const isAuthEndpoint = originalRequest.url?.match(
      /\/auth\/(login|register|refresh|logout)/
    );
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Don't retry if already retried
    if (originalRequest._retry) {
      forceLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Start refresh
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      if (!newToken) {
        processQueue(new Error('Refresh failed'), null);
        forceLogout();
        return Promise.reject(error);
      }

      // Success — process queue and retry original
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
