import { create } from 'zustand';
import { collection, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDefaultList } from '../lib/initializeData';
import type { TodoList, TodoItem } from '../types';

interface TodoStore {
  lists: TodoList[];
  setLists: (lists: TodoList[]) => void;
  toggleItem: (listId: string, itemId: string, sublist?: string) => void;
  deleteItem: (listId: string, itemId: string, sublist?: string) => void;
  addItem: (listId: string, text: string, sublist?: string) => void;
  resetList: (listId: string) => void;
  createList: (name: string) => void;
  deleteList: (listId: string) => void;
  createSublist: (listId: string, name: string) => void;
  saveAsDefault: (listId: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  lists: [],
  darkMode: localStorage.getItem('darkMode') === 'true',
  
  setLists: (lists) => set({ lists }),
  
  toggleItem: async (listId, itemId, sublist) => {
    const lists = [...get().lists];
    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;
    
    const list = lists[listIndex];
    let updated = false;
    
    if (sublist && list.sublists?.[sublist]) {
      const itemIndex = list.sublists[sublist].findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        list.sublists[sublist][itemIndex].completed = !list.sublists[sublist][itemIndex].completed;
        updated = true;
      }
    } else if (list.items) {
      const itemIndex = list.items.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        list.items[itemIndex].completed = !list.items[itemIndex].completed;
        updated = true;
      }
    }
    
    if (updated) {
      await updateDoc(doc(db, 'lists', listId), {
        items: list.items,
        sublists: list.sublists
      });
      set({ lists });
    }
  },

  deleteItem: async (listId, itemId, sublist) => {
    const lists = [...get().lists];
    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;
    
    const list = lists[listIndex];
    let updated = false;
    
    if (sublist && list.sublists?.[sublist]) {
      const itemIndex = list.sublists[sublist].findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        list.sublists[sublist].splice(itemIndex, 1);
        updated = true;
      }
    } else if (list.items) {
      const itemIndex = list.items.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        list.items.splice(itemIndex, 1);
        updated = true;
      }
    }
    
    if (updated) {
      await updateDoc(doc(db, 'lists', listId), {
        items: list.items,
        sublists: list.sublists
      });
      set({ lists });
    }
  },
  
  addItem: async (listId, text, sublist) => {
    const lists = [...get().lists];
    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;
    
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      text,
      completed: false
    };
    
    const list = lists[listIndex];
    if (sublist) {
      if (!list.sublists) {
        list.sublists = {};
      }
      if (!list.sublists[sublist]) {
        list.sublists[sublist] = [];
      }
      list.sublists[sublist].push(newItem);
    } else {
      if (!list.items) {
        list.items = [];
      }
      list.items.push(newItem);
    }
    
    await updateDoc(doc(db, 'lists', listId), {
      items: list.items,
      sublists: list.sublists
    });
    set({ lists });
  },
  
  resetList: async (listId) => {
    const defaultList = getDefaultList(listId);
    if (!defaultList) return;
    
    const resetItems = defaultList.items?.map(item => ({ ...item, completed: false })) || [];
    const resetSublists = defaultList.sublists ? 
      Object.fromEntries(
        Object.entries(defaultList.sublists).map(([name, items]) => [
          name,
          items.map(item => ({ ...item, completed: false }))
        ])
      ) : null;
    
    await setDoc(doc(db, 'lists', listId), {
      name: defaultList.name,
      items: resetItems,
      sublists: resetSublists
    });
    
    const lists = get().lists.map(list => 
      list.id === listId ? { ...defaultList, items: resetItems, sublists: resetSublists } : list
    );
    set({ lists });
  },

  deleteList: async (listId) => {
    await deleteDoc(doc(db, 'lists', listId));
    localStorage.removeItem(`defaultList:${listId}`);
    const lists = get().lists.filter(list => list.id !== listId);
    set({ lists });
  },

  createList: async (name) => {
    const newList: TodoList = {
      id: crypto.randomUUID(),
      name,
      items: [],
      sublists: null
    };
    
    await setDoc(doc(db, 'lists', newList.id), {
      name: newList.name,
      items: newList.items,
      sublists: newList.sublists
    });
    set({ lists: [...get().lists, newList] });
  },

  createSublist: async (listId, name) => {
    const lists = [...get().lists];
    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;
    
    const list = lists[listIndex];
    if (!list.sublists) {
      list.sublists = {};
    }
    
    if (!list.sublists[name]) {
      list.sublists[name] = [];
      
      await updateDoc(doc(db, 'lists', listId), {
        sublists: list.sublists
      });
      set({ lists });
    }
  },

  saveAsDefault: async (listId) => {
    const list = get().lists.find(l => l.id === listId);
    if (list) {
      localStorage.setItem(`defaultList:${listId}`, JSON.stringify({
        name: list.name,
        items: list.items,
        sublists: list.sublists
      }));
    }
  },

  toggleDarkMode: () => {
    const newDarkMode = !get().darkMode;
    localStorage.setItem('darkMode', String(newDarkMode));
    set({ darkMode: newDarkMode });
  }
}));