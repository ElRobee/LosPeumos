import { useState, useEffect } from 'react';
import { FileSpreadsheet, Upload, CheckCircle2, XCircle, AlertCircle, Download, Receipt, Search, MessageCircle, AlertTriangle, FileText } from 'lucide-react';
import { parseExcelFile, validateExcelFile } from '../services/excelParser';
import { matchTransactionsToBills, isSafeAutoMatch } from '../services/paymentMatcher';
import { extractTransactionsFromPDF, parseBankStatement, formatTransactionsForSystem } from '../services/pdfParser';
import { collection, query, where, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

export default function Pagos() {
  const [activeTab, setActiveTab] = useState('excel'); // excel, manual, debtors
  const [excelFile, setExcelFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [pendingBills, setPendingBills] = useState([]);
  const [pendingProofs, setPendingProofs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('upload'); // upload, preview, match, confirm
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalMatches: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    noMatch: 0
  });

  // Estados para registro manual de pagos
  const [allBills, setAllBills] = useState([]);
  const [houses, setHouses] = useState([]);
  const [selectedManualMonth, setSelectedManualMonth] = useState(() => {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0');
  });
  const [selectedManualYear, setSelectedManualYear] = useState(() => {
    const today = new Date();
    return today.getFullYear().toString();
  });
  const [selectedHouseFilter, setSelectedHouseFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [markedPayments, setMarkedPayments] = useState(new Set());

  // Estados para Deudores
  const [selectedDebtorHouse, setSelectedDebtorHouse] = useState('all');
  const [debtorSearchTerm, setDebtorSearchTerm] = useState('');

  // Cargar boletas pendientes y comprobantes sin validar
  useEffect(() => {
    loadPendingData();
    loadManualPaymentData();
  }, []);

  const loadPendingData = async () => {
    try {
      setLoading(true);
      
      // Boletas pendientes
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('status', '==', 'pending')
      );
      const billsSnapshot = await getDocs(billsQuery);
      const billsData = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingBills(billsData);
      
      // Comprobantes sin validar
      const proofsQuery = query(
        collection(firestore, 'payments'),
        where('validated', '==', false)
      );
      const proofsSnapshot = await getDocs(proofsQuery);
      const proofsData = proofsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingProofs(proofsData);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadManualPaymentData = async () => {
    try {
      // Cargar todas las boletas
      const billsQuery = query(collection(firestore, 'bills'));
      const billsSnapshot = await getDocs(billsQuery);
      const billsData = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllBills(billsData);
      
      // Cargar casas (incluyendo house0)
      const housesQuery = query(collection(firestore, 'houses'));
      const housesSnapshot = await getDocs(housesQuery);
      
      // Cargar usuarios para obtener teléfonos actualizados
      const usersQuery = query(collection(firestore, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersMap = {};
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.houseId) {
          usersMap[userData.houseId] = userData;
        }
      });
      
      const housesData = housesSnapshot.docs
        .map(doc => {
          const houseData = {
            id: doc.id,
            ...doc.data()
          };
          // Enriquecer con teléfono del usuario si existe
          const userForHouse = usersMap[doc.id];
          if (userForHouse && userForHouse.phone) {
            houseData.phone = userForHouse.phone;
          }
          return houseData;
        })
        .sort((a, b) => {
          const numA = parseInt(a.id.replace('house', '')) || 0;
          const numB = parseInt(b.id.replace('house', '')) || 0;
          return numA - numB;
        });
      setHouses(housesData);
    } catch (err) {
      console.error('Error al cargar datos de pagos manuales:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea Excel o PDF
      const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      const isPDF = file.name.toLowerCase().endsWith('.pdf');
      
      if (!isExcel && !isPDF) {
        setError('El archivo debe ser formato Excel (.xls o .xlsx) o PDF');
        return;
      }
      
      // Para Excel, usar validación existente
      if (isExcel) {
        const validation = validateExcelFile(file);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
      }
      
      setExcelFile(file);
      setError('');
    }
  };

  const handleParseExcel = async () => {
    if (!excelFile) {
      setError('Selecciona un archivo (Excel o PDF)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      let parsedTransactions = [];
      
      // Detectar tipo de archivo
      if (excelFile.name.toLowerCase().endsWith('.pdf')) {
        // Procesar PDF
        parsedTransactions = await handleParsePDF(excelFile);
      } else {
        // Procesar Excel
        parsedTransactions = await parseExcelFile(excelFile);
      }
      
      if (parsedTransactions.length === 0) {
        setError('No se encontraron transacciones en el archivo');
        return;
      }
      
      setTransactions(parsedTransactions);
      setStep('preview');
      
    } catch (err) {
      console.error('Error al procesar archivo:', err);
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleParsePDF = async (file) => {
    // Leer archivo como ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Usar pdfjs-dist v3
      const pdf = await pdfjsLib.getDocument({ 
        data: new Uint8Array(arrayBuffer), 
        password: '12621852' 
      }).promise;
      
      let fullText = '';
      
      // Extraer texto de todas las páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      // Parsear transacciones
      const transactions = parseBankStatement(fullText);
      return formatTransactionsForSystem(transactions);
      
    } catch (err) {
      console.warn('Error con pdfjs:', err.message);
      
      // Estrategia alternativa: mostrar advertencia y permitir entrada manual
      throw new Error(
        'No se pudo procesar el PDF automáticamente. Por favor, convierte el PDF a Excel y sube el archivo Excel. ' +
        'Error: ' + err.message
      );
    }
  };

  const handleAutoMatch = () => {
    if (transactions.length === 0 || pendingBills.length === 0) {
      setError('No hay transacciones o boletas para hacer matching');
      return;
    }

    const matchResults = matchTransactionsToBills(transactions, pendingBills);
    setMatches(matchResults);
    
    // Calcular estadísticas
    const stats = {
      totalTransactions: transactions.length,
      totalMatches: matchResults.filter(m => m.bill !== null).length,
      highConfidence: matchResults.filter(m => m.status === 'high-confidence').length,
      mediumConfidence: matchResults.filter(m => m.status === 'medium-confidence').length,
      lowConfidence: matchResults.filter(m => m.status === 'low-confidence').length,
      noMatch: matchResults.filter(m => m.status === 'no-match').length
    };
    setStats(stats);
    
    setStep('match');
  };

  const handleConfirmMatch = async (match) => {
    try {
      setLoading(true);
      
      // Actualizar estado de la boleta a 'paid'
      await updateDoc(doc(firestore, 'bills', match.bill.id), {
        status: 'paid',
        paidAt: new Date(),
        paidAmount: match.transaction.amount,
        paidMethod: 'Transferencia',
        reconciliationDate: new Date()
      });
      
      // Crear registro de pago
      await addDoc(collection(firestore, 'payments'), {
        billId: match.bill.id,
        houseId: match.bill.houseId,
        amount: match.transaction.amount,
        date: match.transaction.date || new Date(),
        method: 'Transferencia',
        description: match.transaction.description,
        reference: match.transaction.reference,
        validated: true,
        validatedAt: new Date(),
        validatedBy: 'admin', // TODO: usar auth.currentUser
        matchScore: match.score,
        autoMatched: true
      });
      
      // Recargar datos y remover match de la lista
      await loadPendingData();
      setMatches(matches.filter(m => m.billIndex !== match.billIndex));
      
      setError('');
    } catch (err) {
      console.error('Error al confirmar match:', err);
      setError('Error al confirmar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMatch = (match) => {
    // Solo remover de la lista visual
    setMatches(matches.filter(m => m.transactionIndex !== match.transactionIndex));
  };

  const handleValidateProof = async (proof, approved) => {
    try {
      setLoading(true);
      
      if (approved) {
        // Actualizar pago como validado
        await updateDoc(doc(firestore, 'payments', proof.id), {
          validated: true,
          validatedAt: new Date(),
          validatedBy: 'admin' // TODO: usar auth.currentUser
        });
        
        // Actualizar boleta a 'paid'
        await updateDoc(doc(firestore, 'bills', proof.billId), {
          status: 'paid',
          paidAt: proof.date,
          paidAmount: proof.amount,
          paidMethod: proof.method
        });
      } else {
        // Marcar pago como rechazado
        await updateDoc(doc(firestore, 'payments', proof.id), {
          validated: false,
          rejected: true,
          rejectedAt: new Date(),
          rejectedBy: 'admin'
        });
      }
      
      // Recargar datos
      await loadPendingData();
      setError('');
      
    } catch (err) {
      console.error('Error al validar comprobante:', err);
      setError('Error al validar el comprobante');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'high-confidence': return 'text-green-400 bg-green-900/30';
      case 'medium-confidence': return 'text-yellow-400 bg-yellow-900/30';
      case 'low-confidence': return 'text-orange-400 bg-orange-900/30';
      case 'no-match': return 'text-red-400 bg-red-900/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-gray-900/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'high-confidence': return 'Alta Confianza';
      case 'medium-confidence': return 'Media Confianza';
      case 'low-confidence': return 'Baja Confianza';
      case 'no-match': return 'Sin Match';
      default: return status;
    }
  };

  const togglePaymentMark = (billId) => {
    const newMarked = new Set(markedPayments);
    if (newMarked.has(billId)) {
      newMarked.delete(billId);
    } else {
      newMarked.add(billId);
    }
    setMarkedPayments(newMarked);
  };

  const handleMarkPayments = async () => {
    if (markedPayments.size === 0) {
      setError('Selecciona al menos una boleta para marcar como pagada');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Actualizar estado de boletas a pagadas
      for (const billId of markedPayments) {
        await updateDoc(doc(firestore, 'bills', billId), {
          status: 'paid',
          paidAt: new Date()
        });
      }

      // Limpiar selección
      setMarkedPayments(new Set());
      
      // Recargar datos
      await loadManualPaymentData();
      
      // Mostrar confirmación
      alert(`${markedPayments.size} boleta(s) marcada(s) como pagada(s)`);
    } catch (err) {
      console.error('Error al marcar pagos:', err);
      setError('Error al marcar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBills = () => {
    const year = parseInt(selectedManualYear);
    const month = selectedManualMonth ? parseInt(selectedManualMonth) : null;
    
    return allBills
      .filter(bill => {
        // Filtrar por año
        if (bill.year !== year) {
          return false;
        }
        
        // Filtrar por mes si está especificado
        if (month && bill.month !== month) {
          return false;
        }
        
        // Filtrar por casa
        if (selectedHouseFilter !== 'all' && bill.houseId !== selectedHouseFilter) {
          return false;
        }
        
        // Filtrar por búsqueda
        if (searchTerm && !bill.houseId.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const numA = parseInt(a.houseId.replace('house', '')) || 0;
        const numB = parseInt(b.houseId.replace('house', '')) || 0;
        return numA - numB;
      });
  };

  const getAvailableHousesForMonth = () => {
    const year = parseInt(selectedManualYear);
    const month = selectedManualMonth ? parseInt(selectedManualMonth) : null;
    
    // Obtener IDs de casas que tienen boletas en este año (o mes/año si está especificado)
    const housesWithBills = new Set(
      allBills
        .filter(bill => {
          if (bill.year !== year) return false;
          if (month && bill.month !== month) return false;
          return true;
        })
        .map(bill => bill.houseId)
    );
    
    // Retornar solo las casas que tienen boletas
    return houses.filter(house => housesWithBills.has(house.id));
  };

  const getPendingBillsByHouse = (houseId) => {
    return allBills
      .filter(bill => {
        if (bill.status !== 'pending' && bill.status !== 'partial') return false;
        if (houseId !== 'all' && bill.houseId !== houseId) return false;
        if (debtorSearchTerm && !bill.houseId.toLowerCase().includes(debtorSearchTerm.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        // Ordenar por año descendente, luego por mes descendente
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  };

  const getDebtorHouses = () => {
    // Obtener casas que tienen al menos una boleta pendiente
    const housesWithDebts = new Set(
      allBills
        .filter(bill => bill.status === 'pending' || bill.status === 'partial')
        .map(bill => bill.houseId)
    );
    
    return houses.filter(house => housesWithDebts.has(house.id));
  };

  const getTotalDebtByHouse = (houseId) => {
    return getPendingBillsByHouse(houseId).reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  };

  const handleSendWhatsApp = (house, bills) => {
    if (!house.phone) {
      setError('La parcela no tiene número de teléfono registrado');
      return;
    }

    const totalDebt = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const billsDetail = bills
      .map(bill => `• ${bill.month}/${bill.year}: $${bill.totalAmount?.toLocaleString('es-CL')}`)
      .join('\n');

    const message = encodeURIComponent(
      `Hola ${house.ownerName || 'Estimado/a'}:\n\n` +
      `Tienes las siguientes boletas pendientes de pago Electricidad:\n\n` +
      `${billsDetail}\n\n` +
      `*Total Pendiente: $${totalDebt.toLocaleString('es-CL')}*\n\n` +
      `Por favor, realiza el pago a la brevedad posible.\n\n` +
      `Datos para el pago:\n` +
        `Titular: Gianni Olivari\n` +
        `RUT: 12.621.852-4\n` +
        `Banco: Santander\n` +
        `Cta Corriente: 81816000\n` +
        `Email: electricidad@lospeumos.cl\n` +
        `Motivo: MesAño + Numero de Parcela, Ej. Enero2026 Parcela 1.\n\n` +
      `Muchas Gracias.`
    );

    const whatsappUrl = `https://wa.me/56${house.phone.replace(/\D/g, '').slice(-9)}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Conciliación de Pagos</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Carga cartolas bancarias y valida comprobantes de pago
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('excel')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'excel'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <FileSpreadsheet className="inline w-5 h-5 mr-2" />
          Cartola Bancaria
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'manual'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <Receipt className="inline w-5 h-5 mr-2" />
          Registro Manual
        </button>
        <button
          onClick={() => setActiveTab('debtors')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'debtors'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <AlertTriangle className="inline w-5 h-5 mr-2" />
          Deudores
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Tab: Cartola Bancaria */}
      {activeTab === 'excel' && (
        <div className="space-y-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">1. Cargar Cartola Bancaria</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Sube el archivo Excel (.xls, .xlsx) o PDF protegido con contraseña (se descifrará automáticamente)
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Excel Upload */}
                <div className="border-2 border-dashed border-blue-500 rounded-lg p-6 text-center hover:border-blue-400 transition">
                  <FileSpreadsheet className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Archivo Excel</p>
                  <input
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label
                    htmlFor="excel-upload"
                    className="cursor-pointer text-blue-400 hover:text-blue-300 font-medium text-sm"
                  >
                    Seleccionar Excel
                  </label>
                </div>

                {/* PDF Upload */}
                <div className="border-2 border-dashed border-red-500 rounded-lg p-6 text-center hover:border-red-400 transition">
                  <FileText className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cartola PDF</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer text-red-400 hover:text-red-300 font-medium text-sm"
                  >
                    Seleccionar PDF
                  </label>
                </div>
              </div>

              {excelFile && (
                <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    ✓ Archivo cargado: <span className="font-medium">{excelFile.name}</span>
                  </p>
                </div>
              )}
              
              <button
                onClick={handleParseExcel}
                disabled={!excelFile || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Procesando...' : 'Procesar Cartola'}
              </button>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">2. Transacciones Encontradas</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{transactions.length} transacciones detectadas</p>
                </div>
                <button
                  onClick={() => {
                    setStep('upload');
                    setTransactions([]);
                    setExcelFile(null);
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
                >
                  Cambiar archivo
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Fecha</th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Monto</th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Descripción</th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((trans, idx) => (
                      <tr key={idx} className="border-b border-slate-200 dark:border-slate-700/50">
                        <td className="p-2 text-sm text-slate-700 dark:text-slate-300">
                          {trans.date ? trans.date.toLocaleDateString('es-CL') : '-'}
                        </td>
                        <td className="p-2 text-sm text-green-400 font-medium">
                          ${trans.amount.toLocaleString('es-CL')}
                        </td>
                        <td className="p-2 text-sm text-slate-600 dark:text-slate-400">
                          {trans.description.substring(0, 50)}...
                        </td>
                        <td className="p-2 text-sm text-gray-500">
                          {trans.reference || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    ... y {transactions.length - 10} transacciones más
                  </p>
                )}
              </div>
              
              <button
                onClick={handleAutoMatch}
                disabled={pendingBills.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Hacer Matching Automático
              </button>
              
              {pendingBills.length === 0 && (
                <p className="text-sm text-yellow-400 text-center">
                  No hay boletas pendientes para hacer matching
                </p>
              )}
            </div>
          )}

          {/* Step 3: Matches */}
          {step === 'match' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTransactions}</p>
                </div>
                <div className="bg-green-900/30 rounded-lg p-4">
                  <p className="text-sm text-green-400">Alta</p>
                  <p className="text-2xl font-bold text-green-400">{stats.highConfidence}</p>
                </div>
                <div className="bg-yellow-900/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">Media</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.mediumConfidence}</p>
                </div>
                <div className="bg-orange-900/30 rounded-lg p-4">
                  <p className="text-sm text-orange-400">Baja</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.lowConfidence}</p>
                </div>
                <div className="bg-red-900/30 rounded-lg p-4">
                  <p className="text-sm text-red-400">Sin Match</p>
                  <p className="text-2xl font-bold text-red-400">{stats.noMatch}</p>
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-3">
                {matches.map((match, idx) => (
                  <div key={idx} className="card p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Transaction */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">TRANSACCIÓN</p>
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-bold text-green-400">
                              ${match.transaction.amount.toLocaleString('es-CL')}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {match.transaction.date?.toLocaleDateString('es-CL')}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {match.transaction.description}
                          </p>
                        </div>

                        {/* Bill */}
                        {match.bill ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">BOLETA</p>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-bold text-blue-400">
                                ${match.bill.totalAmount?.toLocaleString('es-CL')}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {match.bill.houseId} - {match.bill.month}/{match.bill.year}
                              </p>
                            </div>
                            <div className="mt-2 space-y-1">
                              {match.matchReasons.map((reason, i) => (
                                <p key={i} className="text-xs text-gray-500">
                                  {reason}
                                </p>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-red-400">No se encontró boleta correspondiente</p>
                        )}
                      </div>

                      {/* Score & Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                          {getStatusLabel(match.status)} ({match.score}%)
                        </span>
                        
                        {match.bill && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleConfirmMatch(match)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleRejectMatch(match)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setStep('upload');
                  setTransactions([]);
                  setMatches([]);
                  setExcelFile(null);
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Procesar Nueva Cartola
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Registro Manual de Pagos */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Marcar Pagos Manuales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Selector de año */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Año
                </label>
                <select
                  value={selectedManualYear}
                  onChange={(e) => setSelectedManualYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de mes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Mes (Opcional)
                </label>
                <select
                  value={selectedManualMonth}
                  onChange={(e) => setSelectedManualMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Todos los meses</option>
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, idx) => (
                    <option key={idx + 1} value={(idx + 1).toString().padStart(2, '0')}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de parcela */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Parcela
                </label>
                <select
                  value={selectedHouseFilter}
                  onChange={(e) => setSelectedHouseFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">Todas las parcelas</option>
                  {getAvailableHousesForMonth().map(house => (
                    <option key={house.id} value={house.id}>
                      Parcela {house.id.replace('house', '')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Parcela..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Boletas */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Boletas Disponibles
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {getFilteredBills().length} boleta{getFilteredBills().length !== 1 ? 's' : ''} encontrada{getFilteredBills().length !== 1 ? 's' : ''}
                </p>
              </div>
              {markedPayments.size > 0 && (
                <span className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {markedPayments.size} seleccionada{markedPayments.size !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {getFilteredBills().length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  No hay boletas para el período seleccionado
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const newMarked = new Set(markedPayments);
                            if (e.target.checked) {
                              getFilteredBills().forEach(bill => newMarked.add(bill.id));
                            } else {
                              getFilteredBills().forEach(bill => newMarked.delete(bill.id));
                            }
                            setMarkedPayments(newMarked);
                          }}
                          checked={getFilteredBills().length > 0 && getFilteredBills().every(bill => markedPayments.has(bill.id))}
                          className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Parcela</th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Mes</th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Monto</th>
                      <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredBills().map(bill => (
                      <tr key={bill.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={markedPayments.has(bill.id)}
                            onChange={() => togglePaymentMark(bill.id)}
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-2 text-slate-900 dark:text-white font-medium">
                          Parcela {bill.houseId?.replace('house', '')}
                        </td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">
                          {bill.month}/{bill.year}
                        </td>
                        <td className="p-2 text-green-600 dark:text-green-400 font-medium">
                          ${bill.totalAmount?.toLocaleString('es-CL')}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bill.status === 'paid'
                              ? 'text-green-400 bg-green-900/30'
                              : bill.status === 'pending'
                              ? 'text-yellow-400 bg-yellow-900/30'
                              : 'text-slate-400 bg-slate-900/30'
                          }`}>
                            {bill.status === 'paid' ? 'Pagada' : bill.status === 'pending' ? 'Pendiente' : bill.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {markedPayments.size > 0 && (
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setMarkedPayments(new Set())}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Limpiar Selección
                </button>
                <button
                  onClick={handleMarkPayments}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Marcar {markedPayments.size} como Pagada{markedPayments.size !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Deudores */}
      {activeTab === 'debtors' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reporte de Deudores</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de parcela */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Parcela
                </label>
                <select
                  value={selectedDebtorHouse}
                  onChange={(e) => setSelectedDebtorHouse(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">Todas las parcelas</option>
                  {getDebtorHouses().map(house => (
                    <option key={house.id} value={house.id}>
                      Parcela {house.id.replace('house', '')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Parcela..."
                    value={debtorSearchTerm}
                    onChange={(e) => setDebtorSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Listado de Deudores */}
          {selectedDebtorHouse === 'all' ? (
            // Vista general por parcela
            <div className="space-y-4">
              {getDebtorHouses().length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-white mb-2">
                    No hay deudores
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Todas las parcelas tienen sus boletas al día
                  </p>
                </div>
              ) : (
                getDebtorHouses().map(house => {
                  const bills = getPendingBillsByHouse(house.id);
                  const totalDebt = getTotalDebtByHouse(house.id);
                  
                  if (debtorSearchTerm && !house.id.toLowerCase().includes(debtorSearchTerm.toLowerCase())) {
                    return null;
                  }

                  return (
                    <div key={house.id} className="card p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Parcela {house.id.replace('house', '')} - {house.ownerName}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Teléfono: {house.phone || 'No registrado'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-600 dark:text-slate-400">Total Adeudado</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            ${totalDebt.toLocaleString('es-CL')}
                          </p>
                        </div>
                      </div>

                      {/* Tabla de boletas */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                              <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Mes</th>
                              <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Consumo</th>
                              <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Monto</th>
                              <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bills.map(bill => (
                              <tr key={bill.id} className="border-b border-slate-200 dark:border-slate-700/50">
                                <td className="p-2 text-slate-900 dark:text-white font-medium">
                                  {bill.month}/{bill.year}
                                </td>
                                <td className="p-2 text-slate-600 dark:text-slate-400">
                                  {bill.consumption ? `${bill.consumption} kW` : '-'}
                                </td>
                                <td className="p-2 text-red-600 dark:text-red-400 font-medium">
                                  ${bill.totalAmount?.toLocaleString('es-CL')}
                                </td>
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    bill.status === 'pending'
                                      ? 'text-yellow-400 bg-yellow-900/30'
                                      : 'text-orange-400 bg-orange-900/30'
                                  }`}>
                                    {bill.status === 'pending' ? 'Pendiente' : 'Parcial'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Botón WhatsApp */}
                      <button
                        onClick={() => handleSendWhatsApp(house, bills)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Enviar Recordatorio por WhatsApp
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Vista detallada de una parcela específica
            (() => {
              const house = houses.find(h => h.id === selectedDebtorHouse);
              const bills = getPendingBillsByHouse(selectedDebtorHouse);
              const totalDebt = getTotalDebtByHouse(selectedDebtorHouse);

              if (!house) return null;

              if (bills.length === 0) {
                return (
                  <div className="card p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-semibold text-white mb-2">
                      Parcela al día
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Parcela {house.id.replace('house', '')} no tiene deudas pendientes
                    </p>
                  </div>
                );
              }

              return (
                <div className="card p-6 space-y-4">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Parcela {house.id.replace('house', '')}
                      </h3>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        {house.ownerName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Teléfono: {house.phone || 'No registrado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Adeudado</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        ${totalDebt.toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>

                  {/* Tabla detallada */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                          <th className="text-left text-slate-700 dark:text-slate-300 font-bold p-3">Mes</th>
                          <th className="text-left text-slate-700 dark:text-slate-300 font-bold p-3">Consumo</th>
                          <th className="text-right text-slate-700 dark:text-slate-300 font-bold p-3">Total</th>
                          <th className="text-left text-slate-700 dark:text-slate-300 font-bold p-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bills.map(bill => (
                          <tr key={bill.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="p-3 text-slate-900 dark:text-white font-medium">
                              {bill.month}/{bill.year}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {bill.consumption ? `${bill.consumption} kW` : '-'}
                            </td>
                            <td className="p-3 text-right text-red-600 dark:text-red-400 font-bold">
                              ${bill.totalAmount?.toLocaleString('es-CL')}
                            </td>
                            <td className="p-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                bill.status === 'pending'
                                  ? 'text-yellow-400 bg-yellow-900/30'
                                  : 'text-orange-400 bg-orange-900/30'
                              }`}>
                                {bill.status === 'pending' ? 'Pendiente' : 'Parcial'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                          <td colSpan="2" className="p-3 text-right font-bold text-slate-900 dark:text-white">
                            TOTAL ADEUDADO:
                          </td>
                          <td className="p-3 text-right text-2xl font-bold text-red-600 dark:text-red-400">
                            ${totalDebt.toLocaleString('es-CL')}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Botón WhatsApp */}
                  <button
                    onClick={() => handleSendWhatsApp(house, bills)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 mt-6"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar Recordatorio por WhatsApp
                  </button>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}

