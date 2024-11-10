import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ id, text, completed, onToggle, onDelete }: TodoItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  let longPressTimer: ReturnType<typeof setTimeout>;

  const handleTouchStart = () => {
    longPressTimer = setTimeout(() => {
      setIsLongPress(true);
      setShowDelete(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
    if (!isLongPress) {
      onToggle(id);
    }
    setIsLongPress(false);
  };

  return (
    <div
      className="group flex items-center gap-3 p-3 pr-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors relative"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={() => clearTimeout(longPressTimer)}
    >
      <button
        onClick={() => onToggle(id)}
        className={`w-5 h-5 rounded-md border-2 ${
          completed
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-500'
        } flex items-center justify-center transition-all`}
      >
        {completed && <Check size={14} className="text-white" />}
      </button>
      <span className={`flex-1 transition-colors ${completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
        {text}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
        className={`absolute right-2 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-all duration-200 ${
          showDelete ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        aria-label="Delete task"
      >
        <X size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
}