/**
 * Utilidades para formateo de moneda chilena (CLP)
 */

/**
 * Formatea un número a formato de moneda chilena
 * @param {number} amount - Monto a formatear
 * @param {boolean} includeSymbol - Si incluir el símbolo $
 * @returns {string} - Monto formateado
 */
export const formatCurrency = (amount, includeSymbol = true) => {
  if (amount === null || amount === undefined) return includeSymbol ? '$0' : '0';
  
  const formatted = new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return includeSymbol ? `$${formatted}` : formatted;
};

/**
 * Formatea un número a formato compacto (K, M)
 * @param {number} amount - Monto a formatear
 * @returns {string} - Monto formateado
 */
export const formatCompactCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  
  return `$${amount}`;
};

/**
 * Parsea un string de moneda a número
 * @param {string} currencyString - String con formato de moneda
 * @returns {number} - Número parseado
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remover símbolo $, puntos de miles y espacios
  const cleaned = currencyString.replace(/[$\s.]/g, '');
  
  // Convertir comas a puntos para decimales
  const normalized = cleaned.replace(',', '.');
  
  return parseFloat(normalized) || 0;
};

/**
 * Calcula el porcentaje de cambio entre dos valores
 * @param {number} current - Valor actual
 * @param {number} previous - Valor anterior
 * @returns {string} - Porcentaje formateado con signo
 */
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return '+0%';
  
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  
  return `${sign}${change.toFixed(1)}%`;
};

/**
 * Formatea un monto con separador de miles
 * @param {number} amount - Monto a formatear
 * @returns {string} - Monto formateado sin símbolo
 */
export const formatNumber = (amount) => {
  if (amount === null || amount === undefined) return '0';
  
  return new Intl.NumberFormat('es-CL').format(amount);
};
