/**
 * Hook personalizado para cargar datos del residente
 * Incluye: información de parcela, boletas, pagos, vehículos
 */

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { firestore } from '../services/firebase';

/**
 * Genera lista de IDs de medidores para un usuario
 * Solo house6 tiene múltiples medidores (house6A, house6B)
 * Las demás parcelas usan búsqueda exacta
 */
const getMeterIds = (baseHouseId) => {
  if (!baseHouseId) return [];
  
  // Solo house6 tiene medidores adicionales
  if (baseHouseId === 'house6') {
    return ['house6', 'house6A', 'house6B'];
  }
  
  // Las demás parcelas solo buscan su ID exacto
  return [baseHouseId];
};

export const useResidentData = (userId, houseId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    house: null,
    bills: [],
    payments: [],
    vehicles: [],
    stats: {
      totalBills: 0,
      pendingBills: 0,
      paidBills: 0,
      overdueBills: 0,
      totalPending: 0,
      totalPaid: 0
    }
  });

  const loadData = async () => {
    if (!userId || !houseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Cargar información de la parcela
      const houseRef = doc(firestore, 'houses', houseId);
      const houseSnap = await getDoc(houseRef);
      const houseData = houseSnap.exists() ? { id: houseSnap.id, ...houseSnap.data() } : null;

      // Cargar boletas de la parcela (incluyendo medidores adicionales)
      // Ejemplo: usuario con houseId="house6" ve boletas de house6, house6A, house6B, etc.
      const billsRef = collection(firestore, 'bills');
      const meterIds = getMeterIds(houseId); // Obtiene [house6, house6A, house6B, ...] para house6
      const billsQuery = query(
        billsRef,
        where('houseId', 'in', meterIds)
      );
      const billsSnap = await getDocs(billsQuery);
      const billsData = billsSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          // Ordenar por createdAt descendente en el cliente
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

      // Cargar pagos de la parcela
      const paymentsRef = collection(firestore, 'payments');
      const paymentsQuery = query(
        paymentsRef,
        where('houseId', '==', houseId)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          // Ordenar por createdAt descendente en el cliente
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

      // Cargar vehículos de la parcela
      const vehiclesRef = collection(firestore, 'vehicles');
      const vehiclesQuery = query(
        vehiclesRef,
        where('houseId', '==', houseId)
      );
      const vehiclesSnap = await getDocs(vehiclesQuery);
      const vehiclesData = vehiclesSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          // Ordenar por createdAt descendente en el cliente
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

      // Calcular estadísticas
      const now = new Date();
      const stats = {
        totalBills: billsData.length,
        pendingBills: billsData.filter(b => b.status === 'pending').length,
        paidBills: billsData.filter(b => b.status === 'paid').length,
        overdueBills: billsData.filter(b => {
          if (b.status !== 'pending') return false;
          const dueDate = b.dueDate ? new Date(b.dueDate) : null;
          return dueDate && dueDate < now;
        }).length,
        totalPending: billsData
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        totalPaid: billsData
          .filter(b => b.status === 'paid')
          .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      };

      setData({
        house: houseData,
        bills: billsData,
        payments: paymentsData,
        vehicles: vehiclesData,
        stats
      });
    } catch (err) {
      console.error('Error al cargar datos del residente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, houseId]);

  return {
    ...data,
    loading,
    error,
    refresh: loadData
  };
};

export default useResidentData;
