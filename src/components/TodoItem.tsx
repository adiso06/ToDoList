import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
}

export function TodoItem({ id, text, completed, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [showDelete, setShowDelete] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);
  let longPressTimer: ReturnType<typeof setTimeout>;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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

  const handleEdit = () => {
    if (!completed) {
      setIsEditing(true);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editText.trim() !== text) {
      onEdit(id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditText(text);
      setIsEditing(false);
    }
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
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </form>
      ) : (
        <span
          onClick={handleEdit}
          className={`flex-1 cursor-pointer transition-colors ${
            completed
              ? 'line-through text-gray-400 dark:text-gray-500'
              : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {text}
        </span>
      )}
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