import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, query, where, orderBy, limit as limitQuery, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { calculateBill, validateReadings, generateDueDate, getCurrentRate, getFixedFee } from '../services/billCalculator';
import { generateBillPDF, pdfToBlob, downloadPDF } from '../services/pdfGenerator';
import { uploadBillPDF } from '../services/storageService';
import { sendNewBillEmail, isEmailConfigured } from '../services/emailService';
import { getNewBillWhatsAppMessage, openWhatsApp, isValidChileanPhone } from '../services/whatsappService';
import { parseElectricityExcel } from '../services/electricityExcelParser';
import { useElectricityRates } from '../hooks/useElectricityRates';
import { Zap, Plus, FileText, Download, Mail, Loader, AlertCircle, CheckCircle, Search, Send, MessageCircle, History, Calendar, TrendingUp, X, Eye, EyeOff, Upload, Printer, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/currencyUtils';
import { getCurrentMonthYear } from '../utils/dateUtils';

const Electricidad = () => {
  const { userData } = useAuth();
  
  // Hook para obtener tarifas desde Firestore
  const { fixedRate, variableRate, loading: ratesLoading } = useElectricityRates();
  
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    previousReading: '',
    currentReading: '',
    month: new Date().getMonth() + 1,  // Mes actual (1-12)
    year: new Date().getFullYear()      // Año actual
  });
  const [calculating, setCalculating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el flujo mejorado
  const [modalStep, setModalStep] = useState('input'); // 'input', 'calculated', 'generated'
  const [calculatedData, setCalculatedData] = useState(null); // Datos calculados antes de generar
  
  // Estados para el modal de historial
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHouseForHistory, setSelectedHouseForHistory] = useState(null);
  const [historyBills, setHistoryBills] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Estado para la boleta global mensual
  const [globalBillData, setGlobalBillData] = useState({
    month: new Date().getMonth() + 1,  // Mes actual
    year: new Date().getFullYear(),    // Año actual
    billNumber: '',           // N° Boleta
    totalConsumption: '',     // Consumo General KW
    totalAmount: '',          // Total a Pagar Chilquinta
    dueDate: '',              // Fecha Vencimiento
    realKwRate: '',           // Valor KW Real
    appliedKwRate: '',        // Valor KW (aplicado a residentes)
    balance: ''               // Saldo a Favor (calculado automáticamente)
  });
  const [showGlobalBillForm, setShowGlobalBillForm] = useState(true);
  const [globalBills, setGlobalBills] = useState([]); // Historial de boletas globales
  
  // Estados para acciones de comunicación
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatedBillData, setGeneratedBillData] = useState(null); // Datos de la boleta recién generada
  
  // Estado para parcelas con medidor (persiste en localStorage)
  const [housesWithMeter, setHousesWithMeter] = useState(() => {
    const saved = localStorage.getItem('electricidad_houses_with_meter');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado para modal de gestión de medidores
  const [showMeterManagementModal, setShowMeterManagementModal] = useState(false);
  const [meterSearchTerm, setMeterSearchTerm] = useState('');

  // Estados para importación de Excel
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importPeriod, setImportPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const fileInputRef = useRef(null);

  // Estados para acciones de boletas en el historial
  const [billToDelete, setBillToDelete] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingBill, setDeletingBill] = useState(false);

  useEffect(() => {
    loadHouses();
    loadGlobalBills();
  }, []);
  
  // Manejar tecla Escape para cerrar modales
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Prioridad: cerrar modales según su z-index (del más alto al más bajo)
        if (showDeleteConfirmModal) {
          handleCancelDeleteBill();
        } else if (showModal) {
          handleCloseModal();
        } else if (showHistoryModal) {
          handleCloseHistory();
        } else if (showMeterManagementModal) {
          setShowMeterManagementModal(false);
        } else if (showImportModal) {
          setShowImportModal(false);
          setImportResult(null);
        }
      }
    };

    // Agregar event listener
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [
    showDeleteConfirmModal, 
    showModal, 
    showHistoryModal, 
    showMeterManagementModal, 
    showImportModal
  ]);
  
  // Guardar parcelas con medidor en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('electricidad_houses_with_meter', JSON.stringify(housesWithMeter));
  }, [housesWithMeter]);

  // Obtener la última lectura registrada de una casa desde las boletas
  const getLastReadingForHouse = async (houseId) => {
    try {
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', houseId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc'),
        limitQuery(1)
      );
      const billsSnapshot = await getDocs(billsQuery);
      
      if (!billsSnapshot.empty) {
        const lastBill = billsSnapshot.docs[0].data();
        // Retorna la lectura actual de la última boleta
        return lastBill.currentReading || null;
      }
      return null;
    } catch (error) {
      console.error(`Error al obtener última lectura para ${houseId}:`, error);
      return null;
    }
  };

  const loadHouses = async () => {
    try {
      setLoading(true);
      const housesRef = collection(firestore, 'houses');
      const housesSnapshot = await getDocs(housesRef);
      let housesData = housesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Obtener última lectura de cada casa desde las boletas
      housesData = await Promise.all(
        housesData.map(async (house) => {
          const lastReading = await getLastReadingForHouse(house.id);
          return {
            ...house,
            lastBillReading: lastReading
          };
        })
      );
      
      // Ordenar por número de parcela
      housesData.sort((a, b) => parseInt(a.houseNumber) - parseInt(b.houseNumber));
      
      setHouses(housesData);
      
      // Si no hay parcelas con medidor guardadas, marcar todas por defecto
      if (housesWithMeter.length === 0) {
        setHousesWithMeter(housesData.map(h => h.id));
      }
    } catch (error) {
      console.error('Error al cargar parcelas:', error);
      setError('Error al cargar las parcelas');
    } finally {
      setLoading(false);
    }
  };
  
  // Funciones para gestionar parcelas con medidor
  const toggleHouseMeter = (houseId) => {
    setHousesWithMeter(prev => {
      if (prev.includes(houseId)) {
        return prev.filter(id => id !== houseId);
      } else {
        return [...prev, houseId];
      }
    });
  };
  
  const hasHouseMeter = (houseId) => {
    return housesWithMeter.includes(houseId);
  };
  
  const selectAllWithMeter = () => {
    setHousesWithMeter(houses.map(h => h.id));
  };
  
  const deselectAllWithMeter = () => {
    setHousesWithMeter([]);
  };

  // Funciones para boletas globales
  const loadGlobalBills = async () => {
    try {
      const globalBillsQuery = query(
        collection(firestore, 'globalBills'),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );
      const snapshot = await getDocs(globalBillsQuery);
      const bills = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGlobalBills(bills);
    } catch (error) {
      console.error('Error al cargar boletas globales:', error);
    }
  };

  const handleOpenModal = async (house) => {
    setSelectedHouse(house);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Buscar la última boleta para obtener la lectura actual como lectura anterior
    let previousReading = house.meters?.currentReading || house.meters?.previousReading || '';
    
    try {
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', house.id),
        orderBy('year', 'desc'),
        orderBy('month', 'desc'),
        limitQuery(1)
      );
      const billsSnapshot = await getDocs(billsQuery);
      
      if (!billsSnapshot.empty) {
        const lastBill = billsSnapshot.docs[0].data();
        previousReading = lastBill.currentReading || previousReading;
      }
    } catch (err) {
      console.log('No se pudo obtener última lectura:', err);
    }
    
    setFormData({
      previousReading: previousReading,
      currentReading: '',
      month: currentMonth,
      year: currentYear
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedHouse(null);
    setFormData({ 
      previousReading: '', 
      currentReading: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });
    setError('');
    setSuccess('');
    setGeneratedBillData(null); // Limpiar datos generados
    setCalculatedData(null); // Limpiar datos calculados
    setModalStep('input'); // Resetear al paso inicial
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };
  
  // Función para actualizar lectura anterior cuando cambia mes/año
  const handlePeriodChange = async (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: parseInt(value)
    };
    
    // Calcular mes/año anterior
    let prevMonth = newFormData.month - 1;
    let prevYear = newFormData.year;
    
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }
    
    // Buscar boleta del mes anterior para obtener lectura actual como lectura anterior
    try {
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', selectedHouse.id),
        where('month', '==', prevMonth),
        where('year', '==', prevYear),
        limitQuery(1)
      );
      const billsSnapshot = await getDocs(billsQuery);
      
      if (!billsSnapshot.empty) {
        const prevBill = billsSnapshot.docs[0].data();
        newFormData.previousReading = prevBill.currentReading || '';
      } else {
        // Si no hay boleta del mes anterior, usar la lectura del medidor
        newFormData.previousReading = selectedHouse.meters?.currentReading || selectedHouse.meters?.previousReading || '';
      }
    } catch (err) {
      console.log('No se pudo buscar boleta anterior:', err);
    }
    
    setFormData(newFormData);
    setError('');
  };

  // Función para abrir el historial de boletas de una casa
  const handleOpenHistory = async (house) => {
    try {
      setSelectedHouseForHistory(house);
      setShowHistoryModal(true);
      setLoadingHistory(true);

      // Cargar boletas de esta casa
      const billsRef = collection(firestore, 'bills');
      const billsQuery = query(
        billsRef,
        where('houseId', '==', house.houseId)
      );
      
      const billsSnapshot = await getDocs(billsQuery);
      const billsData = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Ordenar por período (año descendente, luego mes descendente - más reciente primero)
      billsData.sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year; // Año más reciente primero
        }
        return b.month - a.month; // Mes más reciente primero (dentro del mismo año)
      });

      setHistoryBills(billsData);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('Error al cargar el historial de boletas');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setSelectedHouseForHistory(null);
    setHistoryBills([]);
  };

  // Función para imprimir/descargar boleta
  // Función para calcular la tarifa histórica usando ingeniería inversa
  const calculateHistoricalRate = (bill) => {
    try {
      // Si ya tiene rate, usarla
      if (bill.rate) {
        return bill.rate;
      }
      
      // Ingeniería inversa: (totalAmount - fixedFee) / consumption = rate
      const totalAmount = bill.totalAmount || bill.total || 0;
      const fixedFee = bill.fixedFee || 0;
      const consumption = bill.consumption || 1; // Evitar división por cero
      
      if (consumption === 0) return 0;
      
      const variableCharge = totalAmount - fixedFee;
      const calculatedRate = variableCharge / consumption;
      
      return Math.round(calculatedRate * 100) / 100; // Redondear a 2 decimales
    } catch (error) {
      console.error('Error calculando tarifa histórica:', error);
      return 0;
    }
  };

  const handlePrintBill = async (bill) => {
    try {
      setError(''); // Limpiar errores anteriores
      
      // Si la boleta tiene PDF guardado, descargarlo
      if (bill.pdfData) {
        console.log('Descargando PDF almacenado...');
        // Usar houseNumber del bill si existe, sino del selectedHouseForHistory
        const houseNum = bill.houseNumber || selectedHouseForHistory?.houseNumber || 'xxx';
        const link = document.createElement('a');
        link.href = bill.pdfData;
        link.download = `boleta-${bill.year}-${String(bill.month).padStart(2, '0')}-${houseNum}.pdf`;
        document.body.appendChild(link); // Agregar al DOM
        link.click();
        document.body.removeChild(link); // Remover del DOM
        setSuccess('Boleta descargada exitosamente');
        return;
      }
      
      console.log('Generando PDF dinámicamente...');
      console.log('Bill data:', bill);
      console.log('Selected house for history:', selectedHouseForHistory);
      
      // Si no tiene PDF, generar uno dinámicamente
      // Buscar la información de la parcela - usar selectedHouseForHistory si estamos en modal de historia
      let houseData = selectedHouseForHistory;
      if (!houseData) {
        houseData = houses.find(h => h.id === bill.houseId);
      }
      
      if (!houseData) {
        console.error('No se encontró información de la parcela');
        setError('No se encontró información de la parcela');
        return;
      }

      // Preparar datos de la boleta con tarifa calculada si es necesaria
      const billDataForPDF = {
        ...bill,
        rate: bill.rate || calculateHistoricalRate(bill),
        // Asegurar que los campos de lectura están presentes
        previousReading: bill.previousReading || 0,
        currentReading: bill.currentReading || 0,
        consumption: bill.consumption || 0,
        electricityCharge: bill.variableCost || bill.electricityCharge || 0,
        fixedFee: bill.fixedFee || 0,
        total: bill.totalAmount || bill.total || 0,
        houseNumber: bill.houseNumber || houseData.houseNumber
      };

      console.log('Datos para PDF:', billDataForPDF);

      // Generar PDF
      const pdf = generateBillPDF(billDataForPDF, houseData);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      // Descargar
      const houseNum = billDataForPDF.houseNumber || 'xxx';
      const link = document.createElement('a');
      link.href = url;
      link.download = `boleta-${bill.year}-${String(bill.month).padStart(2, '0')}-${houseNum}.pdf`;
      document.body.appendChild(link); // Agregar al DOM
      link.click();
      document.body.removeChild(link); // Remover del DOM
      
      // Limpiar después de un pequeño delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      setSuccess('Boleta generada y descargada exitosamente');
    } catch (error) {
      console.error('Error al descargar boleta:', error);
      setError(`Error al descargar la boleta: ${error.message}`);
    }
  };

  // Función para editar boleta (abrir modal de edición)
  const handleEditBill = (bill) => {
    // Cerrar modal de historial
    setShowHistoryModal(false);
    
    // Abrir modal de generación con datos pre-cargados
    setSelectedHouse(selectedHouseForHistory);
    setFormData({
      previousReading: bill.previousReading?.toString() || '',
      currentReading: bill.currentReading?.toString() || '',
      month: bill.month,
      year: bill.year
    });
    setModalStep('input'); // Paso correcto: 'input'
    setShowModal(true);
    
    setSuccess('Puedes editar las lecturas y regenerar la boleta');
  };

  // Función para confirmar eliminación
  const handleDeleteBillClick = (bill) => {
    setBillToDelete(bill);
    setShowDeleteConfirmModal(true);
  };

  // Función para eliminar boleta
  const handleConfirmDeleteBill = async () => {
    if (!billToDelete) return;

    setDeletingBill(true);
    try {
      await deleteDoc(doc(firestore, 'bills', billToDelete.id));
      
      setSuccess(`Boleta de ${getMonthName(billToDelete.month)} ${billToDelete.year} eliminada correctamente`);
      
      // Recargar historial
      await loadHistoryBills(selectedHouseForHistory.id);
      
      // Cerrar modal de confirmación
      setShowDeleteConfirmModal(false);
      setBillToDelete(null);
    } catch (error) {
      console.error('Error al eliminar boleta:', error);
      setError('Error al eliminar la boleta');
    } finally {
      setDeletingBill(false);
    }
  };

  // Función para cancelar eliminación
  const handleCancelDeleteBill = () => {
    setShowDeleteConfirmModal(false);
    setBillToDelete(null);
  };

  // Función para obtener el nombre del mes
  const getMonthName = (month) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || month;
  };

  // Función para obtener el estado de la boleta
  const getBillStatus = (bill) => {
    if (bill.status === 'paid') return { text: 'Pagada', color: 'green' };
    if (bill.status === 'pending') {
      const dueDate = new Date(bill.dueDate);
      const now = new Date();
      if (dueDate < now) {
        return { text: 'Vencida', color: 'red' };
      }
      return { text: 'Pendiente', color: 'yellow' };
    }
    return { text: 'Pendiente', color: 'yellow' };
  };

  // Calcular saldo a favor de la boleta global
  const calculateGlobalBalance = async (month, year) => {
    try {
      // Obtener todas las boletas del período
      const billsQuery = query(
        collection(firestore, 'bills'),
        where('month', '==', parseInt(month)),
        where('year', '==', parseInt(year))
      );
      const billsSnapshot = await getDocs(billsQuery);
      
      // Sumar todos los totales de las boletas individuales
      let totalCollected = 0;
      billsSnapshot.docs.forEach(doc => {
        const bill = doc.data();
        totalCollected += bill.totalAmount || 0;
      });
      
      return totalCollected;
    } catch (error) {
      console.error('Error al calcular saldo:', error);
      return 0;
    }
  };

  // Guardar boleta global
  const handleSaveGlobalBill = async () => {
    try {
      // Validaciones
      if (!globalBillData.billNumber || !globalBillData.totalConsumption || 
          !globalBillData.totalAmount || !globalBillData.dueDate) {
        setError('Debes completar todos los campos obligatorios de la boleta global');
        return;
      }

      // Usar mes y año del formulario de boleta global
      const month = globalBillData.month;
      const year = globalBillData.year;

      // Calcular el total recaudado de las boletas individuales
      const totalCollected = await calculateGlobalBalance(month, year);
      
      // Calcular el saldo a favor
      const totalAmountValue = parseFloat(globalBillData.totalAmount.toString().replace(/\./g, '').replace(',', '.')) || 0;
      const balance = totalCollected - totalAmountValue;

      // Verificar si ya existe una boleta global para este período
      const existingQuery = query(
        collection(firestore, 'globalBills'),
        where('month', '==', month),
        where('year', '==', year)
      );
      const existingSnapshot = await getDocs(existingQuery);

      const globalBillDoc = {
        billNumber: globalBillData.billNumber,
        month: month,
        year: year,
        totalConsumption: parseFloat(globalBillData.totalConsumption) || 0,
        totalAmount: totalAmountValue,
        dueDate: globalBillData.dueDate,
        realKwRate: parseFloat(globalBillData.realKwRate?.toString().replace(/\./g, '').replace(',', '.')) || 0,
        appliedKwRate: parseFloat(globalBillData.appliedKwRate?.toString().replace(/\./g, '').replace(',', '.')) || 0,
        balance: balance,
        totalCollected: totalCollected,
      };

      if (!existingSnapshot.empty) {
        // Actualizar la existente
        const docId = existingSnapshot.docs[0].id;
        await updateDoc(doc(firestore, 'globalBills', docId), {
          ...globalBillDoc,
          updatedAt: new Date()
        });
        setSuccess(`Boleta global de ${getMonthName(month)} ${year} actualizada correctamente. Saldo a favor: ${formatCurrency(balance)}`);
      } else {
        // Crear nueva
        await addDoc(collection(firestore, 'globalBills'), {
          ...globalBillDoc,
          createdAt: new Date()
        });
        setSuccess(`Boleta global de ${getMonthName(month)} ${year} guardada correctamente. Saldo a favor: ${formatCurrency(balance)}`);
      }

      // Recargar boletas globales
      await loadGlobalBills();

      // Limpiar formulario
      setGlobalBillData({
        billNumber: '',
        totalConsumption: '',
        totalAmount: '',
        dueDate: '',
        realKwRate: '',
        appliedKwRate: '',
        balance: ''
      });

      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error al guardar boleta global:', error);
      setError('Error al guardar la boleta global');
    }
  };

  // Funciones para importación de Excel
  const handleImportClick = () => {
    setShowImportModal(true);
    setImportResult(null);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');

    try {
      // Parsear el archivo Excel
      const result = await parseElectricityExcel(file);
      
      console.log('📊 Resultado del parser:', result);
      
      setImportResult(result);
      
      // Si hay boleta global, pre-llenar el formulario
      if (result.globalBillData) {
        setGlobalBillData({
          billNumber: result.globalBillData.billNumber || '',
          totalConsumption: result.globalBillData.totalConsumption?.toString() || '',
          totalAmount: result.globalBillData.totalAmount?.toString() || '',
          dueDate: result.globalBillData.dueDate || '',
          realKwRate: result.globalBillData.realKwRate?.toString() || '',
          appliedKwRate: result.globalBillData.appliedKwRate?.toString() || '',
          balance: ''
        });
      }
      
      setImporting(false);
    } catch (error) {
      console.error('Error al importar Excel:', error);
      setError(error.message);
      setImporting(false);
    }

    // Limpiar input
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importResult || !importResult.readings.length) return;

    setImporting(true);
    setError('');
    let successCount = 0;
    let errorCount = 0;
    const errorDetails = [];

    try {
      // Crear un mapa de parcelas por houseNumber (ahora incluye letras: "6A", "6B", etc.)
      const housesMap = {};
      houses.forEach(house => {
        housesMap[house.houseNumber] = house;
      });

      // Procesar cada lectura
      for (const reading of importResult.readings) {
        try {
          // Buscar la casa por houseNumber exacto (puede ser "6A", "6B", "4", "0", etc.)
          const house = housesMap[reading.houseNumber];
          
          if (!house) {
            const msg = `Parcela ${reading.parcelaDisplay || reading.houseNumber} no encontrada en el sistema`;
            console.warn(msg);
            errorDetails.push(msg);
            errorCount++;
            continue;
          }

          // Validar lecturas (permitir consumo 0 para cobrar solo cargo fijo)
          const previousReading = reading.previousReading || 0;
          const currentReading = reading.currentReading || 0;
          const consumption = reading.consumption || 0;

          // Si hay lecturas pero consumo negativo, es error
          if (consumption < 0) {
            const msg = `Parcela ${reading.parcelaDisplay}: Consumo negativo (${consumption})`;
            console.warn(msg);
            errorDetails.push(msg);
            errorCount++;
            continue;
          }

          // Usar tarifas con valores por defecto si no están cargadas
          const currentVariableRate = variableRate || 290;
          const currentFixedRate = fixedRate || 2000;

          console.log(`🔍 Tarifas para ${reading.parcelaDisplay}: Variable=${currentVariableRate}, Fija=${currentFixedRate}`);

          // Calcular boleta (incluso con consumo 0, se cobra cargo fijo)
          const billData = calculateBill(
            previousReading,
            currentReading,
            { variableRate: currentVariableRate, fixedRate: currentFixedRate }
          );

          console.log(`💰 Boleta calculada: Consumo=${billData.consumption}, Costo variable=${billData.electricityCharge}, Cargo fijo=${billData.fixedFee}, Total=${billData.total}`);

          // Verificar si ya existe una boleta para este período
          const existingBillQuery = query(
            collection(firestore, 'bills'),
            where('houseId', '==', house.id),
            where('month', '==', importPeriod.month),
            where('year', '==', importPeriod.year)
          );
          const existingBillSnapshot = await getDocs(existingBillQuery);

          if (!existingBillSnapshot.empty) {
            // Eliminar boleta existente antes de crear la nueva
            const existingBillId = existingBillSnapshot.docs[0].id;
            await deleteDoc(doc(firestore, 'bills', existingBillId));
            console.log(`Boleta existente de parcela ${reading.parcelaDisplay} eliminada para reemplazar`);
          }

          // Guardar boleta en Firestore
          await addDoc(collection(firestore, 'bills'), {
            houseId: house.id,
            houseNumber: house.houseNumber,
            ownerName: house.ownerName,
            previousReading: billData.previousReading,
            currentReading: billData.currentReading,
            consumption: billData.consumption,
            fixedFee: billData.fixedFee,
            variableCost: billData.electricityCharge,
            totalAmount: billData.total,
            month: importPeriod.month,
            year: importPeriod.year,
            dueDate: generateDueDate(),
            status: 'pending',
            createdAt: new Date(),
            pdfUrl: null
          });

          console.log(`✅ Boleta generada para parcela ${reading.parcelaDisplay}: Consumo ${billData.consumption} kW, Total ${billData.total}`);
          successCount++;
        } catch (err) {
          const msg = `Error al procesar parcela ${reading.parcelaDisplay}: ${err.message}`;
          console.error(msg, err);
          errorDetails.push(msg);
          errorCount++;
        }
      }

      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const periodStr = `${monthNames[importPeriod.month - 1]} ${importPeriod.year}`;
      
      let message = `✅ Importación completada: ${successCount} boletas generadas para ${periodStr}`;
      if (errorCount > 0) {
        message += ` (${errorCount} errores)`;
        console.warn('Detalles de errores:', errorDetails);
      }
      
      setSuccess(message);
      setShowImportModal(false);
      setImportResult(null);
      
      // Recargar casas para actualizar lecturas
      await loadHouses();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      console.error('Error al importar lecturas:', error);
      setError('Error al importar lecturas masivas');
    } finally {
      setImporting(false);
    }
  };

  // Nueva función: Solo calcular la lectura (Paso 1)
  const handleCalculateReading = async () => {
    try {
      setError('');
      setCalculating(true);
      
      // Validar que mes y año estén presentes
      if (!formData.month || !formData.year) {
        setError('Debes seleccionar mes y año');
        setCalculating(false);
        return;
      }
      
      // Verificar si ya existe una boleta para este período
      const existingBillQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', selectedHouse.id),
        where('month', '==', formData.month),
        where('year', '==', formData.year)
      );
      const existingBillSnapshot = await getDocs(existingBillQuery);
      
      if (!existingBillSnapshot.empty) {
        const confirmed = window.confirm(
          `⚠️ Ya existe una boleta para ${getMonthName(formData.month)} ${formData.year}.\n\n¿Deseas reemplazarla?`
        );
        if (!confirmed) {
          setCalculating(false);
          return;
        }
      }

      // Validar lecturas
      const validation = validateReadings(
        parseFloat(formData.previousReading),
        parseFloat(formData.currentReading)
      );

      if (!validation.valid) {
        if (validation.warning) {
          const confirmed = window.confirm(`${validation.error}\n\n¿Deseas continuar de todos modos?`);
          if (!confirmed) {
            setCalculating(false);
            return;
          }
        } else {
          setError(validation.error);
          setCalculating(false);
          return;
        }
      }

      // Calcular boleta con tarifas desde Firestore
      const billData = calculateBill(
        parseFloat(formData.previousReading),
        parseFloat(formData.currentReading),
        { variableRate, fixedRate }
      );

      // Guardar datos calculados incluyendo mes y año
      // IMPORTANTE: Mapear nombres de campos para coincidir con el schema de Firestore
      setCalculatedData({
        previousReading: billData.previousReading,
        currentReading: billData.currentReading,
        consumption: billData.consumption,
        fixedFee: billData.fixedFee,
        variableCost: billData.electricityCharge,  // electricityCharge → variableCost
        totalAmount: billData.total,               // total → totalAmount
        rate: variableRate,  // Guardar la tarifa variable para el PDF
        month: formData.month,
        year: formData.year
      });

      // Avanzar al siguiente paso
      setModalStep('calculated');
      setSuccess(`Lectura calculada correctamente para ${getMonthName(formData.month)} ${formData.year}. Ahora puedes generar la boleta.`);

    } catch (error) {
      console.error('Error al calcular lectura:', error);
      setError(`Error al calcular: ${error.message}`);
    } finally {
      setCalculating(false);
    }
  };

  // Función para enviar por WhatsApp
  const handleSendWhatsApp = () => {
    if (!generatedBillData || !selectedHouse) return;

    // Verificar si tiene número de teléfono
    if (!selectedHouse.phone) {
      setError('Esta parcela no tiene número de teléfono registrado');
      return;
    }

    // Validar formato de teléfono
    if (!isValidChileanPhone(selectedHouse.phone)) {
      setError('El número de teléfono no tiene un formato válido');
      return;
    }

    // Generar mensaje de WhatsApp
    const whatsappUrl = getNewBillWhatsAppMessage({
      phone: selectedHouse.phone,
      ownerName: selectedHouse.ownerName || 'Estimado/a',
      houseNumber: selectedHouse.houseNumber,
      month: generatedBillData.month,
      year: generatedBillData.year,
      total: generatedBillData.total,
      dueDate: generatedBillData.dueDate,
      consumption: generatedBillData.consumption
    });

    // Abrir WhatsApp
    openWhatsApp(whatsappUrl);
    
    setSuccess(`Mensaje de WhatsApp preparado para ${selectedHouse.ownerName}`);
  };

  // Función para enviar por Email
  const handleSendEmail = async () => {
    if (!generatedBillData || !selectedHouse) return;

    // Verificar si tiene email
    if (!selectedHouse.ownerEmail) {
      setError('Esta parcela no tiene email registrado');
      return;
    }

    // Verificar si EmailJS está configurado
    if (!isEmailConfigured()) {
      setError('El servicio de email no está configurado. Contacte al administrador del sistema.');
      return;
    }

    try {
      setSendingEmail(true);
      
      await sendNewBillEmail({
        toEmail: selectedHouse.ownerEmail,
        toName: selectedHouse.ownerName,
        houseNumber: selectedHouse.houseNumber,
        month: generatedBillData.month,
        year: generatedBillData.year,
        total: generatedBillData.total,
        pdfUrl: generatedBillData.pdfData,
        dueDate: generatedBillData.dueDate
      });

      setSuccess(`Email enviado exitosamente a ${selectedHouse.ownerEmail}`);
    } catch (error) {
      console.error('Error al enviar email:', error);
      setError(`Error al enviar email: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleGlobalBillChange = (e) => {
    const { name, value } = e.target;
    setGlobalBillData({
      ...globalBillData,
      [name]: value
    });
  };

  const handleGenerateBill = async () => {
    try {
      setError('');
      setGenerating(true);

      // Usar datos ya calculados
      if (!calculatedData) {
        setError('Primero debes calcular la lectura');
        setGenerating(false);
        return;
      }

      // Usar mes y año del formulario (no del sistema actual)
      const now = new Date();
      const month = calculatedData.month;
      const year = calculatedData.year;
      
      // Crear fecha de vencimiento basada en el mes seleccionado
      const billDate = new Date(year, month - 1, 15); // Día 15 del mes seleccionado
      const dueDate = generateDueDate(billDate);

      const completeBillData = {
        ...calculatedData,
        houseId: selectedHouse.houseId,
        month,
        year,
        status: 'pending',
        createdAt: now.toISOString(),
        dueDate: dueDate.toISOString(),
        pdfData: null,
        emailSent: false
      };

      // Generar PDF
      const pdfDoc = generateBillPDF(completeBillData, selectedHouse);
      const pdfBlob = pdfToBlob(pdfDoc);
      
      // Convertir PDF a base64
      const pdfBase64 = await uploadBillPDF(pdfBlob, null, selectedHouse.houseId, year, month);
      
      // Verificar si ya existe una boleta para este período y eliminarla
      const existingBillQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', selectedHouse.id),
        where('month', '==', month),
        where('year', '==', year)
      );
      const existingBillSnapshot = await getDocs(existingBillQuery);
      
      if (!existingBillSnapshot.empty) {
        // Eliminar la boleta existente
        const existingBillDoc = existingBillSnapshot.docs[0];
        await deleteDoc(doc(firestore, 'bills', existingBillDoc.id));
      }
      
      // Guardar en Firestore con el PDF en base64
      completeBillData.pdfData = pdfBase64;
      const billsRef = collection(firestore, 'bills');
      const docRef = await addDoc(billsRef, completeBillData);

      // IMPORTANTE: Actualizar lecturas en la casa SOLO si es la boleta más reciente
      // Buscar la boleta más reciente de esta casa
      const latestBillQuery = query(
        collection(firestore, 'bills'),
        where('houseId', '==', selectedHouse.id),
        orderBy('year', 'desc'),
        orderBy('month', 'desc'),
        limitQuery(1)
      );
      const latestBillSnapshot = await getDocs(latestBillQuery);
      
      if (!latestBillSnapshot.empty) {
        const latestBill = latestBillSnapshot.docs[0].data();
        // Solo actualizar si esta es la boleta más reciente
        if (latestBill.year === year && latestBill.month === month) {
          const houseRef = doc(firestore, 'houses', selectedHouse.id);
          await updateDoc(houseRef, {
            'meters.previousReading': calculatedData.currentReading,
            'meters.currentReading': calculatedData.currentReading,
            'meters.lastReadingDate': now.toISOString(),
            'meters.lastBillMonth': month,
            'meters.lastBillYear': year
          });
        }
      }

      // Intentar enviar email si está configurado
      let emailSent = false;
      if (isEmailConfigured() && selectedHouse.ownerEmail) {
        try {
          await sendNewBillEmail({
            toEmail: selectedHouse.ownerEmail,
            toName: selectedHouse.ownerName,
            houseNumber: selectedHouse.houseNumber,
            month,
            year,
            total: completeBillData.totalAmount,
            pdfUrl: `data:application/pdf;base64,${pdfBase64.split(',')[1]}`,
            dueDate: dueDate.toLocaleDateString('es-CL')
          });
          emailSent = true;
        } catch (emailError) {
          console.error('Error al enviar email:', emailError);
        }
      }

      setSuccess(
        `Boleta generada exitosamente para ${getMonthName(month)} ${year} - Parcela ${selectedHouse.houseNumber}. ` +
        `Total: ${formatCurrency(completeBillData.totalAmount)}. ` +
        (emailSent ? 'Email enviado.' : '') +
        ` Lecturas actualizadas.`
      );

      // Guardar datos de la boleta generada para acciones de comunicación
      setGeneratedBillData({
        ...completeBillData,
        consumption: calculatedData.consumption,
        dueDate: dueDate.toLocaleDateString('es-CL'),
        house: selectedHouse
      });

      // Descargar PDF automáticamente
      downloadPDF(pdfDoc, `boleta-${year}-${month}-${selectedHouse.houseNumber}.pdf`);

      // Avanzar al paso final
      setModalStep('generated');

      // Recargar casas para actualizar las lecturas en la UI
      setTimeout(() => {
        loadHouses();
      }, 1000);

    } catch (error) {
      console.error('Error al generar boleta:', error);
      setError(`Error al generar la boleta: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Formatear número de casa para mostrar "Portón" o "Parcela X"
  const formatHouseNumber = (houseNumber) => {
    if (houseNumber === '0' || houseNumber === 0) {
      return 'Portón';
    }
    return `Parcela ${houseNumber}`;
  };

  const filteredHouses = houses.filter(house => {
    const matchesSearch = house.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const hasMeter = hasHouseMeter(house.id);
    return matchesSearch && hasMeter;
  });

  if (!userData || !['admin', 'tecnico'].includes(userData.role)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Solo administradores y técnicos pueden acceder a este módulo.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Gestión de Electricidad
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {getCurrentMonthYear()} • Tarifa: ${getCurrentRate(variableRate)}/kWh • Cargo fijo: ${getFixedFee(fixedRate)}
          </p>
        </div>
        <button
          onClick={handleImportClick}
          className="btn-secondary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Importar Excel
        </button>
      </div>

      {/* Formulario de Boleta Global */}
      <div className="card">
        <div 
          className="p-4 flex items-center justify-between cursor-pointer border-b border-slate-200 dark:border-slate-700"
          onClick={() => setShowGlobalBillForm(!showGlobalBillForm)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Boleta Global de Electricidad
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Configura los datos de la boleta global de la comunidad
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {showGlobalBillForm ? '▼' : '▶'}
          </button>
        </div>

        {showGlobalBillForm && (
          <div className="p-6">
            {/* Selector de Período */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Período de la Boleta
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Mes *
                  </label>
                  <select
                    name="month"
                    value={globalBillData.month}
                    onChange={handleGlobalBillChange}
                    className="input-field"
                  >
                    <option value={1}>Enero</option>
                    <option value={2}>Febrero</option>
                    <option value={3}>Marzo</option>
                    <option value={4}>Abril</option>
                    <option value={5}>Mayo</option>
                    <option value={6}>Junio</option>
                    <option value={7}>Julio</option>
                    <option value={8}>Agosto</option>
                    <option value={9}>Septiembre</option>
                    <option value={10}>Octubre</option>
                    <option value={11}>Noviembre</option>
                    <option value={12}>Diciembre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                    Año *
                  </label>
                  <select
                    name="year"
                    value={globalBillData.year}
                    onChange={handleGlobalBillChange}
                    className="input-field"
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* N° Boleta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  N° Boleta *
                </label>
                <input
                  type="text"
                  name="billNumber"
                  value={globalBillData.billNumber}
                  onChange={handleGlobalBillChange}
                  className="input-field"
                  placeholder="Ej: 117781738"
                />
              </div>

              {/* Consumo General KW */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Consumo General KW *
                </label>
                <input
                  type="number"
                  name="totalConsumption"
                  value={globalBillData.totalConsumption}
                  onChange={handleGlobalBillChange}
                  className="input-field"
                  placeholder="Ej: 9905"
                />
              </div>

              {/* Total a Pagar Chilquinta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Total a Pagar Chilquinta *
                </label>
                <input
                  type="text"
                  name="totalAmount"
                  value={globalBillData.totalAmount}
                  onChange={handleGlobalBillChange}
                  className="input-field"
                  placeholder="Ej: 2608666"
                />
              </div>

              {/* Fecha Vencimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fecha Vencimiento *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={globalBillData.dueDate}
                  onChange={handleGlobalBillChange}
                  className="input-field"
                />
              </div>

              {/* Valor KW Real */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Valor KW Real ($) *
                </label>
                <input
                  type="text"
                  name="realKwRate"
                  value={globalBillData.realKwRate}
                  onChange={handleGlobalBillChange}
                  className="input-field"
                  placeholder="Ej: 263.4"
                />
              </div>

              {/* Valor KW Aplicado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Valor KW Aplicado ($) *
                </label>
                <input
                  type="text"
                  name="appliedKwRate"
                  value={globalBillData.appliedKwRate}
                  onChange={handleGlobalBillChange}
                  className="input-field"
                  placeholder="Ej: 291"
                />
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                El saldo a favor se calculará automáticamente
              </p>
              <button
                onClick={handleSaveGlobalBill}
                className="btn-primary"
              >
                <CheckCircle className="w-4 h-4" />
                Guardar Boleta Global
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historial de Boletas Globales */}
      {globalBills.length > 0 && (
        <>
          {/* Balance Tracking - Línea de Tiempo de Saldos */}
          <div className="card">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolución de Saldos a Favor
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Seguimiento mensual de saldos acumulados
              </p>
            </div>
            <div className="p-6">
              {/* Timeline View */}
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                
                {/* Items de timeline */}
                <div className="space-y-4">
                  {globalBills.map((bill, index) => {
                    const isPositive = bill.balance >= 0;
                    const isFirst = index === 0;
                    
                    return (
                      <div key={bill.id} className="relative flex items-start gap-4">
                        {/* Punto en la línea */}
                        <div className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                          isPositive 
                            ? 'bg-green-100 dark:bg-green-900/30 border-4 border-green-500' 
                            : 'bg-red-100 dark:bg-red-900/30 border-4 border-red-500'
                        }`}>
                          <span className={`text-sm font-bold ${
                            isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            {isPositive ? '+' : ''}{formatCurrency(bill.balance).replace('$', '')}
                          </span>
                        </div>
                        
                        {/* Contenido */}
                        <div className={`flex-1 p-4 rounded-lg border ${
                          isFirst 
                            ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-lg font-bold text-slate-900 dark:text-white">
                                {getMonthName(bill.month)} {bill.year}
                              </span>
                              {isFirst && (
                                <span className="ml-2 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 px-2 py-1 rounded">
                                  Más reciente
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              N° {bill.billNumber}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-slate-500 dark:text-slate-400">Consumo</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {bill.totalConsumption.toLocaleString('es-CL')} kW
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 dark:text-slate-400">Chilquinta</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(bill.totalAmount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 dark:text-slate-400">Recaudado</div>
                              <div className="font-medium text-slate-900 dark:text-white">
                                {formatCurrency(bill.totalCollected || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-slate-500 dark:text-slate-400">Saldo</div>
                              <div className={`font-bold text-lg ${
                                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(bill.balance)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Boletas Globales */}
          <div className="card">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Detalle de Boletas Globales
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Información detallada de cada boleta
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalBills.map((bill) => (
                <div key={bill.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {getMonthName(bill.month)} {bill.year}
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                      N° {bill.billNumber}
                    </span>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Consumo:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{bill.totalConsumption.toLocaleString('es-CL')} kW</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Chilquinta:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(bill.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Valor KW Real:</span>
                      <span className="font-medium text-slate-900 dark:text-white">${bill.realKwRate.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Valor KW Aplicado:</span>
                      <span className="font-medium text-slate-900 dark:text-white">${bill.appliedKwRate.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">Saldo a Favor:</span>
                      <span className={`font-bold ${bill.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(bill.balance)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2">
                    Vencimiento: {new Date(bill.dueDate).toLocaleDateString('es-CL')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Search y filtros */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por parcela o propietario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 pr-10 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Botón para gestionar medidores */}
          <button
            onClick={() => setShowMeterManagementModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            title="Gestionar parcelas con medidor"
          >
            <Zap className="w-5 h-5" />
            <span>Gestionar Medidores ({housesWithMeter.length}/{houses.length})</span>
          </button>
        </div>
        
        {/* Info de parcelas sin medidor */}
        {houses.length > 0 && housesWithMeter.length < houses.length && (
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <EyeOff className="w-4 h-4" />
            <span>
              Mostrando {housesWithMeter.length} de {houses.length} parcelas (con medidor).
              {houses.length - housesWithMeter.length} ocultas sin medidor.
            </span>
          </div>
        )}
      </div>

      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredHouses.map((house) => (
          <div key={house.id} className="card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatHouseNumber(house.houseNumber)}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {house.ownerName || 'Sin propietario'}
                </p>
              </div>
              <div className="flex gap-2">
                {/* Botón de historial */}
                <button
                  onClick={() => handleOpenHistory(house)}
                  className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                  title="Ver historial de boletas"
                >
                  <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </button>
                {/* Ícono de electricidad */}
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            {house.meters && (
              <div className="mb-3 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  Última lectura: <span className="font-medium text-slate-900 dark:text-white">
                    {house.lastBillReading || house.meters.currentReading || house.meters.previousReading || 'N/A'}
                  </span> kWh
                </p>
              </div>
            )}

            <button
              onClick={() => handleOpenModal(house)}
              className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ingresar Lectura
            </button>
          </div>
        ))}
      </div>

      {filteredHouses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            No se encontraron parcelas
          </p>
        </div>
      )}

      {/* Modal para ingresar lectura - Flujo mejorado de 3 pasos */}
      {showModal && selectedHouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatHouseNumber(selectedHouse.houseNumber)}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedHouse.ownerName || 'No asignado'}
                </p>
              </div>
              {/* Indicador de paso */}
              <div className="flex gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  modalStep === 'input' ? 'bg-primary-600 text-white' : 
                  modalStep === 'calculated' || modalStep === 'generated' ? 'bg-green-500 text-white' : 
                  'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                }`}>1</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  modalStep === 'calculated' ? 'bg-primary-600 text-white' : 
                  modalStep === 'generated' ? 'bg-green-500 text-white' : 
                  'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                }`}>2</div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  modalStep === 'generated' ? 'bg-green-500 text-white' : 
                  'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                }`}>3</div>
              </div>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
              </div>
            )}

            {/* PASO 1: Ingresar lecturas */}
            {modalStep === 'input' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    📊 Paso 1: Ingresa las lecturas del medidor
                  </p>
                </div>

                {/* Selector de Período (Mes y Año) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Mes
                    </label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handlePeriodChange}
                      className="input-field"
                    >
                      <option value={1}>Enero</option>
                      <option value={2}>Febrero</option>
                      <option value={3}>Marzo</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Mayo</option>
                      <option value={6}>Junio</option>
                      <option value={7}>Julio</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Septiembre</option>
                      <option value={10}>Octubre</option>
                      <option value={11}>Noviembre</option>
                      <option value={12}>Diciembre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Año
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handlePeriodChange}
                      className="input-field"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Lectura Anterior (kWh)
                  </label>
                  <input
                    type="number"
                    name="previousReading"
                    value={formData.previousReading}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ej: 5000"
                    required
                    disabled={calculating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Lectura Actual (kWh)
                  </label>
                  <input
                    type="number"
                    name="currentReading"
                    value={formData.currentReading}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ej: 5150"
                    required
                    disabled={calculating}
                  />
                </div>

                {formData.previousReading && formData.currentReading && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>Consumo aproximado:</strong>{' '}
                      {parseFloat(formData.currentReading) - parseFloat(formData.previousReading)} kWh
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleCalculateReading}
                    disabled={calculating || !formData.previousReading || !formData.currentReading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {calculating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Calcular Lectura
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    disabled={calculating}
                    className="btn-secondary px-6"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: Lectura calculada - Opciones de notificación y generar boleta */}
            {modalStep === 'calculated' && calculatedData && (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    ✅ Paso 2: Lectura calculada correctamente
                  </p>
                </div>

                {/* Resumen del cálculo */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Lectura anterior:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{calculatedData.previousReading} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Lectura actual:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{calculatedData.currentReading} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-300 dark:border-slate-600">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Consumo:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">{calculatedData.consumption} kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Tarifa:</span>
                    <span className="text-slate-900 dark:text-white">${calculatedData.rate}/kWh</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Cargo electricidad:</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(calculatedData.electricityCharge)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Cargo fijo:</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(calculatedData.fixedFee)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-slate-300 dark:border-slate-600">
                    <span className="text-slate-900 dark:text-white">TOTAL:</span>
                    <span className="text-primary-600 dark:text-primary-400">{formatCurrency(calculatedData.totalAmount)}</span>
                  </div>
                </div>

                {/* Botón principal: Generar Boleta */}
                <button
                  onClick={handleGenerateBill}
                  disabled={generating}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      Generando Boleta...
                    </>
                  ) : (
                    <>
                      <FileText className="w-6 h-6" />
                      Generar Boleta
                    </>
                  )}
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalStep('input')}
                    disabled={generating}
                    className="flex-1 btn-secondary"
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={handleCloseModal}
                    disabled={generating}
                    className="flex-1 btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: Boleta generada - Opciones de notificación */}
            {modalStep === 'generated' && generatedBillData && (
              <div className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    🎉 Paso 3: ¡Boleta generada exitosamente!
                  </p>
                </div>

                {/* Opciones de notificación */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    💬 Notificar al residente:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Botón WhatsApp */}
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={!selectedHouse.phone}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                      title={!selectedHouse.phone ? 'No hay teléfono registrado' : 'Enviar mensaje por WhatsApp'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                      {!selectedHouse.phone && <span className="text-xs">(Sin tel.)</span>}
                    </button>

                    {/* Botón Email */}
                    <button
                      onClick={handleSendEmail}
                      disabled={!selectedHouse.ownerEmail || sendingEmail || !isEmailConfigured()}
                      className="btn-secondary flex items-center justify-center gap-2 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      title={
                        !selectedHouse.ownerEmail 
                          ? 'No hay email registrado' 
                          : !isEmailConfigured() 
                          ? 'Servicio de email no configurado' 
                          : 'Enviar por correo electrónico'
                      }
                    >
                      {sendingEmail ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Email
                          {!selectedHouse.ownerEmail && <span className="text-xs">(Sin email)</span>}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                    {selectedHouse.phone && '📱 ' + selectedHouse.phone} 
                    {selectedHouse.phone && selectedHouse.ownerEmail && ' • '}
                    {selectedHouse.ownerEmail && '✉️ ' + selectedHouse.ownerEmail}
                  </p>
                </div>

                {/* Información adicional */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-900 dark:text-blue-300">
                    ℹ️ La lectura actual ({generatedBillData.currentReading} kWh) quedó guardada como lectura anterior para el próximo período.
                  </p>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="w-full btn-primary"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Historial de Boletas */}
      {showHistoryModal && selectedHouseForHistory && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleCloseHistory}
        >
          <div 
            className="card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Historial de Boletas
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {formatHouseNumber(selectedHouseForHistory.houseNumber)} - {selectedHouseForHistory.ownerName}
                </p>
              </div>
              <button
                onClick={handleCloseHistory}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading state */}
            {loadingHistory && (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="ml-3 text-slate-600 dark:text-slate-400">Cargando historial...</span>
              </div>
            )}

            {/* Empty state */}
            {!loadingHistory && historyBills.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No hay boletas registradas para esta parcela
                </p>
              </div>
            )}

            {/* Bills table */}
            {!loadingHistory && historyBills.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Período
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Lectura Ant.
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Lectura Act.
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <TrendingUp className="w-4 h-4 inline mr-2" />
                        Consumo
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Total
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Estado
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyBills.map((bill) => {
                      const status = getBillStatus(bill);
                      const statusColors = {
                        green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                        yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                        red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      };

                      return (
                        <tr 
                          key={bill.id} 
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm text-slate-900 dark:text-white font-medium">
                            {getMonthName(bill.month)} {bill.year}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">
                            {bill.previousReading?.toLocaleString('es-CL') || 'N/A'} kWh
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">
                            {bill.currentReading?.toLocaleString('es-CL') || 'N/A'} kWh
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900 dark:text-white">
                            {bill.consumption?.toLocaleString('es-CL') || '0'} kWh
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrency(bill.totalAmount || 0)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[status.color]}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Botón Imprimir/Descargar */}
                              <button
                                onClick={() => handlePrintBill(bill)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Descargar PDF"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              
                              {/* Botón Editar */}
                              <button
                                onClick={() => handleEditBill(bill)}
                                className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                                title="Editar boleta"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              {/* Botón Eliminar */}
                              <button
                                onClick={() => handleDeleteBillClick(bill)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Eliminar boleta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Boletas</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{historyBills.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Consumo Total</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {historyBills.reduce((sum, bill) => sum + (bill.consumption || 0), 0).toLocaleString('es-CL')} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Monto Total</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(historyBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Close button */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCloseHistory}
                className="w-full btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Medidores */}
      {showMeterManagementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Gestionar Medidores
                    </h2>
                    <p className="text-primary-100 text-sm">
                      Selecciona las parcelas que tienen medidor de electricidad
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMeterManagementModal(false)}
                  className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar parcela..."
                    value={meterSearchTerm}
                    onChange={(e) => setMeterSearchTerm(e.target.value)}
                    className="input-field pl-10 w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllWithMeter}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    Marcar Todas
                  </button>
                  <button
                    onClick={deselectAllWithMeter}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    Desmarcar Todas
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>💡 Tip:</strong> Las parcelas sin medidor quedarán ocultas en la vista principal.
                  Solo verás las parcelas marcadas para facilitar la carga de lecturas.
                </p>
              </div>

              {/* Lista de parcelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {houses
                  .filter(house => 
                    house.houseNumber.toLowerCase().includes(meterSearchTerm.toLowerCase()) ||
                    house.ownerName?.toLowerCase().includes(meterSearchTerm.toLowerCase())
                  )
                  .map(house => (
                    <label
                      key={house.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        hasHouseMeter(house.id)
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-600'
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasHouseMeter(house.id)}
                        onChange={() => toggleHouseMeter(house.id)}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {formatHouseNumber(house.houseNumber)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                          {house.ownerName || 'Sin propietario'}
                        </p>
                      </div>
                      {hasHouseMeter(house.id) && (
                        <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      )}
                    </label>
                  ))}
              </div>

              {/* Resumen */}
              <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Parcelas con medidor seleccionadas:
                  </span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {housesWithMeter.length} / {houses.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowMeterManagementModal(false)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación de Boleta */}
      {showDeleteConfirmModal && billToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={handleCancelDeleteBill}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Confirmar Eliminación
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                ¿Estás seguro que deseas eliminar la boleta de:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Período:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {getMonthName(billToDelete.month)} {billToDelete.year}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Parcela:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatHouseNumber(billToDelete.houseNumber)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Consumo:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {billToDelete.consumption?.toLocaleString('es-CL') || '0'} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Monto:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(billToDelete.totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDeleteBill}
                disabled={deletingBill}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteBill}
                disabled={deletingBill}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingBill ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar Boleta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación de Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Importar Lecturas desde Excel
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Sube tu archivo de Excel con las lecturas del mes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Selectores de Período */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                    Período de las Boletas
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Mes
                    </label>
                    <select
                      value={importPeriod.month}
                      onChange={(e) => setImportPeriod({ ...importPeriod, month: parseInt(e.target.value) })}
                      className="input-field w-full"
                    >
                      <option value={1}>Enero</option>
                      <option value={2}>Febrero</option>
                      <option value={3}>Marzo</option>
                      <option value={4}>Abril</option>
                      <option value={5}>Mayo</option>
                      <option value={6}>Junio</option>
                      <option value={7}>Julio</option>
                      <option value={8}>Agosto</option>
                      <option value={9}>Septiembre</option>
                      <option value={10}>Octubre</option>
                      <option value={11}>Noviembre</option>
                      <option value={12}>Diciembre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                      Año
                    </label>
                    <select
                      value={importPeriod.year}
                      onChange={(e) => setImportPeriod({ ...importPeriod, year: parseInt(e.target.value) })}
                      className="input-field w-full"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                  Las boletas se generarán para este período
                </p>
              </div>

              {/* Área de carga */}
              {!importResult && (
                <div>
                  <div 
                    onClick={handleFileSelect}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                  >
                    <Upload className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      Click para seleccionar archivo Excel
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Formatos soportados: .xlsx, .xls
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Instrucciones */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                      📋 Formato esperado del Excel
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                      <li>• Datos de boleta global en las primeras filas (N° Boleta, Consumo, Total, etc.)</li>
                      <li>• Fila de encabezados con: Parcela, Lectura Anterior, Lectura Actual</li>
                      <li>• Una fila por cada parcela con sus lecturas</li>
                      <li>• El sistema detecta automáticamente el formato</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Resultado del parsing */}
              {importResult && (
                <div className="space-y-4">
                  {/* Resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        Lecturas Encontradas
                      </p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {importResult.summary.totalReadings}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                        Consumo Total
                      </p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                        {importResult.summary.totalConsumption.toLocaleString('es-CL')} kW
                      </p>
                    </div>

                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                      <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">
                        Monto Total
                      </p>
                      <p className="text-2xl font-bold text-primary-900 dark:text-primary-300">
                        {formatCurrency(
                          importResult.readings.reduce((total, reading) => {
                            const consumption = reading.consumption || 0;
                            const currentVariableRate = variableRate || 150;
                            const currentFixedRate = fixedRate || 2000;
                            const billTotal = (consumption * currentVariableRate) + currentFixedRate;
                            return total + billTotal;
                          }, 0)
                        )}
                      </p>
                    </div>
                  </div>

                  {importResult.summary.totalErrors > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Advertencias ({importResult.summary.totalErrors})
                      </p>
                      <ul className="text-sm text-red-800 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Datos de boleta global */}
                  {importResult.globalBillData && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                        📄 Boleta Global Detectada
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {importResult.globalBillData.billNumber && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">N° Boleta:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">
                              {importResult.globalBillData.billNumber}
                            </span>
                          </div>
                        )}
                        {importResult.globalBillData.totalConsumption && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Consumo:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">
                              {importResult.globalBillData.totalConsumption} kW
                            </span>
                          </div>
                        )}
                        {importResult.globalBillData.totalAmount && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Total:</span>
                            <span className="ml-2 font-medium text-slate-900 dark:text-white">
                              {formatCurrency(importResult.globalBillData.totalAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tabla de lecturas */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-300">Parcela</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-300">Anterior</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-300">Actual</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-300">Consumo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.readings.map((reading, index) => (
                            <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                              <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">
                                {reading.parcelaDisplay || `Parcela ${reading.houseNumber}`}
                              </td>
                              <td className="px-4 py-2 text-sm text-right text-slate-900 dark:text-white">
                                {reading.previousReading?.toLocaleString('es-CL') || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right text-slate-900 dark:text-white">
                                {reading.currentReading?.toLocaleString('es-CL') || '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-medium text-slate-900 dark:text-white">
                                {reading.consumption?.toLocaleString('es-CL') || '-'} kW
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Errores */}
                  {importResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                        ⚠️ Advertencias ({importResult.errors.length})
                      </h3>
                      <ul className="text-sm text-red-800 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>

              {importResult && (
                <button
                  onClick={handleConfirmImport}
                  disabled={importing || importResult.readings.length === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Generando Boletas...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Generar {importResult.readings.length} Boletas
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Electricidad;
