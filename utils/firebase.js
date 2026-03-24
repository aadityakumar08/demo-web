// utils/firebase.js
// Firebase configuration and Firestore initialization
// Modular SDK (v9+) for tree-shaking

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAkhwyiufGRysOOcyYGSEcNB_H-cPE1xOU",
  authDomain: "smartshop-scanner.firebaseapp.com",
  projectId: "smartshop-scanner",
  storageBucket: "smartshop-scanner.firebasestorage.app",
  messagingSenderId: "357540512385",
  appId: "1:357540512385:web:fb6a6af00f537463698380"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
