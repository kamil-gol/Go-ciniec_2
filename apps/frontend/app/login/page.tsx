'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, Mail, Lock, AlertCircle, Sparkles, Building2 } from 'lucide-react'

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
        router.push('/dashboard')
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/30 dark:bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full"
      >
        {/* Logo & Header Card */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl"
          >
            <Building2 className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2"
          >
            Gościniec Rodzinny
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-neutral-600 dark:text-neutral-400"
          >
            System zarządzania rezerwacjami
          </motion.p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-8"
        >
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-t-2xl" />

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <LogIn className="h-6 w-6 text-violet-600" />
              Zaloguj się
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Wprowadź swoje dane logowania
            </p>
          </div>
          
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-start gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-error-900 dark:text-error-100">
                      Błąd logowania
                    </p>
                    <p className="text-sm text-error-700 dark:text-error-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Adres email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 ${
                    fieldErrors.email 
                      ? 'text-error-500' 
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 ${
                    fieldErrors.email
                      ? 'border-error-500 focus:border-error-600 focus:ring-error-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-violet-500 focus:ring-violet-500/20'
                  } rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200`}
                  placeholder="admin@gosciniecrodzinny.pl"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setError('')
                    setFieldErrors({ ...fieldErrors, email: '' })
                  }}
                />
              </div>
              <AnimatePresence>
                {fieldErrors.email && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Hasło
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${
                    fieldErrors.password
                      ? 'text-error-500'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className={`w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 ${
                    fieldErrors.password
                      ? 'border-error-500 focus:border-error-600 focus:ring-error-500/20'
                      : 'border-neutral-200 dark:border-neutral-700 focus:border-violet-500 focus:ring-violet-500/20'
                  } rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setError('')
                    setFieldErrors({ ...fieldErrors, password: '' })
                  }}
                />
              </div>
              <AnimatePresence>
                {fieldErrors.password && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1"
                  >
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden group"
            >
              {/* Button shimmer effect */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logowanie...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Zaloguj się
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-start gap-2 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-900 dark:text-violet-100 mb-1">
                  Domyślne konto testowe
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-violet-700 dark:text-violet-300">
                    <span className="font-medium">Email:</span>{' '}
                    <code className="bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded">admin@gosciniecrodzinny.pl</code>
                  </p>
                  <p className="text-xs text-violet-700 dark:text-violet-300">
                    <span className="font-medium">Hasło:</span>{' '}
                    <code className="bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded">Admin123!@#</code>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400"
        >
          <p>© 2026 Gościniec Rodzinny. Wszystkie prawa zastrzeżone.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
