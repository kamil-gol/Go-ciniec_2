'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Package,
  Calendar,
  Eye,
  EyeOff,
  Printer,
  Loader2,
} from 'lucide-react'
import { useMenuTemplates, useDeleteMenuTemplate } from '@/hooks/use-menu-config'
import { useEventTypes } from '@/hooks/use-event-types'
import { MenuTemplateDialog } from '@/components/menu/MenuTemplateDialog'
import { downloadMenuTemplatePDF } from '@/lib/api/menu-templates-api'
import type { MenuTemplate } from '@/lib/api/menu-templates-api'
import { toast } from 'sonner'
import { PageLayout, PageHero, StatCard, LoadingState, EmptyState, EntityCard } from '@/components/shared'
import { moduleAccents, statGradients, layout } from '@/lib/design-tokens'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function MenuTemplatesPage() {
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<MenuTemplate | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const accent = moduleAccents.menu

  const { data: eventTypes = [] } = useEventTypes()
  const { data: allTemplates = [], isLoading } = useMenuTemplates()
  const deleteMutation = useDeleteMenuTemplate()

  const templates = allTemplates.filter((t) => {
    if (selectedEventType !== 'all' && t.eventTypeId !== selectedEventType) return false
    if (!showInactive && !t.isActive) return false
    return true
  })

  const handleEdit = (template: MenuTemplate) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setEditingTemplate(null)
    setDialogOpen(true)
  }

  const handleDelete = (template: MenuTemplate) => {
    setTemplateToDelete(template)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (templateToDelete) {
      await deleteMutation.mutateAsync(templateToDelete.id)
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    }
  }

  const handleDownloadPdf = async (template: MenuTemplate) => {
    try {
      setPdfLoading(template.id)
      await downloadMenuTemplatePDF(template.id, template.name)
      toast.success('Karta menu pobrana')
    } catch {
      toast.error('Nie udalo sie pobrac karty menu')
    } finally {
      setPdfLoading(null)
    }
  }

  const getPackageCount = (template: MenuTemplate): number => {
    if (template._count?.packages !== undefined) return template._count.packages
    if (template.packages) return template.packages.length
    return 0
  }

  const stats = {
    total: allTemplates.length,
    active: allTemplates.filter((t) => t.isActive).length,
    inactive: allTemplates.filter((t) => !t.isActive).length,
  }

  return (
    <PageLayout>
      <Breadcrumb />
      <PageHero
        accent={accent}
        title="Szablony Menu"
        subtitle="Konfiguruj szablony menu dla typów wydarzeń"
        icon={FileText}
        action={
          <Button
            size="lg"
            onClick={handleCreate}
            className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
          >
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Nowy szablon</span>
          </Button>
        }
      />

      {/* Stats */}
      <div className={layout.statGrid3}>
        <StatCard label="Wszystkie" value={stats.total} subtitle="Szablony w systemie" icon={FileText} iconGradient={statGradients.count} delay={0.1} />
        <StatCard label="Aktywne" value={stats.active} subtitle="Gotowe do użycia" icon={Eye} iconGradient={statGradients.success} delay={0.2} />
        <StatCard label="Nieaktywne" value={stats.inactive} subtitle="Wyłączone" icon={EyeOff} iconGradient={statGradients.neutral} delay={0.3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filtruj po typie wydarzenia</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy</SelectItem>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant={showInactive ? 'default' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
              className="w-full sm:w-auto"
            >
              {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showInactive ? 'Pokaz wszystkie' : 'Pokaz nieaktywne'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <LoadingState variant="skeleton" rows={6} message="Wczytywanie szablonów..." />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Brak szablonów"
          description={selectedEventType !== 'all'
            ? 'Nie znaleziono szablonów menu dla wybranego typu wydarzenia. Zmień filtr lub utwórz nowy szablon.'
            : 'Nie masz jeszcze żadnych szablonów menu. Utwórz pierwszy szablon, aby zdefiniować ofertę menu dla swoich wydarzeń.'}
          actionLabel="Utwórz szablon"
          onAction={handleCreate}
        />
      ) : (
        <div className={layout.entityGrid}>
          {templates.map((template, index) => (
            <EntityCard
              key={template.id}
              accentColor={template.eventType?.color || undefined}
              dimmed={!template.isActive}
              delay={index * 0.05}
            >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold mb-1 truncate">{template.name}</h3>
                    {template.variant && (
                      <p className="text-sm text-muted-foreground truncate">{template.variant}</p>
                    )}
                  </div>
                  {!template.isActive && (
                    <Badge className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 ml-2 flex-shrink-0">Nieaktywny</Badge>
                  )}
                </div>

                <div className="mb-4">
                  <Badge style={{ backgroundColor: template.eventType?.color || undefined, color: 'white' }}>
                    {template.eventType?.name || 'Brak typu'}
                  </Badge>
                </div>

                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>
                )}

                <div className="flex items-center gap-3 sm:gap-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4 flex-shrink-0" />
                    <span>{getPackageCount(template)} pakietów</span>
                  </div>
                  {(template.validFrom || template.validTo) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Terminowy</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <Button size="sm" variant="outline" className="flex-1 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Edytuj</span>
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-neutral-100 transition-colors" onClick={() => handleDownloadPdf(template)} disabled={pdfLoading === template.id} title="Drukuj kartę menu">
                    {pdfLoading === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors" onClick={() => handleDelete(template)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
            </EntityCard>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MenuTemplateDialog open={dialogOpen} onOpenChange={setDialogOpen} template={editingTemplate} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Szablon &quot;{templateToDelete?.name}&quot; zostanie trwale usunięty. Wszystkie powiązane pakiety również zostaną usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
