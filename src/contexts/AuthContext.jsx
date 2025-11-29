import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del usuario desde Firestore
  const loadUserData = async (uid) => {
    try {
      const userDocRef = doc(firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        return data;
      } else {
        console.error('No se encontró el documento del usuario en Firestore');
        setUserData(null);
        return null;
      }
    } catch (err) {
      console.error('Error al cargar datos del usuario:', err);
      setError(err.message);
      return null;
    }
  };

  // Registrar nuevo usuario (solo admin puede crear usuarios desde UI)
  const signup = async (email, password, additionalData = {}) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // Crear documento en Firestore con datos adicionales
      const userDocRef = doc(firestore, 'users', uid);
      const userData = {
        email,
        role: additionalData.role || 'residente',
        name: additionalData.name || '',
        houseId: additionalData.houseId || null,
        phone: additionalData.phone || '',
        createdAt: new Date().toISOString(),
        active: true
      };

      await setDoc(userDocRef, userData);
      await loadUserData(uid);

      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserData(userCredential.user.uid);
      return userCredential.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Restablecer contraseña
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userData,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    loadUserData,
    // Helpers para verificar roles
    isAdmin: userData?.role === 'admin',
    isPresidente: userData?.role === 'presidente',
    isTecnico: userData?.role === 'tecnico',
    isSecretaria: userData?.role === 'secretaria',
    isResidente: userData?.role === 'residente',
    hasRole: (roles) => {
      if (!userData?.role) return false;
      return Array.isArray(roles) ? roles.includes(userData.role) : userData.role === roles;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
