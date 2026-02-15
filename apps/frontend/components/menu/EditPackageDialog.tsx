'use client'

import { useState, useEffect } from 'react'
import { useUpdatePackage } from '@/hooks/use-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, DollarSign, Plus, X } from 'lucide-react'
import type { MenuPackage } from '@/types/menu.types'

interface EditPackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg: MenuPackage | null
}

export function EditPackageDialog({ open, onOpenChange, pkg }: EditPackageDialogProps) {
  const updateMutation = useUpdatePackage()
  
  const [formData, setFormData] = useState({
    name: '',
    pricePerAdult: '',
    pricePerChild: '',
    pricePerToddler: '',
    includedItems: [''] as string[],
  })

  // Populate form when package changes
  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        pricePerAdult: pkg.pricePerAdult?.toString() || '',
        pricePerChild: pkg.pricePerChild?.toString() || '',
        pricePerToddler: pkg.pricePerToddler?.toString() || '',
        includedItems: pkg.includedItems && pkg.includedItems.length > 0 ? pkg.includedItems : [''],
      })
    }
  }, [pkg])

  const addIncludedItem = () => {
    setFormData({
      ...formData,
      includedItems: [...formData.includedItems, ''],
    })
  }

  const removeIncludedItem = (index: number) => {
    setFormData({
      ...formData,
      includedItems: formData.includedItems.filter((_, i) => i !== index),
    })
  }

  const updateIncludedItem = (index: number, value: string) => {
    const newItems = [...formData.includedItems]
    newItems[index] = value
    setFormData({ ...formData, includedItems: newItems })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pkg) return
    
    // Filter out empty items
    const filteredItems = formData.includedItems.filter(item => item.trim() !== '')
    
    try {
      await updateMutation.mutateAsync({
        id: pkg.id,
        data: {
          name: formData.name,
          pricePerAdult: parseFloat(formData.pricePerAdult),
          pricePerChild: parseFloat(formData.pricePerChild),
          pricePerToddler: parseFloat(formData.pricePerToddler),
          includedItems: filteredItems.length > 0 ? filteredItems : undefined,
        },
      })
      
      onOpenChange(false)
      alert('\u2705 Pakiet zosta\u0142 zaktualizowany!')
    } catch (error: any) {
      alert(`\u274C B\u0142\u0105d: ${error.error || 'Nie uda\u0142o si\u0119 zaktualizowa\u0107 pakietu'}`)
    }
  }

  if (!pkg) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Edytuj Pakiet</DialogTitle>
                <DialogDescription>
                  Modyfikuj ustawienia pakietu cenowego
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa pakietu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Prices */}
            <div className="space-y-3">
              <Label>Ceny za osob\u0119 (z\u0142) *</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pricePerAdult" className="text-xs text-muted-foreground">
                    Doros\u0142y
                  </Label>
                  <Input
                    id="pricePerAdult"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerAdult}
                    onChange={(e) => setFormData({ ...formData, pricePerAdult: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pricePerChild" className="text-xs text-muted-foreground">
                    Dziecko
                  </Label>
                  <Input
                    id="pricePerChild"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerChild}
                    onChange={(e) => setFormData({ ...formData, pricePerChild: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pricePerToddler" className="text-xs text-muted-foreground">
                    Maluch
                  </Label>
                  <Input
                    id="pricePerToddler"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pricePerToddler}
                    onChange={(e) => setFormData({ ...formData, pricePerToddler: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Included Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Elementy w pakiecie</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIncludedItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Dodaj element
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.includedItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="np. Przystawki, Zupa, G\u0142\u00f3wne danie"
                      value={item}
                      onChange={(e) => updateIncludedItem(index, e.target.value)}
                    />
                    {formData.includedItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIncludedItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Puste elementy zostan\u0105 automatycznie pomini\u0119te
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                'Zapisz zmiany'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
