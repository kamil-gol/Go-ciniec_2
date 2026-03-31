'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Sparkles, Users, Building2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { getHallById, updateHall } from '@/lib/api/halls'
import { moduleAccents } from '@/lib/design-tokens'
import Link from 'next/link'
import { toast } from 'sonner'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function EditHallPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isWholeVenue, setIsWholeVenue] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    description: '',
    amenities: [] as string[],
    isActive: true,
  })
  const [newAmenity, setNewAmenity] = useState('')

  const loadHall = useCallback(async () => {
    try {
      setLoading(true)
      const hall = await getHallById(params.id as string)
      setIsWholeVenue(hall.isWholeVenue || false)
      setFormData({
        name: hall.name,
        capacity: hall.capacity,
        description: hall.description || '',
        amenities: hall.amenities || [],
        isActive: hall.isActive,
      })
    } catch (error: any) {
      console.error('Error loading hall:', error)
      toast.error('Nie udało się załadować sali')
      router.push('/dashboard/halls')
    } finally {
      setLoading(false)
    }
  }, [params.id, toast, router])

  useEffect(() => {
    loadHall()
  }, [loadHall])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || formData.capacity <= 0) {
      toast.error('Wypełnij wszystkie wymagane pola')
      return
    }

    try {
      setSaving(true)
      const dataToSend = isWholeVenue
        ? { capacity: formData.capacity, description: formData.description, amenities: formData.amenities }
        : formData
      await updateHall(params.id as string, dataToSend)
      toast.success('Sala została zaktualizowana',)
      router.push('/dashboard/halls')
    } catch (error: any) {
      console.error('Error updating hall:', error)
      toast.error(error.response?.data?.message || 'Nie udało się zaktualizować sali')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Wczytywanie...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Breadcrumb />
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
        {/* Premium Hero */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${moduleAccents.halls.gradient} p-8 text-white shadow-2xl`}>
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
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Edytuj Salę</h1>
                <p className="text-white/90 text-lg mt-1">Aktualizuj informacje o sali weselnej</p>
              </div>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Whole Venue Notice */}
        {isWholeVenue && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Sala systemowa</p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Nazwa i status aktywności tej sali są zablokowane, ponieważ jest używana do logiki rezerwacji całego obiektu.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="border-0 shadow-xl p-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Podstawowe informacje</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    Nazwa sali *
                    {isWholeVenue && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="np. Sala Kryształowa"
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    required
                    disabled={isWholeVenue}
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
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                    placeholder="np. 150"
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500"
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
                  className="text-base border-2 focus-visible:ring-2 focus-visible:ring-purple-500 resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    Sala aktywna
                    {isWholeVenue && <Lock className="h-3.5 w-3.5 text-amber-500" />}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isWholeVenue
                      ? 'Status tej sali nie może być zmieniony'
                      : 'Czy sala jest dostępna do rezerwacji?'
                    }
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  disabled={isWholeVenue}
                />
              </div>
            </div>
          </Card>

          {/* Amenities */}
          <Card className="border-0 shadow-xl p-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Udogodnienia</h2>

              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="np. Klimatyzacja"
                  className="h-12 text-base border-2"
                />
                <Button type="button" onClick={addAmenity} variant="outline" className="h-12">
                  Dodaj
                </Button>
              </div>

              {formData.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity, idx) => (
                    <div key={idx} className="bg-purple-100 dark:bg-purple-950/50 px-3 py-2 rounded-lg flex items-center gap-2">
                      <span>{amenity}</span>
                      <button
                        type="button"
                        onClick={() => removeAmenity(idx)}
                        className="text-red-600 hover:text-red-800 font-bold"
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
              className="flex-1 h-14 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 shadow-xl"
            >
              <Save className="mr-2 h-5 w-5" />
              {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
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
