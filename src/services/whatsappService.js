/**
 * Servicio para generar mensajes de WhatsApp prellenados
 * Usa la API de WhatsApp Web para abrir conversaciones con texto predefinido
 */

/**
 * Genera un mensaje de WhatsApp para notificar una nueva boleta
 * @param {Object} params - Parámetros del mensaje
 * @param {string} params.phone - Número de teléfono (formato: +56912345678)
 * @param {string} params.ownerName - Nombre del propietario
 * @param {string} params.houseNumber - Número de parcela
 * @param {number} params.month - Mes de la boleta
 * @param {number} params.year - Año de la boleta
 * @param {number} params.total - Total a pagar
 * @param {string} params.dueDate - Fecha de vencimiento
 * @param {number} params.consumption - Consumo en kWh
 * @returns {string} URL de WhatsApp con mensaje prellenado
 */
export const getNewBillWhatsAppMessage = (params) => {
  const {
    phone,
    ownerName,
    houseNumber,
    month,
    year,
    total,
    dueDate,
    consumption
  } = params;

  // Limpiar número de teléfono (solo dígitos)
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  // Crear mensaje prellenado sin emojis
  const message = `Hola ${ownerName}

*BOLETA DE ELECTRICIDAD GENERADA*

*PARCELA:* ${houseNumber}
*PERIODO:* ${getMonthName(month)}/${year}
*CONSUMO:* ${consumption} kWh
*TOTAL A PAGAR:* $${total.toLocaleString('es-CL')}
*VENCIMIENTO:* ${dueDate}

----------------------------------------

Puede descargar su boleta ingresando a:
https://lospeumos.cl

O solicitarmela por este medio.

*DATOS PARA PAGAR:*

- Banco Estado
- Cuenta Corriente: 12345678
- RUT: 76.XXX.XXX-X
- Referencia: BILL-${year}-${String(month).padStart(2, '0')}-${houseNumber}

*Por favor, suba el comprobante al sistema una vez realizado el pago.*

Saludos cordiales,
Administracion Comunidad Los Peumos`;

  // Codificar mensaje para URL
  const encodedMessage = encodeURIComponent(message);

  // Generar URL de WhatsApp
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Genera un mensaje de WhatsApp para recordar pago pendiente
 * @param {Object} params - Parámetros del mensaje
 */
export const getPaymentReminderWhatsAppMessage = (params) => {
  const {
    phone,
    ownerName,
    houseNumber,
    month,
    year,
    total,
    dueDate,
    daysOverdue = 0
  } = params;

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const isOverdue = daysOverdue > 0;
  const statusText = isOverdue 
    ? `*VENCIDA - ${daysOverdue} dias de atraso*` 
    : '*PENDIENTE*';

  const message = `Hola ${ownerName}

*RECORDATORIO DE PAGO*

*PARCELA:* ${houseNumber}
*PERIODO:* ${getMonthName(month)}/${year}
*TOTAL:* $${total.toLocaleString('es-CL')}
*VENCIMIENTO:* ${dueDate}
*ESTADO:* ${statusText}

----------------------------------------

*DATOS PARA TRANSFERENCIA:*

- Banco Estado
- Cuenta Corriente: 12345678
- RUT: 76.XXX.XXX-X
- Referencia: BILL-${year}-${String(month).padStart(2, '0')}-${houseNumber}

*No olvide subir el comprobante al sistema:*
https://lospeumos.cl

Si ya realizo el pago, por favor ignore este mensaje.

Saludos,
Administracion Comunidad Los Peumos`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Genera un mensaje de WhatsApp para confirmar pago validado
 * @param {Object} params - Parámetros del mensaje
 */
export const getPaymentConfirmedWhatsAppMessage = (params) => {
  const {
    phone,
    ownerName,
    houseNumber,
    month,
    year,
    amount
  } = params;

  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const message = `Hola ${ownerName}

*PAGO CONFIRMADO*

Su pago ha sido validado exitosamente:

*PARCELA:* ${houseNumber}
*PERIODO:* ${getMonthName(month)}/${year}
*MONTO:* $${amount.toLocaleString('es-CL')}
*FECHA:* ${new Date().toLocaleDateString('es-CL')}

----------------------------------------

Gracias por mantener sus pagos al dia.

Puede revisar el estado en:
https://lospeumos.cl

Saludos,
Administracion Comunidad Los Peumos`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Genera un mensaje de WhatsApp personalizado
 * @param {string} phone - Número de teléfono
 * @param {string} message - Mensaje personalizado
 */
export const getCustomWhatsAppMessage = (phone, message) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Abre WhatsApp en una nueva ventana
 * @param {string} url - URL generada por las funciones anteriores
 */
export const openWhatsApp = (url) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Valida formato de número de teléfono chileno
 * @param {string} phone - Número a validar
 * @returns {boolean} True si es válido
 */
export const isValidChileanPhone = (phone) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // Formato chileno: +56912345678 (9 dígitos después de +56)
  // O formato: 56912345678 (sin +)
  // O formato: 912345678 (sin código país)
  return /^(56)?9\d{8}$/.test(cleanPhone);
};

/**
 * Formatea número de teléfono chileno al formato internacional
 * @param {string} phone - Número a formatear
 * @returns {string} Número en formato +56912345678
 */
export const formatChileanPhone = (phone) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Si ya tiene código de país
  if (cleanPhone.startsWith('56') && cleanPhone.length === 11) {
    return `+${cleanPhone}`;
  }
  
  // Si solo tiene el número local
  if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
    return `+56${cleanPhone}`;
  }
  
  return phone; // Devolver original si no coincide con el formato esperado
};

/**
 * Obtiene nombre del mes en español
 * @param {number} month - Número del mes (1-12)
 * @returns {string} Nombre del mes
 */
const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1] || month;
};

export default {
  getNewBillWhatsAppMessage,
  getPaymentReminderWhatsAppMessage,
  getPaymentConfirmedWhatsAppMessage,
  getCustomWhatsAppMessage,
  openWhatsApp,
  isValidChileanPhone,
  formatChileanPhone
};
