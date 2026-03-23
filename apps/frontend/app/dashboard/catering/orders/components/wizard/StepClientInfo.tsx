import { motion } from 'framer-motion';
import { Combobox } from '@/components/ui/combobox';
import { User, Building2, UserPlus } from 'lucide-react';
import { StepHeader } from './StepHeader';
import type { SetState } from './types';

interface StepClientInfoProps {
  clientId: string;
  set: SetState;
  clientComboboxOptions: { value: string; label: string; description?: string; secondaryLabel?: string }[];
  clientsLoading: boolean;
  selectedClient: any | undefined;
  onOpenCreateClient: () => void;
}

export function StepClientInfo({
  clientId,
  set,
  clientComboboxOptions,
  clientsLoading,
  selectedClient,
  onOpenCreateClient,
}: StepClientInfoProps) {
  const isCompany = selectedClient?.clientType === 'COMPANY';
  const nip = selectedClient?.nip;
  const primaryContact = (selectedClient?.contacts as any[])?.find((c: any) => c.isPrimary);

  return (
    <div className="space-y-6">
      <StepHeader stepIndex={0} />
      <div className="space-y-3">
        <Combobox
          options={clientComboboxOptions}
          value={clientId}
          onChange={val => set({ clientId: val })}
          label="Klient"
          placeholder="Wyszukaj po nazwisku, firmie lub NIP..."
          searchPlaceholder="Wpisz imię, nazwisko, firmę lub NIP..."
          emptyMessage="Nie znaleziono klienta."
          disabled={clientsLoading}
        />
        <button
          type="button"
          onClick={onOpenCreateClient}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Dodaj nowego klienta
        </button>
      </div>

      {selectedClient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCompany ? 'bg-purple-200 dark:bg-purple-800' : 'bg-green-200 dark:bg-green-800'
            }`}>
              {isCompany
                ? <Building2 className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                : <User className="w-5 h-5 text-green-700 dark:text-green-300" />}
            </div>
            <div className="flex-1 min-w-0">
              {isCompany && selectedClient.companyName ? (
                <>
                  <p className="font-semibold text-green-900 dark:text-green-100">{selectedClient.companyName}</p>
                  {nip && <p className="text-xs text-green-700 dark:text-green-300">NIP: {nip}</p>}
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                    {primaryContact && primaryContact.firstName !== selectedClient.firstName && (
                      <span className="text-xs">· {primaryContact.firstName} {primaryContact.lastName}{primaryContact.role ? ` (${primaryContact.role})` : ''}</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
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
  );
}
