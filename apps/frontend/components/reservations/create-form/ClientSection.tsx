'use client'

import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Combobox } from '@/components/ui/combobox'
import { User, UserPlus, CheckCircle, Building2 } from 'lucide-react'
import type { ClientSectionProps } from './types'

export function ClientSection({
  formCtx,
  clientComboboxOptions,
  clientsLoading,
  selectedClient,
  isPromotingFromQueue,
  showCreateClientModal: _showCreateClientModal,
  setShowCreateClientModal,
}: ClientSectionProps) {
  const { control, errors } = formCtx

  const isClientCompany = (selectedClient as any)?.clientType === 'COMPANY'
  const clientCompanyName = (selectedClient as any)?.companyName
  const clientNip = (selectedClient as any)?.nip
  const clientPrimaryContact = (selectedClient as any)?.contacts?.find((c: any) => c.isPrimary)

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white mb-3">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Kto rezerwuje?</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-300 mt-1">Wyszukaj istniejącego klienta lub dodaj nowego</p>
      </div>

      {isPromotingFromQueue ? (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium text-blue-900 dark:text-blue-100">Klient przekazany z kolejki</span>
          </div>
          {selectedClient && (
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {isClientCompany && clientCompanyName ? (
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {clientCompanyName}
                  </p>
                  <p>{selectedClient.firstName} {selectedClient.lastName}{clientNip && ` · NIP: ${clientNip}`}</p>
                </div>
              ) : (
                <p>{selectedClient.firstName} {selectedClient.lastName}{selectedClient.phone && ` • ${selectedClient.phone}`}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Controller name="clientId" control={control} render={({ field }) => (
            <Combobox
              options={clientComboboxOptions}
              value={field.value}
              onChange={field.onChange}
              label="Klient"
              placeholder="Wyszukaj po nazwisku, firmie lub NIP..."
              searchPlaceholder="Wpisz imię, nazwisko, firmę lub NIP..."
              emptyMessage="Nie znaleziono klienta."
              error={errors.clientId?.message}
              disabled={clientsLoading}
            />
          )} />
          <button
            type="button"
            onClick={() => setShowCreateClientModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Dodaj nowego klienta
          </button>
        </div>
      )}

      {selectedClient && !isPromotingFromQueue && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isClientCompany ? 'bg-purple-200 dark:bg-purple-800' : 'bg-green-200 dark:bg-green-800'}`}>
              {isClientCompany ? <Building2 className="w-5 h-5 text-purple-700 dark:text-purple-300" /> : <User className="w-5 h-5 text-green-700 dark:text-green-300" />}
            </div>
            <div className="flex-1 min-w-0">
              {isClientCompany && clientCompanyName ? (
                <>
                  <p className="font-semibold text-green-900 dark:text-green-100">{clientCompanyName}</p>
                  {clientNip && <p className="text-xs text-green-700 dark:text-green-300">NIP: {clientNip}</p>}
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                    {clientPrimaryContact && clientPrimaryContact.firstName !== selectedClient.firstName && (
                      <span className="text-xs">· {clientPrimaryContact.firstName} {clientPrimaryContact.lastName}{clientPrimaryContact.role ? ` (${clientPrimaryContact.role})` : ''}</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-green-900 dark:text-green-100">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-300">
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
