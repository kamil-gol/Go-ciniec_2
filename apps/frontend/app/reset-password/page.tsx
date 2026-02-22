'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowLeft, AlertCircle, CheckCircle2, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [requirements, setRequirements] = useState<string[]>([])
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  // Fetch password requirements
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        const response = await apiClient.get('/auth/password-requirements')
        if (response.data.success) {
          setRequirements(response.data.data.requirements)
        }
      } catch {
        setRequirements([
          'Minimum 12 znaków',
          'Co najmniej 1 wielka litera (A-Z)',
          'Co najmniej 1 mała litera (a-z)',
          'Co najmniej 1 cyfra (0-9)',
          'Co najmniej 1 znak specjalny (!@#$%^&*)',
        ])
      }
    }
    fetchRequirements()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.password || !formData.confirmPassword) {
      setError('Oba pola hasła są wymagane')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne')
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        password: formData.password,
      })

      if (response.data.success) {
        setSuccess(true)
        toast.success('Hasło zostało zmienione!')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Wystąpił błąd. Spróbuj ponownie.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // No token in URL
  if (!token) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Brak tokena
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Link jest nieprawidłowy lub niekompletny. Użyj linku z otrzymanego emaila.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Wygeneruj nowy link
        </Link>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Hasło zmienione!
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Twoje hasło zostało pomyślnie zmienione. Możesz się teraz zalogować nowym hasłem.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          Przejdź do logowania
        </Link>
      </motion.div>
    )
  }

  // Form state
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-violet-600" />
          Nowe hasło
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Ustaw nowe hasło dla swojego konta
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
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Requirements */}
      {requirements.length > 0 && (
        <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl">
          <p className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-2">
            Wymagania hasła:
          </p>
          <ul className="space-y-1">
            {requirements.map((req, i) => (
              <li key={i} className="text-xs text-violet-700 dark:text-violet-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 dark:bg-violet-500 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* New Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Nowe hasło
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200"
              placeholder="Nowe hasło"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                setError('')
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Potwierdź hasło
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              className="w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200"
              placeholder="Powtórz nowe hasło"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value })
                setError('')
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="relative w-full py-3.5 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden group"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Zapisywanie...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" />
                Ustaw nowe hasło
              </>
            )}
          </span>
        </motion.button>
      </form>

      {/* Back to login */}
      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do logowania
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
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
        {/* Logo & Header */}
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
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-8"
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
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
