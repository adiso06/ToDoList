import { create } from 'zustand';
import { doc, updateDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ListContents, TodoItem, TodoList } from '../types';

// Container id used for a list's top-level items (sections use their name).
export const ROOT = '__root__';

export interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

interface TodoStore {
  lists: TodoList[];
  collapsedLists: Set<string>;
  collapsedSections: Set<string>;
  shownDone: Set<string>;
  darkMode: boolean;
  toast: Toast | null;

  setLists: (lists: TodoList[]) => void;
  createList: (name: string) => string;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  reorderLists: (newLists: TodoList[]) => void;

  addItems: (listId: string, texts: string[], container: string, oneOff?: boolean) => void;
  toggleItem: (listId: string, itemId: string) => void;
  toggleOneOff: (listId: string, itemId: string) => void;
  toggleSkipped: (listId: string, itemId: string) => void;
  editItem: (listId: string, itemId: string, text: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
  setContents: (listId: string, contents: ListContents) => void;
  resetList: (listId: string, container?: string) => void;
  clearCompleted: (listId: string) => void;

  createSection: (listId: string, name: string) => boolean;
  renameSection: (listId: string, oldName: string, newName: string) => boolean;
  deleteSection: (listId: string, name: string) => void;
  moveSection: (listId: string, name: string, offset: -1 | 1) => void;

  toggleDarkMode: () => void;
  toggleListCollapse: (listId: string) => void;
  toggleSectionCollapse: (listId: string, name: string) => void;
  toggleShowDone: (listId: string) => void;
  showToast: (message: string, undo?: () => void) => void;
  dismissToast: (id: number) => void;
}

const COLLAPSED_LISTS_KEY = 'todo:collapsedLists';
const COLLAPSED_SECTIONS_KEY = 'todo:collapsedSections';
const SHOWN_DONE_KEY = 'todo:shownDone';

// Droppable id for a whole container, so items can be dropped into empty sections.
export const containerDropId = (container: string) => `container:${container}`;

export const sectionKey = (listId: string, name: string) => `${listId}::${name}`;

const loadSet = (key: string) => {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(key) ?? '[]'));
  } catch {
    return new Set<string>();
  }
};

const saveSet = (key: string, set: Set<string>) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // storage unavailable; collapse state just won't persist
  }
};

