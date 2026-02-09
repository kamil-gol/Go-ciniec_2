'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getHallById, updateHall, type Hall } from '@/lib/api/halls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

export default function EditHallPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const hallId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoCalculate, setAutoCalculate] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    pricePerPerson: 0,
    pricePerChild: 0,
    pricePerToddler: 0,
    description: '',
    isActive: true,
  })

  const [amenities, setAmenities] = useState<string[]>([])
  const [newAmenity, setNewAmenity] = useState('')

  useEffect(() => {
    loadHall()
  }, [hallId])

  // Automatyczne wyliczanie cen dla dzieci i maluchów
  useEffect(() => {
    if (autoCalculate && formData.pricePerPerson > 0) {
      setFormData(prev => ({
        ...prev,
        pricePerChild: Math.round(prev.pricePerPerson * 0.5 * 100) / 100,
        pricePerToddler: Math.round(prev.pricePerPerson * 0.25 * 100) / 100,
      }))
    }
  }, [formData.pricePerPerson, autoCalculate])

  const loadHall = async () => {
    try {
      setLoading(true)
      const hall = await getHallById(hallId)
      setFormData({
        name: hall.name,
        capacity: hall.capacity,
        pricePerPerson: Number(hall.pricePerPerson),
        pricePerChild: Number(hall.pricePerChild) || 0,
        pricePerToddler: Number(hall.pricePerToddler) || 0,
        description: hall.description || '',
        isActive: hall.isActive,
      })
      setAmenities(hall.amenities || [])
    } catch (error) {
      console.error('Error loading hall:', error)
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować danych sali',
        variant: 'destructive',
      })
      router.push('/dashboard/halls')
    } finally {
      setLoading(false)
    }
  }

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
      await updateHall(hallId, {
        ...formData,
        amenities,
      })
      toast({
        title: 'Sukces',
        description: 'Sala została zaktualizowana',
      })
      router.push(`/dashboard/halls/${hallId}`)
    } catch (error: any) {
      console.error('Error updating hall:', error)
      toast({
        title: 'Błąd',
        description: error.response?.data?.message || 'Nie udało się zaktualizować sali',
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <p>Wczytywanie...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edytuj Salę</h1>
          <p className="text-muted-foreground">Aktualizuj informacje o sali</p>
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

            {/* Auto Calculate Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="autoCalculate" className="text-base">Automatyczne wyliczanie cen</Label>
                <p className="text-sm text-muted-foreground">Dzieci 50%, maluchy 25% ceny dorosłego</p>
              </div>
              <Switch
                id="autoCalculate"
                checked={autoCalculate}
                onCheckedChange={setAutoCalculate}
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
                onChange={(e) => {
                  setAutoCalculate(false)
                  setFormData({ ...formData, pricePerChild: parseFloat(e.target.value) || 0 })
                }}
                placeholder="Domyślnie 50% ceny dorosłego"
                disabled={autoCalculate}
              />
              {autoCalculate && formData.pricePerPerson > 0 && (
                <p className="text-sm text-green-600">
                  ✓ Automatycznie: {formData.pricePerChild} zł (50% z {formData.pricePerPerson} zł)
                </p>
              )}
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
                onChange={(e) => {
                  setAutoCalculate(false)
                  setFormData({ ...formData, pricePerToddler: parseFloat(e.target.value) || 0 })
                }}
                placeholder="Domyślnie 25% ceny dorosłego"
                disabled={autoCalculate}
              />
              {autoCalculate && formData.pricePerPerson > 0 && (
                <p className="text-sm text-green-600">
                  ✓ Automatycznie: {formData.pricePerToddler} zł (25% z {formData.pricePerPerson} zł)
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dodaj opis sali..."
                rows={4}
              />
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <Label>Udogodnienia</Label>
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
                    <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeAmenity(amenity)}>
                      {amenity}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isActive" className="text-base">Sala Aktywna</Label>
                <p className="text-sm text-muted-foreground">Czy sala jest dostępna do rezerwacji?</p>
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
            {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            Anuluj
          </Button>
        </div>
      </form>
    </div>
  )
}
