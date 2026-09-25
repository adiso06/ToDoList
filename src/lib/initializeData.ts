import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ListContents, TodoItem, TodoList } from '../types';

export const defaultLists: TodoList[] = [
  {
    id: 'general-list',
    name: 'General List',
    order: 0,
    items: [
      { id: '1', text: 'Add items to your list', completed: false }
    ],
    sublists: null
  },
  {
    id: 'packing-list',
    name: 'Packing List',
    order: 1,
    items: [],
    sublists: {
      'Clothes': [
        { id: 'c1', text: 'T-shirts', completed: false },
        { id: 'c2', text: 'Pants', completed: false },
        { id: 'c3', text: 'Underwear', completed: false },
        { id: 'c4', text: 'Socks', completed: false }
      ],
      'Toiletries': [
        { id: 't1', text: 'Toothbrush', completed: false },
        { id: 't2', text: 'Toothpaste', completed: false },
        { id: 't3', text: 'Shampoo', completed: false },
        { id: 't4', text: 'Deodorant', completed: false }
      ],
      'Electronics': [
        { id: 'e1', text: 'Phone Charger', completed: false },
        { id: 'e2', text: 'Laptop', completed: false },
        { id: 'e3', text: 'Laptop Charger', completed: false },
        { id: 'e4', text: 'Power Bank', completed: false }
      ]
    }
  }
];

export const seedDefaultLists = async () => {
  for (const { id, ...data } of defaultLists) {
    await setDoc(doc(db, 'lists', id), { ...data, template: { items: data.items, sublists: data.sublists } });
  }
};

const normalizeItems = (value: unknown): TodoItem[] =>
  Array.isArray(value)
    ? value
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          id: String(item.id),
          text: String(item.text ?? ''),
          completed: Boolean(item.completed)
        }))
    : [];

export const normalizeContents = (data: Record<string, unknown> | null | undefined): ListContents => {
  const sublists =
    data?.sublists && typeof data.sublists === 'object'
      ? Object.fromEntries(
          Object.entries(data.sublists as Record<string, unknown>).map(([name, items]) => [name, normalizeItems(items)])
        )
      : null;
  return { items: normalizeItems(data?.items), sublists };
};

// Coerce whatever is stored in Firestore into the shape the UI expects, so
// older documents (missing fields, stray properties) never crash a render.
export const normalizeList = (id: string, data: Record<string, unknown>): TodoList => ({
  id,
  name: typeof data.name === 'string' ? data.name : 'Untitled',
  order: typeof data.order === 'number' ? data.order : undefined,
  template: data.template ? normalizeContents(data.template as Record<string, unknown>) : null,
  ...normalizeContents(data)
});

// Templates used to live in localStorage (per device) before they were stored
// on the list document. Fall back to those, then to the built-in defaults.
export const getLegacyTemplate = (listId: string): ListContents | undefined => {
  try {
    const saved = localStorage.getItem(`defaultList:${listId}`);
    if (saved) return normalizeContents(JSON.parse(saved));
  } catch {
    // ignore unreadable storage
  }
  const builtIn = defaultLists.find((list) => list.id === listId);
  return builtIn && { items: builtIn.items, sublists: builtIn.sublists };
};
