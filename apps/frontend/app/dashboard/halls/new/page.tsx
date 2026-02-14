'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Sparkles, Users, Building2 } from 'lucide-react'
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
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    description: '',
    amenities: [] as string[],
    isActive: true,
  })
  const [newAmenity, setNewAmenity] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || formData.capacity <= 0) {
      toast({
        title: 'B\u0142\u0105d walidacji',
        description: 'Wype\u0142nij wszystkie wymagane pola',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      await createHall(formData)
      toast({
        title: 'Sukces',
        description: 'Sala zosta\u0142a utworzona',
      })
      router.push('/dashboard/halls')
    } catch (error: any) {
      console.error('Error creating hall:', error)
      toast({
        title: 'B\u0142\u0105d',
        description: error.response?.data?.message || 'Nie uda\u0142o si\u0119 utworzy\u0107 sali',
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
                Powr\u00f3t do listy
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Plus className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Dodaj Now\u0105 Sal\u0119</h1>
                <p className="text-white/90 text-lg mt-1">Stw\u00f3rz now\u0105 sal\u0119 weseln\u0105 w systemie</p>
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
                    placeholder="np. Sala Kryszta\u0142owa"
                    className="h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    required
                  />
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pojemno\u015b\u0107 *
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
                  placeholder="Opisz sal\u0119..."
                  rows={4}
                  className="text-base border-2 focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-base font-semibold">Sala aktywna</Label>
                  <p className="text-sm text-muted-foreground">Czy sala jest dost\u0119pna do rezerwacji?</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
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
                        \u00d7
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
              {saving ? 'Tworzenie...' : 'Utw\u00f3rz Sal\u0119'}
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
