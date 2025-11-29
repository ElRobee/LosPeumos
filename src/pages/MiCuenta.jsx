/**
 * Página Mi Cuenta - Panel del Residente
 * Muestra información personal, boletas, pagos y vehículos
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useResidentData } from '../hooks/useResidentData';
import { Home, Zap, DollarSign, Car, User, Mail, Phone, Loader, AlertCircle, Key } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import BillsList from '../components/BillsList';
import VehicleManagement from '../components/VehicleManagement';
import QuotasList from '../components/QuotasList';
import GateNumbersList from '../components/GateNumbersList';
import StatCard from '../components/StatCard';

const MiCuenta = () => {
  const { user, userData } = useAuth();
  const { house, bills, vehicles, stats, loading, error, refresh } = useResidentData(
    user?.uid,
    userData?.houseId
  );
  const [activeTab, setActiveTab] = useState('overview'); // overview, bills, cuotas, vehicles, porton

  // Detectar el tab desde la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['overview', 'bills', 'cuotas', 'vehicles', 'porton'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Error al cargar datos
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button onClick={refresh} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Mi Cuenta
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Bienvenido/a, {userData?.name}
        </p>
      </div>

      {/* Información de la Parcela */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <Home className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Parcela {house?.houseNumber || userData?.houseId || 'N/A'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Propietario: {house?.ownerName || userData?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Nombre</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {userData?.name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {userData?.email}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Teléfono</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {userData?.phone || house?.phone || 'No registrado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'overview'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Resumen
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'bills'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Boletas
          {activeTab === 'bills' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('cuotas')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'cuotas'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Cuotas
          {activeTab === 'cuotas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'vehicles'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Vehículos
          {activeTab === 'vehicles' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('porton')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            activeTab === 'porton'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Portón
          {activeTab === 'porton' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Boletas"
              value={stats.totalBills}
              icon={Zap}
              color="blue"
            />
            <StatCard
              title="Boletas Pendientes"
              value={stats.pendingBills}
              subtitle={formatCurrency(stats.totalPending)}
              icon={AlertCircle}
              color="yellow"
            />
            <StatCard
              title="Boletas Vencidas"
              value={stats.overdueBills}
              icon={AlertCircle}
              color="red"
            />
            <StatCard
              title="Boletas Pagadas"
              value={stats.paidBills}
              subtitle={formatCurrency(stats.totalPaid)}
              icon={DollarSign}
              color="green"
            />
          </div>

          {/* Boletas Pendientes Destacadas */}
          {stats.pendingBills > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Boletas Pendientes de Pago
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Tienes <strong>{stats.pendingBills}</strong> boleta{stats.pendingBills > 1 ? 's' : ''} pendiente{stats.pendingBills > 1 ? 's' : ''} por un total de{' '}
                <strong className="text-slate-900 dark:text-white">{formatCurrency(stats.totalPending)}</strong>
              </p>
              <button
                onClick={() => setActiveTab('bills')}
                className="btn-primary"
              >
                Ver Boletas Pendientes
              </button>
            </div>
          )}

          {/* Vehículos Registrados */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Vehículos Registrados
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('vehicles')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Ver todos
              </button>
            </div>
            {vehicles.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">
                No tienes vehículos registrados.{' '}
                <button
                  onClick={() => setActiveTab('vehicles')}
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Agregar vehículo
                </button>
              </p>
            ) : (
              <div className="space-y-2">
                {vehicles.slice(0, 3).map(vehicle => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <Car className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {vehicle.licensePlate}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {vehicle.brand} {vehicle.model}
                      </p>
                    </div>
                  </div>
                ))}
                {vehicles.length > 3 && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center pt-2">
                    Y {vehicles.length - 3} vehículo{vehicles.length - 3 > 1 ? 's' : ''} más
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bills' && (
        <BillsList bills={bills} />
      )}

      {activeTab === 'cuotas' && (
        <>
          {/* Información de Cuenta Bancaria */}
          <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  Datos para Transferencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Titular:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Comite Adelanto Los Peumos</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Banco:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Banco Estado</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Tipo de cuenta:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">Cuenta Vista</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Número de cuenta:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">23070250187</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">RUT:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">65.104.927-K</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Mail:</p>
                    <p className="font-semibold text-slate-900 dark:text-white">secretaria.lospeumos@gmail.com</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    <span className="font-semibold">Asunto:</span> Indicar número de parcela y motivo del pago
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                    Ejemplo: "Parcela {house?.houseNumber || userData?.houseId?.replace('house', '') || 'X'} - Cuota Extraordinaria"
                  </p>
                </div>
              </div>
            </div>
          </div>

          <QuotasList houseId={userData?.houseId} />
        </>
      )}

      {activeTab === 'vehicles' && (
        <VehicleManagement
          vehicles={vehicles}
          userId={user?.uid}
          houseId={userData?.houseId}
          onRefresh={refresh}
        />
      )}

      {activeTab === 'porton' && (
        <GateNumbersList houseId={userData?.houseId} />
      )}
    </div>
  );
};

export default MiCuenta;
