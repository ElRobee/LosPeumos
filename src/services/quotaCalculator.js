/**
 * Servicio para calcular cuotas extras (agua, reparaciones, proyectos, etc.)
 * Soporta distribución equitativa o proporcional y cuotas mensuales/por cuotas
 */

/**
 * Tipos de distribución
 */
export const DISTRIBUTION_TYPES = {
  EQUAL: 'equal', // Dividir en partes iguales entre todas las parcelas
  PROPORTIONAL: 'proportional', // Según proporción específica (ej: por m2)
  CUSTOM: 'custom', // Asignación manual por parcela
  PERCENTAGE: 'percentage' // Según porcentaje de participación
};

/**
 * Tipos de pago de cuotas
 */
export const PAYMENT_TYPES = {
  ONE_TIME: 'one-time', // Pago único
  INSTALLMENTS: 'installments' // Pago en cuotas mensuales
};

/**
 * Categorías de cuotas
 */
export const QUOTA_CATEGORIES = {
  WATER: 'water', // Agua
  REPAIRS: 'repairs', // Reparaciones
  MAINTENANCE: 'maintenance', // Mantención
  PROJECTS: 'projects', // Proyectos
  SERVICES: 'services', // Servicios
  OTHER: 'other' // Otros
};

/**
 * Calcula la distribución de una cuota entre parcelas
 * @param {number} totalAmount - Monto total de la cuota
 * @param {Array} houses - Array de casas/parcelas
 * @param {string} distributionType - Tipo de distribución
 * @param {Object} customData - Datos adicionales para distribución personalizada
 * @returns {Object} - Objeto con distribución por casa
 */
export const calculateQuotaDistribution = (totalAmount, houses, distributionType, customData = {}) => {
  const distribution = {};
  
  switch (distributionType) {
    case DISTRIBUTION_TYPES.EQUAL:
      // Distribución equitativa: dividir en partes iguales
      const amountPerHouse = totalAmount / houses.length;
      houses.forEach(house => {
        distribution[house.id] = {
          amount: Math.round(amountPerHouse),
          percentage: (100 / houses.length).toFixed(2),
          basis: 'equal'
        };
      });
      break;
      
    case DISTRIBUTION_TYPES.PROPORTIONAL:
      // Distribución proporcional según un factor (ej: m2, habitantes, etc.)
      const totalFactor = houses.reduce((sum, house) => {
        const factor = customData.factors?.[house.id] || 1;
        return sum + factor;
      }, 0);
      
      houses.forEach(house => {
        const factor = customData.factors?.[house.id] || 1;
        const percentage = (factor / totalFactor) * 100;
        const amount = (totalAmount * factor) / totalFactor;
        
        distribution[house.id] = {
          amount: Math.round(amount),
          percentage: percentage.toFixed(2),
          factor,
          basis: 'proportional'
        };
      });
      break;
      
    case DISTRIBUTION_TYPES.CUSTOM:
      // Distribución personalizada: montos manuales por casa
      houses.forEach(house => {
        const amount = customData.amounts?.[house.id] || 0;
        const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(2) : 0;
        
        distribution[house.id] = {
          amount,
          percentage,
          basis: 'custom'
        };
      });
      break;
      
    case DISTRIBUTION_TYPES.PERCENTAGE:
      // Distribución por porcentaje de participación
      houses.forEach(house => {
        const percentage = customData.percentages?.[house.id] || (100 / houses.length);
        const amount = (totalAmount * percentage) / 100;
        
        distribution[house.id] = {
          amount: Math.round(amount),
          percentage: percentage.toFixed(2),
          basis: 'percentage'
        };
      });
      break;
      
    default:
      throw new Error(`Tipo de distribución no válido: ${distributionType}`);
  }
  
  return distribution;
};

/**
 * Valida que la suma de montos custom sea igual al total
 * @param {number} totalAmount - Monto total
 * @param {Object} customAmounts - Montos por casa
 * @returns {Object} - { valid: boolean, difference: number }
 */
export const validateCustomDistribution = (totalAmount, customAmounts) => {
  const sum = Object.values(customAmounts).reduce((acc, val) => acc + val, 0);
  const difference = Math.abs(totalAmount - sum);
  
  return {
    valid: difference < 1, // Tolerancia de $1 por redondeo
    difference,
    sum
  };
};

/**
 * Valida que la suma de porcentajes sea 100%
 * @param {Object} percentages - Porcentajes por casa
 * @returns {Object} - { valid: boolean, total: number }
 */
export const validatePercentageDistribution = (percentages) => {
  const total = Object.values(percentages).reduce((acc, val) => acc + val, 0);
  const difference = Math.abs(100 - total);
  
  return {
    valid: difference < 0.1, // Tolerancia de 0.1% por redondeo
    total: total.toFixed(2),
    difference
  };
};

/**
 * Calcula el total recaudado de una cuota
 * @param {Object} quota - Objeto de cuota con payments
 * @returns {Object} - { collected, pending, percentage }
 */
