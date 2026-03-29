'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { GradientCard } from '@/components/shared/GradientCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UtensilsCrossed, Plus, Edit, Trash2,
  Package, Sparkles, ShoppingCart, ChefHat,
  User, Baby
} from 'lucide-react'
import { MenuSelectionFlow } from '@/components/menu/MenuSelectionFlow'
import { useReservationMenu, useSelectMenu, useUpdateReservationMenu, useDeleteReservationMenu } from '@/hooks/use-menu'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PortionTarget } from '@/types/menu'
import { PORTION_TARGET_LABELS } from '@/types/menu'
import { toast } from 'sonner'

interface ReservationMenuSectionProps {
  reservationId: string
  eventTypeId: string
  eventDate: Date
  adults: number
  childrenCount: number
  toddlers: number
  categoryExtras?: Array<{
    id: string
    packageCategoryId: string
    quantity: number
    pricePerItem: number
    guestCount: number
    portionTarget: string
    totalPrice: number
    packageCategory?: { category: { id: string; name: string } }
  }>
  onMenuUpdated?: () => void
  readOnly?: boolean
}

export function ReservationMenuSection({
  reservationId,
  eventTypeId,
  eventDate,
  adults,
  childrenCount,
  toddlers,
  categoryExtras,
  onMenuUpdated,
  readOnly = false
}: ReservationMenuSectionProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()
  const [showSelectionDialog, setShowSelectionDialog] = useState(false)
  
  const { data: menuData, isLoading } = useReservationMenu(reservationId)
  const selectMenuMutation = useSelectMenu()
  const updateMenuMutation = useUpdateReservationMenu()
  const deleteMenuMutation = useDeleteReservationMenu()

  const hasMenu = !!menuData?.snapshot
  const isSaving = selectMenuMutation.isPending || updateMenuMutation.isPending

  const handleMenuSelected = async (selection: any) => {
    if (isSaving || readOnly) return
    try {
      if (hasMenu) {
        await updateMenuMutation.mutateAsync({ reservationId, selection })
        toast.success('Menu zostało zaktualizowane')
      } else {
        await selectMenuMutation.mutateAsync({ reservationId, selection })
        toast.success('Menu zostało dodane do rezerwacji')
      }
      setShowSelectionDialog(false)
      onMenuUpdated?.()
    } catch (error: any) {
      toast.error(error.message || 'Nie udało się zapisać menu')
    }
  }

  const handleDeleteMenu = async () => {
    if (readOnly) return
    if (!await confirm({ title: 'Usuwanie menu', description: 'Czy na pewno chcesz usunąć wybrane menu?', variant: 'destructive', confirmLabel: 'Usuń menu' })) return
    try {
      await deleteMenuMutation.mutateAsync(reservationId)
      toast.success('Menu zostało usunięte')
      onMenuUpdated?.()
    } catch {
      toast.error('Nie udało się usunąć menu')
    }
  }

  const buildInitialSelection = () => {
    if (!hasMenu || !menuData?.snapshot) return undefined
    const snapshot = menuData.snapshot as any
    const md = snapshot.menuData || {} as any
    const templateId = snapshot.menuTemplateId || md.templateId || md.menuTemplateId || undefined
    const packageId = snapshot.packageId || md.packageId || md.selectedPackageId || undefined
    return {
      templateId,
      packageId,
      selectedOptions: (md.selectedOptions || []).map((opt: any) => ({
        optionId: opt.optionId,
        quantity: opt.quantity || 1
      })),
      dishSelections: (md.dishSelections || []).map((cat: any) => ({
        categoryId: cat.categoryId,
        dishes: (cat.dishes || []).map((dish: any) => ({
          dishId: dish.dishId,
          quantity: dish.quantity || 1
        }))
      }))
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const snapshot = menuData?.snapshot
  const menuDataNested = snapshot?.menuData || {} as any
  const {
    packageName,
    packageDescription,
    pricePerAdult,
    pricePerChild,
    pricePerToddler,
    dishSelections,
    selectedOptions
  } = menuDataNested

  return (
    <>
      {/* No menu selected */}
      {!hasMenu && (
        <GradientCard
          title="Menu"
          icon={<UtensilsCrossed className="h-5 w-5 text-white" />}
          iconGradient="from-orange-500 to-amber-500"
          headerGradient="from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30"
        >
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 rounded-full flex items-center justify-center mx-auto">
              <UtensilsCrossed className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Brak wybranego menu</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {readOnly
                  ? 'Menu nie zostało przypisane do tej rezerwacji'
                  : 'Dodaj menu do rezerwacji aby zobaczyć szczegóły'}
              </p>
            </div>
            {!readOnly && (
              <Button
                onClick={() => setShowSelectionDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj menu
              </Button>
            )}
          </div>
        </GradientCard>
      )}

      {/* Menu selected - compact view */}
      {hasMenu && (
        <GradientCard
          title="Menu"
          icon={<UtensilsCrossed className="h-5 w-5 text-white" />}
          iconGradient="from-orange-500 to-amber-500"
          headerGradient="from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30"
          headerSpacing="mb-4"
          action={!readOnly ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowSelectionDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Zmień
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteMenu}
                className="text-red-600 hover:text-red-700"
                disabled={deleteMenuMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : undefined}
        >

            {/* Package info - compact */}
            <div className="bg-white dark:bg-black/20 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-sm">Pakiet: {packageName}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Dor. <strong>{pricePerAdult} zł</strong></span>
                  <span>Dz. <strong>{pricePerChild} zł</strong></span>
                  <span>Mal. <strong>{pricePerToddler} zł</strong></span>
                </div>
              </div>
              {packageDescription && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">{packageDescription}</p>
              )}
            </div>

            {/* Dishes - compact inline list */}
            {dishSelections && dishSelections.length > 0 && (
              <div className="bg-white dark:bg-black/20 rounded-lg p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-4 w-4 text-orange-600" />
                  <span className="font-semibold text-sm">Wybrane dania</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {dishSelections.reduce((sum: number, cat: any) => 
                      sum + cat.dishes.reduce((s: number, d: any) => s + d.quantity, 0), 0
                    )} porcji
                  </Badge>
                </div>
                <div className="space-y-2">
                  {dishSelections.map((category: any) => {
                    const pt = category.portionTarget as PortionTarget | undefined;
                    return (
                      <div key={category.categoryId}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <ChefHat className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {category.categoryName}
                          </span>
                          {/* #166: Portion target badge */}
                          {pt && pt !== 'ALL' && (
                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0 rounded-full ${
                              pt === 'ADULTS_ONLY'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-300'
                            }`}>
                              {pt === 'ADULTS_ONLY' ? <User className="w-2.5 h-2.5" /> : <Baby className="w-2.5 h-2.5" />}
                              {PORTION_TARGET_LABELS[pt]}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-5">
                          {category.dishes.map((dish: any) => (
                            <span
                              key={dish.dishId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 rounded-full text-xs border border-orange-200 dark:border-orange-800"
                            >
                              <span className="font-medium">{dish.dishName || dish.name || 'Danie'}</span>
                              {dish.quantity > 1 && (
                                <span className="text-orange-600 font-bold">{'\u00d7'}{dish.quantity}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Options - compact */}
            {selectedOptions && selectedOptions.length > 0 && (
              <div className="bg-white dark:bg-black/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-amber-600" />
                  <span className="font-semibold text-sm">Opcje dodatkowe ({selectedOptions.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOptions.map((opt: any, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 rounded-full text-xs border border-amber-200 dark:border-amber-800"
                    >
                      <Sparkles className="h-3 w-3 text-amber-600" />
                      <span className="font-medium">{opt.optionName || opt.name}</span>
                      <span className="text-amber-700 font-bold">{opt.priceAmount} zł</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
        </GradientCard>
      )}

      {/* Selection Dialog — only render when not readOnly */}
      {!readOnly && (
        <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{hasMenu ? 'Zmień menu rezerwacji' : 'Wybierz menu dla rezerwacji'}</DialogTitle>
            </DialogHeader>
            <MenuSelectionFlow
              eventTypeId={eventTypeId}
              eventDate={eventDate}
              adults={adults}
              childrenCount={childrenCount}
              toddlers={toddlers}
              initialSelection={buildInitialSelection()}
              initialCategoryExtras={categoryExtras}
              onComplete={handleMenuSelected}
            />
          </DialogContent>
        </Dialog>
      )}
      {ConfirmDialog}
    </>
  )
}
