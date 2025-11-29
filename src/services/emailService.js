/**
 * Servicio para envío de emails usando EmailJS
 * Configuración en .env: VITE_EMAILJS_USER_ID, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID
 */

import emailjs from 'emailjs-com';

// Inicializar EmailJS con el USER_ID
const initEmailJS = () => {
  const userId = import.meta.env.VITE_EMAILJS_USER_ID;
  if (userId) {
    emailjs.init(userId);
  }
};

initEmailJS();

/**
 * Envía email de nueva boleta generada
 * @param {Object} params - Parámetros del email
 * @param {string} params.toEmail - Email del destinatario
 * @param {string} params.toName - Nombre del destinatario
 * @param {string} params.houseNumber - Número de parcela
 * @param {string} params.month - Mes de la boleta
 * @param {string} params.year - Año de la boleta
 * @param {number} params.total - Total a pagar
 * @param {string} params.pdfUrl - URL del PDF en Storage
 * @param {string} params.dueDate - Fecha de vencimiento
 */
export const sendNewBillEmail = async (params) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    throw new Error('EmailJS no está configurado. Verifica las variables de entorno.');
  }

  const templateParams = {
    to_email: params.toEmail,
    to_name: params.toName,
    house_number: params.houseNumber,
    month: params.month,
    year: params.year,
    total: `$${params.total.toLocaleString('es-CL')}`,
    pdf_url: params.pdfUrl,
    due_date: params.dueDate,
    subject: `Boleta de Electricidad - ${params.month}/${params.year} - Parcela ${params.houseNumber}`,
    message: `Estimado/a ${params.toName},

Se ha generado la boleta de electricidad correspondiente al período ${params.month}/${params.year} para la Parcela ${params.houseNumber}.

Total a pagar: $${params.total.toLocaleString('es-CL')}
Fecha de vencimiento: ${params.dueDate}

Puede descargar la boleta desde el siguiente enlace:
${params.pdfUrl}

También puede verla en su cuenta del sistema LosPeumos.

Por favor, una vez realizado el pago, suba el comprobante a través del sistema.

Datos para la transferencia:
Banco: Banco Estado
Tipo de cuenta: Cuenta Corriente
Número de cuenta: 12345678
RUT: 76.XXX.XXX-X
Referencia: BILL-${params.year}-${String(params.month).padStart(2, '0')}-${params.houseNumber}

Saludos cordiales,
Administración Condominio Los Peumos`
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams);
    console.log('Email enviado exitosamente:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

/**
 * Envía email de pago validado
 * @param {Object} params - Parámetros del email
 */
export const sendPaymentValidatedEmail = async (params) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    throw new Error('EmailJS no está configurado. Verifica las variables de entorno.');
  }

  const templateParams = {
    to_email: params.toEmail,
    to_name: params.toName,
    house_number: params.houseNumber,
    month: params.month,
    year: params.year,
    amount: `$${params.amount.toLocaleString('es-CL')}`,
    subject: `Pago Validado - ${params.month}/${params.year} - Parcela ${params.houseNumber}`,
    message: `Estimado/a ${params.toName},

Su pago correspondiente al período ${params.month}/${params.year} para la Parcela ${params.houseNumber} ha sido validado exitosamente.

Monto pagado: $${params.amount.toLocaleString('es-CL')}
Fecha de validación: ${new Date().toLocaleDateString('es-CL')}

Puede ver el estado actualizado en su cuenta del sistema LosPeumos.

Gracias por su pago.

Saludos cordiales,
Administración Condominio Los Peumos`
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams);
    console.log('Email de confirmación enviado:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
    throw error;
  }
};

/**
 * Verifica si EmailJS está configurado
 */
export const isEmailConfigured = () => {
  return !!(
    import.meta.env.VITE_EMAILJS_USER_ID &&
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID
  );
};

export default {
  sendNewBillEmail,
  sendPaymentValidatedEmail,
  isEmailConfigured
};
