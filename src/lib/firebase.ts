import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
export const db = getFirestore(app);