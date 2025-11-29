/**
 * Utilidades para manejo de fechas
 */

/**
 * Formatea una fecha a "hace X tiempo"
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada en español
 */
export const formatDistanceToNow = (date) => {
  if (!date) return 'Fecha desconocida';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Hace un momento';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `Hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
};

/**
 * Formatea una fecha a formato local chileno
 * @param {Date|string} date - Fecha a formatear
 * @param {boolean} includeTime - Si incluir la hora
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('es-CL', options);
};

/**
 * Formatea una fecha a formato corto (DD/MM/YYYY)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Obtiene el nombre del mes en español
 * @param {number} monthIndex - Índice del mes (0-11)
 * @returns {string} - Nombre del mes
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex] || '';
};

/**
 * Obtiene el mes y año actuales en formato string
 * @returns {string} - Ej: "Octubre 2025"
 */
export const getCurrentMonthYear = () => {
  const now = new Date();
  return `${getMonthName(now.getMonth())} ${now.getFullYear()}`;
};

/**
 * Verifica si una fecha está en el mes actual
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isCurrentMonth = (date) => {
  if (!date) return false;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  
  return dateObj.getMonth() === now.getMonth() && 
         dateObj.getFullYear() === now.getFullYear();
};

/**
 * Obtiene el rango de fechas del mes actual
 * @returns {Object} - { start: Date, end: Date }
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return { start, end };
};
