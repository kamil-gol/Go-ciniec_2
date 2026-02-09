'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Sparkles, DollarSign, Users, Building2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createHall } from '@/lib/api/halls'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function NewHallPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [autoCalculate, setAutoCalculate] = useState(true) // Default ON for new halls
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    pricePerPerson: 0,
    pricePerChild: 0,
    pricePerToddler: 0,
    description: '',
    amenities: [] as string[],
    isActive: true,
  })
  const [newAmenity, setNewAmenity] = useState('')

  // Auto-calculate child and toddler prices
  useEffect(() => {
    if (autoCalculate && formData.pricePerPerson > 0) {
      setFormData(prev => ({
        ...prev,
        pricePerChild: Math.round(prev.pricePerPerson * 0.5 * 100) / 100,
        pricePerToddler: Math.round(prev.pricePerPerson * 0.25 * 100) / 100,
      }))
    }
  }, [formData.pricePerPerson, autoCalculate])

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
      await createHall(formData)
      toast({
        title: 'Sukces',
        description: 'Sala została utworzona',
      })
      router.push('/dashboard/halls')
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
    if (newAmenity.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()]
      }))
      setNewAmenity('')
    }
  }

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        {/* Premium Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="relative z-10 space-y-4">
            <Link href="/dashboard/halls">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Powrót do listy
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Dodaj Nową Salę</h1>
                <p className="text-white/90 text-lg mt-1">Stwórz nową salę weselną w systemie</p>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border-0 shadow-xl p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Podstawowe informacje</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Nazwa sali *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="np. Sala Krystałowa"
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    required
                  />
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pojemność *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    placeholder="np. 150"
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Opis</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Opisz salę..."
                  rows={4}
                  className="text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-base font-semibold">Sala aktywna</Label>
                  <p className="text-sm text-muted-foreground">Czy sala jest dostępna do rezerwacji?</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-teal-950/30 p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Cennik</h2>
                  </div>

                  {/* Auto-calc Toggle */}
                  <div className="flex items-center gap-3 bg-white dark:bg-black/20 px-4 py-2 rounded-xl shadow-md">
                    {autoCalculate ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    <Label className="cursor-pointer font-semibold" onClick={() => setAutoCalculate(!autoCalculate)}>
                      Auto-wyliczanie
                    </Label>
                    <Switch
                      checked={autoCalculate}
                      onCheckedChange={setAutoCalculate}
                    />
                  </div>
                </div>

                {autoCalculate && (
                  <div className="bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-lg p-4">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      ✨ Ceny dzieci i maluchów będą automatycznie wyliczane: Dzieci = 50%, Maluchy = 25%
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Adults */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Cena dorosłego *</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formData.pricePerPerson || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerPerson: parseFloat(e.target.value) || 0 }))}
                        className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500 pr-12"
                        required
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">zł</span>
                    </div>
                    <p className="text-xs text-muted-foreground">13+ lat</p>
                  </div>

                  {/* Children */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Cena dziecka</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.pricePerChild || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerChild: parseFloat(e.target.value) || 0 }))}
                        className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500 pr-12"
                        disabled={autoCalculate}
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">zł</span>
                    </div>
                    {autoCalculate && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Wyliczone automatycznie</p>
                    )}
                    <p className="text-xs text-muted-foreground">4-12 lat</p>
                  </div>

                  {/* Toddlers */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Cena malucha</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.pricePerToddler || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerToddler: parseFloat(e.target.value) || 0 }))}
                        className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500 pr-12"
                        disabled={autoCalculate}
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">zł</span>
                    </div>
                    {autoCalculate && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Wyliczone automatycznie</p>
                    )}
                    <p className="text-xs text-muted-foreground">0-3 lat</p>
                  </div>
                </div>

                {/* Example Calculation */}
                {formData.pricePerPerson > 0 && (
                  <div className="bg-white dark:bg-black/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">📊 Przykładowe wyliczenie:</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Dorosły:</div>
                        <div className="font-bold text-lg">{formData.pricePerPerson.toFixed(2)} zł</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Dziecko:</div>
                        <div className="font-bold text-lg">{formData.pricePerChild.toFixed(2)} zł</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Maluch:</div>
                        <div className="font-bold text-lg">{formData.pricePerToddler.toFixed(2)} zł</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card className="border-0 shadow-xl p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Udogodnienia</h2>
              </div>

              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="np. Klimatyzacja, Parking, Wi-Fi..."
                  className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
                <Button type="button" onClick={addAmenity} variant="outline" size="lg" className="h-12 px-8">
                  Dodaj
                </Button>
              </div>

              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, idx) => (
                    <div key={idx} className="bg-emerald-100 dark:bg-emerald-950/50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <span className="font-medium">{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(idx)}
                        className="text-red-600 hover:text-red-800 font-bold text-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="flex-1 h-14 text-lg bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 shadow-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              {saving ? 'Tworzenie...' : 'Utwórz Salę'}
            </Button>
            <Link href="/dashboard/halls" className="flex-1">
              <Button type="button" variant="outline" size="lg" className="w-full h-14 text-lg">
                Anuluj
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
