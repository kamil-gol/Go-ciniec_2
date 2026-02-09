'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHall } from '@/lib/api/halls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function NewHallPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    capacity: 50,
    pricePerPerson: 0,
    pricePerChild: 0,
    pricePerToddler: 0,
    description: '',
    isActive: true,
  })

  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || formData.capacity <= 0 || formData.pricePerPerson <= 0) {
      toast({
        title: 'Błąd walidacji',
        description: 'Wypełnij wszystkie wymagane pola',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const newHall = await createHall({
        ...formData,
        amenities,
        images: [],
      })
      toast({
        title: 'Sukces',
        description: `Sala "${newHall.name}" została utworzona`,
      })
      router.push(`/dashboard/halls/${newHall.id}`)
    } catch (error: any) {
      console.error('Error creating hall:', error)
      toast({
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się utworzyć sali',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      setAmenities([...amenities, newAmenity.trim()])
      setNewAmenity('')
    }
  }

  const removeAmenity = (amenity: string) => {
    setAmenities(amenities.filter(a => a !== amenity))
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nowa Sala</h1>
          <p className="text-muted-foreground">Dodaj nową salę do systemu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Podstawowe Informacje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa Sali *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Sala Kryształowa"
                required
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Pojemność (liczba osób) *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            {/* Price per Adult */}
            <div className="space-y-2">
              <Label htmlFor="pricePerPerson">Cena za osobę dorosłą (zł) *</Label>
              <Input
                id="pricePerPerson"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerPerson}
                onChange={(e) => setFormData({ ...formData, pricePerPerson: parseFloat(e.target.value) || 0 })}
                required
              />
              <p className="text-sm text-muted-foreground">Podstawowa cena za osobę dorosłą</p>
            </div>

            {/* Price per Child */}
            <div className="space-y-2">
              <Label htmlFor="pricePerChild">Cena za dziecko (zł)</Label>
              <Input
                id="pricePerChild"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerChild}
                onChange={(e) => setFormData({ ...formData, pricePerChild: parseFloat(e.target.value) || 0 })}
                placeholder="Opcjonalne - zostaw 0 jeśli taka sama jak dorosły"
              />
              <p className="text-sm text-muted-foreground">Zazwyczaj 70% ceny dorosłego</p>
            </div>

            {/* Price per Toddler */}
            <div className="space-y-2">
              <Label htmlFor="pricePerToddler">Cena za malucha 0-3 lat (zł)</Label>
              <Input
                id="pricePerToddler"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerToddler}
                onChange={(e) => setFormData({ ...formData, pricePerToddler: parseFloat(e.target.value) || 0 })}
                placeholder="Opcjonalne - zostaw 0 jeśli gratis"
              />
              <p className="text-sm text-muted-foreground">Zwykle 0 zł (gratis dla dzieci 0-3 lat)</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dodaj opis sali, udogodnienia, wystrój..."
                rows={4}
              />
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label>Udogodnienia</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Dodaj udogodnienia dostępne w sali (np. klimatyzacja, parkiet, scena)
              </p>
              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="np. Klimatyzacja"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <Button type="button" onClick={addAmenity} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {amenities.map((amenity, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors" 
                      onClick={() => removeAmenity(amenity)}
                    >
                      {amenity}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="isActive" className="text-base">Sala Aktywna</Label>
                <p className="text-sm text-muted-foreground">Czy sala ma być od razu dostępna do rezerwacji?</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={saving} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Tworzenie...' : 'Utwórz Salę'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()} 
            disabled={saving}
          >
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  )
}
