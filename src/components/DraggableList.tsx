import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TodoList } from './TodoList';
import type { TodoList as TodoListType } from '../types';

interface Props {
  list: TodoListType;
  onToggle: (itemId: string, sublist?: string) => void;
  onAdd: (text: string, sublist?: string) => void;
  onReset: () => void;
}

export function DraggableList({ list, ...props }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full px-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="text-gray-400" size={20} />
      </div>
      <TodoList list={list} {...props} />
    </div>
  );
}