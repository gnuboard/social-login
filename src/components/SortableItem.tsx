'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: number;
  category: {
    name: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableItem({ id, category, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
    >
      <div className="flex items-center gap-2">
        <button
          className="cursor-move text-gray-500 hover:text-gray-700"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <span>{category.name}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="text-blue-500 hover:text-blue-700"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700"
        >
          삭제
        </button>
      </div>
    </div>
  );
} 