'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UtensilsCrossed, Plus, Search, Filter, Edit, Trash2,
  Package, Sparkles, ShoppingCart, Calendar, DollarSign,
  Users, CheckCircle2, Clock, Palette, Loader2
} from 'lucide-react'
import { 
  useMenuTemplates, 
  useMenuPackages, 
  useMenuOptions, 
  useEventTypes,
  useDeleteTemplate,
  useDeletePackage,
  useDeleteOption
} from '@/hooks/use-menu'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'

export default function MenuManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const { data: templates = [], isLoading: loadingTemplates } = useMenuTemplates()
  const { data: packages = [], isLoading: loadingPackages } = useMenuPackages(selectedTemplateId)
  const { data: options = [], isLoading: loadingOptions } = useMenuOptions()
  const { data: eventTypes = [], isLoading: loadingEventTypes } = useEventTypes()

  // Mutations
  const deleteTemplateMutation = useDeleteTemplate()
  const deletePackageMutation = useDeletePackage()
  const deleteOptionMutation = useDeleteOption()

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.variant?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEdit = (type: string, id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    alert(`Edycja: ${name}\n\nFunkcja edycji jest w przygotowaniu.\nID: ${id}`)
    // TODO: Open edit dialog or navigate to edit page
  }

  const handleDeleteTemplate = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Czy na pewno chcesz usunąć szablon:\n"${name}"?\n\nTa operacja jest nieodwracalna!`)) {
      return
    }

    try {
      await deleteTemplateMutation.mutateAsync(id)
      alert(`✅ Usunięto szablon: ${name}`)
    } catch (error: any) {
      alert(`❌ Błąd podczas usuwania:\n${error.error || 'Nieznany błąd'}`)
    }
  }

  const handleDeletePackage = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Czy na pewno chcesz usunąć pakiet:\n"${name}"?\n\nTa operacja jest nieodwracalna!`)) {
      return
    }

    try {
      await deletePackageMutation.mutateAsync({ id, templateId: selectedTemplateId! })
      alert(`✅ Usunięto pakiet: ${name}`)
    } catch (error: any) {
      alert(`❌ Błąd podczas usuwania:\n${error.error || 'Nieznany błąd'}`)
    }
  }

  const handleDeleteOption = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Czy na pewno chcesz usunąć opcję:\n"${name}"?\n\nTa operacja jest nieodwracalna!`)) {
      return
    }

    try {
      await deleteOptionMutation.mutateAsync(id)
      alert(`✅ Usunięto opcję: ${name}`)
    } catch (error: any) {
      alert(`❌ Błąd podczas usuwania:\n${error.error || 'Nieznany błąd'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <UtensilsCrossed className="h-10 w-10" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold tracking-tight">Zarządzanie Menu</h1>
                  <p className="text-white/90 text-lg mt-2">Konfiguracja szablonów menu, pakietów i opcji dodatkowych</p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 mt-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <Package className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Szablony</p>
                    <p className="text-xl font-bold">{templates.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <ShoppingCart className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Opcje</p>
                    <p className="text-xl font-bold">{options.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <Palette className="h-5 w-5" />
                  <div>
                    <p className="text-xs text-white/80">Typy wydarzeń</p>
                    <p className="text-xl font-bold">{eventTypes.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-white/90 shadow-xl h-14 px-8 text-lg font-semibold"
              onClick={() => alert('Funkcja dodawania nowych szablonów jest w przygotowaniu.')}
            >
              <Plus className="mr-2 h-6 w-6" />
              Dodaj Nowy
            </Button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-white dark:bg-gray-950 border-2 rounded-2xl shadow-lg p-2">
            <TabsTrigger value="templates" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <Package className="h-4 w-4 mr-2" />
              Szablony Menu ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="packages" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <DollarSign className="h-4 w-4 mr-2" />
              Pakiety ({selectedTemplateId ? packages.length : 0})
            </TabsTrigger>
            <TabsTrigger value="options" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Opcje ({options.length})
            </TabsTrigger>
            <TabsTrigger value="event-types" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Typy Wydarzeń ({eventTypes.length})
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Szukaj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 border-2 rounded-xl shadow-sm focus:shadow-lg transition-shadow"
              />
            </div>
            <Button 
              variant="outline" 
              className="h-12 px-6 rounded-xl border-2 hover:shadow-lg transition-shadow"
              onClick={() => alert('Funkcja filtrowania jest w przygotowaniu.')}
            >
              <Filter className="mr-2 h-5 w-5" />
              Filtry
            </Button>
          </div>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UtensilsCrossed className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Brak szablonów menu</h3>
                  <p className="text-muted-foreground mb-6">Zacznij od utworzenia pierwszego szablonu</p>
                  <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Utwórz szablon
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden group"
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10 group-hover:from-orange-500/20 group-hover:via-amber-500/20 group-hover:to-yellow-500/20 transition-all" />
                      <CardHeader className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                            <UtensilsCrossed className="h-6 w-6 text-white" />
                          </div>
                          <Badge 
                            className={`${
                              template.isActive 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-400 text-white'
                            } border-0 shadow-md`}
                          >
                            {template.isActive ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Aktywny</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> Nieaktywny</>
                            )}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                          {template.name}
                        </CardTitle>
                        {template.variant && (
                          <Badge variant="outline" className="w-fit border-orange-200 text-orange-600">
                            {template.variant}
                          </Badge>
                        )}
                      </CardHeader>
                    </div>
                    
                    <CardContent className="space-y-3">
                      {template.eventType && (
                        <div className="flex items-center gap-2 text-sm">
                          <div 
                            className="w-3 h-3 rounded-full shadow-md"
                            style={{ backgroundColor: template.eventType.color || '#888' }}
                          />
                          <span className="font-medium">{template.eventType.name}</span>
                        </div>
                      )}
                      
                      {template.validFrom && template.validTo && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-2 rounded-lg">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(template.validFrom), 'dd.MM.yyyy', { locale: pl })} - {format(new Date(template.validTo), 'dd.MM.yyyy', { locale: pl })}
                          </span>
                        </div>
                      )}

                      {template._count && (
                        <div className="flex gap-2 pt-2">
                          <Badge className="bg-blue-100 text-blue-700 border-0 dark:bg-blue-950/50 dark:text-blue-400">
                            <Package className="h-3 w-3 mr-1" />
                            {template._count.packages} pakietów
                          </Badge>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-2 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors"
                          onClick={(e) => handleEdit('szablon', template.id, template.name, e)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edytuj
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                          onClick={(e) => handleDeleteTemplate(template.id, template.name, e)}
                          disabled={deleteTemplateMutation.isPending}
                        >
                          {deleteTemplateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages">
            {!selectedTemplateId ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Wybierz szablon menu</h3>
                  <p className="text-muted-foreground">Najpierw wybierz szablon menu z zakładki "Szablony Menu"</p>
                </CardContent>
              </Card>
            ) : loadingPackages ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Brak pakietów</h3>
                  <p className="text-muted-foreground mb-6">Dodaj pakiety cenowe do tego szablonu</p>
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj pakiet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <Card key={pkg.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 group-hover:from-blue-500/20 group-hover:via-cyan-500/20 group-hover:to-teal-500/20 transition-all" />
                      <CardHeader className="relative">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg w-fit mb-3">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{pkg.name}</CardTitle>
                      </CardHeader>
                    </div>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                          <Users className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                          <p className="text-xs text-muted-foreground">Dorośli</p>
                          <p className="font-bold text-sm">{pkg.priceAdult} zł</p>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                          <Users className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                          <p className="text-xs text-muted-foreground">Dzieci</p>
                          <p className="font-bold text-sm">{pkg.priceChild} zł</p>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl">
                          <Users className="h-4 w-4 mx-auto mb-1 text-green-600" />
                          <p className="text-xs text-muted-foreground">Maluchy</p>
                          <p className="font-bold text-sm">{pkg.priceToddler} zł</p>
                        </div>
                      </div>

                      {pkg.includedItems && pkg.includedItems.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground">W pakiecie:</p>
                          <div className="space-y-1">
                            {pkg.includedItems.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{item}</span>
                              </div>
                            ))}
                            {pkg.includedItems.length > 3 && (
                              <p className="text-xs text-muted-foreground pl-6">+{pkg.includedItems.length - 3} więcej...</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                          onClick={(e) => handleEdit('pakiet', pkg.id, pkg.name, e)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edytuj
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                          onClick={(e) => handleDeletePackage(pkg.id, pkg.name, e)}
                          disabled={deletePackageMutation.isPending}
                        >
                          {deletePackageMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options">
            {loadingOptions ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Brak opcji dodatkowych</h3>
                  <p className="text-muted-foreground mb-6">Utwórz opcje takie jak alkohol, muzyka, dekoracje</p>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj opcję
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOptions.map((option) => (
                  <Card key={option.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-rose-500/10 group-hover:from-purple-500/20 group-hover:via-pink-500/20 group-hover:to-rose-500/20 transition-all" />
                      <CardHeader className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                            <Sparkles className="h-6 w-6 text-white" />
                          </div>
                          {option.category && (
                            <Badge className="bg-purple-100 text-purple-700 border-0 dark:bg-purple-950/50 dark:text-purple-400">
                              {option.category}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">{option.name}</CardTitle>
                      </CardHeader>
                    </div>
                    
                    <CardContent className="space-y-3">
                      {option.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{option.description}</p>
                      )}

                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                        <div>
                          <p className="text-xs text-muted-foreground">Cena</p>
                          <p className="text-2xl font-bold text-purple-600">{option.priceAmount} zł</p>
                        </div>
                        <Badge variant="outline" className="border-purple-200 text-purple-600">
                          {option.priceType === 'PER_PERSON' ? 'za osobę' : 'stała'}
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
                          onClick={(e) => handleEdit('opcję', option.id, option.name, e)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edytuj
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                          onClick={(e) => handleDeleteOption(option.id, option.name, e)}
                          disabled={deleteOptionMutation.isPending}
                        >
                          {deleteOptionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Event Types Tab */}
          <TabsContent value="event-types">
            {loadingEventTypes ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : eventTypes.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Brak typów wydarzeń</h3>
                  <p className="text-muted-foreground">Typy wydarzeń zarządzane są w sekcji Event Types</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {eventTypes.map((type) => (
                  <Card 
                    key={type.id} 
                    className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group"
                    style={{
                      background: `linear-gradient(135deg, ${type.color}15 0%, ${type.color}05 100%)`
                    }}
                  >
                    <CardContent className="p-6">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                        style={{ backgroundColor: type.color }}
                      >
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:scale-105 transition-transform">{type.name}</h3>
                      {type.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{type.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
