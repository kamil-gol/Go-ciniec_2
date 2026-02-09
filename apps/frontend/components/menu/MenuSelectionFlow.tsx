/**
 * MenuSelectionFlow Component
 * 
 * Multi-step wizard for selecting menu, package, and options
 * Premium UI with gradients and animations
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
import { Check, ChevronRight, Users, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MenuSelectionFlowProps {
  eventTypeId?: string;
  eventDate?: Date;
  adults?: number;
  children?: number;
  toddlers?: number;
  initialSelection?: {
    templateId?: string;
    packageId?: string;
    selectedOptions?: SelectedOption[];
  };
  onComplete?: (selection: any) => void;
  className?: string;
}

type Step = 'template' | 'package' | 'guests' | 'options';

export function MenuSelectionFlow({ 
  eventTypeId,
  eventDate,
  adults = 50,
  children = 10,
  toddlers = 5,
  initialSelection,
  onComplete,
  className 
}: MenuSelectionFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate>();
  const [selectedPackage, setSelectedPackage] = useState<MenuPackage>();
  const [guestCounts, setGuestCounts] = useState({
    adults,
    children,
    toddlers,
  });
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});

  // Queries
  const { data: templates, isLoading: templatesLoading } = useMenuTemplates({ 
    eventTypeId,
    isActive: true 
  });
  const { data: packages, isLoading: packagesLoading } = useMenuPackages(selectedTemplate?.id);
  const { data: options, isLoading: optionsLoading } = useMenuOptions({ isActive: true });

  const steps: { id: Step; label: string; icon: any; gradient: string; }[] = [
    { id: 'template', label: 'Wybór Menu', icon: Sparkles, gradient: 'from-orange-500 to-amber-500' },
    { id: 'package', label: 'Pakiet', icon: Check, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'guests', label: 'Goście', icon: Users, gradient: 'from-purple-500 to-pink-500' },
    { id: 'options', label: 'Dodatki', icon: Sparkles, gradient: 'from-green-500 to-emerald-500' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleTemplateSelect = (template: MenuTemplate) => {
    setSelectedTemplate(template);
    setSelectedPackage(undefined);
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
      templateId: selectedTemplate.id,
      packageId: selectedPackage.id,
      selectedOptions,
      adultsCount: guestCounts.adults,
      childrenCount: guestCounts.children,
      toddlersCount: guestCounts.toddlers,
    });
  };

  const totalGuests = guestCounts.adults + guestCounts.children + guestCounts.toddlers;

  return (
    <div className={cn('space-y-8', className)}>
      {/* Premium Progress Steps */}
      <div className="relative">
        {/* Background gradient line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-blue-500 via-purple-500 to-green-500 rounded-full opacity-20" />
        
        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = index < currentStepIndex;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                {/* Step Circle */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.1 : 1, 
                    opacity: 1 
                  }}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-full border-4 font-bold transition-all shadow-lg',
                    isCompleted && 'border-green-500 bg-gradient-to-br from-green-500 to-emerald-500 text-white',
                    isActive && `border-white bg-gradient-to-br ${step.gradient} text-white shadow-xl`,
                    !isActive && !isCompleted && 'border-gray-300 bg-white text-gray-400 dark:bg-gray-800 dark:border-gray-600'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <StepIcon className="h-6 w-6" />
                  )}
                  
                  {/* Glow effect for active step */}
                  {isActive && (
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} blur-xl opacity-40 -z-10`} />
                  )}
                </motion.div>
                
                {/* Step Label */}
                <span
                  className={cn(
                    'text-xs sm:text-sm font-semibold text-center transition-colors',
                    isActive && 'text-transparent bg-clip-text bg-gradient-to-r ' + step.gradient,
                    isCompleted && 'text-green-600',
                    !isActive && !isCompleted && 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content with Premium Animations */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Step 1: Select Template */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg mb-2">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Wybierz Menu
                </h2>
                <p className="text-muted-foreground">
                  Dostosowane do Twojego wydarzenia
                </p>
              </div>

              {templatesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <MenuCardSkeleton key={i} />)}
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map(template => (
                    <MenuCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-orange-600" />
                  </div>
                  <p className="text-muted-foreground">Brak dostępnych menu</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Package */}
          {currentStep === 'package' && selectedTemplate && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-2">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Wybierz Pakiet
                </h2>
                <p className="text-muted-foreground">
                  {selectedTemplate.name} - {selectedTemplate.variant}
                </p>
              </div>

              {packagesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(i => <PackageCardSkeleton key={i} />)}
                </div>
              ) : packages && packages.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      isSelected={selectedPackage?.id === pkg.id}
                      onSelect={handlePackageSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Brak dostępnych pakietów</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('template')}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zmień menu
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Guest Counts */}
          {currentStep === 'guests' && (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-2">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Liczba Gości
                </h2>
                <p className="text-muted-foreground">
                  Podaj przybliżoną liczbę uczestników
                </p>
              </div>

              <div className="space-y-4 rounded-2xl border-2 bg-white dark:bg-gray-950 p-8 shadow-xl">
                {/* Adults */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                  <label className="flex items-center gap-3 font-semibold text-lg">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Dorośli
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={guestCounts.adults}
                    onChange={(e) => setGuestCounts(prev => ({ ...prev, adults: parseInt(e.target.value) || 0 }))}
                    className="w-28 rounded-xl border-2 border-purple-200 px-4 py-3 text-center text-xl font-bold focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                {/* Children */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                  <label className="flex items-center gap-3 font-semibold text-lg">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Dzieci (do 12 lat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={guestCounts.children}
                    onChange={(e) => setGuestCounts(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                    className="w-28 rounded-xl border-2 border-blue-200 px-4 py-3 text-center text-xl font-bold focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                {/* Toddlers */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl">
                  <label className="flex items-center gap-3 font-semibold text-lg">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-md">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Maluchy (do 3 lat)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={guestCounts.toddlers}
                    onChange={(e) => setGuestCounts(prev => ({ ...prev, toddlers: parseInt(e.target.value) || 0 }))}
                    className="w-28 rounded-xl border-2 border-green-200 px-4 py-3 text-center text-xl font-bold focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all"
                  />
                </div>

                {/* Total */}
                <div className="border-t-2 pt-6 mt-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white shadow-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-8 w-8" />
                      <span className="text-xl font-bold">Razem:</span>
                    </div>
                    <span className="text-4xl font-bold">
                      {totalGuests}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep('package')}
                  className="border-2 px-8"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Wstecz
                </Button>
                <Button
                  size="lg"
                  onClick={handleGuestsSubmit}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 shadow-lg"
                >
                  Dalej
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Select Options */}
          {currentStep === 'options' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg mb-2">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Opcje Dodatkowe
                </h2>
                <p className="text-muted-foreground">
                  Wybierz dodatkowe usługi (opcjonalne)
                </p>
              </div>

              {optionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <OptionCardSkeleton key={i} />)}
                </div>
              ) : options && options.length > 0 ? (
                <div className="space-y-4">
                  {options.map(option => (
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
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-950 rounded-2xl border-2">
                  <p className="text-muted-foreground">Brak dostępnych opcji dodatkowych</p>
                </div>
              )}

              <div className="flex justify-center gap-4 pt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep('guests')}
                  className="border-2 px-8"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Wstecz
                </Button>
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-12 shadow-lg text-lg"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Zatwierdź wybór
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
