'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motionTokens } from '@/lib/design-tokens'

export interface StepConfig {
  id: string
  title: string
  description?: string
  icon: LucideIcon
  isOptional?: boolean
}

interface StepperProps {
  steps: StepConfig[]
  currentStep: number
  onStepClick?: (stepIndex: number) => void
  completedSteps?: Set<number>
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  completedSteps = new Set(),
  className,
}: StepperProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop stepper */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = completedSteps.has(index)
          const isPast = index < currentStep
          const isClickable = onStepClick && (isCompleted || isPast || index === currentStep + 1)
          const StepIcon = step.icon

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  'flex flex-col items-center gap-2 relative',
                  isClickable && 'cursor-pointer group'
                )}
                onClick={() => isClickable && onStepClick?.(index)}
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onStepClick?.(index)
                  }
                }}
              >
                {/* Circle */}
                <motion.div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors',
                    isActive && 'border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/30',
                    isCompleted && 'border-success-500 bg-success-500 text-white',
                    isPast && !isCompleted && 'border-primary-300 bg-primary-100 text-primary-600',
                    !isActive && !isCompleted && !isPast && 'border-secondary-300 bg-white dark:bg-neutral-900 text-neutral-500',
                    isClickable && !isActive && 'group-hover:border-primary-400 group-hover:bg-primary-50'
                  )}
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: motionTokens.duration.normal }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </motion.div>

                {/* Label */}
                <div className="text-center">
                  <p
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isActive && 'text-primary-700',
                      isCompleted && 'text-success-700',
                      !isActive && !isCompleted && 'text-neutral-500'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.isOptional && (
                    <p className="text-[10px] text-neutral-500">opcjonalny</p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 mt-[-24px]">
                  <div className="h-0.5 bg-secondary-200 relative overflow-hidden rounded-full">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{
                        width: isPast || isCompleted ? '100%' : isActive ? '50%' : '0%',
                      }}
                      transition={{ duration: motionTokens.duration.medium, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile stepper — compact with step icons */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Krok {currentStep + 1} z {steps.length}
          </p>
          <p className="text-sm font-semibold text-primary-600">
            {steps[currentStep]?.title}
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: motionTokens.duration.medium, ease: 'easeInOut' }}
          />
        </div>

        {/* Step icons row */}
        <div className="flex justify-between mt-3 px-1 overflow-x-auto gap-1">
          {steps.map((step, index) => {
            const isActive = index === currentStep
            const isCompleted = completedSteps.has(index)
            const isPast = index < currentStep
            const StepIcon = step.icon

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => (isCompleted || isPast) && onStepClick?.(index)}
                disabled={!isCompleted && !isPast}
                className={cn(
                  'flex flex-col items-center gap-0.5 min-w-0',
                  (isCompleted || isPast) && onStepClick && 'cursor-pointer'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-primary-500 text-white shadow-sm',
                    isCompleted && 'bg-success-500 text-white',
                    isPast && !isCompleted && 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
                    !isActive && !isCompleted && !isPast && 'bg-secondary-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className={cn(
                  'text-[9px] font-medium truncate max-w-[48px] hidden xs:block',
                  isActive && 'text-primary-600',
                  isCompleted && 'text-success-600',
                  !isActive && !isCompleted && 'text-neutral-500'
                )}>
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* Step content wrapper with animation */
interface StepContentProps {
  children: React.ReactNode
  stepIndex: number
  currentStep: number
  className?: string
}

export function StepContent({ children, stepIndex, currentStep, className }: StepContentProps) {
  if (stepIndex !== currentStep) return null

  return (
    <motion.div
      key={stepIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: motionTokens.duration.normal, ease: 'easeInOut' }}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  )
}

/* Step navigation buttons */
interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSubmit?: () => void
  isNextDisabled?: boolean
  isSubmitting?: boolean
  nextLabel?: string
  prevLabel?: string
  submitLabel?: string
  className?: string
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSubmit,
  isNextDisabled = false,
  isSubmitting = false,
  nextLabel = 'Dalej',
  prevLabel = 'Wstecz',
  submitLabel = 'Utwórz Rezerwację',
  className,
}: StepNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1
  const isFirstStep = currentStep === 0

  return (
    <div className={cn('flex items-center justify-between pt-6 border-t border-secondary-200 dark:border-neutral-700', className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
          isFirstStep
            ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-secondary-100 dark:hover:bg-neutral-800'
        )}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {prevLabel}
      </button>

      <div className="flex items-center gap-3">
        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || isNextDisabled}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all',
              'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
            )}
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Tworzenie...
              </>
            ) : (
              <>
                {submitLabel}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all',
              'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
            )}
          >
            {nextLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