const getInitialTheme = () => {
  try {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) return savedTheme === 'true';
  } catch {
    // fall through to system preference
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const contentsOf = (list: TodoList): ListContents => ({ items: list.items, sublists: list.sublists });

const getContainer = (c: ListContents, container: string) =>
  container === ROOT ? c.items : c.sublists?.[container] ?? [];

const withContainer = (c: ListContents, container: string, items: TodoItem[]): ListContents =>
  container === ROOT ? { ...c, items } : { ...c, sublists: { ...(c.sublists ?? {}), [container]: items } };

const findItem = (c: ListContents, itemId: string) => {
  for (const container of [ROOT, ...Object.keys(c.sublists ?? {})]) {
    const index = getContainer(c, container).findIndex((item) => item.id === itemId);
    if (index !== -1) return { container, index };
  }
  return null;
};

// Apply fn to every item in every container; returning null drops the item.
const mapAll = (c: ListContents, fn: (item: TodoItem) => TodoItem | null): ListContents => {
  const apply = (items: TodoItem[]) => items.flatMap((item) => fn(item) ?? []);
  return {
    items: apply(c.items),
    sublists: c.sublists && Object.fromEntries(Object.entries(c.sublists).map(([name, items]) => [name, apply(items)]))
  };
};

const allItems = (c: ListContents) => [...c.items, ...Object.values(c.sublists ?? {}).flat()];

// Starting a list over: staples are unchecked and unskipped, one-offs that
// were bought/packed (or skipped) are dropped, and unfinished one-offs stay.
const resetItem = (item: TodoItem): TodoItem | null =>
  item.oneOff && (item.completed || item.skipped)
    ? null
    : { id: item.id, text: item.text, completed: false, ...(item.oneOff && { oneOff: true }) };

const isResettable = (item: TodoItem) => item.completed || item.skipped;

const sortLists = (lists: TodoList[]) =>
  [...lists].sort(
    (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name)
  );

// The id lives in the document path, not its fields. JSON round-trip drops it
// along with any other undefined values, which Firestore rejects.
const toDoc = (list: TodoList) =>
  JSON.parse(JSON.stringify({ ...list, id: undefined, sectionOrder: Object.keys(list.sublists ?? {}) }));

// Firestore returns map keys in arbitrary order, so section order is stored
// separately as an array (see normalizeContents) whenever sections change.
const toDocPatch = (patch: Partial<TodoList>) =>
  'sublists' in patch ? { ...patch, sectionOrder: Object.keys(patch.sublists ?? {}) } : patch;

let toastId = 0;

export const useTodoStore = create<TodoStore>((set, get) => {
  const reportError = (error: unknown) => {
    console.error(error);
    const code = (error as { code?: string })?.code;
    get().showToast(`Couldn't save your change${code ? ` (${code})` : ''}. Check your connection and try again.`);
  };

  const getList = (listId: string) => get().lists.find((list) => list.id === listId);

  const patchList = (listId: string, patch: Partial<TodoList>) => {
    set({ lists: get().lists.map((list) => (list.id === listId ? { ...list, ...patch } : list)) });
    updateDoc(doc(db, 'lists', listId), toDocPatch(patch)).catch(reportError);
  };

  // Update a list's items/sections optimistically, then persist. When
  // undoMessage is given, show a toast that restores the previous contents.
  const updateContents = (
    listId: string,
    fn: (c: ListContents) => ListContents,
    undoMessage?: string
  ) => {
    const list = getList(listId);
    if (!list) return;
    const previous = contentsOf(list);
    const next = fn(previous);
    const hasSections = next.sublists && Object.keys(next.sublists).length > 0;
    patchList(listId, { items: next.items, sublists: hasSections ? next.sublists : null });
    if (undoMessage) {
      get().showToast(undoMessage, () => patchList(listId, previous));
    }
  };

  return {
    lists: [],
    collapsedLists: loadSet(COLLAPSED_LISTS_KEY),
    collapsedSections: loadSet(COLLAPSED_SECTIONS_KEY),
    shownDone: loadSet(SHOWN_DONE_KEY),
    darkMode: getInitialTheme(),
    toast: null,

    setLists: (lists) => set({ lists: sortLists(lists) }),

    // New lists go on top, next to the form that created them. Every list's
    // order is saved so the server's copy sorts exactly like the screen.
    createList: (name) => {
      const newList: TodoList = { id: newId(), name, items: [], sublists: null };
      const ordered = [newList, ...get().lists].map((list, order) => ({ ...list, order }));
      set({ lists: ordered });
      const batch = writeBatch(db);
      ordered.forEach((list) =>
        list.id === newList.id
          ? batch.set(doc(db, 'lists', list.id), toDoc(list))
          : batch.update(doc(db, 'lists', list.id), { order: list.order })
      );
      batch.commit().catch(reportError);
      return newList.id;
    },

    renameList: (listId, name) => patchList(listId, { name }),

    deleteList: (listId) => {
      const list = getList(listId);
      if (!list) return;
      set({ lists: get().lists.filter((l) => l.id !== listId) });
      deleteDoc(doc(db, 'lists', listId)).catch(reportError);
      get().showToast(`Deleted “${list.name}”`, () => {
        set({ lists: sortLists([...get().lists, list]) });
        setDoc(doc(db, 'lists', listId), toDoc(list)).catch(reportError);
      });
    },

    reorderLists: (newLists) => {
      const ordered = newLists.map((list, order) => ({ ...list, order }));
      set({ lists: ordered });
      const batch = writeBatch(db);
      ordered.forEach((list) => batch.update(doc(db, 'lists', list.id), { order: list.order }));
      batch.commit().catch(reportError);
    },

    addItems: (listId, texts, container, oneOff) =>
      updateContents(listId, (c) =>
        withContainer(c, container, [
          ...getContainer(c, container),
          ...texts.map((text) => ({ id: newId(), text, completed: false, ...(oneOff && { oneOff: true }) }))
        ])
      ),

    toggleItem: (listId, itemId) =>
      updateContents(listId, (c) =>
        mapAll(c, (item) => (item.id === itemId ? { ...item, completed: !item.completed } : item))
      ),

    toggleOneOff: (listId, itemId) =>
      updateContents(listId, (c) =>
        mapAll(c, (item) => {
          if (item.id !== itemId) return item;
          const { oneOff, ...rest } = item;
          return oneOff ? rest : { ...rest, oneOff: true };
        })
      ),

    toggleSkipped: (listId, itemId) =>
      updateContents(listId, (c) =>
        mapAll(c, (item) => {
          if (item.id !== itemId) return item;
          const { skipped, ...rest } = item;
          return skipped ? rest : { ...rest, completed: false, skipped: true };
        })
      ),

    editItem: (listId, itemId, text) =>
      updateContents(listId, (c) => mapAll(c, (item) => (item.id === itemId ? { ...item, text } : item))),

    deleteItem: (listId, itemId) => {
      const list = getList(listId);
      const location = list && findItem(list, itemId);
      if (!list || !location) return;
      const item = getContainer(list, location.container)[location.index];
      updateContents(listId, (c) => mapAll(c, (i) => (i.id === itemId ? null : i)));
      // Undo re-inserts just this item, so edits made in the meantime survive.
      get().showToast(`Deleted “${item.text}”`, () =>
        updateContents(listId, (c) => {
          const container = location.container === ROOT || c.sublists?.[location.container] ? location.container : ROOT;
          const items = [...getContainer(c, container)];
          items.splice(Math.min(location.index, items.length), 0, item);
          return withContainer(c, container, items);
        })
      );
    },

    setContents: (listId, contents) => updateContents(listId, () => contents),

    resetList: (listId, container) => {
      const list = getList(listId);
      if (!list) return;
      const scope = container === undefined ? allItems(list) : getContainer(list, container);
      if (!scope.some(isResettable)) return;
      updateContents(
        listId,
        (c) =>
          container === undefined
            ? mapAll(c, resetItem)
            : withContainer(c, container, getContainer(c, container).flatMap((item) => resetItem(item) ?? [])),
        container === undefined || container === ROOT ? `Reset “${list.name}”` : `Reset “${container}”`
      );
    },

    clearCompleted: (listId) => {
      const list = getList(listId);
      const count = list ? allItems(list).filter((item) => item.completed).length : 0;
      updateContents(
        listId,
        (c) => mapAll(c, (item) => (item.completed ? null : item)),
        `Removed ${count} checked item${count === 1 ? '' : 's'}`
      );
    },

    createSection: (listId, name) => {
      const list = getList(listId);
      if (!list) return false;
      if (list.sublists?.[name]) {
        get().showToast(`A section named “${name}” already exists`);
        return false;
      }
      updateContents(listId, (c) => withContainer(c, name, []));
      return true;
    },

    renameSection: (listId, oldName, newName) => {
      const list = getList(listId);
      if (!list?.sublists || oldName === newName) return true;
      if (list.sublists[newName]) {
        get().showToast(`A section named “${newName}” already exists`);
        return false;
      }
      // Rebuild the map so the section keeps its position.
      updateContents(listId, (c) => ({
        ...c,
        sublists: Object.fromEntries(
          Object.entries(c.sublists ?? {}).map(([name, items]) => [name === oldName ? newName : name, items])
        )
      }));
      const collapsedSections = new Set(get().collapsedSections);
      if (collapsedSections.delete(sectionKey(listId, oldName))) {
        collapsedSections.add(sectionKey(listId, newName));
        saveSet(COLLAPSED_SECTIONS_KEY, collapsedSections);
        set({ collapsedSections });
      }
      return true;
    },

    moveSection: (listId, name, offset) =>
      updateContents(listId, (c) => {
        const names = Object.keys(c.sublists ?? {});
        const from = names.indexOf(name);
        const to = from + offset;
        if (from === -1 || to < 0 || to >= names.length) return c;
        [names[from], names[to]] = [names[to], names[from]];
        return { ...c, sublists: Object.fromEntries(names.map((n) => [n, c.sublists![n]])) };
      }),

    deleteSection: (listId, name) =>
      updateContents(
        listId,
        (c) => ({
          ...c,
          sublists: Object.fromEntries(Object.entries(c.sublists ?? {}).filter(([key]) => key !== name))
        }),
        `Deleted section “${name}”`
      ),

    toggleDarkMode: () => {
      const darkMode = !get().darkMode;
      try {
        localStorage.setItem('darkMode', String(darkMode));
      } catch {
        // preference just won't persist
      }
      set({ darkMode });
    },

    toggleListCollapse: (listId) => {
      const collapsedLists = new Set(get().collapsedLists);
      if (!collapsedLists.delete(listId)) collapsedLists.add(listId);
      saveSet(COLLAPSED_LISTS_KEY, collapsedLists);
      set({ collapsedLists });
    },

    toggleSectionCollapse: (listId, name) => {
      const key = sectionKey(listId, name);
      const collapsedSections = new Set(get().collapsedSections);
      if (!collapsedSections.delete(key)) collapsedSections.add(key);
      saveSet(COLLAPSED_SECTIONS_KEY, collapsedSections);
      set({ collapsedSections });
    },

    toggleShowDone: (listId) => {
      const shownDone = new Set(get().shownDone);
      if (!shownDone.delete(listId)) shownDone.add(listId);
      saveSet(SHOWN_DONE_KEY, shownDone);
      set({ shownDone });
    },

    showToast: (message, undo) => set({ toast: { id: ++toastId, message, undo } }),

    dismissToast: (id) => {
      if (get().toast?.id === id) set({ toast: null });
    }
  };
});
