/**
 * Servicio para parsear archivos Excel (cartolas bancarias)
 * Extrae transacciones con monto, fecha, referencia
 */

import * as XLSX from 'xlsx';

/**
 * Lee un archivo Excel y extrae transacciones
 * @param {File} file - Archivo Excel
 * @returns {Promise<Array>} - Array de transacciones
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Parsear transacciones
        const transactions = parseTransactions(jsonData);
        
        resolve(transactions);
      } catch (error) {
        reject(new Error(`Error al parsear Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parsea las filas del Excel y extrae transacciones
 * Asume formato estándar de cartola bancaria chilena
 * @param {Array} rows - Filas del Excel
 * @returns {Array} - Transacciones parseadas
 */
const parseTransactions = (rows) => {
  const transactions = [];
  
  // Buscar la fila de encabezados (puede variar según banco)
  let headerRow = -1;
  const possibleHeaders = ['fecha', 'monto', 'descripcion', 'referencia', 'abono', 'cargo'];
  
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const rowText = row.join('|').toLowerCase();
    
    if (possibleHeaders.some(h => rowText.includes(h))) {
      headerRow = i;
      break;
    }
  }
  
  if (headerRow === -1) {
    // Si no encuentra encabezados, asumir formato: Fecha | Descripción | Monto
    headerRow = 0;
  }
  
  const headers = rows[headerRow].map(h => (h || '').toString().toLowerCase());
  
  // Identificar índices de columnas
  const dateIndex = headers.findIndex(h => h.includes('fecha'));
  const amountIndex = headers.findIndex(h => h.includes('monto') || h.includes('abono'));
  const descIndex = headers.findIndex(h => h.includes('descripcion') || h.includes('detalle') || h.includes('glosa'));
  const refIndex = headers.findIndex(h => h.includes('referencia') || h.includes('ref'));
  
  // Procesar filas de datos
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    
    if (!row || row.length === 0 || !row[0]) continue;
    
    try {
      const transaction = {
        date: parseDate(row[dateIndex >= 0 ? dateIndex : 0]),
        amount: parseAmount(row[amountIndex >= 0 ? amountIndex : (row.length > 2 ? 2 : 1)]),
        description: row[descIndex >= 0 ? descIndex : 1]?.toString() || '',
        reference: row[refIndex >= 0 ? refIndex : -1]?.toString() || '',
        rawRow: row
      };
      
      // Validar que tenga monto válido
      if (transaction.amount && transaction.amount > 0) {
        // Extraer posible referencia de la descripción si no hay columna de referencia
        if (!transaction.reference && transaction.description) {
          const refMatch = transaction.description.match(/BILL-\d{4}-\d{2}-[a-zA-Z0-9]+/i);
          if (refMatch) {
            transaction.reference = refMatch[0];
          }
        }
        
        transactions.push(transaction);
      }
    } catch (error) {
      console.warn(`Error al parsear fila ${i}:`, error);
    }
  }
  
  return transactions;
};

/**
 * Parsea una fecha en varios formatos posibles
 * @param {any} dateValue - Valor de fecha del Excel
 * @returns {Date|null}
 */
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // Si es número (fecha de Excel)
  if (typeof dateValue === 'number') {
    const date = XLSX.SSF.parse_date_code(dateValue);
    return new Date(date.y, date.m - 1, date.d);
  }
  
  // Si es string
  const dateStr = dateValue.toString();
  
  // Formato DD-MM-YYYY o DD/MM/YYYY
  const match = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    return new Date(match[3], match[2] - 1, match[1]);
  }
  
  // Intentar parseo estándar
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Parsea un monto en varios formatos
 * @param {any} amountValue - Valor del monto
 * @returns {number}
 */
const parseAmount = (amountValue) => {
  if (!amountValue) return 0;
  
  if (typeof amountValue === 'number') {
    return Math.abs(amountValue);
  }
  
  // Limpiar string: quitar $, puntos (miles), reemplazar coma por punto (decimales)
  const cleanStr = amountValue
    .toString()
    .replace(/[$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const amount = parseFloat(cleanStr);
  return isNaN(amount) ? 0 : Math.abs(amount);
};

/**
 * Valida que el archivo sea un Excel válido
 * @param {File} file - Archivo a validar
 * @returns {Object} - { valid: boolean, error: string }
 */
export const validateExcelFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No se seleccionó ningún archivo' };
  }
  
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xls|xlsx)$/i)) {
    return { 
      valid: false, 
      error: 'El archivo debe ser formato Excel (.xls o .xlsx)' 
    };
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'El archivo es muy grande. Máximo 10MB' 
    };
  }
  
  return { valid: true };
};

export default {
  parseExcelFile,
  validateExcelFile,
  parseDate,
  parseAmount
};
