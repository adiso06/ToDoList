import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, X } from 'lucide-react';
import { InlineEdit } from './InlineEdit';
import type { TodoItem as TodoItemType } from '../types';

interface ItemProps {
  item: TodoItemType;
  onToggle?: () => void;
  onEdit?: (text: string) => void;
  onDelete?: () => void;
}

interface RowProps extends ItemProps {
  style?: CSSProperties;
  handleProps?: HTMLAttributes<HTMLButtonElement> & { ref?: (el: HTMLElement | null) => void };
  dimmed?: boolean;
  overlay?: boolean;
}

export const TodoItemRow = forwardRef<HTMLLIElement, RowProps>(function TodoItemRow(
  { item, onToggle, onEdit, onDelete, style, handleProps, dimmed, overlay },
  ref
) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <li
      ref={ref}
      style={style}
      className={`group relative flex items-start rounded-lg ${dimmed ? 'opacity-30' : ''} ${
        overlay
          ? 'list-none bg-white shadow-lg ring-1 ring-black/5 dark:bg-zinc-800 dark:ring-white/10'
          : 'hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
      }`}
    >
      <button
        type="button"
        aria-label={`Reorder ${item.text}`}
        {...handleProps}
        className="hover-reveal flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.completed}
        aria-label={item.text}
        onClick={onToggle}
        className="flex h-9 w-8 shrink-0 items-center justify-center"
      >
        <span
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] transition-colors ${
            item.completed
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-zinc-300 group-hover:border-zinc-400 dark:border-zinc-600 dark:group-hover:border-zinc-500'
          }`}
        >
          {item.completed && <Check size={12} strokeWidth={3} />}
        </span>
      </button>
      {isEditing ? (
        <InlineEdit
          initial={item.text}
          ariaLabel="Edit item"
          className="my-0.5 flex-1"
          onCancel={() => setIsEditing(false)}
          onCommit={(text) => {
            setIsEditing(false);
            // Clearing an item's text deletes it (with undo), like Reminders.
            if (!text) onDelete?.();
            else if (text !== item.text) onEdit?.(text);
          }}
        />
      ) : (
        <span
          onClick={() => onEdit && setIsEditing(true)}
          title="Click to edit"
          className={`min-w-0 flex-1 cursor-text break-words py-1.5 text-base leading-6 sm:text-[15px] ${
            item.completed ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'
          }`}
        >
          {item.text}
        </span>
      )}
      <button
        type="button"
        aria-label={`Delete ${item.text}`}
        title="Delete"
        onClick={onDelete}
        className="hover-reveal flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
      >
        <X size={16} />
      </button>
    </li>
  );
});

export function SortableTodoItem({ container, ...props }: ItemProps & { container: string }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: props.item.id,
    data: { container }
  });

  return (
    <TodoItemRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      handleProps={{ ...attributes, ...listeners, ref: setActivatorNodeRef }}
      dimmed={isDragging}
      {...props}
    />
  );
}
