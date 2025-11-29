/**
 * Servicio para manejar archivos SIN usar Firebase Storage (plan Spark gratuito)
 * Los archivos se guardan como base64 en Firestore
 */

/**
 * Convierte un Blob a base64 string
 * @param {Blob} blob - Blob del archivo
 * @returns {Promise<string>} - String base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Guarda un PDF de boleta como base64 (sin usar Storage)
 * @param {Blob} pdfBlob - Blob del PDF
 * @param {string} billId - ID de la boleta
 * @param {string} houseId - ID de la parcela
 * @param {number} year - Año
 * @param {number} month - Mes
 * @returns {Promise<string>} - String base64 del PDF
 */
export const uploadBillPDF = async (pdfBlob, billId, houseId, year, month) => {
  try {
    // Convertir el blob a base64
    const base64String = await blobToBase64(pdfBlob);
    
    console.log('PDF convertido a base64 exitosamente');
    return base64String; // Retornamos el base64 para guardarlo en Firestore
  } catch (error) {
    console.error('Error al convertir PDF:', error);
    throw new Error(`Error al procesar PDF: ${error.message}`);
  }
};

/**
 * Guarda un comprobante de pago como base64 (sin usar Storage)
 * @param {File} file - Archivo del comprobante
 * @param {string} userId - ID del usuario
 * @param {string} billId - ID de la boleta
 * @returns {Promise<string>} - String base64 del archivo
 */
export const uploadPaymentProof = async (file, userId, billId) => {
  try {
    // Convertir el archivo a base64
    const base64String = await blobToBase64(file);
    
    console.log('Comprobante convertido a base64 exitosamente');
    return base64String; // Retornamos el base64 para guardarlo en Firestore
  } catch (error) {
    console.error('Error al convertir comprobante:', error);
    throw new Error(`Error al procesar comprobante: ${error.message}`);
  }
};

/**
 * Guarda un template de certificado como base64 (sin usar Storage)
 * @param {File} file - Archivo del template
 * @param {string} templateName - Nombre del template
 * @returns {Promise<string>} - String base64 del archivo
 */
export const uploadCertificateTemplate = async (file, templateName) => {
  try {
    const base64String = await blobToBase64(file);
    
    console.log('Template convertido a base64 exitosamente');
    return base64String;
  } catch (error) {
    console.error('Error al convertir template:', error);
    throw new Error(`Error al procesar template: ${error.message}`);
  }
};

/**
 * No se necesita eliminar archivos ya que están en Firestore
 * @param {string} fileUrl - URL del archivo (no usado)
 */
export const deleteFile = async (fileUrl) => {
  // No hacer nada, los archivos se eliminan con el documento de Firestore
  console.log('Archivo marcado para eliminación en Firestore');
};

/**
 * Valida el tipo y tamaño de archivo
 * @param {File} file - Archivo a validar
 * @param {Array} allowedTypes - Tipos MIME permitidos
 * @param {number} maxSize - Tamaño máximo en bytes
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateFile = (file, allowedTypes, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}` 
    };
  }

  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `El archivo es muy grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(2)} MB` 
    };
  }

  return { valid: true };
};

export default {
  uploadBillPDF,
  uploadPaymentProof,
  uploadCertificateTemplate,
  deleteFile,
  validateFile
};
