'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { MenuDishesPreview } from '@/components/menu/MenuDishesPreview'
import { Utensils, Users, Baby, Smile, ChefHat } from 'lucide-react'

interface MenuSummaryProps {
  menuData: any
  onEdit?: () => void
  showEdit?: boolean
}

export function MenuSummary({ menuData, onEdit, showEdit = true }: MenuSummaryProps) {
  if (!menuData || !menuData.snapshot) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Menu nie zostało wybrane</p>
        </CardContent>
      </Card>
    )
  }

  // Backend returns: { snapshot: { menuData: {...} }, priceBreakdown: {...} }
  const { snapshot, priceBreakdown } = menuData
  const menuDataNested = snapshot.menuData || {}
  
  const {
    packageName,
    packageDescription,
    adults,
    children,
    toddlers,
    dishSelections,
    pricePerAdult,
    pricePerChild,
    pricePerToddler
  } = menuDataNested

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Menu
          </CardTitle>
          {showEdit && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Zmień
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pakiet */}
          <div>
            <h4 className="font-semibold mb-2">Pakiet: {packageName || '-'}</h4>
            {packageDescription && (
              <p className="text-sm text-muted-foreground">{packageDescription}</p>
            )}
          </div>

          {/* Ceny pakietu */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg">
              <Users className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Dorośli</p>
              <p className="font-bold">{pricePerAdult} zł</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-lg">
              <Smile className="h-4 w-4 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Dzieci</p>
              <p className="font-bold">{pricePerChild} zł</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg">
              <Baby className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Maluchy</p>
              <p className="font-bold">{pricePerToddler} zł</p>
            </div>
          </div>

          {/* Liczba gości */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Liczba gości</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Dorośli</p>
                  <p className="font-semibold">{adults}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Dzieci</p>
                  <p className="font-semibold">{children}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Baby className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Maluchy</p>
                  <p className="font-semibold">{toddlers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Wybrane dania */}
          {dishSelections && dishSelections.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <ChefHat className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold">Wybrane dania</h4>
                <Badge variant="secondary" className="ml-auto">
                  {dishSelections.reduce((sum: number, cat: any) => 
                    sum + cat.dishes.reduce((s: number, d: any) => s + d.quantity, 0), 0
                  )} porcji
                </Badge>
              </div>
              <MenuDishesPreview dishSelections={dishSelections} />
            </div>
          )}

          {/* Breakdown cen */}
          {priceBreakdown && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Koszt menu</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Pakiet</span>
                </div>
                {priceBreakdown.packageCost.adults.count > 0 && (
                  <div className="flex justify-between">
                    <span>Dorośli ({priceBreakdown.packageCost.adults.count} × {formatCurrency(priceBreakdown.packageCost.adults.priceEach)})</span>
                    <span className="font-medium">{formatCurrency(priceBreakdown.packageCost.adults.total)}</span>
                  </div>
                )}
                {priceBreakdown.packageCost.children.count > 0 && (
                  <div className="flex justify-between">
                    <span>Dzieci ({priceBreakdown.packageCost.children.count} × {formatCurrency(priceBreakdown.packageCost.children.priceEach)})</span>
                    <span className="font-medium">{formatCurrency(priceBreakdown.packageCost.children.total)}</span>
                  </div>
                )}
                {priceBreakdown.packageCost.toddlers.count > 0 && (
                  <div className="flex justify-between">
                    <span>Maluchy ({priceBreakdown.packageCost.toddlers.count} × {formatCurrency(priceBreakdown.packageCost.toddlers.priceEach)})</span>
                    <span className="font-medium">{formatCurrency(priceBreakdown.packageCost.toddlers.total)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Suma pakietu</span>
                  <span>{formatCurrency(priceBreakdown.packageCost.subtotal)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
