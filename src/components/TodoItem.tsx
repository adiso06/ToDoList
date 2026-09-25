import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Minus, Pencil, Repeat, Repeat1, SkipForward, Trash2, Undo2 } from 'lucide-react';
import { InlineEdit } from './InlineEdit';
import { Menu } from './Menu';
import type { TodoItem as TodoItemType } from '../types';

export interface ItemHandlers {
  onToggle?: () => void;
  onEdit?: (text: string) => void;
  onDelete?: () => void;
  onToggleOneOff?: () => void;
  onToggleSkipped?: () => void;
}

interface RowProps extends ItemHandlers {
  item: TodoItemType;
  style?: CSSProperties;
  // Omitted for rows that can't be dragged (checked/skipped items).
  handleProps?: HTMLAttributes<HTMLButtonElement> & { ref?: (el: HTMLElement | null) => void };
  dimmed?: boolean;
  overlay?: boolean;
}

export const TodoItemRow = forwardRef<HTMLLIElement, RowProps>(function TodoItemRow(
  { item, onToggle, onEdit, onDelete, onToggleOneOff, onToggleSkipped, style, handleProps, dimmed, overlay },
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
      {handleProps ? (
        <button
          type="button"
          aria-label={`Reorder ${item.text}`}
          {...handleProps}
          className="hover-reveal flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
        >
          <GripVertical size={14} />
        </button>
      ) : (
        <span className="w-5 shrink-0" />
      )}
      {item.skipped ? (
        <button
          type="button"
          aria-label={`Need ${item.text} this time`}
          title="Skipped this time. Tap to bring it back"
          onClick={onToggleSkipped}
          className="flex h-9 w-8 shrink-0 items-center justify-center"
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-600">
            <Minus size={12} strokeWidth={3} />
          </span>
        </button>
      ) : (
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
      )}
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
            item.completed
              ? 'text-zinc-400 line-through dark:text-zinc-500'
              : item.skipped
                ? 'text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-800 dark:text-zinc-100'
          }`}
        >
          {item.text || <span className="italic text-zinc-400">Untitled</span>}
          {item.oneOff && (
            <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded bg-amber-100 px-1.5 align-middle text-[11px] font-medium leading-4 text-amber-800 no-underline dark:bg-amber-500/15 dark:text-amber-200">
              once
            </span>
          )}
          {item.skipped && (
            <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded bg-zinc-100 px-1.5 align-middle text-[11px] font-medium leading-4 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              skipped
            </span>
          )}
        </span>
      )}
      {!overlay && (
        <Menu
          label={`${item.text} options`}
          className="hover-reveal mr-0.5 mt-0.5"
          actions={[
            { label: 'Edit', icon: Pencil, onSelect: () => setIsEditing(true) },
            item.oneOff
              ? { label: 'Keep every time', icon: Repeat, onSelect: () => onToggleOneOff?.() }
              : { label: 'Just this time', icon: Repeat1, onSelect: () => onToggleOneOff?.() },
            item.skipped
              ? { label: 'Need it this time', icon: Undo2, onSelect: () => onToggleSkipped?.() }
              : { label: 'Skip this time', icon: SkipForward, onSelect: () => onToggleSkipped?.() },
            'divider',
            { label: 'Delete', icon: Trash2, danger: true, onSelect: () => onDelete?.() }
          ]}
        />
      )}
    </li>
  );
});

export function SortableTodoItem({ container, ...props }: RowProps & { container: string }) {
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
