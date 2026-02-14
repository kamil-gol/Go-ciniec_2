'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  UtensilsCrossed, Plus, Edit, Trash2, DollarSign, 
  Users, Package, Sparkles, ShoppingCart, ChefHat
} from 'lucide-react'
import { MenuSelectionFlow } from '@/components/menu/MenuSelectionFlow'
import { MenuDishesPreview } from '@/components/menu/MenuDishesPreview'
import { useReservationMenu, useSelectMenu, useUpdateReservationMenu, useDeleteReservationMenu } from '@/hooks/use-menu'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface ReservationMenuSectionProps {
  reservationId: string
  eventTypeId: string
  eventDate: Date
  adults: number
  children: number
  toddlers: number
  onMenuUpdated?: () => void
}

export function ReservationMenuSection({
  reservationId,
  eventTypeId,
  eventDate,
  adults,
  children,
  toddlers,
  onMenuUpdated
}: ReservationMenuSectionProps) {
  const { toast } = useToast()
  const [showSelectionDialog, setShowSelectionDialog] = useState(false)
  
  const { data: menuData, isLoading } = useReservationMenu(reservationId)
  const selectMenuMutation = useSelectMenu()
  const updateMenuMutation = useUpdateReservationMenu()
  const deleteMenuMutation = useDeleteReservationMenu()

  const hasMenu = !!menuData?.snapshot

  const handleMenuSelected = async (selection: any) => {
    try {
      if (hasMenu) {
        await updateMenuMutation.mutateAsync({
          reservationId,
          selection
        })
        toast({
          title: 'Sukces!',
          description: 'Menu zostało zaktualizowane',
        })
      } else {
        await selectMenuMutation.mutateAsync({
          reservationId,
          selection
        })
        toast({
          title: 'Sukces!',
          description: 'Menu zostało dodane do rezerwacji',
        })
      }
      
      setShowSelectionDialog(false)
      onMenuUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się zapisać menu',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteMenu = async () => {
    if (!confirm('Czy na pewno chcesz usunąć wybrane menu?')) return

    try {
      await deleteMenuMutation.mutateAsync(reservationId)
      toast({
        title: 'Sukces',
        description: 'Menu zostało usunięte',
      })
      onMenuUpdated?.()
    } catch (error: any) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się usunąć menu',
        variant: 'destructive',
      })
    }
  }

  const handleCloseDialog = () => {
    setShowSelectionDialog(false)
  }

  /**
   * Build initial selection for edit mode.
   * Uses snapshot.menuTemplateId and snapshot.packageId (DB columns)
   * exposed by the updated formatMenuResponse, with JSONB fallbacks.
   */
  const buildInitialSelection = () => {
    if (!hasMenu || !menuData?.snapshot) return undefined
    const snapshot = menuData.snapshot
    const md = snapshot.menuData || {} as any
    
    // Primary: DB column fields from formatMenuResponse
    // Fallback: JSONB menuData fields
    const templateId = snapshot.menuTemplateId || md.templateId || md.menuTemplateId || undefined
    const packageId = snapshot.packageId || md.packageId || md.selectedPackageId || undefined
    
    if (!packageId) {
      console.warn('[buildInitialSelection] packageId not found. snapshot keys:', Object.keys(snapshot), 'menuData keys:', Object.keys(md))
    }
    if (!templateId) {
      console.warn('[buildInitialSelection] templateId not found. snapshot keys:', Object.keys(snapshot), 'menuData keys:', Object.keys(md))
    }
    
    console.log('[buildInitialSelection] templateId:', templateId, 'packageId:', packageId)
    
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

  // Extract menu data if available
  const snapshot = menuData?.snapshot
  const priceBreakdown = menuData?.priceBreakdown
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
      {/* No menu selected yet */}
      {!hasMenu && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                <UtensilsCrossed className="h-5 w-5 text-white" />
              </div>
              Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 rounded-full flex items-center justify-center mx-auto">
                <UtensilsCrossed className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Brak wybranego menu</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Dodaj menu do rezerwacji aby zobaczyć szczegóły
                </p>
              </div>
              <Button
                onClick={() => setShowSelectionDialog(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Dodaj menu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu is selected - show details */}
      {hasMenu && (
        <>
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg shadow-lg">
                    <UtensilsCrossed className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Menu</h2>
                    <p className="text-sm text-muted-foreground">{packageName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSelectionDialog(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Zmień
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteMenu}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Package Section */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-black/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold">Pakiet: {packageName}</h3>
                  </div>
                  
                  {packageDescription && (
                    <p className="text-sm text-muted-foreground mb-3">{packageDescription}</p>
                  )}
                  
                  {/* Package Prices */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Dorośli</p>
                      <p className="font-bold">{pricePerAdult} zł</p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Dzieci</p>
                      <p className="font-bold">{pricePerChild} zł</p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Maluchy</p>
                      <p className="font-bold">{pricePerToddler} zł</p>
                    </div>
                  </div>
                </div>

                {/* Selected Dishes */}
                {dishSelections && dishSelections.length > 0 && (
                  <div className="bg-white dark:bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <ChefHat className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold">Wybrane dania</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {dishSelections.reduce((sum: number, cat: any) => 
                          sum + cat.dishes.reduce((s: number, d: any) => s + d.quantity, 0), 0
                        )} porcji
                      </Badge>
                    </div>
                    <MenuDishesPreview dishSelections={dishSelections} />
                  </div>
                )}

                {/* Selected Options */}
                {selectedOptions && selectedOptions.length > 0 && (
                  <div className="bg-white dark:bg-black/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="h-5 w-5 text-amber-600" />
                      <h3 className="font-semibold">Dodatkowe opcje ({selectedOptions.length})</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedOptions.map((opt: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-600" />
                            <div>
                              <p className="font-medium text-sm">{opt.optionName || opt.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {opt.priceUnit === 'PER_PERSON' || opt.priceType === 'PER_PERSON' ? 'za osobę' : 'kwota stała'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{opt.priceAmount} zł</p>
                            {opt.quantity && (
                              <p className="text-xs text-muted-foreground">× {opt.quantity}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Price Breakdown Card */}
          {priceBreakdown && (
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg shadow-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Koszt menu</h2>
                </div>

                <div className="space-y-3">
                  {/* Package Cost */}
                  <div className="bg-white dark:bg-black/20 rounded-lg p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Pakiet</p>
                    <div className="space-y-2">
                      {priceBreakdown.packageCost.adults.count > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Dorośli ({priceBreakdown.packageCost.adults.count} × {priceBreakdown.packageCost.adults.priceEach} zł)</span>
                          <span className="font-semibold">{priceBreakdown.packageCost.adults.total} zł</span>
                        </div>
                      )}
                      {priceBreakdown.packageCost.children.count > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Dzieci ({priceBreakdown.packageCost.children.count} × {priceBreakdown.packageCost.children.priceEach} zł)</span>
                          <span className="font-semibold">{priceBreakdown.packageCost.children.total} zł</span>
                        </div>
                      )}
                      {priceBreakdown.packageCost.toddlers.count > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Maluchy ({priceBreakdown.packageCost.toddlers.count} × {priceBreakdown.packageCost.toddlers.priceEach} zł)</span>
                          <span className="font-semibold">{priceBreakdown.packageCost.toddlers.total} zł</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Suma pakietu</span>
                        <span>{priceBreakdown.packageCost.subtotal} zł</span>
                      </div>
                    </div>
                  </div>

                  {/* Options Cost */}
                  {priceBreakdown.optionsCost && priceBreakdown.optionsCost.length > 0 && (
                    <div className="bg-white dark:bg-black/20 rounded-lg p-4">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">Opcje dodatkowe</p>
                      <div className="space-y-2">
                        {priceBreakdown.optionsCost.map((opt: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{opt.option} ({opt.priceType === 'PER_PERSON' ? `${opt.quantity} × ${opt.priceEach} zł` : 'stała'})</span>
                            <span className="font-semibold">{opt.total} zł</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Suma opcji</span>
                          <span>{priceBreakdown.optionsSubtotal} zł</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total */}
                  <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">Całkowity koszt menu</p>
                        <p className="text-3xl font-bold">{priceBreakdown.totalMenuPrice} zł</p>
                      </div>
                      <Users className="h-8 w-8 opacity-80" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Single shared Dialog for both add and edit */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onClose={handleCloseDialog}
        >
          <DialogHeader>
            <DialogTitle>{hasMenu ? 'Zmień menu rezerwacji' : 'Wybierz menu dla rezerwacji'}</DialogTitle>
          </DialogHeader>
          <MenuSelectionFlow
            eventTypeId={eventTypeId}
            eventDate={eventDate}
            adults={adults}
            children={children}
            toddlers={toddlers}
            initialSelection={buildInitialSelection()}
            onComplete={handleMenuSelected}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
