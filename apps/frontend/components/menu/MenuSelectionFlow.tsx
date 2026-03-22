/**
 * MenuSelectionFlow Component
 * 
 * Multi-step wizard for selecting menu, package, and dishes
 * Premium UI with gradients and animations
 * 
 * PHASE A: Guest counts come from reservation (read-only)
 * Options step removed — extras handled via ServiceExtras system
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MenuTemplate, 
  MenuPackage, 
} from '@/types/menu.types';
import { 
  useMenuTemplates, 
  useMenuPackages,
  useMenuPackage,
} from '@/hooks/use-menu';
import {
  MenuCard,
  MenuCardSkeleton,
  PackageCard,
  PackageCardSkeleton,
} from '@/components/menu';
import { DishSelector } from '@/components/menu/DishSelector';
import type { DishSelectorResult, CategoryExtraResult } from '@/components/menu/DishSelector';
import { Check, Users, Sparkles, UtensilsCrossed, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner'

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
  adults: number;
  childrenCount: number;
  toddlers: number;
  initialSelection?: {
    templateId?: string;
    packageId?: string;
    dishSelections?: CategorySelection[];
  };
  /** #216: Existing category extras from reservation — used to pre-enable extras toggles in DishSelector */
  initialCategoryExtras?: Array<{
    packageCategoryId: string;
    quantity: number;
    portionTarget: string;
    packageCategory?: { category: { id: string; name: string } };
    [key: string]: any;
  }>;
  onComplete?: (selection: any) => void;
  className?: string;
}

type Step = 'template' | 'package' | 'dishes';

