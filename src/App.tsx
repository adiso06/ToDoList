import { useEffect, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { collection, onSnapshot } from 'firebase/firestore';
import { CheckSquare, Loader2, Moon, Sun } from 'lucide-react';
import { db } from './lib/firebase';
import { normalizeList, seedDefaultLists } from './lib/initializeData';
import { useTodoStore } from './store/todoStore';
import { TodoList } from './components/TodoList';
import { InlineEdit } from './components/InlineEdit';
import { Toast } from './components/Toast';

const SEEDED_KEY = 'todo:seeded';

function App() {
  const lists = useTodoStore((s) => s.lists);
  const darkMode = useTodoStore((s) => s.darkMode);
  const { setLists, createList, reorderLists, toggleDarkMode } = useTodoStore.getState();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isCreating, setIsCreating] = useState(false);
  const [newListId, setNewListId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(
    () =>
      onSnapshot(
        collection(db, 'lists'),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.empty) {
            // An empty local cache doesn't mean the server is empty; wait for it.
            if (snapshot.metadata.fromCache) return;
            // Seed the starter lists once, not every time someone deletes them all.
            if (!localStorage.getItem(SEEDED_KEY)) {
              localStorage.setItem(SEEDED_KEY, '1');
              seedDefaultLists().catch(console.error);
              return;
            }
          } else {
            localStorage.setItem(SEEDED_KEY, '1');
          }
          setLists(snapshot.docs.map((d) => normalizeList(d.id, d.data())));
          setStatus('ready');
        },
        (error) => {
          console.error(error);
          setStatus('error');
        }
      ),
    [setLists]
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', darkMode ? '#09090b' : '#fafafa');
  }, [darkMode]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      const oldIndex = lists.findIndex((list) => list.id === active.id);
      const newIndex = lists.findIndex((list) => list.id === over.id);
      reorderLists(arrayMove(lists, oldIndex, newIndex));
    }
  };

  const remainingCount = lists.reduce(
    (sum, list) =>
      sum + [...list.items, ...Object.values(list.sublists ?? {}).flat()].filter((item) => !item.completed && !item.skipped).length,
    0
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/85">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-3 px-4">
          <div className="flex items-baseline gap-3">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <CheckSquare size={20} className="text-blue-600" />
              To-Do
            </h1>
            {status === 'ready' && lists.length > 0 && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">{remainingCount} left</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              New list
            </button>
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-3 pb-24 pt-4 sm:px-4">
        {isCreating && (
          <div className="flex rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <InlineEdit
              placeholder="List name, e.g. Weekend trip"
              ariaLabel="New list name"
              className="flex-1 font-semibold"
              onCancel={() => setIsCreating(false)}
              onCommit={(name) => {
                if (name) setNewListId(createList(name));
                setIsCreating(false);
              }}
            />
          </div>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
            <Loader2 size={16} className="animate-spin" /> Loading your lists…
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            Couldn't load your lists. Check your connection and refresh the page.
          </div>
        )}

        {status === 'ready' && lists.length === 0 && !isCreating && (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
            <p className="font-medium">No lists yet</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Make one for groceries, a trip, or anything you do more than once.
            </p>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="mt-4 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create a list
            </button>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lists.map((list) => list.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {lists.map((list) => (
                <TodoList key={list.id} list={list} autoFocus={list.id === newListId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      <Toast />
    </div>
  );
}

export default App;
