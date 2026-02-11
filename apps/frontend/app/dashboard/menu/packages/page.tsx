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
  Package,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Star,
  ThumbsUp,
  Users,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { useMenuTemplates } from '@/hooks/use-menu-templates'
import { usePackagesByTemplate, useDeletePackage } from '@/hooks/use-menu-packages'
import { MenuPackageDialog } from '@/components/menu/MenuPackageDialog'
import type { MenuPackage } from '@/lib/api/menu-packages-api'

export default function MenuPackagesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<MenuPackage | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<MenuPackage | null>(null)

  const { data: templates = [] } = useMenuTemplates({ isActive: true })
  const { data: packages = [], isLoading } = usePackagesByTemplate(selectedTemplate)
  const deleteMutation = useDeletePackage()

  const handleEdit = (pkg: MenuPackage) => {
    setEditingPackage(pkg)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    if (!selectedTemplate) return
    setEditingPackage(null)
    setDialogOpen(true)
  }

  const handleDelete = (pkg: MenuPackage) => {
    setPackageToDelete(pkg)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (packageToDelete) {
      await deleteMutation.mutateAsync(packageToDelete.id)
      setDeleteDialogOpen(false)
      setPackageToDelete(null)
    }
  }

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <Link href="/dashboard/menu">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót do Menu
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Package className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-tight">Pakiety Menu</h1>
                <p className="text-white/90 text-lg mt-2">Konfiguruj pakiety dla szablonów menu</p>
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleCreate}
              disabled={!selectedTemplate}
              className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nowy pakiet
            </Button>
          </div>

          {/* Quick Stats */}
          {selectedTemplate && (
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                <Package className="h-5 w-5" />
                <div>
                  <p className="text-xs text-white/80">Pakiety</p>
                  <p className="text-2xl font-bold">{packages.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                <Star className="h-5 w-5" />
                <div>
                  <p className="text-xs text-white/80">Popularne</p>
                  <p className="text-2xl font-bold">{packages.filter((p) => p.isPopular).length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/20">
                <ThumbsUp className="h-5 w-5" />
                <div>
                  <p className="text-xs text-white/80">Polecane</p>
                  <p className="text-2xl font-bold">{packages.filter((p) => p.isRecommended).length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Template Selector */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Wybierz szablon menu <span className="text-red-500">*</span>
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz szablon..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.variant && ` (${template.variant})`}
                      {template.eventType && (
                        <span className="text-muted-foreground ml-2">
                          - {template.eventType.name}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedTemplate && (
                <p className="text-sm text-muted-foreground">
                  Wybierz szablon aby zobaczyć lub dodawać pakiety
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Packages Grid */}
        {!selectedTemplate ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Wybierz szablon</h3>
              <p className="text-muted-foreground">
                Wybierz szablon menu powyżej aby zobaczyć jego pakiety
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Wczytywanie pakietów...</p>
          </div>
        ) : packages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Brak pakietów</h3>
              <p className="text-muted-foreground mb-6">
                Szablon "{selectedTemplateData?.name}" nie ma jeszcze żadnych pakietów
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Utwórz pierwszy pakiet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((pkg) => (
                <Card
                  key={pkg.id}
                  className="hover:shadow-xl transition-all border-2 relative overflow-hidden"
                  style={{
                    borderColor: pkg.color || undefined,
                  }}
                >
                  {/* Top Badge */}
                  {(pkg.isPopular || pkg.isRecommended || pkg.badgeText) && (
                    <div className="absolute top-3 right-3 flex gap-2">
                      {pkg.badgeText && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                          {pkg.badgeText}
                        </Badge>
                      )}
                      {pkg.isPopular && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          <Star className="h-3 w-3 mr-1" />
                          Popularny
                        </Badge>
                      )}
                      {pkg.isRecommended && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Polecany
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="mb-4 mt-8">
                      <div className="flex items-center gap-2 mb-2">
                        {pkg.icon && <span className="text-3xl">{pkg.icon}</span>}
                        <h3 className="text-xl font-bold">{pkg.name}</h3>
                      </div>
                      {pkg.shortDescription && (
                        <p className="text-sm text-muted-foreground">{pkg.shortDescription}</p>
                      )}
                    </div>

                    {/* Prices */}
                    <div className="space-y-2 mb-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Dorosły:</span>
                        <span className="text-lg font-bold" style={{ color: pkg.color || undefined }}>
                          {parseFloat(pkg.pricePerAdult).toFixed(2)} zł
                        </span>
                      </div>
                      {parseFloat(pkg.pricePerChild) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Dziecko:</span>
                          <span className="font-semibold">
                            {parseFloat(pkg.pricePerChild).toFixed(2)} zł
                          </span>
                        </div>
                      )}
                      {parseFloat(pkg.pricePerToddler) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Maluch:</span>
                          <span className="font-semibold">
                            {parseFloat(pkg.pricePerToddler).toFixed(2)} zł
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Guest Limits */}
                    {(pkg.minGuests || pkg.maxGuests) && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {pkg.minGuests && pkg.maxGuests
                            ? `${pkg.minGuests}-${pkg.maxGuests} osób`
                            : pkg.minGuests
                            ? `Min. ${pkg.minGuests} osób`
                            : `Max. ${pkg.maxGuests} osób`}
                        </span>
                      </div>
                    )}

                    {/* Included Items */}
                    {pkg.includedItems.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">W pakiecie:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {pkg.includedItems.slice(0, 3).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              {item}
                            </li>
                          ))}
                          {pkg.includedItems.length > 3 && (
                            <li className="text-xs">+ {pkg.includedItems.length - 3} więcej...</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Options Count */}
                    <div className="flex items-center gap-2 mb-4 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {pkg._count?.packageOptions || 0} przypisanych opcji
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edytuj
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(pkg)}
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
      {selectedTemplate && (
        <MenuPackageDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          templateId={selectedTemplate}
          package={editingPackage}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Pakiet "{packageToDelete?.name}" zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
