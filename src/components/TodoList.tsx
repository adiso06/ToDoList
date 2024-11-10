import React, { useState } from 'react';
import { Plus, RotateCcw, Save, Trash2, ListPlus, ChevronDown } from 'lucide-react';
import type { TodoList as TodoListType } from '../types';
import { useTodoStore } from '../store/todoStore';
import { TodoItem } from './TodoItem';
import { TodoSublist } from './TodoSublist';

interface Props {
  list: TodoListType;
  onToggle: (itemId: string, sublist?: string) => void;
  onAdd: (text: string, sublist?: string) => void;
  onReset: () => void;
}

export function TodoList({ list, onToggle, onAdd, onReset }: Props) {
  const { createSublist, saveAsDefault, deleteList, deleteItem } = useTodoStore();
  const [newItemText, setNewItemText] = useState('');
  const [newSublistName, setNewSublistName] = useState('');
  const [showSublistInput, setShowSublistInput] = useState(false);
  const [expandedSublists, setExpandedSublists] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSublist = (sublist: string) => {
    const newExpanded = new Set(expandedSublists);
    if (newExpanded.has(sublist)) {
      newExpanded.delete(sublist);
    } else {
      newExpanded.add(sublist);
    }
    setExpandedSublists(newExpanded);
  };

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

  const handleHeaderClick = (e: React.MouseEvent) => {
    // Prevent collapse when clicking buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      <div 
        className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 cursor-pointer select-none"
        onClick={handleHeaderClick}
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

            <div className="space-y-4">
              {list.items?.map(item => (
                <TodoItem
                  key={`${list.id}-item-${item.id}`}
                  id={item.id}
                  text={item.text}
                  completed={item.completed}
                  onToggle={(itemId) => onToggle(itemId)}
                  onDelete={(itemId) => deleteItem(list.id, itemId)}
                />
              ))}
            </div>

            {list.sublists && Object.entries(list.sublists).length > 0 && (
              <div className="space-y-4">
                {Object.entries(list.sublists).map(([sublist, items]) => (
                  <TodoSublist
                    key={`${list.id}-sublist-${sublist}`}
                    name={sublist}
                    items={items}
                    isExpanded={expandedSublists.has(sublist)}
                    onToggle={(itemId) => onToggle(itemId, sublist)}
                    onAdd={(text) => onAdd(text, sublist)}
                    onDelete={(itemId) => deleteItem(list.id, itemId, sublist)}
                    onToggleExpand={() => toggleSublist(sublist)}
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