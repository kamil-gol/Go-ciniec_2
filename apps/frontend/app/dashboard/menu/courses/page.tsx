'use client'

import { useState } from 'react'
import { Book, ArrowLeft, Plus, Loader2, Edit, Trash2, ChefHat, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CourseBuilderDialog } from '@/components/menu/CourseBuilderDialog'
import { DishAssignmentDialog } from '@/components/menu/DishAssignmentDialog'
import { useMenuCourses, useDeleteMenuCourse } from '@/hooks/use-dishes-courses'
import { useMenuTemplates, useMenuPackages } from '@/hooks/use-menu'
import type { MenuCourse } from '@/types/menu.types'
import { PageLayout, PageHero, EmptyState, LoadingState } from '@/components/shared'
import { moduleAccents } from '@/lib/design-tokens'

export default function CoursesPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [dishAssignOpen, setDishAssignOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<MenuCourse | null>(null)
  const [editingCourse, setEditingCourse] = useState<MenuCourse | null>(null)
  const accent = moduleAccents.menu

  const { data: templates = [], isLoading: loadingTemplates } = useMenuTemplates()
  const { data: packages = [], isLoading: loadingPackages } = useMenuPackages(selectedTemplateId)
  const { data: courses = [], isLoading: loadingCourses } = useMenuCourses(selectedPackageId)
  const deleteCourseMutation = useDeleteMenuCourse()

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const selectedPackage = packages.find(p => p.id === selectedPackageId)

  const handleDeleteCourse = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Czy na pewno chcesz usunąć kurs:\n"${name}"?\n\nTa operacja jest nieodwracalna!`)) return
    try {
      await deleteCourseMutation.mutateAsync({ id, packageId: selectedPackageId! })
      alert(`\u2705 Usunięto kurs: ${name}`)
    } catch (error: any) {
      alert(`\u274c Błąd podczas usuwania:\n${error.error || 'Nieznany błąd'}`)
    }
  }

  const handleManageDishes = (course: MenuCourse) => {
    setSelectedCourse(course)
    setDishAssignOpen(true)
  }

  const heroSubtitle = !selectedTemplateId
    ? 'Wybierz szablon menu'
    : !selectedPackageId
      ? 'Wybierz pakiet'
      : `${selectedTemplate?.name} \u203a ${selectedPackage?.name}`

  return (
    <>
      <CourseBuilderDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        packageId={selectedPackageId}
        course={editingCourse}
      />
      <DishAssignmentDialog
        open={dishAssignOpen}
        onOpenChange={setDishAssignOpen}
        course={selectedCourse}
      />

      <PageLayout>
        <PageHero
          accent={accent}
          title="Kursy Menu"
          subtitle={heroSubtitle}
          icon={Book}
          backHref="/dashboard/menu"
          backLabel="Powrót do Menu"
          stats={[
            { icon: Book, label: 'Kursy', value: selectedPackageId ? courses.length : 0 },
          ]}
          action={
            selectedPackageId ? (
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 shadow-xl"
                onClick={() => { setEditingCourse(null); setCourseDialogOpen(true) }}
              >
                <Plus className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Dodaj Kurs</span>
              </Button>
            ) : undefined
          }
        />

        {/* Step 1: Template Selection */}
        {!selectedTemplateId ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 sm:p-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Krok 1: Wybierz szablon menu</h3>
              <p className="text-muted-foreground mb-6 text-center text-sm sm:text-base">Najpierw wybierz szablon, potem pakiet</p>

              {loadingTemplates ? (
                <LoadingState variant="skeleton" rows={3} message="Ładowanie szablonów..." />
              ) : templates.length === 0 ? (
                <EmptyState icon={Package} title="Brak szablonów menu" description="Utwórz szablon aby zacząć" actionLabel="Utwórz szablon" actionHref="/dashboard/menu" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 sm:mt-8">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="border-2 hover:border-orange-500 cursor-pointer transition-all hover:shadow-lg group"
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                            <Package className="h-5 w-5 text-white" />
                          </div>
                          {(template as any)._count && (
                            <Badge className="border border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/50">
                              {(template as any)._count.packages} pak.
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base sm:text-lg group-hover:text-orange-600 transition-colors">{template.name}</CardTitle>
                        {template.variant && (
                          <Badge className="w-fit mt-1 text-xs border border-neutral-200 dark:border-neutral-700">{template.variant}</Badge>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <p className="text-sm text-muted-foreground">Kliknij, aby wybrać pakiet</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : !selectedPackageId ? (
          /* Step 2: Package Selection */
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6 sm:p-12">
              <Button variant="ghost" className="mb-6" onClick={() => { setSelectedTemplateId(null); setSelectedPackageId(null) }}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Wróć do szablonów
              </Button>
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-center">Krok 2: Wybierz pakiet</h3>
              <p className="text-muted-foreground mb-6 text-center text-sm sm:text-base">Szablon: <strong>{selectedTemplate?.name}</strong></p>

              {loadingPackages ? (
                <LoadingState variant="skeleton" rows={3} message="Ładowanie pakietów..." />
              ) : packages.length === 0 ? (
                <EmptyState icon={Book} title="Brak pakietów" description="Ten szablon nie ma jeszcze pakietów" actionLabel="Dodaj pakiet" actionHref="/dashboard/menu" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 sm:mt-8">
                  {packages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className="border-2 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg group"
                      onClick={() => setSelectedPackageId(pkg.id)}
                    >
                      <CardHeader className="p-4 sm:p-6">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mb-2">
                          <Book className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-base sm:text-lg group-hover:text-blue-600 transition-colors">{pkg.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dorośli:</span>
                            <span className="font-semibold">{pkg.pricePerAdult} zł</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Dzieci:</span>
                            <span className="font-semibold">{pkg.pricePerChild} zł</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : loadingCourses ? (
          <LoadingState variant="skeleton" rows={6} message="Ładowanie kursów..." />
        ) : (
          /* Step 3: Courses List */
          <>
            <div className="mb-4 sm:mb-6">
              <Button variant="ghost" onClick={() => setSelectedPackageId(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Wróć do pakietów
              </Button>
            </div>

            {courses.length === 0 ? (
              <EmptyState
                icon={Book}
                title="Brak kursów"
                description={`Dodaj pierwszy kurs do pakietu: ${selectedPackage?.name}`}
                actionLabel="Dodaj kurs"
                onAction={() => { setEditingCourse(null); setCourseDialogOpen(true) }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden group">
                    <div className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:via-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
                      <CardHeader className="relative p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                            <Book className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          {course.isRequired && (
                            <Badge className="bg-red-500 text-white border-0 shadow-md text-xs">Wymagany</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg sm:text-xl group-hover:text-blue-600 transition-colors">{course.name}</CardTitle>
                        {course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                        )}
                      </CardHeader>
                    </div>
                    <CardContent className="space-y-3 p-4 sm:p-6 pt-0 sm:pt-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Wybierz:</span>
                        <Badge className="border border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-950/50">
                          {course.minSelect} - {course.maxSelect}
                        </Badge>
                      </div>
                      {course.options && course.options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                            <ChefHat className="h-4 w-4" /> Dania ({course.options.length}):
                          </p>
                          <div className="space-y-1">
                            {course.options.slice(0, 3).map((option) => (
                              <div key={option.id} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                <span className="line-clamp-1">{option.dish?.name ?? 'Nieznane danie'}</span>
                              </div>
                            ))}
                            {course.options.length > 3 && (
                              <p className="text-xs text-muted-foreground pl-4">+{course.options.length - 3} więcej...</p>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <Button size="sm" variant="outline" className="border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600" onClick={() => handleManageDishes(course)}>
                          <ChefHat className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600" onClick={() => { setEditingCourse(course); setCourseDialogOpen(true) }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600" onClick={(e) => handleDeleteCourse(course.id, course.name, e)} disabled={deleteCourseMutation.isPending}>
                          {deleteCourseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </PageLayout>
    </>
  )
}
