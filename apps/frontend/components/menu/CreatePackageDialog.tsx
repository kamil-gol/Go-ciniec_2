'use client'

import { useState } from 'react'
import { useCreatePackage } from '@/hooks/use-menu'
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
import { toast } from 'sonner'

interface CreatePackageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  templateName?: string
}

export function CreatePackageDialog({ 
  open, 
  onOpenChange, 
  templateId,
  templateName 
}: CreatePackageDialogProps) {
  const createMutation = useCreatePackage()
  
  const [formData, setFormData] = useState({
    name: '',
    priceAdult: '',
    priceChild: '',
    priceToddler: '',
    includedItems: [''] as string[],
  })

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
    
    // Filter out empty items
    const filteredItems = formData.includedItems.filter(item => item.trim() !== '')
    
    try {
      await createMutation.mutateAsync({
        templateId,
        name: formData.name,
        priceAdult: parseFloat(formData.priceAdult),
        priceChild: parseFloat(formData.priceChild),
        priceToddler: parseFloat(formData.priceToddler),
        includedItems: filteredItems.length > 0 ? filteredItems : undefined,
      })
      
      // Reset form and close
      setFormData({
        name: '',
        priceAdult: '',
        priceChild: '',
        priceToddler: '',
        includedItems: [''],
      })
      onOpenChange(false)
      toast.success('Pakiet został dodany!')
    } catch (error: any) {
      toast.error(error.error || 'Nie udało się dodać pakietu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">Nowy Pakiet</DialogTitle>
                <DialogDescription>
                  Dodaj pakiet cenowy do: {templateName || 'szablonu'}
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
                placeholder="np. Standard, Premium, VIP"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Prices */}
            <div className="space-y-3">
              <Label>Ceny za osobę (zł) *</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="priceAdult" className="text-xs text-muted-foreground">
                    Dorosły
                  </Label>
                  <Input
                    id="priceAdult"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.priceAdult}
                    onChange={(e) => setFormData({ ...formData, priceAdult: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="priceChild" className="text-xs text-muted-foreground">
                    Dziecko
                  </Label>
                  <Input
                    id="priceChild"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.priceChild}
                    onChange={(e) => setFormData({ ...formData, priceChild: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="priceToddler" className="text-xs text-muted-foreground">
                    Maluch
                  </Label>
                  <Input
                    id="priceToddler"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.priceToddler}
                    onChange={(e) => setFormData({ ...formData, priceToddler: e.target.value })}
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
                      placeholder="np. Przystawki, Zupa, Główne danie"
                      value={item}
                      onChange={(e) => updateIncludedItem(index, e.target.value)}
                    />
                    {formData.includedItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIncludedItem(index)}
                        aria-label="Usuń element"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Puste elementy zostaną automatycznie pominięte
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Dodawanie...
                </>
              ) : (
                'Dodaj pakiet'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
