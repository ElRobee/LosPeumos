/**
 * Servicio para hacer matching automático entre transacciones bancarias y boletas
 * Algoritmo de coincidencia por monto, mes, referencia, parcela
 */

/**
 * Hace matching entre transacciones y boletas pendientes
 * @param {Array} transactions - Transacciones del Excel
 * @param {Array} pendingBills - Boletas pendientes de pago
 * @returns {Array} - Array de matches con score de confianza
 */
export const matchTransactionsToBills = (transactions, pendingBills) => {
  const matches = [];
  const usedTransactions = new Set();
  const usedBills = new Set();
  
  // Para cada transacción, buscar la mejor boleta
  transactions.forEach((transaction, transIndex) => {
    let bestMatch = null;
    let bestScore = 0;
    
    pendingBills.forEach((bill, billIndex) => {
      // Saltar si ya fue usado
      if (usedBills.has(billIndex)) return;
      
      const score = calculateMatchScore(transaction, bill);
      
      if (score > bestScore && score >= 50) { // Mínimo 50% de confianza
        bestScore = score;
        bestMatch = {
          transaction,
          bill,
          score,
          transactionIndex: transIndex,
          billIndex: billIndex,
          status: score >= 80 ? 'high-confidence' : score >= 60 ? 'medium-confidence' : 'low-confidence',
          matchReasons: getMatchReasons(transaction, bill)
        };
      }
    });
    
    if (bestMatch) {
      matches.push(bestMatch);
      usedTransactions.add(transIndex);
      usedBills.add(billIndex);
    }
  });
  
  // Agregar transacciones sin match
  transactions.forEach((transaction, index) => {
    if (!usedTransactions.has(index)) {
      matches.push({
        transaction,
        bill: null,
        score: 0,
        transactionIndex: index,
        billIndex: null,
        status: 'no-match',
        matchReasons: ['No se encontró boleta correspondiente']
      });
    }
  });
  
  // Ordenar por score descendente
  return matches.sort((a, b) => b.score - a.score);
};

/**
 * Calcula score de coincidencia entre transacción y boleta
 * @param {Object} transaction - Transacción bancaria
 * @param {Object} bill - Boleta
 * @returns {number} - Score de 0 a 100
 */
const calculateMatchScore = (transaction, bill) => {
  let score = 0;
  
  // 1. Match por monto exacto (40 puntos)
  if (Math.abs(transaction.amount - bill.total) < 0.01) {
    score += 40;
  } else {
    // Match por monto similar (con margen de error)
    const diff = Math.abs(transaction.amount - bill.total);
    const percentDiff = (diff / bill.total) * 100;
    
    if (percentDiff < 1) score += 35; // 1% diferencia
    else if (percentDiff < 5) score += 25; // 5% diferencia
    else if (percentDiff < 10) score += 15; // 10% diferencia
  }
  
  // 2. Match por referencia explícita (30 puntos)
  const billReference = `BILL-${bill.year}-${String(bill.month).padStart(2, '0')}-${bill.houseId}`;
  if (transaction.reference.toUpperCase().includes(billReference.toUpperCase())) {
    score += 30;
  } else if (transaction.description.toUpperCase().includes(billReference.toUpperCase())) {
    score += 25;
  } else if (transaction.reference.includes(bill.houseId) || transaction.description.includes(bill.houseId)) {
    score += 10;
  }
  
  // 3. Match por fecha (15 puntos) - mismo mes
  if (transaction.date) {
    const transMonth = transaction.date.getMonth();
    const transYear = transaction.date.getFullYear();
    const billMonth = bill.month - 1; // bill.month es 1-indexed
    const billYear = bill.year;
    
    if (transMonth === billMonth && transYear === billYear) {
      score += 15;
    } else if (transYear === billYear && Math.abs(transMonth - billMonth) === 1) {
      // Mes adyacente (pagó en mes anterior o siguiente)
      score += 8;
    }
  }
  
  // 4. Match por número de parcela en descripción (15 puntos)
  const houseNumber = bill.houseId.replace('house', '');
  const descUpper = transaction.description.toUpperCase();
  
  if (descUpper.includes(`PARCELA ${houseNumber}`) || 
      descUpper.includes(`PARC ${houseNumber}`) ||
      descUpper.includes(`CASA ${houseNumber}`) ||
      descUpper.includes(`#${houseNumber}`)) {
    score += 15;
  } else if (descUpper.includes(houseNumber)) {
    score += 8;
  }
  
  return Math.min(score, 100);
};

