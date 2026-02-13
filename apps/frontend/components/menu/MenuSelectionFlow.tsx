/**
 * MenuSelectionFlow Component
 * 
 * Multi-step wizard for selecting menu, package, dishes, and options
 * Premium UI with gradients and animations
 * 
 * PHASE A: Guest counts come from reservation (read-only, no step 4)
 * FIX v2: Always fetch package by ID to reliably find the template
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  MenuTemplate, 
  MenuPackage, 
  MenuOption,
  SelectedOption 
} from '@/types/menu.types';
import { 
  useMenuTemplates, 
  useMenuPackages,
  useMenuPackage,
  useMenuOptions 
} from '@/hooks/use-menu';
import {
  MenuCard,
  MenuCardSkeleton,
  PackageCard,
  PackageCardSkeleton,
} from '@/components/menu';
import { OptionsSelector } from '@/components/menu/OptionsSelector';
import { DishSelector } from '@/components/menu/DishSelector';
import { Check, ChevronRight, Users, ArrowLeft, Sparkles, UtensilsCrossed, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DishSelection {
  dishId: string
  quantity: number
}

interface CategorySelection {
  categoryId: string
  dishes: DishSelection[]
}

interface MenuSelectionFlowProps {
  eventTypeId?: string;
  eventDate?: Date;
  /** Guest counts from reservation (read-only, single source of truth) */
  adults: number;
  children: number;
  toddlers: number;
  initialSelection?: {
    templateId?: string;
    packageId?: string;
    selectedOptions?: SelectedOption[];
    dishSelections?: CategorySelection[];
  };
  onComplete?: (selection: any) => void;
  className?: string;
}

// 4 steps: template -> package -> dishes -> options
type Step = 'template' | 'package' | 'dishes' | 'options';

