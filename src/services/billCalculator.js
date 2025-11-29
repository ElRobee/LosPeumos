/**
 * Servicio para cálculo de boletas de electricidad
 */

// Valores por defecto (fallback si Firestore no está disponible)
const DEFAULT_ELECTRICITY_RATE = parseInt(import.meta.env.VITE_ELECTRICITY_RATE) || 150;
const DEFAULT_FIXED_FEE = 2000; // Cargo fijo mensual en CLP

/**
 * Calcula el consumo y total de una boleta
 * @param {number} previousReading - Lectura anterior
 * @param {number} currentReading - Lectura actual
 * @param {Object} rates - Objeto con { variableRate, fixedRate } desde Firestore (opcional)
 * @returns {Object} - Datos calculados de la boleta
 */
export const calculateBill = (previousReading, currentReading, rates = null) => {
  // Validaciones
  if (!previousReading || !currentReading) {
    throw new Error('Las lecturas anterior y actual son obligatorias');
  }

  if (currentReading < previousReading) {
    throw new Error('La lectura actual no puede ser menor a la lectura anterior');
  }

  const consumption = currentReading - previousReading;
  const rate = rates?.variableRate || DEFAULT_ELECTRICITY_RATE;
  const electricityCharge = consumption * rate;
  const fixedFee = rates?.fixedRate || DEFAULT_FIXED_FEE;
  const total = electricityCharge + fixedFee;

  return {
    previousReading: parseInt(previousReading),
    currentReading: parseInt(currentReading),
    consumption,
    rate,
    electricityCharge,
    fixedFee,
    total
  };
};

/**
 * Genera la fecha de vencimiento (20 del mes siguiente)
 * @param {Date} createdDate - Fecha de creación de la boleta
 * @returns {Date}
 */
export const generateDueDate = (createdDate = new Date()) => {
  const dueDate = new Date(createdDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(20);
  dueDate.setHours(23, 59, 59, 999);
  return dueDate;
};

/**
 * Genera el ID de referencia de la boleta
 * @param {number} year - Año
 * @param {number} month - Mes
 * @param {string} houseId - ID de la parcela
 * @returns {string}
 */
export const generateBillReference = (year, month, houseId) => {
  return `BILL-${year}-${String(month).padStart(2, '0')}-${houseId}`;
};

/**
 * Valida que las lecturas sean correctas
 * @param {number} previousReading - Lectura anterior
 * @param {number} currentReading - Lectura actual
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateReadings = (previousReading, currentReading) => {
  if (!previousReading || previousReading < 0) {
    return { valid: false, error: 'La lectura anterior debe ser un número positivo' };
  }

  if (!currentReading || currentReading < 0) {
    return { valid: false, error: 'La lectura actual debe ser un número positivo' };
  }

  if (currentReading < previousReading) {
    return { valid: false, error: 'La lectura actual no puede ser menor a la anterior' };
  }

  const consumption = currentReading - previousReading;
  
  // Validar consumo razonable (0-500 kWh por mes)
  if (consumption > 500) {
    return { 
      valid: false, 
      error: `El consumo de ${consumption} kWh parece muy alto. Verifica las lecturas.`,
      warning: true
    };
  }

  if (consumption === 0) {
    return { 
      valid: false, 
      error: 'El consumo es 0. ¿Estás seguro de que las lecturas son correctas?',
      warning: true
    };
  }

  return { valid: true };
};

/**
 * Obtiene la tarifa variable actual (para mostrar en UI)
 * @param {number} customRate - Tarifa desde Firestore (opcional)
 */
export const getCurrentRate = (customRate = null) => customRate || DEFAULT_ELECTRICITY_RATE;

/**
 * Obtiene el cargo fijo (para mostrar en UI)
 * @param {number} customFee - Cargo fijo desde Firestore (opcional)
 */
export const getFixedFee = (customFee = null) => customFee || DEFAULT_FIXED_FEE;

export default {
  calculateBill,
  generateDueDate,
  generateBillReference,
  validateReadings,
  getCurrentRate,
  getFixedFee
};
