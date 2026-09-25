import { useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, CopyCheck, GripVertical, ListPlus, ListX, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { containerDropId, ROOT, useTodoStore } from '../store/todoStore';
import { TodoSublist } from './TodoSublist';
import { TodoItemRow } from './TodoItem';
import { ItemGroup } from './ItemGroup';
import { InlineEdit } from './InlineEdit';
import { Menu } from './Menu';
import type { TodoItem, TodoList as TodoListType } from '../types';

type Containers = Record<string, TodoItem[]>;

const toContainers = (list: TodoListType): Containers => ({ [ROOT]: list.items, ...(list.sublists ?? {}) });

const isContainerId = (id: UniqueIdentifier) => String(id).startsWith('container:');

// Prefer the item under the pointer, then the section under the pointer (for
// empty or collapsed sections), then the nearest item (keyboard dragging).
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const itemHits = hits.filter((hit) => !isContainerId(hit.id));
  if (itemHits.length) return itemHits;
  if (hits.length) return hits;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => !isContainerId(c.id))
  });
};

interface Props {
  list: TodoListType;
  autoFocus?: boolean;
}

export function TodoList({ list, autoFocus }: Props) {
  const isCollapsed = useTodoStore((s) => s.collapsedLists.has(list.id));
  const showDone = useTodoStore((s) => s.shownDone.has(list.id));
  const store = useTodoStore.getState();
  const [isRenaming, setIsRenaming] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  // While dragging an item, its container moves are previewed locally and
  // only written to Firestore on drop.
  const [dragContainers, setDragContainers] = useState<Containers | null>(null);
  const [activeItem, setActiveItem] = useState<TodoItem | null>(null);
  const dragStart = useRef<Containers | null>(null);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id
  });
  const { setNodeRef: setRootDropRef } = useDroppable({ id: containerDropId(ROOT) });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const containers = dragContainers ?? toContainers(list);
  const all = Object.values(toContainers(list)).flat();
  const counted = all.filter((item) => !item.skipped);
  const done = counted.filter((item) => item.completed).length;
  const total = counted.length;
  const skipped = all.length - total;
  const resettable = done + skipped > 0;
  const sectionNames = Object.keys(list.sublists ?? {});

  const findContainer = (id: UniqueIdentifier) => {
    if (isContainerId(id)) return String(id).slice('container:'.length);
    return Object.keys(containers).find((key) => containers[key].some((item) => item.id === id));
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    dragStart.current = toContainers(list);
    setDragContainers(dragStart.current);
    setActiveItem(all.find((item) => item.id === active.id) ?? null);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to || !(to in containers)) return;
    const moving = containers[from].find((item) => item.id === active.id);
    if (!moving) return;
    const target = containers[to];
    const overIndex = target.findIndex((item) => item.id === over.id);
    const insertAt = overIndex === -1 ? target.length : overIndex;
    setDragContainers({
      ...containers,
      [from]: containers[from].filter((item) => item.id !== active.id),
      [to]: [...target.slice(0, insertAt), moving, ...target.slice(insertAt)]
    });
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const container = findContainer(active.id);
    let next = containers;
    if (container && over && !isContainerId(over.id)) {
      const items = containers[container];
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        next = { ...containers, [container]: arrayMove(items, oldIndex, newIndex) };
      }
    }
    if (next !== dragStart.current) {
      const { [ROOT]: items, ...sublists } = next;
      store.setContents(list.id, { items, sublists: sectionNames.length ? sublists : null });
    }
    setDragContainers(null);
    setActiveItem(null);
  };

  const handleDragCancel = () => {
    setDragContainers(null);
    setActiveItem(null);
  };

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
        isDragging ? 'relative z-20 opacity-80 shadow-xl' : ''
      }`}
    >
      <header className="group flex items-center gap-1 py-1.5 pl-1 pr-2">
        <button
          type="button"
          aria-label={`Reorder ${list.name}`}
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="hover-reveal flex h-9 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-zinc-300 active:cursor-grabbing dark:text-zinc-600"
        >
          <GripVertical size={16} />
        </button>
        {isRenaming ? (
          <InlineEdit
            initial={list.name}
            ariaLabel="List name"
            className="flex-1 text-base font-semibold"
            onCancel={() => setIsRenaming(false)}
            onCommit={(name) => {
              if (name && name !== list.name) store.renameList(list.id, name);
              setIsRenaming(false);
            }}
          />
        ) : (
          <button
            type="button"
            aria-expanded={!isCollapsed}
            onClick={() => store.toggleListCollapse(list.id)}
            onDoubleClick={() => setIsRenaming(true)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1 text-left"
          >
            <ChevronDown
              size={18}
              className={`shrink-0 text-zinc-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
            />
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{list.name}</h2>
          </button>
        )}
        {total > 0 && (
          <span className="shrink-0 px-1 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
            {done}/{total}
          </span>
        )}
        <Menu
          label={`${list.name} options`}
          actions={[
            { label: 'Rename list', icon: Pencil, onSelect: () => setIsRenaming(true) },
            {
              label: 'Add section',
              icon: ListPlus,
              onSelect: () => {
                if (isCollapsed) store.toggleListCollapse(list.id);
                setIsAddingSection(true);
              }
            },
            'divider',
            { label: 'Reset list', icon: RotateCcw, disabled: !resettable, onSelect: () => store.resetList(list.id) },
            { label: 'Remove checked items', icon: ListX, disabled: done === 0, onSelect: () => store.clearCompleted(list.id) },
            'divider',
            { label: 'Delete list', icon: Trash2, danger: true, onSelect: () => store.deleteList(list.id) }
          ]}
        />
      </header>

      {total > 0 && (
        <div className="mx-4 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      {!isCollapsed && (
        <div className="px-1 pb-2 pt-1.5">
          {total > 0 && done === total && (
            <div className="mx-1 mb-1 flex items-center justify-between gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-500/10 dark:text-blue-200">
              <span className="flex items-center gap-2">
                <CopyCheck size={16} /> All done!
              </span>
              <button
                type="button"
                onClick={() => store.resetList(list.id)}
                className="rounded-md px-2 py-0.5 font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20"
              >
                Reset list
              </button>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div ref={setRootDropRef}>
              <ItemGroup
                listId={list.id}
                container={ROOT}
                items={containers[ROOT]}
                showDone={showDone}
                placeholder="Add item"
                autoFocus={autoFocus}
              />
            </div>

            {sectionNames.map((name) => (
              <TodoSublist
                key={name}
                listId={list.id}
                name={name}
                items={containers[name] ?? []}
                showDone={showDone}
              />
            ))}

            <DragOverlay>{activeItem && <TodoItemRow item={activeItem} overlay />}</DragOverlay>
          </DndContext>

          {done + skipped > 0 && (
            <button
              type="button"
              aria-expanded={showDone}
              onClick={() => store.toggleShowDone(list.id)}
              className="ml-6 mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ChevronDown size={14} className={`transition-transform ${showDone ? '' : '-rotate-90'}`} />
              {[done > 0 && `${done} checked`, skipped > 0 && `${skipped} skipped`].filter(Boolean).join(' · ')}
            </button>
          )}

          {isAddingSection && (
            <div className="mt-2 flex border-t border-zinc-100 pl-6 pr-2 pt-2 dark:border-zinc-800">
              <InlineEdit
                placeholder="Section name, e.g. Toiletries"
                ariaLabel="New section name"
                className="flex-1 font-semibold"
                onCancel={() => setIsAddingSection(false)}
                onCommit={(name) => {
                  if (!name || store.createSection(list.id, name)) {
                    setIsAddingSection(false);
                    return true;
                  }
                  return false;
                }}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
