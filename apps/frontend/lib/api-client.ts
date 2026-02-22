import axios, { AxiosError, AxiosInstance } from 'axios'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const isDev = process.env.NODE_ENV === 'development'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        // Try both 'token' and 'auth_token' for backwards compatibility
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        } else {
          // Show toast only for non-login requests
          if (!config.url?.includes('/auth/')) {
            toast.error('Sesja wygas\u0142a. Zaloguj si\u0119 ponownie.', {
              duration: 5000,
              action: {
                label: 'Zaloguj',
                onClick: () => window.location.href = '/login'
              }
            })
          }
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    // Supports _silent config flag to suppress toast for expected errors
    // Usage: apiClient.get('/url', { _silent: true } as any)
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (isDev) {
          console.error('[API Error]', error.config?.url, error.response?.status)
        }

        // Check if the caller wants to suppress error toasts
        const isSilent = (error.config as any)?._silent === true
        
        if (error.response) {
          const message = (error.response.data as any)?.error || (error.response.data as any)?.message || 'Wyst\u0105pi\u0142 b\u0142\u0105d'
          
          if (error.response.status === 401) {
            // Unauthorized - clear tokens and redirect to login
            localStorage.removeItem('token')
            localStorage.removeItem('auth_token')
            
            toast.error('Sesja wygas\u0142a. Zaloguj si\u0119 ponownie.', {
              duration: 5000,
              action: {
                label: 'Zaloguj',
                onClick: () => window.location.href = '/login'
              }
            })
            
            // Redirect after a short delay to allow toast to show
            setTimeout(() => {
              window.location.href = '/login'
            }, 1500)
          } else if (error.response.status === 403 && !isSilent) {
            toast.error('Brak uprawnie\u0144 do wykonania tej operacji', {
              duration: 4000
            })
          } else if (error.response.status === 404 && !isSilent) {
            toast.error(`Nie znaleziono: ${message}`, {
              duration: 4000
            })
          } else if (error.response.status >= 500 && !isSilent) {
            toast.error('B\u0142\u0105d serwera. Spr\u00f3buj ponownie p\u00f3\u017aniej.', {
              duration: 5000,
              description: message
            })
          } else if (!isSilent && error.response.status !== 404 && error.response.status !== 403 && error.response.status < 500) {
            toast.error(message, {
              duration: 4000
            })
          }
        } else if (error.request && !isSilent) {
          toast.error('Brak po\u0142\u0105czenia z serwerem', {
            duration: 5000,
            description: 'Sprawd\u017a po\u0142\u0105czenie internetowe lub skontaktuj si\u0119 z administratorem'
          })
        }
        
        return Promise.reject(error)
      }
    )
  }

  public get instance(): AxiosInstance {
    return this.client
  }
}

export const apiClient = new ApiClient().instance
