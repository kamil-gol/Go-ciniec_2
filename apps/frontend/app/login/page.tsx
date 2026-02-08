'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  })
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Clear field errors
    setFieldErrors({ email: '', password: '' })

    // Validate empty fields
    let hasErrors = false
    const newFieldErrors = { email: '', password: '' }
    
    if (!formData.email) {
      newFieldErrors.email = 'Email jest wymagany'
      hasErrors = true
    }
    
    if (!formData.password) {
      newFieldErrors.password = 'Hasło jest wymagane'
      hasErrors = true
    }
    
    if (hasErrors) {
      setFieldErrors(newFieldErrors)
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.post('/auth/login', formData)
      
      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token)
        toast.success('Zalogowano pomyślnie!')
        router.push('/dashboard') // Fixed: changed from /reservations to /dashboard
      }
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.error || 'Niepoprawny email lub hasło'
      setError(errorMessage)
      toast.error(errorMessage)
      
      // Security: Clear password field after failed login
      setFormData({ ...formData, password: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zaloguj się
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            System zarządzania rezerwacjami
          </p>
        </div>
        
        {/* Error message display */}
        {error && (
          <div className="error-message bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="admin@gosciniecrodzinny.pl"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setError('') // Clear error on input change
                  setFieldErrors({ ...fieldErrors, email: '' })
                }}
              />
              {fieldErrors.email && (
                <p className="error mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  fieldErrors.password ? 'border-red-500' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="********"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  setError('') // Clear error on input change
                  setFieldErrors({ ...fieldErrors, password: '' })
                }}
              />
              {fieldErrors.password && (
                <p className="error mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Domyślne konto:</p>
            <p className="font-mono text-xs mt-1">admin@gosciniecrodzinny.pl / Admin123!@#</p>
          </div>
        </form>
      </div>
    </div>
  )
}
