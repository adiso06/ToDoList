import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { TodoList } from '../types';

export const defaultLists: TodoList[] = [
  {
    id: 'general-list',
    name: 'General List',
    items: [
      { id: '1', text: 'Add items to your list', completed: false }
    ],
    sublists: null
  },
  {
    id: 'packing-list',
    name: 'Packing List',
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

export const initializeFirestore = async () => {
  const listsCollection = collection(db, 'lists');
  
  for (const list of defaultLists) {
    // Check if there's a saved default state in localStorage
    const savedDefault = localStorage.getItem(`defaultList:${list.id}`);
    const listData = savedDefault ? JSON.parse(savedDefault) : list;
    
    await setDoc(doc(listsCollection, list.id), {
      name: listData.name,
      items: listData.items,
      sublists: listData.sublists
    });
  }
};

export const getDefaultList = (listId: string): TodoList | undefined => {
  // First check if there's a saved default state
  const savedDefault = localStorage.getItem(`defaultList:${listId}`);
  if (savedDefault) {
    const parsedDefault = JSON.parse(savedDefault);
    return {
      id: listId,
      ...parsedDefault
    };
  }
  
  // Fallback to original defaults
  return defaultLists.find(list => list.id === listId);
};