export function MenuSelectionFlow({ 
  eventTypeId,
  eventDate,
  adults,
  children,
  toddlers,
  initialSelection,
  onComplete,
  className 
}: MenuSelectionFlowProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate>();
  const [selectedPackage, setSelectedPackage] = useState<MenuPackage>();
  const [dishSelections, setDishSelections] = useState<CategorySelection[]>(initialSelection?.dishSelections || []);
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Total guests calculated from reservation props (read-only)
  const totalGuests = adults + children + toddlers;

  // ── Queries ────────────────────────────────────────────────────────
  const { data: templates, isLoading: templatesLoading } = useMenuTemplates({ 
    eventTypeId,
    isActive: true 
  });
  
  // Always fetch packages for selected template
  const { data: packages, isLoading: packagesLoading } = useMenuPackages(selectedTemplate?.id);
  
  // ALWAYS fetch the initial package if we have packageId (primary init strategy)
  const { data: initialPackage, isLoading: initialPackageLoading } = useMenuPackage(
    initialSelection?.packageId && !isInitialized ? initialSelection.packageId : undefined
  );
  
  const { data: options, isLoading: optionsLoading } = useMenuOptions({ isActive: true });

  // ── Initialize from initialSelection ──────────────────────────────
  useEffect(() => {
    if (!initialSelection || isInitialized || !templates || templates.length === 0) return;
    
    // We need the package to find the template
    if (!initialPackage) return; // still loading
    
    // Find the template that owns this package
    const templateId = initialPackage.menuTemplateId || initialSelection.templateId;
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      console.warn('[MenuSelectionFlow] Template not found for ID:', templateId, 'Available:', templates.map(t => t.id));
      setIsInitialized(true); // give up, show step 1
      return;
    }
    
    // Set template and package
    setSelectedTemplate(template);
    setSelectedPackage(initialPackage);
    
    // Restore options
    if (initialSelection.selectedOptions && initialSelection.selectedOptions.length > 0) {
      const quantities: Record<string, number> = {};
      initialSelection.selectedOptions.forEach(opt => {
        quantities[opt.optionId] = opt.quantity || 1;
      });
      setOptionQuantities(quantities);
    }

    // Restore dish selections
    if (initialSelection.dishSelections && initialSelection.dishSelections.length > 0) {
      setDishSelections(initialSelection.dishSelections);
    }

    // Jump to the furthest completed step
    if (initialSelection.dishSelections && initialSelection.dishSelections.length > 0) {
      setCurrentStep('options');
    } else {
      setCurrentStep('dishes');
    }
    
    setIsInitialized(true);
  }, [initialSelection, templates, initialPackage, isInitialized]);

  const steps: { id: Step; label: string; icon: any; gradient: string; }[] = [
    { id: 'template', label: 'Wyb\u00f3r Menu', icon: Sparkles, gradient: 'from-orange-500 to-amber-500' },
    { id: 'package', label: 'Pakiet', icon: Check, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'dishes', label: 'Dania', icon: UtensilsCrossed, gradient: 'from-red-500 to-rose-500' },
    { id: 'options', label: 'Dodatki', icon: Sparkles, gradient: 'from-green-500 to-emerald-500' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canNavigateToStep = (stepId: Step): boolean => {
    switch (stepId) {
      case 'template':
        return true;
      case 'package':
        return !!selectedTemplate;
      case 'dishes':
        return !!selectedTemplate && !!selectedPackage;
      case 'options':
        return !!selectedTemplate && !!selectedPackage && dishSelections.length > 0;
      default:
        return false;
    }
  };

  const handleStepClick = (stepId: Step) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    
    if (stepIndex <= currentStepIndex) {
      setCurrentStep(stepId);
      return;
    }

    if (!canNavigateToStep(stepId)) {
      toast({
        title: 'Nie mo\u017cna przej\u015b\u0107 dalej',
        description: 'Uzupe\u0142nij poprzednie kroki przed przej\u015bciem dalej.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentStep(stepId);
  };

  const handleTemplateSelect = (template: MenuTemplate) => {
    if (selectedTemplate?.id !== template.id) {
      setSelectedTemplate(template);
      setSelectedPackage(undefined);
      setDishSelections([]);
      toast({
        title: 'Menu zmienione',
        description: 'Wybierz ponownie pakiet i dania dla nowego menu.',
      });
    } else {
      setSelectedTemplate(template);
    }
    setCurrentStep('package');
  };

  const handlePackageSelect = (pkg: MenuPackage) => {
    setSelectedPackage(pkg);
    setDishSelections([]);
    setCurrentStep('dishes');
  };

  const handleDishesComplete = (selections: CategorySelection[]) => {
    setDishSelections(selections);
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
      dishSelections,
      selectedOptions,
      adults,
      children,
      toddlers,
    });
  };

  // Show loading when initializing from initialSelection
  if (initialSelection && !isInitialized && (templatesLoading || initialPackageLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">\u0141adowanie wybranego menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Guest Info Banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 flex items-center gap-4">
          <span className="text-sm font-medium">
            <span className="font-bold">{adults}</span> doros\u0142ych
          </span>
          <span className="text-purple-300">\u2022</span>
          <span className="text-sm font-medium">
            <span className="font-bold">{children}</span> dzieci
          </span>
          <span className="text-purple-300">\u2022</span>
          <span className="text-sm font-medium">
            <span className="font-bold">{toddlers}</span> maluch\u00f3w
          </span>
          <span className="text-purple-300">\u2022</span>
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {totalGuests} razem
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Z rezerwacji</span>
        </div>
      </div>

      {/* Premium Progress Steps */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-blue-500 via-red-500 to-green-500 rounded-full opacity-20" />
        
        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = index < currentStepIndex;
            const isClickable = index <= currentStepIndex || canNavigateToStep(step.id);
            const StepIcon = step.icon;
            
            return (
              <div 
                key={step.id} 
                className="flex flex-col items-center gap-2 flex-1"
                onClick={() => handleStepClick(step.id)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.1 : 1, 
                    opacity: 1 
                  }}
                  whileHover={isClickable ? { scale: 1.15 } : {}}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-full border-4 font-bold transition-all shadow-lg',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-60',
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
                  
                  {isActive && (
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} blur-xl opacity-40 -z-10`} />
                  )}

                  {isClickable && !isActive && (
                    <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 hover:opacity-10 transition-opacity" />
                  )}
                </motion.div>
                
                <span
                  className={cn(
                    'text-xs sm:text-sm font-semibold text-center transition-colors',
                    isClickable && 'cursor-pointer',
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

      {/* Step Content */}
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
                      isSelected={selectedTemplate?.id === template.id}
                      onSelect={handleTemplateSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-orange-600" />
                  </div>
                  <p className="text-muted-foreground">Brak dost\u0119pnych menu</p>
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
                  <p className="text-muted-foreground">Brak dost\u0119pnych pakiet\u00f3w</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep('template')}
                  className="group border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 dark:hover:from-blue-950/50 dark:hover:to-cyan-950/50 text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 shadow-md hover:shadow-lg transition-all px-6"
                >
                  <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  Zmie\u0144 menu
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Select Dishes */}
          {currentStep === 'dishes' && selectedPackage && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl shadow-lg mb-2">
                  <UtensilsCrossed className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  Wyb\u00f3r Da\u0144
                </h2>
                <p className="text-muted-foreground">
                  {selectedPackage.name}
                </p>
              </div>

              <DishSelector
                packageId={selectedPackage.id}
                initialSelections={dishSelections}
                onComplete={handleDishesComplete}
                onBack={() => setCurrentStep('package')}
              />
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
                  Wybierz dodatkowe us\u0142ugi (opcjonalne)
                </p>
              </div>

              {/* Top Confirm Button */}
              <div className="flex justify-center pb-4 border-b-2">
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-12 shadow-lg text-lg font-bold"
                >
                  <Check className="mr-2 h-6 w-6" />
                  Zatwierd\u017a wyb\u00f3r
                </Button>
              </div>

              {/* Use OptionsSelector for better UX */}
              <OptionsSelector
                options={options || []}
                isLoading={optionsLoading}
                quantities={optionQuantities}
                onQuantityChange={(id, qty) => {
                  setOptionQuantities(prev => ({ ...prev, [id]: qty }));
                }}
              />

              {/* Bottom Navigation */}
              <div className="flex justify-center gap-4 pt-6 border-t-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep('dishes')}
                  className="border-2 px-8"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Wstecz
                </Button>
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-12 shadow-lg text-lg font-bold"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Zatwierd\u017a wyb\u00f3r
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
