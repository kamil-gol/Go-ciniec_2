import axios, { AxiosError, AxiosInstance } from 'axios'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          const message = (error.response.data as any)?.message || 'Wystąpił błąd'
          
          if (error.response.status === 401) {
            localStorage.removeItem('auth_token')
            window.location.href = '/login'
            toast.error('Sesja wygasła. Zaloguj się ponownie.')
          } else if (error.response.status === 403) {
            toast.error('Brak uprawnień do wykonania tej operacji')
          } else if (error.response.status >= 500) {
            toast.error('Błąd serwera. Spróbuj ponownie później.')
          } else {
            toast.error(message)
          }
        } else if (error.request) {
          toast.error('Brak połączenia z serwerem')
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