export const calculateQuotaProgress = (quota) => {
  const totalAmount = quota.totalAmount || 0;
  
  // Sumar pagos por casa
  let collected = 0;
  if (quota.payments) {
    Object.values(quota.payments).forEach(payment => {
      if (payment.status === 'paid') {
        // Pago completo
        collected += payment.amount || 0;
      } else if (payment.status === 'partial') {
        // Pagos parciales - calcular monto realmente pagado
        let amountPaid = 0;
        
        // Si es cuota mensual, sumar installmentPayments
        if (payment.installmentPayments && payment.installmentPayments.length > 0) {
          amountPaid = payment.installmentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        }
        // Si es pago único con abonos, sumar partialPayments
        else if (payment.partialPayments && payment.partialPayments.length > 0) {
          amountPaid = payment.partialPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        }
        
        collected += amountPaid;
      }
    });
  }
  
  const pending = totalAmount - collected;
  const percentage = totalAmount > 0 ? ((collected / totalAmount) * 100).toFixed(2) : 0;
  
  return {
    collected,
    pending,
    percentage,
    totalAmount
  };
};

/**
 * Genera estadísticas de múltiples cuotas
 * @param {Array} quotas - Array de cuotas
 * @returns {Object} - Estadísticas generales
 */
export const calculateQuotasStats = (quotas) => {
  let totalQuotas = quotas.length;
  let activeQuotas = 0;
  let completedQuotas = 0;
  let totalAmount = 0;
  let collectedAmount = 0;
  let pendingAmount = 0;
  
  const byCategory = {};
  
  quotas.forEach(quota => {
    const progress = calculateQuotaProgress(quota);
    
    totalAmount += progress.totalAmount;
    collectedAmount += progress.collected;
    pendingAmount += progress.pending;
    
    if (quota.status === 'active') activeQuotas++;
    if (quota.status === 'completed') completedQuotas++;
    
    // Agrupar por categoría
    const category = quota.category || 'other';
    if (!byCategory[category]) {
      byCategory[category] = {
        count: 0,
        total: 0,
        collected: 0
      };
    }
    byCategory[category].count++;
    byCategory[category].total += progress.totalAmount;
    byCategory[category].collected += progress.collected;
  });
  
  return {
    totalQuotas,
    activeQuotas,
    completedQuotas,
    totalAmount,
    collectedAmount,
    pendingAmount,
    collectionRate: totalAmount > 0 ? ((collectedAmount / totalAmount) * 100).toFixed(2) : 0,
    byCategory
  };
};

/**
 * Obtiene el label en español de una categoría
 * @param {string} category - Categoría
 * @returns {string} - Label en español
 */
export const getCategoryLabel = (category) => {
  const labels = {
    water: 'Agua',
    repairs: 'Reparaciones',
    maintenance: 'Mantención',
    projects: 'Proyectos',
    services: 'Servicios',
    other: 'Otros'
  };
  return labels[category] || category;
};

/**
 * Obtiene el label en español de un tipo de distribución
 * @param {string} type - Tipo de distribución
 * @returns {string} - Label en español
 */
export const getDistributionLabel = (type) => {
  const labels = {
    equal: 'Partes Iguales',
    proportional: 'Proporcional',
    custom: 'Personalizado',
    percentage: 'Por Porcentaje'
  };
  return labels[type] || type;
};

/**
 * Obtiene el label en español de un tipo de pago
 * @param {string} type - Tipo de pago
 * @returns {string} - Label en español
 */
export const getPaymentTypeLabel = (type) => {
  const labels = {
    'one-time': 'Pago Único',
    'installments': 'Cuotas Mensuales'
  };
  return labels[type] || type;
};

/**
 * Registra un pago parcial (cuota mensual) con número de voucher
 * @param {Object} quota - Cuota actual
 * @param {string} houseId - ID de la casa
 * @param {string} voucherNumber - Número de voucher/boleta
 * @returns {Object} - Cuota actualizada
 */
export const recordInstallmentPayment = (quota, houseId, voucherNumber) => {
  if (!quota.payments || !quota.payments[houseId]) {
    throw new Error('Casa no encontrada en la cuota');
  }

  const payment = quota.payments[houseId];
  
  if (!payment.installmentPayments) {
    payment.installmentPayments = [];
  }

  // Agregar el pago de esta cuota
  payment.installmentPayments.push({
    voucherNumber,
    paidAt: new Date().toISOString(),
    amount: quota.monthlyAmount || payment.amount
  });

  // Actualizar contador de cuotas pagadas
  payment.installmentsPaid = payment.installmentPayments.length;
  payment.installmentsPending = (quota.installments?.total || 1) - payment.installmentsPaid;

  // Si completó todas las cuotas, marcar como pagado
  if (payment.installmentsPaid >= (quota.installments?.total || 1)) {
    payment.status = 'paid';
    payment.paidAt = new Date().toISOString();
  } else {
    payment.status = 'partial';
  }

  return quota;
};

/**
 * Calcula el progreso de cuotas mensuales para una casa
 * @param {Object} payment - Datos de pago de la casa
 * @param {number} totalInstallments - Total de cuotas
 * @returns {Object} - Progreso de pagos
 */
export const calculateInstallmentProgress = (payment, totalInstallments) => {
  const paid = payment.installmentsPaid || 0;
  const pending = totalInstallments - paid;
  const percentage = Math.round((paid / totalInstallments) * 100);

  return {
    paid,
    pending,
    total: totalInstallments,
    percentage,
    payments: payment.installmentPayments || []
  };
};

export default {
  DISTRIBUTION_TYPES,
  QUOTA_CATEGORIES,
  PAYMENT_TYPES,
  calculateQuotaDistribution,
  validateCustomDistribution,
  validatePercentageDistribution,
  calculateQuotaProgress,
  calculateQuotasStats,
  getCategoryLabel,
  getDistributionLabel,
  getPaymentTypeLabel,
  recordInstallmentPayment,
  calculateInstallmentProgress
};
