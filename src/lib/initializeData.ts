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
    await setDoc(doc(db, 'lists', id), { ...data, sectionOrder: Object.keys(data.sublists ?? {}) });
  }
};

const normalizeItems = (value: unknown): TodoItem[] =>
  Array.isArray(value)
    ? value
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          id: String(item.id),
          text: String(item.text ?? ''),
          completed: Boolean(item.completed),
          ...(item.oneOff === true && { oneOff: true }),
          ...(item.skipped === true && { skipped: true })
        }))
    : [];

export const normalizeContents = (data: Record<string, unknown> | null | undefined): ListContents => {
  if (!data?.sublists || typeof data.sublists !== 'object') {
    return { items: normalizeItems(data?.items), sublists: null };
  }
  const raw = data.sublists as Record<string, unknown>;
  // Firestore hands back map keys in arbitrary order (and it can change after
  // every write), so order sections by the saved sectionOrder array. Sections
  // it doesn't mention (older documents) follow alphabetically, so the order
  // is at least stable until the next write saves one.
  const saved = Array.isArray(data.sectionOrder) ? data.sectionOrder.map(String) : [];
  const names = [
    ...saved.filter((name, i) => name in raw && saved.indexOf(name) === i),
    ...Object.keys(raw)
      .filter((name) => !saved.includes(name))
      .sort((a, b) => a.localeCompare(b))
  ];
  return {
    items: normalizeItems(data.items),
    sublists: Object.fromEntries(names.map((name) => [name, normalizeItems(raw[name])]))
  };
};

// Coerce whatever is stored in Firestore into the shape the UI expects, so
// older documents (missing fields, stray properties) never crash a render.
export const normalizeList = (id: string, data: Record<string, unknown>): TodoList => ({
  id,
  name: typeof data.name === 'string' ? data.name : 'Untitled',
  order: typeof data.order === 'number' ? data.order : undefined,
  ...normalizeContents(data)
});
