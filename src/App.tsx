import React from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { useTodoStore } from './store/todoStore';
import { TodoList } from './components/TodoList';
import { Plus, Moon, Sun } from 'lucide-react';
import { initializeFirestore } from './lib/initializeData';
import { useEffect, useState } from 'react';

function App() {
  const { lists, setLists, toggleItem, addItem, resetList, createList, darkMode, toggleDarkMode } = useTodoStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'lists'), (snapshot) => {
      if (!isInitialized && snapshot.empty) {
        initializeFirestore().then(() => setIsInitialized(true));
      } else {
        const listsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLists(listsData);
      }
    });

    return () => unsubscribe();
  }, [isInitialized]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      createList(newListName.trim());
      setNewListName('');
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'} transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <form onSubmit={handleCreateList} className="flex gap-2">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name..."
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus size={18} />
              Create List
            </button>
          </form>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <Sun size={24} className="text-white" /> : <Moon size={24} />}
          </button>
        </div>

        <div className="space-y-8">
          {lists.map(list => (
            <TodoList
              key={list.id}
              list={list}
              onToggle={(itemId, sublist) => toggleItem(list.id, itemId, sublist)}
              onAdd={(text, sublist) => addItem(list.id, text, sublist)}
              onReset={() => resetList(list.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;