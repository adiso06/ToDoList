import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBq0KwZ8urihRvMB2vUEuNfbG1PCcZqwt4",
  authDomain: "todo-list-8465d.firebaseapp.com",
  projectId: "todo-list-8465d",
  storageBucket: "todo-list-8465d.firebasestorage.app",
  messagingSenderId: "908700447494",
  appId: "1:908700447494:web:52bdf252fcb405300c6487",
  measurementId: "G-P2KR4PEWQS"
};

const app = initializeApp(firebaseConfig);

// Cache lists in IndexedDB so the app opens instantly and works offline;
// writes made offline sync once the connection comes back.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true
});
