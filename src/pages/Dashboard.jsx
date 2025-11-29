import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import StatCard from '../components/StatCard';
import QuickActions from '../components/QuickActions';
import UpcomingMeetings from '../components/UpcomingMeetings';
import PageLoader from '../components/PageLoader';
import DebtStatusModal from '../components/DebtStatusModal';
import { PaymentStatusChart } from '../components/Charts';
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Zap,
  Upload,
  Car,
  Users,
  FileCheck,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import { getCurrentMonthYear } from '../utils/dateUtils';

const Dashboard = () => {
  const { userData } = useAuth();
  const { stats, paymentStatus } = useDashboardStats();
  const [showDebtModal, setShowDebtModal] = useState(false);

  // Acciones rápidas según el rol
  const getQuickActions = () => {
    const actions = {
      admin: [
        { 
          label: 'Estado de Deuda', 
          description: 'Consultar deudas por parcela',
          icon: Receipt, 
          onClick: () => setShowDebtModal(true),
          color: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400'
        },
        { 
          label: 'Generar Boletas', 
          description: 'Crear boletas de electricidad',
          icon: Zap, 
          path: '/electricidad',
          color: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400'
        },
        { 
          label: 'Pagos Luz', 
          description: 'Subir cartola bancaria',
          icon: Upload, 
          path: '/pagos',
          color: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          label: 'Registrar Usuario', 
          description: 'Crear nuevo usuario',
          icon: Users, 
          path: '/signup',
          color: 'bg-green-100 dark:bg-green-900/20',
          iconColor: 'text-green-600 dark:text-green-400'
        },
      ],
      presidente: [
        { 
          label: 'Estado de Deuda', 
          description: 'Consultar deudas por parcela',
          icon: Receipt, 
          onClick: () => setShowDebtModal(true),
          color: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400'
        },
        { 
          label: 'Gestión de Pagos', 
          description: 'Conciliación bancaria',
          icon: CheckCircle, 
          path: '/pagos',
          color: 'bg-green-100 dark:bg-green-900/20',
          iconColor: 'text-green-600 dark:text-green-400'
        },
        { 
          label: 'Reuniones', 
          description: 'Gestionar reuniones',
          icon: Users, 
          path: '/reuniones',
          color: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400'
        },
      ],
      tecnico: [
        { 
          label: 'Lecturas Eléctricas', 
          description: 'Ingresar lecturas',
          icon: Zap, 
          path: '/electricidad',
          color: 'bg-yellow-100 dark:bg-yellow-900/20',
          iconColor: 'text-yellow-600 dark:text-yellow-400'
        },
        { 
          label: 'Generar Boletas', 
          description: 'Crear boletas del mes',
          icon: FileText, 
          path: '/electricidad',
          color: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          label: 'Gestión de Pagos', 
          description: 'Conciliación bancaria',
          icon: CheckCircle, 
          path: '/pagos',
          color: 'bg-green-100 dark:bg-green-900/20',
          iconColor: 'text-green-600 dark:text-green-400'
        },
        { 
          label: 'Estado de Deuda', 
          description: 'Consultar deudas por parcela',
          icon: Receipt, 
          onClick: () => setShowDebtModal(true),
          color: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400'
        },
      ],
      secretaria: [
        { 
          label: 'Estado de Deuda', 
          description: 'Consultar deudas por parcela',
          icon: Receipt, 
          onClick: () => setShowDebtModal(true),
          color: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400'
        },
        { 
          label: 'Nueva Reunión', 
          description: 'Crear convocatoria',
          icon: Users, 
          path: '/reuniones',
          color: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          label: 'Certificados', 
          description: 'Generar certificados',
          icon: FileCheck, 
          path: '/certificados',
          color: 'bg-purple-100 dark:bg-purple-900/20',
          iconColor: 'text-purple-600 dark:text-purple-400'
        },
      ],
      residente: [
        { 
          label: 'Mis Boletas', 
          description: 'Ver estado de pagos',
          icon: FileText, 
          path: '/mi-cuenta?tab=bills',
          color: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400'
        },
        { 
          label: 'Mis Cuotas', 
          description: 'Cuotas extraordinarias',
          icon: DollarSign, 
          path: '/mi-cuenta?tab=cuotas',
          color: 'bg-orange-100 dark:bg-orange-900/20',
          iconColor: 'text-orange-600 dark:text-orange-400'
        },
        { 
          label: 'Mis Vehículos', 
          description: 'Gestionar vehículos',
          icon: Car, 
          path: '/mi-cuenta?tab=vehicles',
          color: 'bg-slate-100 dark:bg-slate-800',
          iconColor: 'text-slate-600 dark:text-slate-400'
        },
      ],
    };

    return actions[userData?.role] || [];
  };

  if (stats.loading) {
    return <PageLoader message="Cargando estadísticas del dashboard..." />;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
          Bienvenido, {userData?.name} • {getCurrentMonthYear()}
        </p>
      </div>

      {/* Stats Cards */}
      {userData?.role === 'residente' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-lg">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
            Electricidad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Boletas del Mes"
              value={stats.totalBills}
              icon={FileText}
              color="blue"
              subtitle={`Parcela ${userData.houseId}`}
            />
            <StatCard
              title="Pendientes"
              value={stats.pendingBills}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Pagadas"
              value={stats.paidBills}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Total a Pagar"
              value={formatCurrency(stats.totalExpenses)}
              icon={DollarSign}
              color="red"
            />
          </div>
        </div>
      ) : userData?.role !== 'secretaria' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
            Electricidad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Total Boletas"
              value={stats.totalBills}
              icon={FileText}
              color="blue"
              subtitle="Este mes"
            />
            <StatCard
              title="Ingresos"
              value={formatCurrency(stats.totalIncome)}
              icon={TrendingUp}
              color="green"
              trend="+12%"
              trendLabel="vs mes anterior"
            />
            <StatCard
              title="Pendientes"
              value={stats.pendingBills}
              icon={Clock}
              color="yellow"
              subtitle="Por cobrar"
            />
            <StatCard
              title="Balance"
              value={formatCurrency(stats.balance)}
              icon={DollarSign}
              color={stats.balance >= 0 ? 'green' : 'red'}
              subtitle="Ingresos - Egresos"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
            📋 Resumen General
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Bienvenido al panel de secretaría. Aquí puedes gestionar reuniones, certificados y cuotas de la comunidad.
          </p>
        </div>
      )}

      {/* Charts Section */}
      {userData?.role !== 'residente' && userData?.role !== 'secretaria' && (
        <div className="lg:col-span-1">
          <PaymentStatusChart data={paymentStatus} title="Estado de Pagos Electricidad" />
        </div>
      )}

      {/* Quick Actions and Upcoming Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <QuickActions actions={getQuickActions()} />
        <UpcomingMeetings />
      </div>

      {/* Info Card */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-2 border-primary-200 dark:border-primary-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          💡 Consejo
        </h3>
        <p className="text-slate-700 dark:text-slate-300 text-sm">
          {userData?.role === 'residente' 
            ? 'Recuerda subir tu comprobante de pago apenas realices la transferencia para agilizar la validación.'
            : 'Los reportes mensuales están disponibles en la sección de Reportes. Puedes exportarlos en Excel o PDF.'}
        </p>
      </div>

      {/* Modal de Estado de Deuda */}
      <DebtStatusModal 
        isOpen={showDebtModal} 
        onClose={() => setShowDebtModal(false)} 
      />
    </div>
  );
};

export default Dashboard;
