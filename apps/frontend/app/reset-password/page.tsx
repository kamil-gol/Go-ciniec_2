'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ArrowLeft, AlertCircle, Building2, KeyRound, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

const PASSWORD_REQUIREMENTS = [
  { label: 'Minimum 12 znaków', test: (p: string) => p.length >= 12 },
  { label: 'Co najmniej 1 wielka litera (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Co najmniej 1 mała litera (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Co najmniej 1 cyfra (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Co najmniej 1 znak specjalny (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  // Real-time password validation
  const passwordChecks = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map(req => ({
      label: req.label,
      passed: req.test(formData.newPassword),
    }))
  }, [formData.newPassword])

  const allPassed = passwordChecks.every(c => c.passed)
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast.error('Brak tokena resetowania hasła')
      router.replace('/forgot-password')
    }
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!allPassed) {
      setError('Hasło nie spełnia wszystkich wymagań')
      setLoading(false)
      return
    }

    if (!passwordsMatch) {
      setError('Hasła nie są identyczne')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      })
      setSuccess(true)
      toast.success('Hasło zostało zmienione!')

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      console.error('Reset password error:', error)
      const errorMessage = error.response?.data?.error || 'Wystąpił błąd. Spróbuj ponownie.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

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
          <AnimatePresence mode="wait">
            {success ? (
              /* ===== SUCCESS STATE ===== */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                  Hasło zmienione!
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-2">
                  Twoje hasło zostało pomyślnie zaktualizowane.
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
                  Za chwilę zostaniesz przekierowany do logowania...
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zaloguj się
                </Link>
              </motion.div>
            ) : (
              /* ===== FORM STATE ===== */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <KeyRound className="h-6 w-6 text-violet-600" />
                    Nowe hasło
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    Ustaw nowe hasło do swojego konta
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
                        <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password Field */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Nowe hasło
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        autoFocus
                        className="w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700 focus:border-violet-500 focus:ring-ring/20 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200"
                        placeholder="••••••••••••"
                        value={formData.newPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, newPassword: e.target.value })
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

                  {/* Password Requirements Checklist */}
                  {formData.newPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1.5 px-1"
                    >
                      {passwordChecks.map((check, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                          )}
                          <span className={`text-xs ${
                            check.passed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Powtórz hasło
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={`h-5 w-5 ${
                          formData.confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'text-emerald-500'
                              : 'text-error-500'
                            : 'text-neutral-400 dark:text-neutral-500'
                        }`} />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        className={`w-full pl-12 pr-12 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 ${
                          formData.confirmPassword.length > 0
                            ? passwordsMatch
                              ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-error-400 focus:border-error-500 focus:ring-error-500/20'
                            : 'border-neutral-200 dark:border-neutral-700 focus:border-violet-500 focus:ring-ring/20'
                        } rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200`}
                        placeholder="••••••••••••"
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
                    <AnimatePresence>
                      {formData.confirmPassword.length > 0 && !passwordsMatch && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 text-sm text-error-600 dark:text-error-400 flex items-center gap-1"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Hasła nie są identyczne
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !allPassed || !passwordsMatch}
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
                          <KeyRound className="h-5 w-5" />
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
                    className="inline-flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Wróć do logowania
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400"
        >
          <p>&copy; 2026 Gościniec Rodzinny. Wszystkie prawa zastrzeżone.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-800">
        <div className="h-8 w-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
