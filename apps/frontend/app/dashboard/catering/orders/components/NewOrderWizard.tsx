'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCreateCateringOrder } from '@/hooks/use-catering-orders';
import { useCateringTemplates } from '@/hooks/use-catering';
import { useClients } from '@/hooks/use-clients';
import { useDishes } from '@/hooks/use-dishes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper, StepNavigation } from '@/components/ui/stepper';
import { CreateClientModal } from '@/components/clients/create-client-modal';

import { STEPS, INITIAL, stepVariants } from './wizard/types';
import type { WizardState } from './wizard/types';
import { formatPln, buildAddress } from './wizard/utils';
import { StepClientInfo } from './wizard/StepClientInfo';
import { StepEventDetails } from './wizard/StepEventDetails';
import { StepTemplate } from './wizard/StepTemplate';
import { StepItems } from './wizard/StepItems';
import { StepDelivery } from './wizard/StepDelivery';
import { StepSummary } from './wizard/StepSummary';

interface Props {
  onSuccess: (id: string) => void;
}

export function NewOrderWizard({ onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [state, setState] = useState<WizardState>(INITIAL);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: templates } = useCateringTemplates(false);
  const { data: dishes } = useDishes({ isActive: true });
  const createOrder = useCreateCateringOrder();

  const set = useCallback((partial: Partial<WizardState>) =>
    setState(prev => ({ ...prev, ...partial })), []);

  const clientsArray = useMemo(
    () => (Array.isArray(clientsData) ? clientsData : []),
    [clientsData]
  );

  const clientComboboxOptions = useMemo(() =>
    clientsArray.map((client: { id: string; firstName: string; lastName: string; companyName?: string | null }) => {
      const isCompany = client.clientType === 'COMPANY';
      if (isCompany && client.companyName) {
        return {
          value: client.id,
          label: `🏢 ${client.companyName} · ${client.firstName} ${client.lastName}`,
          description: client.nip ? `NIP: ${client.nip}` : client.email || undefined,
          secondaryLabel: client.phone || undefined,
        };
      }
      return {
        value: client.id,
        label: `${client.firstName} ${client.lastName}`,
        description: client.email || undefined,
        secondaryLabel: client.phone || undefined,
      };
    }),
    [clientsArray]
  );

  const selectedClient = useMemo(
    () => clientsArray.find((c: { id: string; isPrimary?: boolean }) => c.id === state.clientId) as { id: string } | undefined,
    [clientsArray, state.clientId]
  );

  useEffect(() => {
    if (!selectedClient) return;
    const isCompany = selectedClient.clientType === 'COMPANY';
    if (isCompany) {
      const primaryContact = (selectedClient.contacts as { id: string; isPrimary?: boolean }[])?.find((c: { id: string; isPrimary?: boolean }) => c.isPrimary);
      const contact = primaryContact ?? (selectedClient.contacts as { id: string; isPrimary?: boolean }[])?.[0];
      set({
        contactName: contact
          ? `${contact.firstName} ${contact.lastName}`
          : `${selectedClient.firstName} ${selectedClient.lastName}`,
        contactPhone: contact?.phone ?? selectedClient.phone ?? '',
        contactEmail: contact?.email ?? selectedClient.email ?? '',
      });
    } else {
      set({
        contactName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        contactPhone: selectedClient.phone ?? '',
        contactEmail: selectedClient.email ?? '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.clientId]);

  const handleClientCreated = useCallback(async (newClient: { id: string }) => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] });
    set({
      clientId: newClient.id,
      clientName:
        newClient.clientType === 'COMPANY' && newClient.companyName
          ? newClient.companyName
          : `${newClient.firstName} ${newClient.lastName}`,
    });
    setShowCreateClientModal(false);
  }, [queryClient, set]);

  const selectedTemplate = templates?.find((t: { id: string }) => t.id === state.templateId);
  const templatePackages =
    selectedTemplate &&
    Array.isArray(selectedTemplate.packages) &&
    selectedTemplate.packages.length > 0
      ? (selectedTemplate.packages as { id: string; name: string; basePrice: number }[])
      : null;

  const dishesArray = useMemo(() => Array.isArray(dishes) ? dishes : [], [dishes]);

  const dishOptions = useMemo(() =>
    dishesArray.map((d: { id: string; name: string }) => ({
      value: d.id,
      label: d.name,
      description: d.description || undefined,
      secondaryLabel: d.price != null ? formatPln(d.price) : undefined,
    })),
    [dishesArray]
  );

  const isStep4Valid = useMemo(() => {
    const hasTime = !!state.deliveryTime;
    if (state.deliveryType === 'PICKUP') return hasTime;
    return hasTime
      && !!state.deliveryCity.trim()
      && !!state.deliveryStreet.trim()
      && !!state.deliveryNumber.trim();
  }, [state.deliveryType, state.deliveryTime, state.deliveryCity, state.deliveryStreet, state.deliveryNumber]);

  const goToNextStep = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, step]));
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    setMaxStep(prev => Math.max(prev, next));
  }, [step]);

  const goToPrevStep = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index <= maxStep) setStep(index);
  }, [maxStep]);

  const isNextDisabled =
    (step === 0 && !state.clientId) ||
    (step === 4 && !isStep4Valid);

  const handleSubmit = async () => {
    const validItems = state.items.filter(item => item.dishId.trim() !== '');
    const validExtras = state.extras.filter(extra => extra.name.trim() !== '');
    const deliveryAddress = buildAddress(state.deliveryStreet, state.deliveryNumber, state.deliveryCity) || null;

    try {
      const order = await createOrder.mutateAsync({
        clientId: state.clientId,
        templateId: state.templateId || null,
        packageId: state.packageId || null,
        deliveryType: state.deliveryType,
        eventName: state.eventName || null,
        eventDate: state.eventDate || null,
        guestsCount: parseInt(state.guestsCount, 10) || 0,
        deliveryAddress,
        deliveryDate: state.eventDate || null,
        deliveryTime: state.deliveryTime || null,
        deliveryNotes: state.deliveryNotes || null,
        contactName: state.contactName || null,
        contactPhone: state.contactPhone || null,
        contactEmail: state.contactEmail || null,
        notes: state.notes || null,
        specialRequirements: state.specialRequirements || null,
        items: validItems.length > 0 ? validItems : undefined,
        extras: validExtras.length > 0 ? validExtras : undefined,
      });
      onSuccess(order.id);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        toast.error('Brak uprawnień do tworzenia zamówień cateringowych');
      } else if (status === 401) {
        toast.error('Sesja wygasła — zaloguj się ponownie');
      } else {
        toast.error('Nie udało się utworzyć zamówienia. Spróbuj ponownie.');
      }
    }
  };

  // ═══ STEP RENDERERS ═══

  const renderStep0 = () => (
    <StepClientInfo
      clientId={state.clientId}
      set={set}
      clientComboboxOptions={clientComboboxOptions}
      clientsLoading={clientsLoading}
      selectedClient={selectedClient}
      onOpenCreateClient={() => setShowCreateClientModal(true)}
    />
  );

  const renderStep1 = () => (
    <StepEventDetails state={state} set={set} />
  );

  const renderStep2 = () => (
    <StepTemplate
      templateId={state.templateId}
      packageId={state.packageId}
      set={set}
      templates={templates}
      templatePackages={templatePackages}
    />
  );

  const renderStep3 = () => (
    <StepItems
      state={state}
      set={set}
      dishOptions={dishOptions}
      dishesArray={dishesArray}
    />
  );

  const renderStep4 = () => (
    <StepDelivery state={state} set={set} isStep4Valid={isStep4Valid} />
  );

  const renderStep5 = () => (
    <StepSummary
      state={state}
      set={set}
      selectedClient={selectedClient}
      goToStep={goToStep}
    />
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
            <CardTitle className="text-xl">Nowe zamówienie cateringowe</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Stepper steps={STEPS} currentStep={step} completedSteps={completedSteps} onStepClick={goToStep} className="mb-8" />
            {/* Mobile step indicator */}
            <div className="md:hidden text-center mb-4">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                Krok {step + 1} z {STEPS.length}: {STEPS[step].title}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}`}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {stepRenderers[step]()}
              </motion.div>
            </AnimatePresence>
            <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700 p-4 -mx-4 mt-6 md:relative md:border-0 md:p-0 md:mx-0 md:mt-0 md:bg-transparent md:backdrop-blur-none">
              <StepNavigation
                currentStep={step}
                totalSteps={STEPS.length}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
                onSubmit={handleSubmit}
                isNextDisabled={isNextDisabled}
                isSubmitting={createOrder.isPending}
                submitLabel="Utwórz zamówienie"
                className="mt-8"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <CreateClientModal
        open={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onSuccess={handleClientCreated}
      />
    </>
  );
}
