import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Tooltip personalizado para los gráficos
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card p-3 shadow-lg">
        <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {entry.name}:
            </span>
            <span className="text-sm font-semibold" style={{ color: entry.color }}>
              ${entry.value.toLocaleString('es-CL')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/**
 * Gráfico de ingresos vs egresos mensuales
 * @param {Object} props
 * @param {Array} props.data - Datos del gráfico
 * @param {string} props.type - Tipo de gráfico: 'bar' o 'line'
 */
export const IncomeExpenseChart = ({ data = [], type = 'bar' }) => {
  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  if (!data.length) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Ingresos vs Egresos
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">
            No hay datos disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Ingresos vs Egresos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="currentColor" 
            className="text-slate-200 dark:text-slate-700"
          />
          <XAxis 
            dataKey="month" 
            stroke="currentColor"
            className="text-slate-600 dark:text-slate-400"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="currentColor"
            className="text-slate-600 dark:text-slate-400"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            iconType="circle"
          />
          <DataComponent 
            dataKey="ingresos" 
            fill="#10b981" 
            stroke="#10b981"
            name="Ingresos"
            radius={type === 'bar' ? [8, 8, 0, 0] : undefined}
          />
          <DataComponent 
            dataKey="egresos" 
            fill="#ef4444" 
            stroke="#ef4444"
            name="Egresos"
            radius={type === 'bar' ? [8, 8, 0, 0] : undefined}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de estado de pagos (pie/donut)
 * @param {Object} props
 * @param {Object} props.data - Datos con pagados, pendientes, vencidos
 */
export const PaymentStatusChart = ({ data = {}, title = 'Estado de Pagos' }) => {
  const { paid = 0, pending = 0, overdue = 0 } = data;
  const total = paid + pending + overdue;

  if (total === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-48 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">
            No hay datos de pagos
          </p>
        </div>
      </div>
    );
  }

  const paidPercentage = ((paid / total) * 100).toFixed(0);
  const pendingPercentage = ((pending / total) * 100).toFixed(0);
  const overduePercentage = ((overdue / total) * 100).toFixed(0);

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {title}
      </h3>
      
      {/* Barra de progreso */}
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden flex mb-4">
        {paid > 0 && (
          <div 
            className="bg-green-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${paidPercentage}%` }}
          >
            {paidPercentage > 10 && `${paidPercentage}%`}
          </div>
        )}
        {pending > 0 && (
          <div 
            className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${pendingPercentage}%` }}
          >
            {pendingPercentage > 10 && `${pendingPercentage}%`}
          </div>
        )}
        {overdue > 0 && (
          <div 
            className="bg-red-500 flex items-center justify-center text-xs font-medium text-white"
            style={{ width: `${overduePercentage}%` }}
          >
            {overduePercentage > 10 && `${overduePercentage}%`}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Pagados</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {paid} ({paidPercentage}%)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Pendientes</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {pending} ({pendingPercentage}%)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Vencidos</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {overdue} ({overduePercentage}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default { IncomeExpenseChart, PaymentStatusChart };
