'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { MenuDishesPreview } from '@/components/menu/MenuDishesPreview'
import { Badge } from '@/components/ui/badge'
import { Utensils, Users, Baby, Smile } from 'lucide-react'

interface MenuSummaryProps {
  menuData: any
  onEdit?: () => void
  showEdit?: boolean
}

export function MenuSummary({ menuData, onEdit, showEdit = true }: MenuSummaryProps) {
  if (!menuData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Menu nie zostało wybrane</p>
        </CardContent>
      </Card>
    )
  }

  const { template, adults, children, toddlers, priceBreakdown, dishSelections } = menuData

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
            <h4 className="font-semibold mb-2">Pakiet: {template?.name || '-'}</h4>
            <p className="text-sm text-muted-foreground">{template?.description}</p>
          </div>

          {/* Liczba gości */}
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

          {/* Wybrane dania */}
          {dishSelections && dishSelections.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Wybrane dania</h4>
              <MenuDishesPreview dishSelections={dishSelections} />
            </div>
          )}

          {/* Breakdown cen */}
          {priceBreakdown && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Koszt menu</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pakiet</span>
                </div>
                {adults > 0 && (
                  <div className="flex justify-between">
                    <span>Dorośli ({adults} × {formatCurrency(priceBreakdown.pricePerAdult)})</span>
                    <span className="font-medium">{formatCurrency(priceBreakdown.adultsTotal)}</span>
                  </div>
                )}
                {children > 0 && (
                  <div className="flex justify-between">
                    <span>Dzieci ({children} × {formatCurrency(priceBreakdown.pricePerChild)})</span>
                    <span className="font-medium">{formatCurrency(priceBreakdown.childrenTotal)}</span>
                  </div>
                )}
                {toddlers > 0 && (
                  <div className="flex justify-between">
                    <span>Maluchy ({toddlers} × {formatCurrency(priceBreakdown.pricePerToddler)})</span>
                    <span className="font-medium">{formatCurrency(priceBreakdown.toddlersTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Suma pakietu</span>
                  <span>{formatCurrency(priceBreakdown.packageTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
