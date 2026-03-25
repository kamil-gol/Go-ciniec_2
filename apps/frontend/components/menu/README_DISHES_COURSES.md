# Dish & Course Management Components

Komponenty do zarządzania biblioteką dań i kursami menu.

## 🍽️ Dish Components

### DishLibraryManager

Główny komponent do zarządzania biblioteką dań.

**Features:**
- Lista wszystkich dań w formie grid
- Filtry: kategoria, status aktywny/nieaktywny, wyszukiwanie
- CRUD operations (create, delete)
- Wyświetlanie alergenów i modyfikatorów cen
- Responsywny layout
- Loading i empty states

**Użycie:**
```tsx
import { DishLibraryManager } from '@/components/menu'

export default function DishesPage() {
  return (
    <div className="container mx-auto py-8">
      <DishLibraryManager />
    </div>
  )
}
```

### CreateDishDialog

Dialog do tworzenia nowych dań.

**Features:**
- Formularze z walidacją
- Wybór kategorii (Przystawka, Zupa, Danie główne, etc.)
- Dodawanie wielu alergenów
- Modyfikator ceny
- URL zdjęcia i miniatury
- Integracja z React Query

**Props:**
```typescript
interface CreateDishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Przykład:**
```tsx
import { CreateDishDialog } from '@/components/menu'

function MyComponent() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Dodaj danie
      </Button>
      <CreateDishDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
```

---

## 📚 Course Components

### CourseBuilderDialog

Dialog do tworzenia i edycji kursów menu w pakiecie.

**Features:**
- Create & Edit mode
- Konfiguracja min/max wyborów
- Toggle "kurs wymagany"
- Wybór ikony (Lucide Icons)
- Walidacja (maxSelect >= minSelect)

**Props:**
```typescript
interface CourseBuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  packageId: string
  course?: MenuCourse // Jeśli podane = tryb edycji
}
```

**Przykład (Create):**
```tsx
import { CourseBuilderDialog } from '@/components/menu'

function PackageManager({ packageId }: { packageId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Dodaj kurs
      </Button>
      <CourseBuilderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        packageId={packageId}
      />
    </>
  )
}
```

**Przykład (Edit):**
```tsx
<CourseBuilderDialog
  open={editDialogOpen}
  onOpenChange={setEditDialogOpen}
  packageId={packageId}
  course={selectedCourse}
/>
```

### DishAssignmentDialog

Dialog do przypisywania dań do kursu.

**Features:**
- Lista wszystkich aktywnych dań
- Filtrowanie po kategorii
- Multi-select z checkboxami
- Custom price dla każdego dania
- Flagi: isDefault, isRecommended
- Pokazuje obecnie przypisane dania
- Bulk assignment operation

**Props:**
```typescript
interface DishAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
}
```

**Przykład:**
```tsx
import { DishAssignmentDialog } from '@/components/menu'

function CourseActions({ courseId }: { courseId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        Przypisz dania
      </Button>
      <DishAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
      />
    </>
  )
}
```

---

## 🔗 API Integration

Komponenty korzystają z React Query hooks:

### Dishes
```typescript
import { 
  useDishes,
  useDish,
  useCreateDish,
  useUpdateDish,
  useDeleteDish 
} from '@/hooks/use-dishes'

// Lista dań z filtrami
const { data: dishes, isLoading } = useDishes({
  category: 'MAIN_COURSE',
  isActive: true,
  search: 'kurczak'
})

// Pojedyncze danie
const { data: dish } = useDish(dishId)

// Mutacje
const createMutation = useCreateDish()
const updateMutation = useUpdateDish()
const deleteMutation = useDeleteDish()
```

### Courses
```typescript
import { 
  useCoursesByPackage,
  useCourse,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useAssignDishes,
  useRemoveDish
} from '@/hooks/use-menu-config'

// Kursy dla pakietu
const { data: courses } = useCoursesByPackage(packageId)

// Pojedynczy kurs
const { data: course } = useCourse(courseId)

// Przypisywanie dań
const assignMutation = useAssignDishes()
await assignMutation.mutateAsync({
  courseId,
  input: {
    dishes: [
      { dishId: 'xxx', isDefault: true },
      { dishId: 'yyy', customPrice: 50 }
    ]
  }
})
```

---

## 🎨 Styling

Wszystkie komponenty używają:
- **shadcn/ui** components
- **Tailwind CSS**
- **Lucide Icons**
- **Gradient buttons** (brand consistency)

### Color Schemes
- **Dishes**: Orange to Red gradient (`from-orange-500 to-red-500`)
- **Courses**: Blue to Purple gradient (`from-blue-500 to-purple-500`)
- **Assignment**: Green to Emerald gradient (`from-green-500 to-emerald-500`)

---

## 📝 Data Flow

### Creating a Complete Menu Course

1. **Create Dishes** (if not exist)
   ```
   DishLibraryManager → CreateDishDialog → API
   ```

2. **Create Course for Package**
   ```
   CourseBuilderDialog → API
   ```

3. **Assign Dishes to Course**
   ```
   DishAssignmentDialog → API
   ```

4. **Client Selection** (booking flow)
   ```
   Client sees courses → Selects dishes → Saved to reservation
   ```

---

## 🐛 Common Issues

### Issue: Dishes not showing in assignment dialog
**Solution:** Upewnij się, że dania są `isActive: true`

### Issue: Course not updating after dish assignment
**Solution:** React Query automatycznie invaliduje cache - sprawdź `queryKey` w hooks

### Issue: Validation errors on course creation
**Solution:** Upewnij się, że `maxSelect >= minSelect`

---

## 🚀 Best Practices

1. **Zawsze filtruj dania po kategorii** przed przypisaniem do kursu
2. **Używaj isDefault** dla najbardziej popularnych dań
3. **Używaj isRecommended** dla polecanych opcji (wyższe marże)
4. **Custom price** tylko jeśli cena dania jest inna niż w bazie
5. **Testuj min/max select** przed wdrożeniem - wpływa na UX klienta

---

## 📚 Related Documentation

- [Backend API Documentation](../../../backend/src/controllers/README.md)
- [React Query Hooks](../../hooks/README.md)
- [Type Definitions](../../types/menu.types.ts)
