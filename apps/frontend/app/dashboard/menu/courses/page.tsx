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
import Link from 'next/link'
import type { MenuCourse } from '@/types/menu.types'

export default function CoursesPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [dishAssignOpen, setDishAssignOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<MenuCourse | null>(null)
  const [editingCourse, setEditingCourse] = useState<MenuCourse | null>(null)

  const { data: templates = [], isLoading: loadingTemplates } = useMenuTemplates()
  const { data: packages = [], isLoading: loadingPackages } = useMenuPackages(selectedTemplateId)
  const { data: courses = [], isLoading: loadingCourses } = useMenuCourses(selectedPackageId)
  const deleteCourseMutation = useDeleteMenuCourse()

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
  const selectedPackage = packages.find(p => p.id === selectedPackageId)

  const handleDeleteCourse = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Czy na pewno chcesz usun\u0105\u0107 kurs:\n"${name}"?\n\nTa operacja jest nieodwracalna!`)) {
      return
    }

    try {
      await deleteCourseMutation.mutateAsync({ id, packageId: selectedPackageId! })
      alert(`\u2705 Usuni\u0119to kurs: ${name}`)
    } catch (error: any) {
      alert(`\u274c B\u0142\u0105d podczas usuwania:\n${error.error || 'Nieznany b\u0142\u0105d'}`)
    }
  }

  const handleManageDishes = (course: MenuCourse) => {
    setSelectedCourse(course)
    setDishAssignOpen(true)
  }

  const handleBackToPackages = () => {
    setSelectedPackageId(null)
  }

  const handleBackToTemplates = () => {
    setSelectedTemplateId(null)
    setSelectedPackageId(null)
  }

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

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-b-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]" />
          
          <div className="container mx-auto px-6 py-12 relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <Link href="/dashboard/menu">
                  <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Powr\u00f3t do Menu
                  </Button>
                </Link>
                
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <Book className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold tracking-tight">Kursy Menu</h1>
                    <p className="text-white/90 text-lg mt-2">
                      {!selectedTemplateId 
                        ? 'Wybierz szablon menu' 
                        : !selectedPackageId 
                          ? 'Wybierz pakiet' 
                          : `${selectedTemplate?.name} \u203a ${selectedPackage?.name}`
                      }
                    </p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex gap-6 mt-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <Book className="h-5 w-5" />
                    <div>
                      <p className="text-xs text-white/80">Kursy</p>
                      <p className="text-xl font-bold">{selectedPackageId ? courses.length : 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPackageId && (
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 shadow-xl h-14 px-8 text-lg font-semibold"
                  onClick={() => {
                    setEditingCourse(null)
                    setCourseDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-6 w-6" />
                  Dodaj Kurs
                </Button>
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {/* Step 1: Template Selection */}
          {!selectedTemplateId ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">Krok 1: Wybierz szablon menu</h3>
                <p className="text-muted-foreground mb-6 text-center">Najpierw wybierz szablon, potem pakiet</p>
                
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Brak szablon\u00f3w menu</p>
                    <Link href="/dashboard/menu">
                      <Button className="bg-gradient-to-r from-orange-500 to-amber-500">
                        Utw\u00f3rz szablon
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    {templates.map((template) => (
                      <Card 
                        key={template.id}
                        className="border-2 hover:border-orange-500 cursor-pointer transition-all hover:shadow-lg group"
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                              <Package className="h-5 w-5 text-white" />
                            </div>
                            {(template as any)._count && (
                              <Badge className="border border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-950/50">
                                {(template as any)._count.packages} pakiet\u00f3w
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                            {template.name}
                          </CardTitle>
                          {template.variant && (
                            <Badge className="w-fit mt-1 text-xs border border-neutral-200 dark:border-neutral-700">
                              {template.variant}
                            </Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Kliknij, aby wybra\u0107 pakiet</p>
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
              <CardContent className="p-12">
                <Button 
                  variant="ghost" 
                  className="mb-6"
                  onClick={handleBackToTemplates}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Wr\u00f3\u0107 do szablon\u00f3w
                </Button>

                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Book className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">Krok 2: Wybierz pakiet</h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Szablon: <strong>{selectedTemplate?.name}</strong>
                </p>
                
                {loadingPackages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Ten szablon nie ma jeszcze pakiet\u00f3w</p>
                    <Link href="/dashboard/menu">
                      <Button className="bg-gradient-to-r from-blue-500 to-indigo-500">
                        Dodaj pakiet do szablonu
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                    {packages.map((pkg) => (
                      <Card 
                        key={pkg.id}
                        className="border-2 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg group"
                        onClick={() => setSelectedPackageId(pkg.id)}
                      >
                        <CardHeader>
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg w-fit mb-2">
                            <Book className="h-5 w-5 text-white" />
                          </div>
                          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                            {pkg.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Doro\u015bli:</span>
                              <span className="font-semibold">{pkg.priceAdult} z\u0142</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Dzieci:</span>
                              <span className="font-semibold">{pkg.priceChild} z\u0142</span>
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
            /* Loading Courses */
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            /* Step 3: Courses List */
            <>
              <div className="mb-6">
                <Button 
                  variant="ghost"
                  onClick={handleBackToPackages}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Wr\u00f3\u0107 do pakiet\u00f3w
                </Button>
              </div>

              {courses.length === 0 ? (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Book className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Brak kurs\u00f3w</h3>
                    <p className="text-muted-foreground mb-6">Dodaj pierwszy kurs do pakietu: <strong>{selectedPackage?.name}</strong></p>
                    <Button 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      onClick={() => {
                        setEditingCourse(null)
                        setCourseDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Dodaj kurs
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.id} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden group">
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:via-indigo-500/20 group-hover:to-purple-500/20 transition-all" />
                        <CardHeader className="relative">
                          <div className="flex items-start justify-between mb-2">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                              <Book className="h-6 w-6 text-white" />
                            </div>
                            {course.isRequired && (
                              <Badge className="bg-red-500 text-white border-0 shadow-md">
                                Wymagany
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                            {course.name}
                          </CardTitle>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                          )}
                        </CardHeader>
                      </div>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Wybierz:</span>
                          <Badge className="border border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-950/50">
                            {course.minSelect} - {course.maxSelect}
                          </Badge>
                        </div>

                        {course.options && course.options.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                              <ChefHat className="h-4 w-4" />
                              Dania ({course.options.length}):
                            </p>
                            <div className="space-y-1">
                              {course.options.slice(0, 3).map((option) => (
                                <div key={option.id} className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span className="line-clamp-1">{option.dish.name}</span>
                                </div>
                              ))}
                              {course.options.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-4">+{course.options.length - 3} wi\u0119cej...</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                            onClick={() => handleManageDishes(course)}
                          >
                            <ChefHat className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors"
                            onClick={() => {
                              setEditingCourse(course)
                              setCourseDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                            onClick={(e) => handleDeleteCourse(course.id, course.name, e)}
                            disabled={deleteCourseMutation.isPending}
                          >
                            {deleteCourseMutation.isPending ? (
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
            </>
          )}
        </div>
      </div>
    </>
  )
}
