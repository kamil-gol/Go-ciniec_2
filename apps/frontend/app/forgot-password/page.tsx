'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, AlertCircle, Building2, Send, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Adres email jest wymagany')
      setLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Nieprawidłowy format adresu email')
      setLoading(false)
      return
    }

    try {
      await apiClient.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Sprawdź swoją skrzynkę email')
    } catch (error: any) {
      console.error('Forgot password error:', error)
      const errorMessage = error.response?.data?.error || 'Wystąpił błąd. Spróbuj ponownie.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-3xl" />
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
            className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl bg-primary-600 dark:bg-primary-500 shadow-2xl"
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
          className="relative bg-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-8"
        >
          <AnimatePresence mode="wait">
            {sent ? (
              /* ===== SUCCESS STATE ===== */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-success-50 dark:bg-success-900/30">
                  <CheckCircle2 className="w-8 h-8 text-success-600 dark:text-success-400" />
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                  Sprawdź swoją skrzynkę
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-2">
                  Jeśli konto z adresem <strong className="text-neutral-900 dark:text-neutral-100">{email}</strong> istnieje w naszym systemie, wysłaliśmy link do resetowania hasła.
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-6">
                  Link jest ważny przez 60 minut. Sprawdź też folder spam.
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 h-10 px-8 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Wróć do logowania
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
                    <Mail className="h-6 w-6 text-violet-600" />
                    Resetuj hasło
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                    Podaj adres email powiązany z Twoim kontem
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
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      Adres email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoFocus
                        className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700 focus:border-primary-500 focus:ring-ring/20 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-4 transition-all duration-200"
                        placeholder="twoj@email.pl"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setError('')
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="relative w-full py-3.5 px-6 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 overflow-hidden group"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Wysyłanie...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Wyślij link resetujący
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>

                {/* Back to login */}
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
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
          className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-300"
        >
          <p>&copy; 2026 Gościniec Rodzinny. Wszystkie prawa zastrzeżone.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
