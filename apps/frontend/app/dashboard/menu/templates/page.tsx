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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Copy,
  Package,
  Calendar,
  Eye,
  EyeOff,
  Printer,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useMenuTemplates, useDeleteMenuTemplate } from '@/hooks/use-menu-templates'
import { useEventTypes } from '@/hooks/use-event-types'
import { MenuTemplateDialog } from '@/components/menu/MenuTemplateDialog'
import { downloadMenuTemplatePDF } from '@/lib/api/menu-templates-api'
import type { MenuTemplate } from '@/lib/api/menu-templates-api'
import { toast } from 'sonner'

export default function MenuTemplatesPage() {
  const [selectedEventType, setSelectedEventType] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<MenuTemplate | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  const { data: eventTypes = [] } = useEventTypes()
  const { data: allTemplates = [], isLoading } = useMenuTemplates()
  const deleteMutation = useDeleteMenuTemplate()

  // Filter templates
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

  /** Helper: get package count from either _count or packages array */
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powr\u00f3t do Menu
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <FileText className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight">Szablony Menu</h1>
                <p className="text-white/90 text-lg mt-2">Konfiguruj szablony menu dla typ\u00f3w wydarze\u0144</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleCreate}
              className="bg-white text-blue-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nowy szablon
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
              <FileText className="h-5 w-5" />
              <div>
                <p className="text-xs text-white/80">Wszystkie</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
              <Eye className="h-5 w-5" />
              <div>
                <p className="text-xs text-white/80">Aktywne</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
              <EyeOff className="h-5 w-5" />
              <div>
                <p className="text-xs text-white/80">Nieaktywne</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  Filtruj po typie wydarzenia
                </label>
                <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant={showInactive ? 'default' : 'outline'}
                  onClick={() => setShowInactive(!showInactive)}
                >
                  {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                  {showInactive ? 'Pokaz wszystkie' : 'Pokaz nieaktywne'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Wczytywanie szablon\u00f3w...</p>
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Brak szablon\u00f3w</h3>
              <p className="text-muted-foreground mb-6">
                {selectedEventType !== 'all'
                  ? 'Brak szablon\u00f3w dla wybranego typu wydarzenia'
                  : 'Zacznij od stworzenia pierwszego szablonu menu'}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Utw\u00f3rz szablon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="hover:shadow-lg transition-shadow border-2"
                style={{
                  borderColor: template.eventType?.color || undefined,
                  opacity: template.isActive ? 1 : 0.6,
                }}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{template.name}</h3>
                      {template.variant && (
                        <p className="text-sm text-muted-foreground">{template.variant}</p>
                      )}
                    </div>
                    {!template.isActive && (
                      <Badge className="bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Nieaktywny</Badge>
                    )}
                  </div>

                  {/* Event Type */}
                  <div className="mb-4">
                    <Badge
                      style={{
                        backgroundColor: template.eventType?.color || undefined,
                        color: 'white',
                      }}
                    >
                      {template.eventType?.name || 'Brak typu'}
                    </Badge>
                  </div>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>{getPackageCount(template)} pakiet\u00f3w</span>
                    </div>
                    {(template.validFrom || template.validTo) && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Terminowy</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edytuj
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPdf(template)}
                      disabled={pdfLoading === template.id}
                      title="Drukuj kart\u0119 menu"
                    >
                      {pdfLoading === template.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <MenuTemplateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usun\u0105\u0107?</AlertDialogTitle>
            <AlertDialogDescription>
              Szablon "{templateToDelete?.name}" zostanie trwale usuni\u0119ty.
              Wszystkie powi\u0105zane pakiety r\u00f3wnie\u017c zostan\u0105 usuni\u0119te.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Usu\u0144
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
