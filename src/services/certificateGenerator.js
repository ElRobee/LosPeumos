/**
 * Servicio para generar certificados de residencia en PDF
 * Usa jsPDF para crear PDFs con template personalizado
 * Basado en formato oficial de Los Peumos
 */

import jsPDF from 'jspdf';

/**
 * Genera un certificado de residencia en PDF
 * @param {Object} data - Datos del certificado
 * @returns {Blob} - PDF como blob
 */
export const generateCertificatePDF = (data) => {
  const {
    certificateNumber,
    residentName,
    residentRut,
    houseId,
    purpose,
    presidentName = 'GUILLERMO SALGADO JEREZ',
    presidentRut = '15.766.257-0',
    communityRut = '65.104.927-K'
  } = data;

  // Crear PDF en tamaño carta
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const centerX = pageWidth / 2;

  // ============================================
  // LOGO (centrado arriba)
  // ============================================
  try {
    // Logo de 40x40mm centrado - cargado desde public/logo-lospeumos.png
    const logoPath = '/logo-lospeumos.png';
    doc.addImage(logoPath, 'PNG', centerX - 20, 15, 40, 40);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  // ============================================
  // TÍTULO: CERTIFICADO DE RESIDENCIA
  // ============================================
  let yPosition = 75;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICADO DE RESIDENCIA', centerX, yPosition, { align: 'center' });
  yPosition += 15;

  // ============================================
  // ENCABEZADO - Datos del Presidente (texto normal)
  // ============================================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  // Nombre del presidente
  const line1 = `Guillermo Salgado Jerez, Cédula Nacional de Identidad N° `;
  const line1Width = doc.getTextWidth(line1);
  doc.text(line1, margin, yPosition);
  
  // RUT del presidente (negrita cursiva)
  doc.setFont('helvetica', 'bolditalic');
  doc.text(presidentRut, margin + line1Width, yPosition);
  doc.setFont('helvetica', 'bold');
  yPosition += 6;

  // Segunda línea
  doc.setFont('helvetica', 'normal');
  const line2 = 'en calidad de Presidente de la Comunidad denominada ';
  const line2Width = doc.getTextWidth(line2);
  doc.text(line2, margin, yPosition);
  
  // Nombre comunidad (negrita cursiva)
  doc.setFont('helvetica', 'bolditalic');
  doc.text('"COMUNIDAD LOS PEUMOS"', margin + line2Width, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(',', margin + line2Width + doc.getTextWidth('"COMUNIDAD LOS PEUMOS"'), yPosition);
  yPosition += 6;

  // Tercera línea
  const line3 = 'RUT: ';
  const line3Width = doc.getTextWidth(line3);
  doc.text(line3, margin, yPosition);
  
  // RUT comunidad (negrita cursiva)
  doc.setFont('helvetica', 'bolditalic');
  doc.text(communityRut, margin + line3Width, yPosition);
  doc.setFont('helvetica', 'normal');
  
  const line3b = ', ubicada en sector Fuerte Aguayo, Concón, Región de Valparaíso.';
  doc.text(line3b, margin + line3Width + doc.getTextWidth(communityRut), yPosition);
  yPosition += 20;

  // ============================================
  // CERTIFICA
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('CERTIFICA', centerX, yPosition, { align: 'center' });
  yPosition += 15;

  // ============================================
  // CUERPO DEL CERTIFICADO
  // ============================================
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Primera línea del cuerpo
  const body1 = 'Que: ';
  const body1Width = doc.getTextWidth(body1);
  doc.text(body1, margin, yPosition);
  
  // Nombre del residente (negrita cursiva)
  doc.setFont('helvetica', 'bolditalic');
  doc.text(residentName, margin + body1Width, yPosition);
  doc.setFont('helvetica', 'normal');
  
  const body1b = ', Cédula Nacional de Identidad';
  doc.text(body1b, margin + body1Width + doc.getTextWidth(residentName), yPosition);
  yPosition += 6;

  // Segunda línea - RUT
  const body2 = 'N° ';
  const body2Width = doc.getTextWidth(body2);
  doc.text(body2, margin, yPosition);
  
  // RUT (negrita cursiva)
  doc.setFont('helvetica', 'bolditalic');
  doc.text(residentRut, margin + body2Width, yPosition);
  doc.setFont('helvetica', 'normal');
  
  const body2b = ' registra su domicilio particular en nuestra comunidad,';
  doc.text(body2b, margin + body2Width + doc.getTextWidth(residentRut), yPosition);
  yPosition += 6;

  // Tercera línea - Dirección
  const body3 = 'En Av. Los Peumos, Parcela #';
  const body3Width = doc.getTextWidth(body3);
  doc.text(body3, margin, yPosition);
  
  // Número de parcela (negrita cursiva)
  doc.setFont('helvetica', 'bolditalic');
  doc.text(houseId.replace('house', ''), margin + body3Width, yPosition);
  doc.setFont('helvetica', 'normal');
  
  const body3b = ' , Comunidad Los Peumos, sector Fuerte Aguayo Concón ,';
  doc.text(body3b, margin + body3Width + doc.getTextWidth(houseId.replace('house', '')), yPosition);
  yPosition += 6;

  doc.text('Región de Valparaíso.', margin, yPosition);
  yPosition += 15;

  // Propósito del certificado
  const purposeText = 'Se extiende el presente certificado a petición de la interesada para fines que estime';
  doc.text(purposeText, margin, yPosition);
  yPosition += 6;
  doc.text('conveniente.', margin, yPosition);
  yPosition += 40;

  // ============================================
  // FIRMA
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('P.P. COMITÉ DE ADELANTO LOS PEUMOS', centerX, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('GUILLERMO SALGADO JEREZ', centerX, yPosition, { align: 'center' });
  yPosition += 6;
  doc.text('PRESIDENTE', centerX, yPosition, { align: 'center' });

  // Retornar como blob
  return doc.output('blob');
};

/**
 * Genera número de certificado único
 * @returns {string} - Número de certificado (ej: CERT-2024-10-00123)
 */
export const generateCertificateNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  
  return `CERT-${year}-${month}-${random}`;
};

/**
 * Convierte blob a base64
 * @param {Blob} blob - Blob del PDF
 * @returns {Promise<string>} - String base64
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Descarga el certificado PDF
 * @param {Blob} blob - Blob del PDF
 * @param {string} fileName - Nombre del archivo
 */
export const downloadCertificatePDF = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formatea el RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado (ej: 12.345.678-9)
 */
export const formatRut = (rut) => {
  // Remover puntos y guión
  const cleaned = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Separar número y dígito verificador
  const number = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Formatear con puntos
  const formatted = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formatted}-${dv}`;
};

export default {
  generateCertificatePDF,
  generateCertificateNumber,
  blobToBase64,
  downloadCertificatePDF,
  formatRut
};
