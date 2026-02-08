'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { QueueItem } from '@/types'
import { SortableQueueItem } from './sortable-queue-item'
import { QueueItemCard } from './queue-item-card'
import { Loader2 } from 'lucide-react'

interface DraggableQueueListProps {
  items: QueueItem[]
  onReorder: (items: QueueItem[]) => Promise<void>
  onPromote?: (id: string) => void
  onEdit?: (id: string) => void
  showPromoteButton?: boolean
  disabled?: boolean // Disable drag and drop
}

export function DraggableQueueList({
  items,
  onReorder,
  onPromote,
  onEdit,
  showPromoteButton = false,
  disabled = false,
}: DraggableQueueListProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)
  // ✨ BUG #6 FIX: Add loading state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync with parent when items change
  if (items !== localItems && !activeId && !isLoading) {
    setLocalItems(items)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    // ✨ BUG #6 FIX: Prevent drag if loading or disabled
    if (disabled || isLoading) return
    setActiveId(event.active.id as string)
    setError(null) // Clear previous errors
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    // ✨ BUG #6 FIX: Prevent action if disabled or loading
    if (disabled || isLoading) return
    
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id)
      const newIndex = localItems.findIndex((item) => item.id === over.id)

      const reorderedItems = arrayMove(localItems, oldIndex, newIndex)
      
      // Update positions
      const itemsWithNewPositions = reorderedItems.map((item, index) => ({
        ...item,
        position: index + 1,
      }))

      // ✨ BUG #6 FIX: Optimistic update
      setLocalItems(itemsWithNewPositions)
      setIsLoading(true)
      setError(null)

      try {
        await onReorder(itemsWithNewPositions)
        // Success - keep optimistic update
      } catch (error: any) {
        // ✨ BUG #6 FIX: Revert on error with visual feedback
        setLocalItems(items)
        setError(error.message || 'Nie udało się zmienić kolejności. Spróbuj ponownie.')
        
        // Auto-clear error after 5 seconds
        setTimeout(() => setError(null), 5000)
      } finally {
        // ✨ BUG #6 FIX: Clear loading state
        setIsLoading(false)
      }
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const activeItem = activeId ? localItems.find((item) => item.id === activeId) : null

  if (localItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Brak elementów w kolejce
      </div>
    )
  }

  // ✨ BUG #6 FIX: Show loading state if disabled or loading
  const isDisabled = disabled || isLoading

  // If disabled, show simple list without drag and drop
  if (isDisabled && !isLoading) {
    return (
      <div className="space-y-3">
        {localItems.map((item, index) => (
          <QueueItemCard
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === localItems.length - 1}
            onPromote={showPromoteButton && onPromote ? () => onPromote(item.id) : undefined}
            onEdit={onEdit ? () => onEdit(item.id) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* ✨ BUG #6 FIX: Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2 bg-card p-4 rounded-lg shadow-lg border">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Zapisywanie kolejności...</p>
          </div>
        </div>
      )}

      {/* ✨ BUG #6 FIX: Error message */}
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm">
          <p className="font-medium">Błąd</p>
          <p>{error}</p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={localItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div 
            className={`space-y-3 transition-opacity ${
              isLoading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {localItems.map((item, index) => (
              <SortableQueueItem
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === localItems.length - 1}
                onPromote={showPromoteButton && onPromote && !isLoading ? () => onPromote(item.id) : undefined}
                onEdit={onEdit && !isLoading ? () => onEdit(item.id) : undefined}
                disabled={isLoading}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80">
              <QueueItemCard
                item={activeItem}
                isFirst={false}
                isLast={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
