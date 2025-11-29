import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentMonthRange } from '../utils/dateUtils';

/**
 * Hook personalizado para obtener estadísticas del dashboard
 */
export const useDashboardStats = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalBills: 0,
    pendingBills: 0,
    paidBills: 0,
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    loading: true,
    error: null
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState({ paid: 0, pending: 0, overdue: 0 });

  useEffect(() => {
    if (!userData) return;

    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // Obtener estadísticas según el rol
        if (userData.role === 'residente') {
          await fetchResidentStats();
        } else {
          await fetchAdminStats();
        }

      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar las estadísticas'
        }));
      }
    };

    fetchStats();
  }, [userData]);

  // Estadísticas para residentes (solo su parcela)
  const fetchResidentStats = async () => {
    try {
      const { start, end } = getCurrentMonthRange();
      
      // Consultar boletas de la parcela del residente
      // Filtrado por fecha se hace en el cliente para evitar índice compuesto
      const billsRef = collection(firestore, 'bills');
      const billsQuery = query(
        billsRef,
        where('houseId', '==', userData.houseId)
      );
      
      const billsSnapshot = await getDocs(billsQuery);
      const allBills = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filtrar por fecha del mes actual en el cliente
      const bills = allBills.filter(bill => {
        const billDate = new Date(bill.createdAt);
        return billDate >= start && billDate <= end;
      });
      
      const totalBills = bills.length;
      const pendingBills = bills.filter(b => b.status === 'pending').length;
      const paidBills = bills.filter(b => b.status === 'paid').length;
      const totalAmount = bills.reduce((sum, b) => sum + (b.total || 0), 0);

      setStats({
        totalBills,
        pendingBills,
        paidBills,
        totalIncome: 0,
        totalExpenses: totalAmount,
        balance: -totalAmount,
        loading: false,
        error: null
      });

      // Actividad reciente del residente
      setRecentActivity([
        ...bills.slice(0, 5).map(bill => ({
          id: bill.id,
          type: 'bill',
          title: `Boleta de ${bill.month}/${bill.year}`,
          description: `Total: $${bill.total?.toLocaleString('es-CL')} - Estado: ${bill.status === 'paid' ? 'Pagado' : 'Pendiente'}`,
          timestamp: bill.createdAt
        }))
      ]);

    } catch (error) {
      console.error('Error en fetchResidentStats:', error);
      throw error;
    }
  };

  // Estadísticas para admin, presidente, técnico, secretaria
  const fetchAdminStats = async () => {
    try {
      const { start, end } = getCurrentMonthRange();
      
      // Consultar todas las boletas del mes actual
      const billsRef = collection(firestore, 'bills');
      const billsQuery = query(
        billsRef,
        where('createdAt', '>=', start.toISOString()),
        where('createdAt', '<=', end.toISOString())
      );
      
      const billsSnapshot = await getDocs(billsQuery);
      const bills = billsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const totalBills = bills.length;
      const pendingBills = bills.filter(b => b.status === 'pending').length;
      const paidBills = bills.filter(b => b.status === 'paid').length;
      const overdueBills = bills.filter(b => b.status === 'overdue').length;
      
      const totalIncome = bills
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + (b.total || 0), 0);
      
      const totalExpenses = 0; // Se implementará en etapas futuras
      const balance = totalIncome - totalExpenses;

      setStats({
        totalBills,
        pendingBills,
        paidBills,
        totalIncome,
        totalExpenses,
        balance,
        loading: false,
        error: null
      });

      setPaymentStatus({
        paid: paidBills,
        pending: pendingBills,
        overdue: overdueBills
      });

      // Actividad reciente general
      const recentBills = bills.slice(0, 5).map(bill => ({
        id: bill.id,
        type: 'bill',
        title: `Boleta Parcela ${bill.houseId}`,
        description: `${bill.month}/${bill.year} - $${bill.total?.toLocaleString('es-CL')}`,
        timestamp: bill.createdAt
      }));

      setRecentActivity(recentBills);

      // Datos para el gráfico (últimos 6 meses - datos de ejemplo por ahora)
      const monthlyData = generateMonthlyChartData();
      setChartData(monthlyData);

    } catch (error) {
      console.error('Error en fetchAdminStats:', error);
      throw error;
    }
  };

  // Generar datos de ejemplo para el gráfico (se reemplazará con datos reales)
  const generateMonthlyChartData = () => {
    const months = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'];
    return months.map(month => ({
      month,
      ingresos: Math.floor(Math.random() * 500000) + 300000,
      egresos: Math.floor(Math.random() * 300000) + 150000,
    }));
  };

  return {
    stats,
    recentActivity,
    chartData,
    paymentStatus,
    refresh: () => {
      if (userData?.role === 'residente') {
        fetchResidentStats();
      } else {
        fetchAdminStats();
      }
    }
  };
};

export default useDashboardStats;
