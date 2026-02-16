'use client'

import { useState } from 'react'
import { Settings, Users, Shield, Building2 } from 'lucide-react'
import { PageLayout, PageHero } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from '@/components/settings/UsersTab'
import { RolesTab } from '@/components/settings/RolesTab'
import { CompanyTab } from '@/components/settings/CompanyTab'

export default function SettingsPage() {
  const accent = moduleAccents.settings
  const [activeTab, setActiveTab] = useState('users')

  return (
    <PageLayout>
      <PageHero
        accent={accent}
        title="Ustawienia"
        subtitle="Zarządzanie użytkownikami, rolami, uprawnieniami i danymi firmy"
        icon={Settings}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Użytkownicy</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Role i uprawnienia</span>
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Dane firmy</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="company">
          <CompanyTab />
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