/**
 * Obtiene las razones del match para mostrar al usuario
 * @param {Object} transaction - Transacción
 * @param {Object} bill - Boleta
 * @returns {Array} - Array de strings con razones
 */
const getMatchReasons = (transaction, bill) => {
  const reasons = [];
  
  // Monto
  if (Math.abs(transaction.amount - bill.total) < 0.01) {
    reasons.push(`✓ Monto exacto: $${transaction.amount.toLocaleString('es-CL')}`);
  } else {
    const diff = Math.abs(transaction.amount - bill.total);
    const percentDiff = ((diff / bill.total) * 100).toFixed(1);
    reasons.push(`~ Monto similar: $${transaction.amount.toLocaleString('es-CL')} (${percentDiff}% diferencia)`);
  }
  
  // Referencia
  const billReference = `BILL-${bill.year}-${String(bill.month).padStart(2, '0')}-${bill.houseId}`;
  if (transaction.reference.toUpperCase().includes(billReference.toUpperCase())) {
    reasons.push(`✓ Referencia exacta en campo referencia`);
  } else if (transaction.description.toUpperCase().includes(billReference.toUpperCase())) {
    reasons.push(`✓ Referencia encontrada en descripción`);
  } else if (transaction.reference.includes(bill.houseId) || transaction.description.includes(bill.houseId)) {
    reasons.push(`~ HouseId encontrado: ${bill.houseId}`);
  }
  
  // Fecha
  if (transaction.date) {
    const transMonth = transaction.date.getMonth();
    const transYear = transaction.date.getFullYear();
    const billMonth = bill.month - 1;
    const billYear = bill.year;
    
    if (transMonth === billMonth && transYear === billYear) {
      reasons.push(`✓ Mismo mes de la boleta`);
    } else {
      reasons.push(`⚠ Mes diferente: transacción en ${transMonth + 1}/${transYear}`);
    }
  }
  
  // Parcela
  const houseNumber = bill.houseId.replace('house', '');
  if (transaction.description.includes(houseNumber)) {
    reasons.push(`✓ Número de parcela mencionado: ${houseNumber}`);
  }
  
  return reasons;
};

/**
 * Busca manualmente una boleta que coincida con criterios
 * @param {Object} criteria - Criterios de búsqueda
 * @param {Array} bills - Array de boletas
 * @returns {Object|null} - Boleta encontrada o null
 */
export const findBillByCriteria = (criteria, bills) => {
  const { amount, houseId, month, year } = criteria;
  
  return bills.find(bill => {
    let match = true;
    
    if (amount && Math.abs(bill.total - amount) > 0.01) {
      match = false;
    }
    
    if (houseId && bill.houseId !== houseId) {
      match = false;
    }
    
    if (month && bill.month !== month) {
      match = false;
    }
    
    if (year && bill.year !== year) {
      match = false;
    }
    
    return match;
  });
};

/**
 * Valida que un match sea seguro para confirmar automáticamente
 * @param {Object} match - Objeto de match
 * @returns {boolean}
 */
export const isSafeAutoMatch = (match) => {
  return match.score >= 80 && match.matchReasons.length >= 3;
};

export default {
  matchTransactionsToBills,
  calculateMatchScore,
  getMatchReasons,
  findBillByCriteria,
  isSafeAutoMatch
};
