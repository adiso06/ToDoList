import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ChevronRight, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { ItemGroup } from './ItemGroup';
import { InlineEdit } from './InlineEdit';
import { Menu } from './Menu';
import { containerDropId, sectionKey, useTodoStore } from '../store/todoStore';
import type { TodoItem } from '../types';

interface Props {
  listId: string;
  name: string;
  items: TodoItem[];
  showDone: boolean;
}

export function TodoSublist({ listId, name, items, showDone }: Props) {
  const collapsed = useTodoStore((s) => s.collapsedSections.has(sectionKey(listId, name)));
  const { toggleSectionCollapse, renameSection, deleteSection, resetList } = useTodoStore.getState();
  const [isRenaming, setIsRenaming] = useState(false);
  // The whole section (header included) accepts drops, so items can be moved
  // into empty or collapsed sections.
  const { setNodeRef, isOver } = useDroppable({ id: containerDropId(name) });
  const counted = items.filter((item) => !item.skipped);
  const done = counted.filter((item) => item.completed).length;
  const resettable = items.some((item) => item.completed || item.skipped);

  return (
    <section
      ref={setNodeRef}
      className={`mt-2 rounded-lg border-t border-zinc-100 pt-2 transition-colors dark:border-zinc-800 ${
        isOver && collapsed ? 'bg-blue-50 dark:bg-blue-500/10' : ''
      }`}
    >
      <div className="flex items-center gap-1 pr-1">
        {isRenaming ? (
          <InlineEdit
            initial={name}
            ariaLabel="Section name"
            className="ml-1 flex-1 font-semibold"
            onCancel={() => setIsRenaming(false)}
            onCommit={(value) => {
              if (!value || renameSection(listId, name, value)) {
                setIsRenaming(false);
                return true;
              }
              return false;
            }}
          />
        ) : (
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={() => toggleSectionCollapse(listId, name)}
            onDoubleClick={() => setIsRenaming(true)}
            className="flex min-w-0 flex-1 items-center gap-1 rounded-md py-1.5 text-left"
          >
            <span className="flex w-5 shrink-0 justify-center text-zinc-400">
              <ChevronRight size={16} className={`transition-transform ${collapsed ? '' : 'rotate-90'}`} />
            </span>
            <span className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">{name}</span>
            <span className="ml-1.5 shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
              {done}/{counted.length}
            </span>
          </button>
        )}
        <Menu
          label={`${name} options`}
          actions={[
            { label: 'Rename section', icon: Pencil, onSelect: () => setIsRenaming(true) },
            {
              label: 'Reset section',
              icon: RotateCcw,
              disabled: !resettable,
              onSelect: () => resetList(listId, name)
            },
            'divider',
            { label: 'Delete section', icon: Trash2, danger: true, onSelect: () => deleteSection(listId, name) }
          ]}
        />
      </div>

      {!collapsed && (
        <ItemGroup listId={listId} container={name} items={items} showDone={showDone} placeholder={`Add to ${name}`} />
      )}
    </section>
  );
}
