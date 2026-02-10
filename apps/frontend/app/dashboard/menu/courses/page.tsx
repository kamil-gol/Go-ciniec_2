'use client'

import { useState } from 'react'
import { Book, ArrowLeft, Plus, Loader2, Edit, Trash2, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CourseBuilderDialog } from '@/components/menu/CourseBuilderDialog'
import { DishAssignmentDialog } from '@/components/menu/DishAssignmentDialog'
import { useMenuCourses, useDeleteMenuCourse } from '@/hooks/use-dishes-courses'
import { useMenuPackages } from '@/hooks/use-menu'
import Link from 'next/link'
import type { MenuCourse } from '@/types/menu.types'

export default function CoursesPage() {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [dishAssignOpen, setDishAssignOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<MenuCourse | null>(null)
  const [editingCourse, setEditingCourse] = useState<MenuCourse | null>(null)

  const { data: packages = [] } = useMenuPackages(null)
  const { data: courses = [], isLoading: loadingCourses } = useMenuCourses(selectedPackageId)
  const deleteCourseMutation = useDeleteMenuCourse()

  const handleDeleteCourse = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Czy na pewno chcesz usunąć kurs:\n"${name}"?\n\nTa operacja jest nieodwracalna!`)) {
      return
    }

    try {
      await deleteCourseMutation.mutateAsync({ id, packageId: selectedPackageId! })
      alert(`✅ Usunięto kurs: ${name}`)
    } catch (error: any) {
      alert(`❌ Błąd podczas usuwania:\n${error.error || 'Nieznany błąd'}`)
    }
  }

  const handleManageDishes = (course: MenuCourse) => {
    setSelectedCourse(course)
    setDishAssignOpen(true)
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
                    Powrót do Menu
                  </Button>
                </Link>
                
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <Book className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold tracking-tight">Kursy Menu</h1>
                    <p className="text-white/90 text-lg mt-2">Zarządzaj kursami dla pakietów menu</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex gap-6 mt-6">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                    <Book className="h-5 w-5" />
                    <div>
                      <p className="text-xs text-white/80">Kursy</p>
                      <p className="text-xl font-bold">{courses.length}</p>
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
          {/* Package Selection */}
          {!selectedPackageId ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Book className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center">Wybierz pakiet menu</h3>
                <p className="text-muted-foreground mb-6 text-center">Wybierz pakiet, dla którego chcesz zarządzać kursami</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                  {packages.map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className="border-2 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => setSelectedPackageId(pkg.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Kliknij, aby zarządzać kursami</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : loadingCourses ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <Card className="border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Book className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Brak kursów</h3>
                <p className="text-muted-foreground mb-6">Dodaj pierwszy kurs do tego pakietu</p>
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
                      <Badge variant="outline" className="border-blue-200 text-blue-600">
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
                            <p className="text-xs text-muted-foreground pl-4">+{course.options.length - 3} więcej...</p>
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
        </div>
      </div>
    </>
  )
}
