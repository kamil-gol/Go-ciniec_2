/**
 * MenuSelectionFlow Component
 * 
 * Multi-step wizard for selecting menu, package, and options
 */

'use client';

import { useState } from 'react';
import { 
  MenuTemplate, 
  MenuPackage, 
  MenuOption,
  SelectedOption 
} from '@/types/menu.types';
import { 
  useMenuTemplates, 
  useMenuPackages, 
  useMenuOptions 
} from '@/hooks/use-menu';
import {
  MenuCard,
  MenuCardSkeleton,
  PackageCard,
  PackageCardSkeleton,
  OptionCard,
  OptionCardSkeleton,
} from '@/components/menu';
import { Check, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuSelectionFlowProps {
  eventTypeId?: string;
  onComplete?: (selection: {
    template: MenuTemplate;
    package: MenuPackage;
    selectedOptions: SelectedOption[];
    guestCounts: {
      adults: number;
      children: number;
      toddlers: number;
    };
  }) => void;
  className?: string;
}

type Step = 'template' | 'package' | 'guests' | 'options' | 'summary';

export function MenuSelectionFlow({ 
  eventTypeId,
  onComplete,
  className 
}: MenuSelectionFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate>();
  const [selectedPackage, setSelectedPackage] = useState<MenuPackage>();
  const [guestCounts, setGuestCounts] = useState({
    adults: 50,
    children: 10,
    toddlers: 5,
  });
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});

  // Queries
  const { data: templates, isLoading: templatesLoading } = useMenuTemplates({ 
    eventTypeId,
    isActive: true 
  });
  const { data: packages, isLoading: packagesLoading } = useMenuPackages(selectedTemplate?.id);
  const { data: options, isLoading: optionsLoading } = useMenuOptions({ isActive: true });

  const steps: { id: Step; label: string; }[] = [
    { id: 'template', label: 'Wybór Menu' },
    { id: 'package', label: 'Wybór Pakietu' },
    { id: 'guests', label: 'Liczba Gości' },
    { id: 'options', label: 'Opcje Dodatkowe' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleTemplateSelect = (template: MenuTemplate) => {
    setSelectedTemplate(template);
    setSelectedPackage(undefined); // Reset package when template changes
    setCurrentStep('package');
  };

  const handlePackageSelect = (pkg: MenuPackage) => {
    setSelectedPackage(pkg);
    setCurrentStep('guests');
  };

  const handleGuestsSubmit = () => {
    setCurrentStep('options');
  };

  const handleComplete = () => {
    if (!selectedTemplate || !selectedPackage) return;

    const selectedOptions: SelectedOption[] = Object.entries(optionQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([optionId, quantity]) => ({ optionId, quantity }));

    onComplete?.({
      template: selectedTemplate,
      package: selectedPackage,
      selectedOptions,
      guestCounts,
    });
  };

  return (
    <div className={cn('space-y-8', className)}>
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.id} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Step Circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all',
                    isCompleted && 'border-green-500 bg-green-500 text-white',
                    isActive && 'border-violet-600 bg-violet-600 text-white',
                    !isActive && !isCompleted && 'border-neutral-300 bg-white text-neutral-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                {/* Step Label */}
                <span
                  className={cn(
                    'hidden text-sm font-medium md:block',
                    isActive && 'text-violet-600',
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-neutral-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {/* Arrow */}
              {index < steps.length - 1 && (
                <ChevronRight className="h-5 w-5 text-neutral-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Select Template */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Wybierz Menu
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  Dostosowane do Twojego wydarzenia
                </p>
              </div>

              {templatesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <MenuCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates?.map(template => (
                    <MenuCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Package */}
          {currentStep === 'package' && selectedTemplate && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Wybierz Pakiet
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  {selectedTemplate.name}
                </p>
              </div>

              {packagesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <PackageCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages?.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      isSelected={selectedPackage?.id === pkg.id}
                      onSelect={handlePackageSelect}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={() => setCurrentStep('template')}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  ← Zmień menu
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Guest Counts */}
          {currentStep === 'guests' && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Liczba Gości
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  Podaj przybliżoną liczbę uczestników
                </p>
              </div>

              <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                {/* Adults */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
                    <Users className="h-5 w-5 text-violet-600" />
                    Dorośli
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={guestCounts.adults}
                    onChange={(e) => setGuestCounts(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                    className="w-24 rounded-lg border border-neutral-300 px-4 py-2 text-center font-semibold focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Children */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
                    <Users className="h-5 w-5 text-violet-600" />
                    Dzieci (do 12 lat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={guestCounts.children}
                    onChange={(e) => setGuestCounts(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                    className="w-24 rounded-lg border border-neutral-300 px-4 py-2 text-center font-semibold focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Toddlers */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
                    <Users className="h-5 w-5 text-violet-600" />
                    Maluchy (do 3 lat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={guestCounts.toddlers}
                    onChange={(e) => setGuestCounts(prev => ({ ...prev, toddlers: parseInt(e.target.value) || 0 }))}
                    className="w-24 rounded-lg border border-neutral-300 px-4 py-2 text-center font-semibold focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                {/* Total */}
                <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-white">Razem:</span>
                    <span className="text-2xl font-bold text-violet-600">
                      {guestCounts.adults + guestCounts.children + guestCounts.toddlers} osób
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCurrentStep('package')}
                  className="rounded-lg border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  ← Wstecz
                </button>
                <button
                  onClick={handleGuestsSubmit}
                  className="rounded-lg bg-violet-600 px-6 py-2.5 font-semibold text-white hover:bg-violet-700"
                >
                  Dalej →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Select Options */}
          {currentStep === 'options' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Opcje Dodatkowe
                </h2>
                <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                  Wybierz dodatkowe usługi (opcjonalne)
                </p>
              </div>

              {optionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <OptionCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {options?.map(option => (
                    <OptionCard
                      key={option.id}
                      option={option}
                      quantity={optionQuantities[option.id] || 0}
                      onQuantityChange={(id, qty) => {
                        setOptionQuantities(prev => ({ ...prev, [id]: qty }));
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCurrentStep('guests')}
                  className="rounded-lg border border-neutral-300 px-6 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  ← Wstecz
                </button>
                <button
                  onClick={handleComplete}
                  className="rounded-lg bg-green-600 px-6 py-2.5 font-semibold text-white hover:bg-green-700"
                >
                  Zakończ
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
