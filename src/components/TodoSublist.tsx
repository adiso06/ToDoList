import React, { useState } from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { DraggableTodoItem } from './DraggableTodoItem';
import { useTodoStore } from '../store/todoStore';
import type { TodoItem as TodoItemType } from '../types';

interface TodoSublistProps {
  listId: string;
  name: string;
  items: TodoItemType[];
  onToggle: (itemId: string) => void;
  onAdd: (text: string) => void;
  onDelete: (itemId: string) => void;
  onEdit: (itemId: string, newText: string) => void;
}

export function TodoSublist({
  listId,
  name,
  items,
  onToggle,
  onAdd,
  onDelete,
  onEdit
}: TodoSublistProps) {
  const { collapsedSublists, toggleSublistCollapse, reorderSublist } = useTodoStore();
  const [newItemText, setNewItemText] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      onAdd(newItemText.trim());
      setNewItemText('');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      reorderSublist(listId, name, newItems);
    }
  };

  const isExpanded = !collapsedSublists.get(listId)?.has(name);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/50">
      <button
        onClick={() => toggleSublistCollapse(listId, name)}
        className="w-full p-4 text-left font-medium flex items-center justify-between transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50"
      >
        <div className="flex items-center gap-3">
          <ChevronRight
            size={20}
            className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''} text-gray-500`}
          />
          <span className="text-gray-900 dark:text-white">{name}</span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {items.filter(item => item.completed).length}/{items.length}
        </span>
      </button>
      
      <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add new item to sublist..."
              className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Add Item"
            >
              <Plus size={20} />
            </button>
          </form>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 pl-2">
                {items.map(item => (
                  <DraggableTodoItem
                    key={item.id}
                    {...item}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}