// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Storage no se usa en plan Spark gratuito - archivos se guardan como base64 en Firestore

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-y4B65hlfwafnu0KPOSNKx-9o0CLkXNg",
  authDomain: "lospeumos-e0261.firebaseapp.com",
  projectId: "lospeumos-e0261",
  storageBucket: "lospeumos-e0261.firebasestorage.app",
  messagingSenderId: "696722608195",
  appId: "1:696722608195:web:c89efe62da5691ccf884f6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const firestore = getFirestore(app);

export default app;
