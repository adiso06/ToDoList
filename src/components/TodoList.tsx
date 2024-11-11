import React, { useState } from 'react';
import { Plus, RotateCcw, Save, Trash2, ListPlus, ChevronDown } from 'lucide-react';
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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import type { TodoList as TodoListType } from '../types';
import { useTodoStore } from '../store/todoStore';
import { DraggableTodoItem } from './DraggableTodoItem';
import { TodoSublist } from './TodoSublist';

interface Props {
  list: TodoListType;
  onToggle: (itemId: string, sublist?: string) => void;
  onAdd: (text: string, sublist?: string) => void;
  onReset: () => void;
}

export function TodoList({ list, onToggle, onAdd, onReset }: Props) {
  const {
    createSublist,
    saveAsDefault,
    deleteList,
    deleteItem,
    editItem,
    toggleListCollapse,
    collapsedLists,
    reorderSublist
  } = useTodoStore();
  
  const [newItemText, setNewItemText] = useState('');
  const [newSublistName, setNewSublistName] = useState('');
  const [showSublistInput, setShowSublistInput] = useState(false);

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

  const handleCreateSublist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSublistName.trim()) {
      createSublist(list.id, newSublistName.trim());
      setNewSublistName('');
      setShowSublistInput(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const items = [...list.items];
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      reorderSublist(list.id, '', newItems);
    }
  };

  const isCollapsed = collapsedLists.has(list.id);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      <div 
        className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 cursor-pointer select-none"
        onClick={() => toggleListCollapse(list.id)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChevronDown
              size={24}
              className={`transform transition-transform text-white ${isCollapsed ? '-rotate-90' : ''}`}
            />
            <h2 className="text-2xl font-bold text-white">{list.name}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveAsDefault(list.id);
              }}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-colors"
              title="Save as Default"
            >
              <Save size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-colors"
              title="Reset to Default"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteList(list.id);
              }}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white transition-colors"
              title="Delete List"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0' : 'max-h-[5000px]'} overflow-hidden`}>
        <div className="p-6">
          <div className="flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add new item..."
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

            {!showSublistInput ? (
              <button
                onClick={() => setShowSublistInput(true)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <ListPlus size={20} />
                <span>Add new sublist</span>
              </button>
            ) : (
              <form onSubmit={handleCreateSublist} className="relative">
                <input
                  type="text"
                  value={newSublistName}
                  onChange={(e) => setNewSublistName(e.target.value)}
                  placeholder="New sublist name..."
                  className="w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white shadow-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Create Sublist"
                >
                  <Plus size={20} />
                </button>
              </form>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={list.items?.map(item => item.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {list.items?.map(item => (
                    <DraggableTodoItem
                      key={item.id}
                      {...item}
                      onToggle={(itemId) => onToggle(itemId)}
                      onDelete={(itemId) => deleteItem(list.id, itemId)}
                      onEdit={(itemId, newText) => editItem(list.id, itemId, newText)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {list.sublists && Object.entries(list.sublists).length > 0 && (
              <div className="space-y-4">
                {Object.entries(list.sublists).map(([sublist, items]) => (
                  <TodoSublist
                    key={`${list.id}-sublist-${sublist}`}
                    listId={list.id}
                    name={sublist}
                    items={items}
                    onToggle={(itemId) => onToggle(itemId, sublist)}
                    onAdd={(text) => onAdd(text, sublist)}
                    onDelete={(itemId) => deleteItem(list.id, itemId, sublist)}
                    onEdit={(itemId, newText) => editItem(list.id, itemId, newText, sublist)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}