
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpG7Ja5HCfU2RnGJuxXU5ypPA7JKgYY7U",
  authDomain: "clinic-725a7.firebaseapp.com",
  projectId: "clinic-725a7",
  storageBucket: "clinic-725a7.firebasestorage.app",
  messagingSenderId: "644725580556",
  appId: "1:644725580556:web:a5947d966e711888125f29",
  measurementId: "G-82J5FZ1M07"
};

// Initialize Firebase with modular SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
