/**
 * Parser para extraer datos de cartola bancaria PDF
 * Convierte tabla de transacciones a formato compatible con el sistema
 */

// Expresión regular para detectar transacciones
const TRANSACTION_PATTERN = /(\d{1,2}\/\d{1,2})(?:\s+.+?)?([-+]?\$?[\d.,]+)\s*([-+]?\$?[\d.,]+)/;

/**
 * Extrae transacciones del texto del PDF
 * @param {string} text - Texto extraído del PDF
 * @returns {Array} Array de transacciones
 */
export const extractTransactionsFromPDF = (text) => {
  const transactions = [];
  const lines = text.split('\n');
  
  let currentTransaction = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;
    
    // Detectar línea de fecha y monto
    const match = trimmed.match(/(\d{1,2}\/\d{1,2}).*?([-+]?\$?[\d.,]+)$/);
    
    if (match) {
      // Guardar transacción anterior si existe
      if (currentTransaction && currentTransaction.amount) {
        transactions.push(currentTransaction);
      }
      
      const dateStr = match[1];
      const amountStr = match[2];
      
      currentTransaction = {
        date: dateStr,
        description: trimmed.substring(0, match.index + match[1].length).trim(),
        amount: parseAmount(amountStr),
        rawAmount: amountStr,
        reference: '',
        type: amountStr.includes('-') ? 'egreso' : 'ingreso'
      };
    } else if (currentTransaction && trimmed) {
      // Agregar más información a la descripción
      currentTransaction.description += ' ' + trimmed;
    }
  }
  
  // Agregar última transacción
  if (currentTransaction && currentTransaction.amount) {
    transactions.push(currentTransaction);
  }
  
  return transactions;
};

/**
 * Parsea un monto en formato chileno (ej: $1.234.567,89)
 * @param {string} amountStr - String del monto
 * @returns {number} Monto convertido a número
 */
export const parseAmount = (amountStr) => {
  if (!amountStr) return 0;
  
  // Eliminar símbolo de dólar y espacios
  let cleaned = amountStr.replace(/\$/g, '').trim();
  
  // Detectar si usa punto como separador de miles y coma como decimal
  // Formato chileno: $1.234.567,89
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Formato con puntos como miles y coma como decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.') && !cleaned.includes(',')) {
    // Podría ser 1.234 (miles) o 1.234567 (sin separador)
    const parts = cleaned.split('.');
    if (parts[parts.length - 1].length <= 2) {
      // Es separador decimal
      cleaned = cleaned.replace('.', '.');
    } else {
      // Son separadores de miles, convertir
      cleaned = cleaned.replace(/\./g, '');
    }
  }
  
  const number = parseFloat(cleaned);
  return isNaN(number) ? 0 : number;
};

/**
 * Extrae tabla de transacciones del PDF usando una estrategia simple
 * @param {string} text - Texto extraído del PDF
 * @returns {Array} Array de transacciones ordenadas
 */
export const parseBankStatement = (text) => {
  const transactions = [];
  
  // Dividir por líneas y procesar
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Buscar patrones de fecha (DD/MM)
    const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})/);
    
    if (dateMatch) {
      const [, day, month] = dateMatch;
      
      // Extraer el resto de la línea
      const rest = line.substring(line.indexOf('/') + 3).trim();
      
      // Buscar montos en esta línea
      const amountMatches = rest.match(/([-+]?\$?[\d.,]+)/g);
      
      if (amountMatches && amountMatches.length >= 1) {
        const transaction = {
          date: `${day}/${month}`,
          description: rest.replace(/([-+]?\$?[\d.,]+)/g, '').trim(),
          amount: parseAmount(amountMatches[amountMatches.length - 1]),
          reference: '',
          type: amountMatches[amountMatches.length - 1].includes('-') ? 'egreso' : 'ingreso'
        };
        
        if (transaction.amount !== 0) {
          transactions.push(transaction);
        }
      }
    }
    
    i++;
  }
  
  return transactions;
};

/**
 * Convierte transacciones a formato JSON compatible con el sistema
 * @param {Array} transactions - Array de transacciones extraídas
 * @returns {Array} Array formateado para el sistema
 */
export const formatTransactionsForSystem = (transactions) => {
  return transactions.map((trans, index) => ({
    id: `trans_${Date.now()}_${index}`,
    date: trans.date,
    description: trans.description || 'Transacción bancaria',
    amount: Math.abs(trans.amount),
    type: trans.type,
    reference: trans.reference || '',
    raw: trans.rawAmount || `${trans.amount}`,
    matched: false
  }));
};

/**
 * Detecta automáticamente si el PDF está protegido
 * @param {ArrayBuffer} fileBuffer - Buffer del archivo PDF
 * @returns {boolean} true si está protegido
 */
export const isPDFProtected = (fileBuffer) => {
  // Convertir a string para buscar indicadores de protección
  const view = new Uint8Array(fileBuffer);
  const text = String.fromCharCode.apply(null, view);
  
  // PDFs protegidos tienen ciertos marcadores
  return text.includes('/Encrypt') || text.includes('/P ') || text.includes('/O ');
};
