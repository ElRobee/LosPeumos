/**
 * Servicio para parsear archivos Excel de boletas de electricidad
 * Extrae lecturas de medidores por parcela
 */

import * as XLSX from 'xlsx';

/**
 * Lee un archivo Excel y extrae lecturas de electricidad
 * @param {File} file - Archivo Excel
 * @returns {Promise<Object>} - Objeto con datos parseados
 */
export const parseElectricityExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Tomar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a JSON manteniendo estructura
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });
        
        // Parsear lecturas
        const result = parseElectricityReadings(jsonData);
        
        resolve(result);
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
 * Parsea las filas del Excel y extrae lecturas de electricidad
 * @param {Array} rows - Filas del Excel
 * @returns {Object} - Datos parseados
 */
const parseElectricityReadings = (rows) => {
  const readings = [];
  const errors = [];
  let globalBillData = null;
  
  // Buscar datos de la boleta global en las primeras filas
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    const firstCell = (row[0] || '').toString().toLowerCase();
    
    // Buscar N° Boleta
    if (firstCell.includes('boleta') || firstCell.includes('n°')) {
      globalBillData = globalBillData || {};
      globalBillData.billNumber = extractValue(row, 1) || extractValue(row, 2);
    }
    
    // Buscar Consumo General
    if (firstCell.includes('consumo') && firstCell.includes('general')) {
      globalBillData = globalBillData || {};
      globalBillData.totalConsumption = parseNumber(extractValue(row, 1) || extractValue(row, 2));
    }
    
    // Buscar Total a Pagar
    if (firstCell.includes('total') && (firstCell.includes('pagar') || firstCell.includes('chilquinta'))) {
      globalBillData = globalBillData || {};
      globalBillData.totalAmount = parseAmount(extractValue(row, 1) || extractValue(row, 2));
    }
    
    // Buscar Fecha Vencimiento
    if (firstCell.includes('vencimiento') || firstCell.includes('fecha')) {
      globalBillData = globalBillData || {};
      const dateValue = extractValue(row, 1) || extractValue(row, 2);
      globalBillData.dueDate = parseDate(dateValue);
    }
    
    // Buscar Valor KW Real
    if (firstCell.includes('valor') && firstCell.includes('real')) {
      globalBillData = globalBillData || {};
      globalBillData.realKwRate = parseAmount(extractValue(row, 1) || extractValue(row, 2));
    }
    
    // Buscar Valor KW Aplicado
    if (firstCell.includes('valor') && firstCell.includes('kw') && !firstCell.includes('real')) {
      globalBillData = globalBillData || {};
      globalBillData.appliedKwRate = parseAmount(extractValue(row, 1) || extractValue(row, 2));
    }
  }
  
  // Buscar la fila de encabezados de lecturas
  let headerRow = -1;
  const possibleHeaders = ['parcela', 'casa', 'house', 'lectura', 'anterior', 'actual', 'consumo'];
  
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    const rowText = row.join('|').toLowerCase();
    
    if (possibleHeaders.some(h => rowText.includes(h))) {
      headerRow = i;
      break;
    }
  }
  
  if (headerRow === -1) {
    return { readings: [], errors: ['No se encontró la fila de encabezados de lecturas'], globalBillData };
  }
  
  const headers = rows[headerRow].map(h => (h || '').toString().toLowerCase().trim());
  
  // Identificar índices de columnas según tu formato exacto
  // Nombre | Parcela | Consumo Anterior | Consumo Actual | KW Consumo | Valor Neto | Cargo Fijo | Total
  const nombreIndex = headers.findIndex(h => h.includes('nombre'));
  const parcelaIndex = headers.findIndex(h => 
    h.includes('parcela') || h.includes('casa') || h.includes('house')
  );
  const anteriorIndex = headers.findIndex(h => 
    (h.includes('consumo') && h.includes('anterior')) || h.includes('anterior')
  );
  const actualIndex = headers.findIndex(h => 
    (h.includes('consumo') && h.includes('actual')) || (h.includes('actual') && !h.includes('anterior'))
  );
  const consumoIndex = headers.findIndex(h => 
    h.includes('kw') && h.includes('consumo')
  );
  
  console.log('📊 Índices detectados:', {
    nombre: nombreIndex,
    parcela: parcelaIndex,
    anterior: anteriorIndex,
    actual: actualIndex,
    consumo: consumoIndex,
    headers
  });
  
  // Procesar filas de datos
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    
    if (!row || row.length === 0) continue;
    
    // Detectar fila de totales y saltar
    const firstCell = (row[0] || '').toString().toLowerCase();
    if (firstCell === '' && row.some(cell => {
      const str = (cell || '').toString();
      return str.includes('8951') || str.includes('2.604.741') || str.includes('2.724.741');
    })) {
      break; // Es la fila de totales, terminar
    }
    
    try {
      const parcelaValue = row[parcelaIndex >= 0 ? parcelaIndex : 1];
      if (!parcelaValue) continue;
      
      const parcelaStr = parcelaValue.toString().trim();
      
      // Construir houseNumber completo (con letra si aplica)
      let houseNumber = null;
      
      if (parcelaStr.toUpperCase() === 'PORTON' || parcelaStr.toUpperCase() === 'PORTÓN') {
        houseNumber = '0'; // Portón como string "0"
      } else {
        const letterMatch = parcelaStr.match(/^(\d+)([A-Z])$/i);
        if (letterMatch) {
          // Tiene letra: 6A, 6B, 18A, etc.
          houseNumber = letterMatch[1] + letterMatch[2].toUpperCase(); // "6A", "6B", etc.
        } else {
          // Solo número: 4, 7, 10, etc.
          const numMatch = parcelaStr.match(/(\d+)/);
          if (numMatch) {
            houseNumber = numMatch[1]; // "4", "7", "10", etc.
          }
        }
      }
      
      if (houseNumber === null) continue;
      
      const reading = {
        houseNumber: houseNumber, // "6A", "6B", "4", "0", etc.
        parcelaDisplay: parcelaStr,
        previousReading: parseNumber(row[anteriorIndex >= 0 ? anteriorIndex : 2]),
        currentReading: parseNumber(row[actualIndex >= 0 ? actualIndex : 3]),
        consumption: consumoIndex >= 0 ? parseNumber(row[consumoIndex]) : null,
        rawRow: row
      };
      
      // Calcular consumo si no está presente
      if (!reading.consumption && reading.previousReading !== null && reading.currentReading !== null) {
        reading.consumption = reading.currentReading - reading.previousReading;
      }
      
      // Si no hay consumo o es 0, establecer en 0 (se cobrará solo cargo fijo)
      if (reading.consumption === null || reading.consumption === 0) {
        reading.consumption = 0;
      }
      
      // Validación: solo alertar si consumo es negativo
      if (reading.consumption < 0) {
        errors.push(`Parcela ${parcelaStr}: Consumo negativo (${reading.consumption})`);
      }
      
      // Agregar todas las lecturas, incluso con consumo 0
      readings.push(reading);
    } catch (error) {
      errors.push(`Fila ${i + 1}: ${error.message}`);
    }
  }
  
  return {
    readings,
    errors,
    globalBillData,
    summary: {
      totalReadings: readings.length,
      totalErrors: errors.length,
      totalConsumption: readings.reduce((sum, r) => sum + (r.consumption || 0), 0)
    }
  };
};

