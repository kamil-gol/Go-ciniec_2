'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi, CompanySettings, UpdateCompanyInput } from '@/lib/api/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

export function CompanyTab() {
  const [, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<UpdateCompanyInput>({})

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await settingsApi.getCompanySettings()
      setSettings(data)
      setForm({
        companyName: data.companyName || '',
        address: data.address || '',
        city: data.city || '',
        postalCode: data.postalCode || '',
        phone: data.phone || '',
        email: data.email || '',
        nip: data.nip || '',
        regon: data.regon || '',
        website: data.website || '',
      })
    } catch { /* handled */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await settingsApi.updateCompanySettings(form)
      setSettings(updated)
      toast.success('Zapisano dane firmy')
    } catch { /* handled */ } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 shadow-soft border border-neutral-100 dark:border-neutral-700/50 p-6 lg:p-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
      </div>
      {/* Form fields skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      {/* Save button skeleton */}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )

  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800/80 shadow-soft border border-neutral-100 dark:border-neutral-700/50 p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Dane firmy</h3>
          <p className="text-sm text-neutral-500">Informacje wyświetlane na dokumentach i fakturach</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Podstawowe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nazwa firmy</Label>
            <Input
              id="companyName"
              value={form.companyName || ''}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={form.email || ''}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Telefon</Label>
            <Input
              id="companyPhone"
              value={form.phone || ''}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyWebsite">Strona www</Label>
            <Input
              id="companyWebsite"
              value={form.website || ''}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="https://"
            />
          </div>
        </div>

        {/* Adres */}
        <div className="border-t border-neutral-100 dark:border-neutral-700/50 pt-6">
          <h4 className="font-medium mb-4">Adres</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="companyAddress">Ulica i numer</Label>
              <Input
                id="companyAddress"
                value={form.address || ''}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="ul. Weselna 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPostalCode">Kod pocztowy</Label>
              <Input
                id="companyPostalCode"
                value={form.postalCode || ''}
                onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                placeholder="00-000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyCity">Miasto</Label>
              <Input
                id="companyCity"
                value={form.city || ''}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Dane podatkowe */}
        <div className="border-t border-neutral-100 dark:border-neutral-700/50 pt-6">
          <h4 className="font-medium mb-4">Dane podatkowe</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyNip">NIP</Label>
              <Input
                id="companyNip"
                value={form.nip || ''}
                onChange={e => setForm(f => ({ ...f, nip: e.target.value }))}
                placeholder="000-000-00-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyRegon">REGON</Label>
              <Input
                id="companyRegon"
                value={form.regon || ''}
                onChange={e => setForm(f => ({ ...f, regon: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </Button>
        </div>
      </form>
    </div>
  )
}
