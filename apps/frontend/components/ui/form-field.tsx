'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface FormFieldProps {
  /** Etykieta pola */
  label: string
  /** ID powiązanego inputa */
  htmlFor: string
  /** Komunikat błędu walidacji */
  error?: string
  /** Tekst pomocniczy pod polem */
  description?: string
  /** Czy pole jest wymagane (wyświetla gwiazdkę) */
  required?: boolean
  /** Rozmiar pola */
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

const sizeClasses = {
  sm: '[&_label]:text-xs',
  md: '[&_label]:text-sm',
  lg: '[&_label]:text-sm',
} as const

/**
 * FormField — wrapper na label + input/select/textarea + error/description.
 *
 * Użycie:
 * ```tsx
 * <FormField label="Imię" htmlFor="firstName" error={errors.firstName?.message} required>
 *   <Input id="firstName" {...register('firstName')} />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  size = 'md',
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', sizeClasses[size], className)}>
      <label
        htmlFor={htmlFor}
        className="block font-medium text-foreground"
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p
          className="flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
