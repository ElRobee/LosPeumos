/**
 * Componente para mostrar lista de boletas del residente
 * Con filtros, descarga de PDF y subida de comprobante
 */

import React, { useState } from 'react';
import { FileText, Download, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate, getMonthName } from '../utils/dateUtils';

const BillsList = ({ bills }) => {
  const [filter, setFilter] = useState('all'); // all, pending, paid, overdue

  const getBillStatus = (bill) => {
    if (bill.status === 'paid') return 'paid';
    if (bill.status === 'pending') {
      const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;
      if (dueDate && dueDate < new Date()) return 'overdue';
      return 'pending';
    }
    return 'pending';
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Pagada',
          color: 'text-green-700 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          icon: CheckCircle
        };
      case 'overdue':
        return {
          label: 'Vencida',
          color: 'text-red-700 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          icon: AlertCircle
        };
      default:
        return {
          label: 'Pendiente',
          color: 'text-yellow-700 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          icon: Clock
        };
    }
  };

  const filteredBills = bills.filter(bill => {
    const status = getBillStatus(bill);
    if (filter === 'all') return true;
    return status === filter;
  });

  const handleDownloadPDF = (bill) => {
    if (bill.pdfData) {
      // Si el PDF está como base64, convertirlo a blob y descargarlo
      const byteCharacters = atob(bill.pdfData.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else if (bill.pdfUrl) {
      // Compatibilidad con PDFs que tengan URL (si existen)
      window.open(bill.pdfUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Todas ({bills.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Pendientes ({bills.filter(b => getBillStatus(b) === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'overdue'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Vencidas ({bills.filter(b => getBillStatus(b) === 'overdue').length})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'paid'
              ? 'bg-primary-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Pagadas ({bills.filter(b => getBillStatus(b) === 'paid').length})
        </button>
      </div>

      {/* Lista de boletas */}
      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="card p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              No hay boletas {filter !== 'all' ? `con estado "${filter}"` : ''}
            </p>
          </div>
        ) : (
          filteredBills.map(bill => {
            const status = getBillStatus(bill);
            const statusConfig = getStatusConfig(status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={bill.id}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {getMonthName(bill.month - 1)} {bill.year}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Boleta N° {bill.year}-{String(bill.month).padStart(2, '0')}-{bill.houseId}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>
                </div>

                {/* Detalles */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Consumo</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {bill.consumption || 0} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Total</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {formatCurrency(bill.totalAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Emisión</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatDate(bill.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Vencimiento</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  {(bill.pdfData || bill.pdfUrl) && (
                    <button
                      onClick={() => handleDownloadPDF(bill)}
                      className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BillsList;