/**
 * Extrae el número de parcela del texto
 */
const extractHouseNumber = (value) => {
  if (!value) return null;
  
  const str = value.toString().trim().toUpperCase();
  
  // Casos especiales
  if (str === 'PORTON' || str === 'PORTÓN') return 0;
  
  // Si es solo un número, devolverlo
  if (/^\d+$/.test(str)) {
    return parseInt(str);
  }
  
  // Formato con letra: 6A, 6B, 18A, 20A, 26A, etc. (retornar solo el número)
  const letterMatch = str.match(/^(\d+)[A-Z]$/);
  if (letterMatch) {
    return parseInt(letterMatch[1]);
  }
  
  // Buscar cualquier número en el texto
  const match = str.match(/(\d+)/);
  if (match) {
    return parseInt(match[1]);
  }
  
  return null;
};

/**
 * Extrae un valor de una celda (puede estar en diferentes posiciones)
 */
const extractValue = (row, ...indices) => {
  for (const index of indices) {
    if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
      return row[index];
    }
  }
  return null;
};

/**
 * Parsea un número (maneja diferentes formatos)
 */
const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  
  const str = value.toString().trim();
  if (str === '') return null;
  
  // Remover separadores de miles y convertir
  const cleaned = str.replace(/[.,]/g, (match, offset, string) => {
    // Si es el último punto/coma, es decimal
    const lastDotIndex = string.lastIndexOf('.');
    const lastCommaIndex = string.lastIndexOf(',');
    const lastSeparatorIndex = Math.max(lastDotIndex, lastCommaIndex);
    
    return offset === lastSeparatorIndex ? '.' : '';
  });
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

/**
 * Parsea un monto (maneja formato chileno: $2.608.666 o 2.608.666)
 */
const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  
  const str = value.toString().trim()
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remover separadores de miles
    .replace(',', '.'); // Convertir coma decimal a punto
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

/**
 * Parsea una fecha (maneja diferentes formatos)
 */
const parseDate = (value) => {
  if (!value) return null;
  
  const str = value.toString().trim();
  
  // Si ya está en formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  
  // Formato DD-MM-YYYY o DD/MM/YYYY
  const match = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Formato con nombre de mes: "22-sept" o "22 septiembre"
  const monthMatch = str.match(/(\d{1,2})[-\s](ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i);
  if (monthMatch) {
    const [, day, monthName] = monthMatch;
    const months = {
      'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12'
    };
    const month = months[monthName.toLowerCase().substring(0, 3)];
    const year = new Date().getFullYear(); // Asumir año actual
    return `${year}-${month}-${day.padStart(2, '0')}`;
  }
  
  // Intentar parsear con Date
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignorar error
  }
  
  return null;
};
