/**
 * Servicio para generar PDFs de boletas de electricidad
 * Usa jsPDF para crear documentos PDF
 */

import jsPDF from 'jspdf';
import { formatCurrency } from '../utils/currencyUtils';
import { formatDate } from '../utils/dateUtils';

/**
 * Genera un PDF de boleta de electricidad
 * @param {Object} billData - Datos de la boleta
 * @param {Object} houseData - Datos de la parcela
 * @returns {Blob} - PDF como Blob
 */
export const generateBillPDF = (billData, houseData) => {
  const doc = new jsPDF();
  
  // Configuración de colores
  const primaryColor = [14, 165, 233]; // primary-600
  const darkColor = [15, 23, 42]; // slate-900
  const grayColor = [100, 116, 139]; // slate-500
  
  // Función auxiliar para establecer colores de forma segura
  const setColor = (colorArray) => {
    if (Array.isArray(colorArray) && colorArray.length === 3) {
      return colorArray;
    }
    return [0, 0, 0]; // Negro por defecto
  };
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = margin;

  // ============================================
  // ENCABEZADO
  // ============================================
  
  // Logo/Título
  doc.setFillColor(14, 165, 233); // primaryColor RGB
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('LosPeumos', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comunidad Los Peumos', margin, 27);
  
  // Número de boleta
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const billNumber = `BOLETA N° ${billData.month}-${String(billData.year).padStart(2, '0')}`;
  doc.text(billNumber, pageWidth - margin, 20, { align: 'right' });
  
  yPos = 45;

  // ============================================
  // INFORMACIÓN DE LA PARCELA
  // ============================================
  
  doc.setTextColor(15, 23, 42); // darkColor RGB
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Boleta de Electricidad', margin, yPos);
  yPos += 10;
  
  // Box con info de la parcela - MEJORADO
  doc.setDrawColor(100, 116, 139); // grayColor RGB
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, yPos, pageWidth - (2 * margin), 38, 3, 3, 'FD');
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // darkColor RGB
  
  // Usar houseNumber de billData si existe, sino de houseData
  const houseNumber = billData.houseNumber || houseData?.houseNumber || 'N/A';
  const ownerName = houseData?.ownerName || billData.ownerName || 'No asignado';
  
  doc.text(`Parcela: ${houseNumber}`, margin + 5, yPos);
  yPos += 5;
  doc.text(`Propietario: ${ownerName}`, margin + 5, yPos);
  yPos += 5;
  
  // Periodo en el mismo recuadro
  const monthName = getMonthName(billData.month);
  doc.text(`Período: ${monthName} ${billData.year}`, margin + 5, yPos);
  
  yPos += 12;

  // ============================================
  // FECHAS
  // ============================================
  
  const createdAtDate = billData.createdAt ? new Date(billData.createdAt) : new Date();
  const dueDateDate = billData.dueDate ? new Date(billData.dueDate) : new Date();
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(' Fecha de emisión:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(createdAtDate), margin + 45, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(' Fecha de vencimiento:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 38, 38); // red-600
  doc.text(formatDate(dueDateDate), margin + 45, yPos);
  doc.setTextColor(15, 23, 42); // darkColor RGB
  
  yPos += 15;

  // ============================================
  // DETALLE DE CONSUMO
  // ============================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Consumo', margin, yPos);
  yPos += 10;
  
  // Tabla de lecturas - MEJORADA
  const tableStartY = yPos;
  const colWidth = (pageWidth - (2 * margin)) / 4;
  
  // Header de tabla
  doc.setFillColor(14, 165, 233); // primaryColor RGB
  doc.rect(margin, yPos, pageWidth - (2 * margin), 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Encabezados centrados
  doc.text('Lectura Anterior', margin + colWidth / 2, yPos + 6.5, { align: 'center' });
  doc.text('Lectura Actual', margin + colWidth * 1.5, yPos + 6.5, { align: 'center' });
  doc.text('Consumo (kWh)', margin + colWidth * 2.5, yPos + 6.5, { align: 'center' });
  doc.text('Tarifa ($/kWh)', margin + colWidth * 3.5, yPos + 6.5, { align: 'center' });
  
  yPos += 10;
  
  // Datos
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, yPos, pageWidth - (2 * margin), 12, 'F');
  
  doc.setTextColor(15, 23, 42); // darkColor RGB
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  // Usar valores válidos o mostrar N/A
  const previousReadingStr = String(billData.previousReading || 0);
  const currentReadingStr = String(billData.currentReading || 0);
  const consumptionStr = String(billData.consumption || 0);
  const rateStr = billData.rate ? `$${billData.rate.toLocaleString('es-CL')}` : 'N/A';
  
  // Alinear texto centrado en cada columna
  doc.text(previousReadingStr, margin + colWidth / 2, yPos + 7, { align: 'center' });
  doc.text(currentReadingStr, margin + colWidth * 1.5, yPos + 7, { align: 'center' });
  doc.text(consumptionStr, margin + colWidth * 2.5, yPos + 7, { align: 'center' });
  doc.text(rateStr, margin + colWidth * 3.5, yPos + 7, { align: 'center' });
  
  yPos += 10;

  // ============================================
  // DESGLOSE DE COSTOS - OPTIMIZADO PARA UNA PÁGINA
  // ============================================
  
  doc.setDrawColor(100, 116, 139); // grayColor RGB
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 4;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // darkColor RGB
  doc.text('Desglose de Costos', margin, yPos);
  yPos += 4;
  
  // Configurar columnas
  const costsTableWidth = pageWidth - (2 * margin);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Consumo eléctrico
  const rate = billData.rate || 0;
  const electricityCharge = billData.electricityCharge || billData.variableCost || 0;
  doc.text('Consumo eléctrico:', margin, yPos);
  doc.text(`${billData.consumption || 0} kWh × $${rate.toLocaleString('es-CL')}`, margin + costsTableWidth - 60, yPos, { align: 'right' });
  doc.text(formatCurrency(electricityCharge), margin + costsTableWidth - 5, yPos, { align: 'right' });
  yPos += 3;
  
  // Cargo fijo
  const fixedFee = billData.fixedFee || billData.fixedCharge || billData.serviceFee || 0;
  doc.text('Cargo fijo de servicio:', margin, yPos);
  doc.text(formatCurrency(fixedFee), margin + costsTableWidth - 5, yPos, { align: 'right' });
  yPos += 3;
  
  // Impuestos si existen
  const taxes = billData.taxes || 0;
  if (taxes > 0) {
    doc.text('Impuestos:', margin, yPos);
    doc.text(formatCurrency(taxes), margin + costsTableWidth - 5, yPos, { align: 'right' });
    yPos += 3;
  }
  
  // Saldo anterior si existe
  if (billData.previousBalance !== undefined && billData.previousBalance !== 0) {
    const balanceLabel = billData.previousBalance >= 0 ? 'Saldo a favor:' : 'Saldo adeudado:';
    const balanceColor = billData.previousBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
    // Usar valores RGB directos para color seguro
    const balanceColorRGB = billData.previousBalance >= 0 ? [34, 197, 94] : [239, 68, 68];
    doc.setTextColor(balanceColorRGB[0], balanceColorRGB[1], balanceColorRGB[2]);
    doc.text(balanceLabel, margin, yPos);
    doc.text(formatCurrency(Math.abs(billData.previousBalance)), margin + costsTableWidth - 5, yPos, { align: 'right' });
    yPos += 3;
    doc.setTextColor(15, 23, 42); // darkColor RGB
  }
  
  // Línea separadora
  doc.setDrawColor(14, 165, 233); // primaryColor RGB
  doc.line(margin, yPos, margin + costsTableWidth, yPos);
  yPos += 2;
  
  // Total con fondo destacado
  doc.setFillColor(239, 246, 255); // blue-50
  doc.rect(margin, yPos - 2, costsTableWidth, 8, 'F');
  doc.setDrawColor(14, 165, 233); // primaryColor RGB
  doc.rect(margin, yPos - 2, costsTableWidth, 8);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // darkColor RGB
  doc.text('TOTAL A PAGAR:', margin + 2, yPos + 3);
  doc.setTextColor(14, 165, 233); // primaryColor RGB
  doc.text(formatCurrency(billData.total || billData.totalAmount || 0), margin + costsTableWidth - 3, yPos + 3, { align: 'right' });
  doc.setTextColor(15, 23, 42); // darkColor RGB
  
  yPos += 12; // 8 de la caja + 4 de separación (3 enters)

  // ============================================
  // INFORMACIÓN DE PAGO - EN CUERPO PRINCIPAL
  // ============================================
  
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(14, 165, 233); // primaryColor RGB
  doc.roundedRect(margin, yPos, pageWidth - (2 * margin), 28, 2, 2, 'FD');
  
  yPos += 4;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // darkColor RGB
  doc.text('INSTRUCCIONES DE PAGO:', margin + 3, yPos + 3);
  
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Información en dos columnas
  const col1Width = margin + 50;
  const col2Width = margin + 110;
  
  // Primera columna
  doc.text('Titular: Gianni Olivari', margin + 3, yPos + 4);
  doc.text('RUT: 12.621.852-4', margin + 3, yPos + 7);
  doc.text('Banco: Santander', margin + 3, yPos + 10);
  
  // Segunda columna
  doc.text('Cta Corriente: 81816000', col1Width, yPos + 4);
  doc.text('Email: electricidad@lospeumos.cl', col1Width, yPos + 7);
  doc.text('Motivo: MesAño + Numero de Parcela, Ej. Enero2026 Parcela 1', col1Width, yPos + 10);
  yPos += 8;
  
  // Concepto de pago
  yPos += 8;
  
  // Números de página y fecha en la parte inferior
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139); // grayColor RGB
  doc.setFont('helvetica', 'italic');
  const pdfDate = formatDate(new Date(), true);
  doc.text(`Generado: ${pdfDate}`, margin, doc.internal.pageSize.height - 2.5);
  doc.text('LosPeumos © 2025', pageWidth - margin, doc.internal.pageSize.height - 2.5, { align: 'right' });

  return doc;
};

/**
 * Descarga el PDF generado
 * @param {jsPDF} doc - Documento PDF
 * @param {string} filename - Nombre del archivo
 */
export const downloadPDF = (doc, filename) => {
  doc.save(filename);
};

/**
 * Convierte el PDF a Blob para subir a Storage
 * @param {jsPDF} doc - Documento PDF
 * @returns {Blob}
 */
export const pdfToBlob = (doc) => {
  return doc.output('blob');
};

/**
 * Obtiene nombre del mes en español
 */
const getMonthName = (monthIndex) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex - 1] || '';
};

export default {
  generateBillPDF,
  downloadPDF,
  pdfToBlob
};