export function MenuSelectionFlow({
  eventTypeId,
  adults,
  childrenCount,
  toddlers,
  initialSelection,
  initialCategoryExtras,
  onComplete,
  className
}: MenuSelectionFlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<MenuTemplate>();
  const [selectedPackage, setSelectedPackage] = useState<MenuPackage>();
  const [dishSelections, setDishSelections] = useState<CategorySelection[]>(initialSelection?.dishSelections || []);
  // #216: Track category extras from DishSelector
  const [categoryExtras, setCategoryExtras] = useState<CategoryExtraResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // #216: Compute initialExtrasEnabled from existing reservation categoryExtras
  // Maps categoryId → true for categories that have extras, so DishSelector starts with toggles ON
  const initialExtrasEnabled = useMemo(() => {
    if (!initialCategoryExtras || initialCategoryExtras.length === 0) return undefined;
    const map: Record<string, boolean> = {};
    initialCategoryExtras.forEach(extra => {
      const categoryId = extra.packageCategory?.category?.id;
      if (categoryId && Number(extra.quantity) > 0) {
        map[categoryId] = true;
      }
    });
    return Object.keys(map).length > 0 ? map : undefined;
  }, [initialCategoryExtras]);

  const totalGuests = adults + childrenCount + toddlers;

  useEffect(() => {
    const dialogContent = containerRef.current?.closest('[role="dialog"]') || containerRef.current?.closest('.overflow-y-auto');
    if (dialogContent) {
      dialogContent.scrollTop = 0;
    }
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentStep]);

  const { data: templates, isLoading: templatesLoading } = useMenuTemplates({ 
    eventTypeId,
    isActive: true 
  });
  
  const { data: packages, isLoading: packagesLoading } = useMenuPackages(selectedTemplate?.id);
  
  const { data: initialPackage, isLoading: initialPackageLoading } = useMenuPackage(
    initialSelection?.packageId && !isInitialized ? initialSelection.packageId : undefined
  );

  // Initialize from initialSelection
  useEffect(() => {
    if (!initialSelection || isInitialized) return;
    if (!templates || templates.length === 0) return;

    // FIX: Always wait for package to load when editing (packageId is set)
    // Previously this only waited when resolvedTemplateId was missing,
    // causing the flow to skip to 'package' step on first open.
    if (initialSelection.packageId && !initialPackage && initialPackageLoading) {
      return;
    }
    
    let resolvedTemplateId = initialSelection.templateId;
    
    if (!resolvedTemplateId && initialPackage) {
      resolvedTemplateId = (initialPackage as any).menuTemplateId;
    }
    
    if (!resolvedTemplateId) {
      console.warn('[MenuSelectionFlow] Could not resolve templateId.');
      setIsInitialized(true);
      return;
    }
    
    const template = templates.find(t => t.id === resolvedTemplateId);
    if (!template) {
      console.warn('[MenuSelectionFlow] Template not found:', resolvedTemplateId);
      setIsInitialized(true);
      return;
    }
    
    console.log('[MenuSelectionFlow] Init success. Template:', template.name, 'Package:', initialPackage?.name || 'n/a');
    
    setSelectedTemplate(template);
    
    if (initialPackage) {
      setSelectedPackage(initialPackage);
    }

    if (initialSelection.dishSelections && initialSelection.dishSelections.length > 0) {
      setDishSelections(initialSelection.dishSelections);
    }

    // In edit mode start at dishes step so user can see and confirm selections
    if (initialPackage) {
      setCurrentStep('dishes');
    } else {
      setCurrentStep('package');
    }
    
    setIsInitialized(true);
  }, [initialSelection, templates, initialPackage, initialPackageLoading, isInitialized]);

  const steps: { id: Step; label: string; icon: any; gradient: string; }[] = [
    { id: 'template', label: 'Wybór Menu', icon: Sparkles, gradient: 'from-orange-500 to-amber-500' },
    { id: 'package', label: 'Pakiet', icon: Check, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'dishes', label: 'Dania', icon: UtensilsCrossed, gradient: 'from-red-500 to-rose-500' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const canNavigateToStep = (stepId: Step): boolean => {
    switch (stepId) {
      case 'template': return true;
      case 'package': return !!selectedTemplate;
      case 'dishes': return !!selectedTemplate && !!selectedPackage;
      default: return false;
    }
  };

  const handleStepClick = (stepId: Step) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex <= currentStepIndex) {
      setCurrentStep(stepId);
      return;
    }
    if (!canNavigateToStep(stepId)) {
      toast.error('Uzupełnij poprzednie kroki.');
      return;
    }
    setCurrentStep(stepId);
  };

  const handleTemplateSelect = (template: MenuTemplate) => {
    if (selectedTemplate?.id !== template.id) {
      setSelectedTemplate(template);
      setSelectedPackage(undefined);
      setDishSelections([]);
      setCategoryExtras([]);
      toast.success('Wybierz ponownie pakiet i dania.');
    } else {
      setSelectedTemplate(template);
    }
    setCurrentStep('package');
  };

  const handlePackageSelect = (pkg: MenuPackage) => {
    if (selectedPackage?.id !== pkg.id) {
      setSelectedPackage(pkg);
      setDishSelections([]);
      setCategoryExtras([]);
    } else {
      setSelectedPackage(pkg);
    }
    setCurrentStep('dishes');
  };

  // #216: DishSelector now returns DishSelectorResult with selections + categoryExtras
  const handleDishesComplete = (result: DishSelectorResult) => {
    setDishSelections(result.selections);
    setCategoryExtras(result.categoryExtras);
    handleComplete(result.selections, result.categoryExtras);
  };

  const handleComplete = (selections?: CategorySelection[], extras?: CategoryExtraResult[]) => {
    if (!selectedTemplate || !selectedPackage) {
      toast.error('Nie wybrano menu lub pakietu.');
      return;
    }

    onComplete?.({
      templateId: selectedTemplate.id,
      packageId: selectedPackage.id,
      dishSelections: selections || dishSelections,
      categoryExtras: extras || categoryExtras,
      adults,
      childrenCount,
      toddlers,
    });
  };

  if (initialSelection && !isInitialized && (templatesLoading || initialPackageLoading)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{"Ładowanie wybranego menu..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('space-y-8', className)}>
      {/* Guest Info Banner */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-sm">
          <Users className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 flex items-center gap-4">
          <span className="text-sm font-medium">
            <span className="font-bold">{adults}</span>{' dorosłych'}
          </span>
          <span className="text-purple-300">{"\u2022"}</span>
          <span className="text-sm font-medium">
            <span className="font-bold">{childrenCount}</span>{' dzieci'}
          </span>
          <span className="text-purple-300">{"\u2022"}</span>
          <span className="text-sm font-medium">
            <span className="font-bold">{toddlers}</span>{' maluchów'}
          </span>
          <span className="text-purple-300">{"\u2022"}</span>
          <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {totalGuests}{' razem'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Z rezerwacji</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-red-500 rounded-full opacity-20" />
        <div className="relative flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = index < currentStepIndex;
            const isClickable = index <= currentStepIndex || canNavigateToStep(step.id);
            const StepIcon = step.icon;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1" onClick={() => handleStepClick(step.id)}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: isActive ? 1.1 : 1, opacity: 1 }}
                  whileHover={isClickable ? { scale: 1.15 } : {}}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center rounded-full border-4 font-bold transition-all shadow-lg',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-60',
                    isCompleted && 'border-green-500 bg-gradient-to-br from-green-500 to-emerald-500 text-white',
                    isActive && `border-white bg-gradient-to-br ${step.gradient} text-white shadow-xl`,
                    !isActive && !isCompleted && 'border-neutral-300 bg-white text-neutral-400 dark:bg-neutral-800 dark:border-neutral-600'
                  )}
                >
                  {isCompleted ? <Check className="h-6 w-6" /> : <StepIcon className="h-6 w-6" />}
                  {isActive && <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${step.gradient} blur-xl opacity-40 -z-10`} />}
                  {isClickable && !isActive && <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 hover:opacity-10 transition-opacity" />}
                </motion.div>
                <span className={cn(
                  'text-xs sm:text-sm font-semibold text-center transition-colors',
                  isClickable && 'cursor-pointer',
                  isActive && 'text-transparent bg-clip-text bg-gradient-to-r ' + step.gradient,
                  isCompleted && 'text-green-600',
                  !isActive && !isCompleted && 'text-neutral-500'
                )}>{step.label}</span>
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
          {currentStep === 'template' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg mb-2">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">Wybierz Menu</h2>
                <p className="text-muted-foreground">Dostosowane do Twojego wydarzenia</p>
              </div>
              {templatesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <MenuCardSkeleton key={i} />)}</div>
              ) : templates && templates.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {templates.map(template => (
                    <MenuCard key={template.id} template={template} isSelected={selectedTemplate?.id === template.id} onSelect={handleTemplateSelect} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/30 dark:to-amber-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-orange-600" />
                  </div>
                  <p className="text-muted-foreground">{'Brak dostępnych menu'}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'package' && selectedTemplate && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-2">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Wybierz Pakiet</h2>
                <p className="text-muted-foreground">{selectedTemplate.name} - {selectedTemplate.variant}</p>
              </div>
              {packagesLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <PackageCardSkeleton key={i} />)}</div>
              ) : packages && packages.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map(pkg => (
                    <PackageCard key={pkg.id} package={pkg} isSelected={selectedPackage?.id === pkg.id} onSelect={handlePackageSelect} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12"><p className="text-muted-foreground">{'Brak dostępnych pakietów'}</p></div>
              )}
              <div className="flex justify-center">
                <Button variant="outline" size="lg" onClick={() => setCurrentStep('template')} className="group border-2 border-blue-300 hover:border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 dark:hover:from-blue-950/50 dark:hover:to-cyan-950/50 text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100 shadow-md hover:shadow-lg transition-all px-6">
                  <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  {'Zmień menu'}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'dishes' && selectedPackage && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="inline-flex p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl shadow-lg mb-2">
                  <UtensilsCrossed className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">{'Wybór Dań'}</h2>
                <p className="text-muted-foreground">{selectedPackage.name}</p>
              </div>
              <DishSelector
                packageId={selectedPackage.id}
                adults={adults}
                childrenCount={childrenCount}
                toddlers={toddlers}
                initialSelections={dishSelections}
                initialExtrasEnabled={initialExtrasEnabled}
                onComplete={handleDishesComplete}
                onBack={() => setCurrentStep('package')}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
