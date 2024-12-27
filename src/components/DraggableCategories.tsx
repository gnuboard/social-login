'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface Category {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
  onOrderChange: (newOrder: Category[]) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function DraggableCategories({ categories, onOrderChange, onEdit, onDelete }: Props) {
  const [items, setItems] = useState(categories);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        onOrderChange(newOrder);
        return newOrder;
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map((category) => (
            <SortableItem
              key={category.id}
              id={category.id}
              category={category}
              onEdit={() => onEdit(category.id)}
              onDelete={() => onDelete(category.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 