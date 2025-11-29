import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { DollarSign, CheckCircle, Clock, Calendar } from 'lucide-react';

const QuotasList = ({ houseId }) => {
  const [quotas, setQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuotas = async () => {
      if (!houseId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar todas las cuotas
        const quotasRef = collection(firestore, 'quotas');
        const snapshot = await getDocs(quotasRef);
        
        // Filtrar y transformar cuotas que incluyan este houseId en payments
        const quotasData = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Verificar si esta cuota tiene un pago para este houseId
          if (data.payments && data.payments[houseId]) {
            const payment = data.payments[houseId];
            
            // Calcular monto realmente pagado
            let amountPaid = 0;
            if (payment.status === 'paid') {
              amountPaid = payment.amount;
            } else if (payment.status === 'partial') {
              // Si es cuota mensual, sumar installmentPayments
              if (payment.installmentPayments && payment.installmentPayments.length > 0) {
                amountPaid = payment.installmentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
              }
              // Si es pago único con abonos, sumar partialPayments
              else if (payment.partialPayments && payment.partialPayments.length > 0) {
                amountPaid = payment.partialPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
              }
            }
            
            const amountPending = payment.amount - amountPaid;
            
            quotasData.push({
              id: doc.id,
              name: data.name,
              description: data.description || '',
              category: data.category,
              totalAmount: data.totalAmount,
              createdAt: data.createdAt,
              dueDate: data.dueDate,
              paymentType: data.paymentType,
              installments: data.installments,
              // Datos específicos de esta casa
              amount: payment.amount,
              status: payment.status,
              paidAt: payment.paidAt,
              percentage: payment.percentage,
              amountPaid: amountPaid,
              amountPending: amountPending,
              installmentPayments: payment.installmentPayments,
              partialPayments: payment.partialPayments,
              installmentsPaid: payment.installmentsPaid,
              installmentsPending: payment.installmentsPending
            });
          }
        });

        // Ordenar por createdAt descendente
        quotasData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setQuotas(quotasData);
      } catch (err) {
        console.error('Error loading quotas:', err);
        setError('Error al cargar las cuotas');
      } finally {
        setLoading(false);
      }
    };

    loadQuotas();
  }, [houseId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    // Manejar timestamps de Firestore
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status, quota) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          Pagada
        </span>
      );
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <Clock className="w-4 h-4" />
          Parcial
          {quota.installmentsPaid && quota.installments && (
            <span className="text-xs">({quota.installmentsPaid}/{quota.installments.total})</span>
          )}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
        <Clock className="w-4 h-4" />
        Pendiente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (quotas.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-8 text-center">
        <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">
          No tienes cuotas extraordinarias asignadas
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen de cuotas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Monto Pendiente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
            {formatCurrency(quotas.reduce((sum, q) => sum + (q.amountPending || 0), 0))}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Monto Pagado</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            {formatCurrency(quotas.reduce((sum, q) => sum + (q.amountPaid || 0), 0))}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Total Cuotas</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {quotas.length}
          </p>
        </div>
      </div>

      {/* Lista de cuotas */}
      <div className="space-y-3">
        {quotas.map((quota) => (
          <div
            key={quota.id}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {quota.name || 'Cuota Extraordinaria'}
                </h3>
                {quota.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {quota.description}
                  </p>
                )}
              </div>
              {getStatusBadge(quota.status, quota)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Monto
                </span>
                {quota.status === 'partial' ? (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Total: <span className="line-through">{formatCurrency(quota.amount || 0)}</span>
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Pagado: {formatCurrency(quota.amountPaid || 0)}
                    </div>
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      Pendiente: {formatCurrency(quota.amountPending || 0)}
                    </div>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(quota.amount || 0)}
                  </span>
                )}
              </div>

              {quota.dueDate && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Vencimiento
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(quota.dueDate)}
                  </span>
                </div>
              )}

              {quota.paidAt && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Fecha de Pago
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(quota.paidAt)}
                  </span>
                </div>
              )}

              {!quota.paidAt && quota.createdAt && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Creada
                  </span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {formatDate(quota.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuotasList;
