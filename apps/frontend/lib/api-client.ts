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
            toast.error('Sesja wygasła. Zaloguj się ponownie.', {
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
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (isDev) {
          console.error('[API Error]', error.config?.url, error.response?.status)
        }
        
        if (error.response) {
          const message = (error.response.data as any)?.error || (error.response.data as any)?.message || 'Wystąpił błąd'
          
          if (error.response.status === 401) {
            // Unauthorized - clear tokens and redirect to login
            localStorage.removeItem('token')
            localStorage.removeItem('auth_token')
            
            toast.error('Sesja wygasła. Zaloguj się ponownie.', {
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
          } else if (error.response.status === 403) {
            toast.error('Brak uprawnień do wykonania tej operacji', {
              duration: 4000
            })
          } else if (error.response.status === 404) {
            toast.error(`Nie znaleziono: ${message}`, {
              duration: 4000
            })
          } else if (error.response.status >= 500) {
            toast.error('Błąd serwera. Spróbuj ponownie później.', {
              duration: 5000,
              description: message
            })
          } else if (error.response.status === 400) {
            toast.error(message, {
              duration: 4000
            })
          } else {
            toast.error(message, {
              duration: 4000
            })
          }
        } else if (error.request) {
          toast.error('Brak połączenia z serwerem', {
            duration: 5000,
            description: 'Sprawdź połączenie internetowe lub skontaktuj się z administratorem'
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
