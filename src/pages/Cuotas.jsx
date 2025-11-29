import { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, CheckCircle2, Clock, AlertCircle, Edit, Trash2, Eye, ChevronDown, ChevronUp, Receipt, Search, X } from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, orderBy } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import {
  DISTRIBUTION_TYPES,
  QUOTA_CATEGORIES,
  PAYMENT_TYPES,
  calculateQuotaDistribution,
  validateCustomDistribution,
  calculateQuotaProgress,
  calculateQuotasStats,
  getCategoryLabel,
  getDistributionLabel,
  getPaymentTypeLabel,
  recordInstallmentPayment,
  calculateInstallmentProgress
} from '../services/quotaCalculator';

export default function Cuotas() {
  const [quotas, setQuotas] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoucherSearchModal, setShowVoucherSearchModal] = useState(false);
  const [showPartialPaymentModal, setShowPartialPaymentModal] = useState(false);
  const [editingQuota, setEditingQuota] = useState(null);
  const [stats, setStats] = useState(null);
  const [expandedQuotas, setExpandedQuotas] = useState({});
  const [paymentData, setPaymentData] = useState({
    quotaId: null,
    houseId: null,
    voucherNumber: '',
    installmentsCount: 1,
    partialAmount: '',
    paymentMode: 'full' // 'full' o 'partial'
  });
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherResults, setVoucherResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: QUOTA_CATEGORIES.OTHER,
    totalAmount: '',
    paymentType: PAYMENT_TYPES.ONE_TIME,
    installmentsCount: 12,
    dueDate: '',
    startDate: new Date().toISOString().split('T')[0], // Fecha de inicio (YYYY-MM-DD)
    endDate: '', // Fecha de fin/vencimiento (opcional)
    status: 'active',
    selectedHouses: [] // Parcelas seleccionadas para esta cuota
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (quotas.length > 0) {
      const calculated = calculateQuotasStats(quotas);
      setStats(calculated);
    }
  }, [quotas]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar casas
      const housesSnapshot = await getDocs(collection(firestore, 'houses'));
      const housesData = housesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Filtrar house0 (Portón) - solo para electricidad
      .filter(house => house.id !== 'house0');
      setHouses(housesData);
      
      // Cargar cuotas
      const quotasQuery = query(
        collection(firestore, 'quotas'),
        orderBy('createdAt', 'desc')
      );
      const quotasSnapshot = await getDocs(quotasQuery);
      const quotasData = quotasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQuotas(quotasData);
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para ordenar casas numéricamente
  const sortHousesNumerically = (entries) => {
    return entries.sort((a, b) => {
      const numA = parseInt(a[0].replace('house', '')) || 0;
      const numB = parseInt(b[0].replace('house', '')) || 0;
      return numA - numB;
    });
  };

  // Toggle expandir/colapsar cuota
  const toggleQuotaExpansion = (quotaId) => {
    setExpandedQuotas(prev => ({
      ...prev,
      [quotaId]: !prev[quotaId]
    }));
  };

  const handleCreateQuota = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validar campos obligatorios
      if (!formData.name || !formData.totalAmount || !formData.dueDate || !formData.startDate) {
        setError('Completa todos los campos obligatorios');
        return;
      }

      // Validar que hay parcelas seleccionadas
      if (formData.selectedHouses.length === 0) {
        setError('Debes seleccionar al menos una parcela');
        return;
      }
      
      const totalAmount = parseFloat(formData.totalAmount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }
      
      // Validar fechas
      if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        setError('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
      
      // Determinar estado basado en fechas
      let status = formData.status;
      const now = new Date();
      const startDate = new Date(formData.startDate);
      const endDate = formData.endDate ? new Date(formData.endDate) : null;
      
      if (endDate && endDate < now) {
        status = 'completed'; // Cuota finalizada automáticamente
      } else if (startDate > now) {
        status = 'pending'; // Cuota futura
      } else {
        status = 'active'; // Cuota vigente
      }
      
      // Obtener solo las parcelas seleccionadas
      const selectedHousesData = houses.filter(house => formData.selectedHouses.includes(house.id));
      
      // Calcular distribución (siempre en partes iguales)
      const distribution = calculateQuotaDistribution(
        totalAmount,
        selectedHousesData,
        DISTRIBUTION_TYPES.EQUAL
      );
      
      // Calcular monto mensual si es por cuotas
      const isInstallments = formData.paymentType === PAYMENT_TYPES.INSTALLMENTS;
      const installmentsCount = isInstallments ? parseInt(formData.installmentsCount) : 1;
      const monthlyAmount = isInstallments ? Math.round(totalAmount / installmentsCount) : totalAmount;

      // Crear payments solo para parcelas seleccionadas
      const payments = {};
      selectedHousesData.forEach(house => {
        const houseAmount = distribution[house.id].amount;
        const houseMonthlyAmount = isInstallments ? Math.round(houseAmount / installmentsCount) : houseAmount;
        
        payments[house.id] = {
          houseId: house.id,
          amount: houseAmount,
          monthlyAmount: houseMonthlyAmount,
          percentage: distribution[house.id].percentage,
          status: 'pending',
          paidAt: null,
          ...(isInstallments && {
            installmentsPaid: 0,
            installmentsPending: installmentsCount,
            installmentPayments: []
          })
        };
      });
      
      const quotaData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        totalAmount,
        paymentType: formData.paymentType,
        ...(isInstallments && {
          installments: {
            total: installmentsCount,
            paid: 0,
            pending: installmentsCount
          },
          monthlyAmount
        }),
        distributionType: DISTRIBUTION_TYPES.EQUAL,
        dueDate: new Date(formData.dueDate),
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        status,
        payments,
        distribution,
        createdAt: new Date(),
        createdBy: 'admin' // TODO: usar auth.currentUser
      };
      
      if (editingQuota) {
        // Actualizar
        await updateDoc(doc(firestore, 'quotas', editingQuota.id), quotaData);
      } else {
        // Crear
        await addDoc(collection(firestore, 'quotas'), quotaData);
      }
      
      // Recargar y cerrar modal
      await loadData();
      handleCloseModal();
      
    } catch (err) {
      console.error('Error al guardar cuota:', err);
      setError('Error al guardar la cuota');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuota = (quota) => {
    setEditingQuota(quota);
    const selectedHouseIds = Object.keys(quota.payments || {});
    setFormData({
      name: quota.name,
      description: quota.description || '',
      category: quota.category,
      totalAmount: quota.totalAmount.toString(),
      paymentType: quota.paymentType || PAYMENT_TYPES.ONE_TIME,
      installmentsCount: quota.installments?.total || 12,
      dueDate: quota.dueDate.toDate().toISOString().split('T')[0],
      startDate: quota.startDate ? quota.startDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: quota.endDate ? quota.endDate.toDate().toISOString().split('T')[0] : '',
      status: quota.status,
      selectedHouses: selectedHouseIds
    });
    setShowModal(true);
  };

  const handleDeleteQuota = async (quotaId) => {
    if (!confirm('¿Estás seguro de eliminar esta cuota?')) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(firestore, 'quotas', quotaId));
      await loadData();
    } catch (err) {
      console.error('Error al eliminar cuota:', err);
      setError('Error al eliminar la cuota');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (quotaId, houseId) => {
    const quota = quotas.find(q => q.id === quotaId);
    
    // Determinar cuántas cuotas puede pagar
    let maxInstallments = 1;
    if (quota.paymentType === PAYMENT_TYPES.INSTALLMENTS) {
      const payment = quota.payments[houseId];
      maxInstallments = payment.installmentsPending || quota.installments?.total || 1;
    }

    // Abrir modal para voucher (para todos los tipos de cuota ahora)
    setPaymentData({
      quotaId,
      houseId,
      voucherNumber: '',
      installmentsCount: 1,
      maxInstallments
    });
    setShowPaymentModal(true);
  };

  const handleRecordInstallmentPayment = async () => {
    try {
      setLoading(true);
      setError('');

      if (!paymentData.voucherNumber.trim()) {
        setError('Debes ingresar el número de voucher/boleta');
        return;
      }

      const installmentsCount = parseInt(paymentData.installmentsCount) || 1;

      const quota = quotas.find(q => q.id === paymentData.quotaId);
      const updatedPayments = { ...quota.payments };
      const payment = updatedPayments[paymentData.houseId];

      const isInstallments = quota.paymentType === PAYMENT_TYPES.INSTALLMENTS;

      if (isInstallments) {
        // Cuota mensual - registrar múltiples pagos
        if (!payment.installmentPayments) {
          payment.installmentPayments = [];
        }

        // Calcular el monto por cuota (usar payment.monthlyAmount que es por casa, NO quota.monthlyAmount que es total)
        const amountPerInstallment = payment.monthlyAmount;

        // Registrar cada pago mensual
        for (let i = 0; i < installmentsCount; i++) {
          payment.installmentPayments.push({
            voucherNumber: paymentData.voucherNumber,
            paidAt: new Date().toISOString(),
            amount: amountPerInstallment,
            installmentNumber: payment.installmentPayments.length + 1
          });
        }

        // Actualizar contadores
        payment.installmentsPaid = payment.installmentPayments.length;
        payment.installmentsPending = (quota.installments?.total || 1) - payment.installmentsPaid;

        // Si completó todas las cuotas, marcar como pagado
        if (payment.installmentsPaid >= (quota.installments?.total || 1)) {
          payment.status = 'paid';
          payment.paidAt = new Date().toISOString();
        } else {
          payment.status = 'partial';
        }
      } else {
        // Pago único
        if (paymentData.paymentMode === 'partial') {
          // Abono parcial
          const partialAmount = parseFloat(paymentData.partialAmount);
          if (!partialAmount || partialAmount <= 0) {
            setError('Debes ingresar un monto válido');
            return;
          }

          const totalOwed = payment.amount;
          const alreadyPaid = payment.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
          const remaining = totalOwed - alreadyPaid;

          if (partialAmount > remaining) {
            setError(`El abono no puede ser mayor al saldo pendiente ($${remaining.toLocaleString('es-CL')})`);
            return;
          }

          if (!payment.partialPayments) {
            payment.partialPayments = [];
          }

          payment.partialPayments.push({
            voucherNumber: paymentData.voucherNumber,
            amount: partialAmount,
            paidAt: new Date().toISOString()
          });

          const newTotalPaid = alreadyPaid + partialAmount;
          
          if (newTotalPaid >= totalOwed) {
            payment.status = 'paid';
            payment.paidAt = new Date().toISOString();
          } else {
            payment.status = 'partial';
          }
        } else {
          // Pago completo
          payment.status = 'paid';
          payment.paidAt = new Date().toISOString();
          payment.voucherNumber = paymentData.voucherNumber;
        }
      }

      await updateDoc(doc(firestore, 'quotas', paymentData.quotaId), {
        payments: updatedPayments
      });

      // Cerrar modal y recargar
      setShowPaymentModal(false);
      setPaymentData({ quotaId: null, houseId: null, voucherNumber: '', installmentsCount: 1, partialAmount: '', paymentMode: 'full' });
      await loadData();

    } catch (err) {
      console.error('Error al registrar pago:', err);
      setError('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handlePartialPayment = (quotaId, houseId) => {
    const quota = quotas.find(q => q.id === quotaId);
    const payment = quota.payments[houseId];
    
    setPaymentData({
      quotaId,
      houseId,
      voucherNumber: '',
      installmentsCount: 1,
      partialAmount: ''
    });
    setShowPartialPaymentModal(true);
  };

  const handleDeletePayment = async (quotaId, houseId) => {
    if (!window.confirm('¿Estás seguro de eliminar todos los pagos registrados para esta parcela? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const quota = quotas.find(q => q.id === quotaId);
      const updatedPayments = { ...quota.payments };
      const payment = updatedPayments[houseId];

      // Resetear el pago a estado inicial
      payment.status = 'pending';
      payment.paidAt = null;
      delete payment.voucherNumber;
      delete payment.installmentPayments;
      delete payment.partialPayments;
      delete payment.installmentsPaid;
      delete payment.installmentsPending;

      // Si es cuota mensual, restaurar contadores
      if (quota.paymentType === 'installments') {
        payment.installmentsPaid = 0;
        payment.installmentsPending = quota.installments?.total || 1;
      }

      await updateDoc(doc(firestore, 'quotas', quotaId), {
        payments: updatedPayments
      });

      await loadData();
    } catch (err) {
      console.error('Error al eliminar pago:', err);
      setError('Error al eliminar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPartialPayment = async () => {
    try {
      setLoading(true);
      setError('');

      // Validaciones
      if (!paymentData.voucherNumber.trim()) {
        setError('Debes ingresar el número de voucher/boleta');
        return;
      }

      const partialAmount = parseFloat(paymentData.partialAmount);
      if (!partialAmount || partialAmount <= 0) {
        setError('Debes ingresar un monto válido');
        return;
      }

      const quota = quotas.find(q => q.id === paymentData.quotaId);
      const payment = quota.payments[paymentData.houseId];

      // Calcular cuánto debe en total
      const totalOwed = payment.amount;
      const alreadyPaid = payment.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const remaining = totalOwed - alreadyPaid;

      if (partialAmount > remaining) {
        setError(`El abono no puede ser mayor al saldo pendiente ($${remaining.toLocaleString('es-CL')})`);
        return;
      }

      // Actualizar pagos
      const updatedPayments = { ...quota.payments };
      
      if (!updatedPayments[paymentData.houseId].partialPayments) {
        updatedPayments[paymentData.houseId].partialPayments = [];
      }

      updatedPayments[paymentData.houseId].partialPayments.push({
        voucherNumber: paymentData.voucherNumber,
        amount: partialAmount,
        paidAt: new Date().toISOString()
      });

      // Calcular nuevo total pagado
      const newTotalPaid = alreadyPaid + partialAmount;
      
      // Actualizar status
      if (newTotalPaid >= totalOwed) {
        updatedPayments[paymentData.houseId].status = 'paid';
        updatedPayments[paymentData.houseId].paidAt = new Date().toISOString();
      } else {
        updatedPayments[paymentData.houseId].status = 'partial';
      }

      await updateDoc(doc(firestore, 'quotas', paymentData.quotaId), {
        payments: updatedPayments
      });

      // Cerrar modal y recargar
      setShowPartialPaymentModal(false);
      setPaymentData({ quotaId: null, houseId: null, voucherNumber: '', installmentsCount: 1, partialAmount: '', paymentMode: 'full' });
      await loadData();

    } catch (err) {
      console.error('Error al registrar abono:', err);
      setError('Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchVoucher = async () => {
    try {
      setLoading(true);
      const results = [];

      // Buscar en todas las cuotas
      quotas.forEach(quota => {
        Object.entries(quota.payments || {}).forEach(([houseId, payment]) => {
          // Buscar en cuotas mensuales
          if (payment.installmentPayments) {
            payment.installmentPayments.forEach((installment, index) => {
              if (installment.voucherNumber && 
                  installment.voucherNumber.toLowerCase().includes(voucherSearch.toLowerCase())) {
                results.push({
                  quotaId: quota.id,
                  quotaName: quota.name,
                  houseId,
                  voucherNumber: installment.voucherNumber,
                  amount: installment.amount,
                  paidAt: installment.paidAt,
                  installmentNumber: installment.installmentNumber || index + 1,
                  type: 'installment'
                });
              }
            });
          }
          
          // Buscar en abonos parciales
          if (payment.partialPayments) {
            payment.partialPayments.forEach((partial, index) => {
              if (partial.voucherNumber && 
                  partial.voucherNumber.toLowerCase().includes(voucherSearch.toLowerCase())) {
                results.push({
                  quotaId: quota.id,
                  quotaName: quota.name,
                  houseId,
                  voucherNumber: partial.voucherNumber,
                  amount: partial.amount,
                  paidAt: partial.paidAt,
                  type: 'partial',
                  partialNumber: index + 1
                });
              }
            });
          }
          
          // Buscar en pagos únicos
          if (payment.voucherNumber && 
              payment.voucherNumber.toLowerCase().includes(voucherSearch.toLowerCase())) {
            results.push({
              quotaId: quota.id,
              quotaName: quota.name,
              houseId,
              voucherNumber: payment.voucherNumber,
              amount: payment.amount,
              paidAt: payment.paidAt,
              type: 'one-time'
            });
          }
        });
      });

      setVoucherResults(results);
    } catch (err) {
      console.error('Error al buscar voucher:', err);
      setError('Error al buscar voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingQuota(null);
    setFormData({
      name: '',
      description: '',
      paymentType: PAYMENT_TYPES.ONE_TIME,
      installmentsCount: 12,
      category: QUOTA_CATEGORIES.OTHER,
      totalAmount: '',
      dueDate: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      selectedHouses: []
    });
    setError('');
  };

  const handleOpenCreateModal = () => {
    setEditingQuota(null);
    // Seleccionar todas las parcelas excepto house0 por defecto
    const defaultHouses = houses
      .filter(house => house.id !== 'house0')
      .map(house => house.id);
    
    setFormData({
      name: '',
      description: '',
      paymentType: PAYMENT_TYPES.ONE_TIME,
      installmentsCount: 12,
      category: QUOTA_CATEGORIES.OTHER,
      totalAmount: '',
      dueDate: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      selectedHouses: defaultHouses
    });
    setError('');
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'cancelled': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activa',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  // Filtrar cuotas
  const filteredQuotas = quotas.filter(quota => {
    const matchesSearch = 
      quota.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quota.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCategoryLabel(quota.category)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStatusLabel(quota.status)?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Cuotas Extras</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestión de cuotas adicionales (agua, reparaciones, proyectos)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowVoucherSearchModal(true);
              setVoucherSearch('');
              setVoucherResults([]);
            }}
            className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            Buscar Voucher
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Cuota
          </button>
        </div>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Cuotas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalQuotas}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Activas</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.activeQuotas}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedQuotas}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tasa de Cobro</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.collectionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, descripción, categoría o estado..."
            className="input pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Mostrando {filteredQuotas.length} de {quotas.length} cuotas
          </p>
        )}
      </div>

      {/* Quotas List */}
      <div className="space-y-4">
        {loading && quotas.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">Cargando cuotas...</div>
        ) : filteredQuotas.length === 0 ? (
          <div className="card p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {searchTerm 
                ? 'No se encontraron cuotas que coincidan con la búsqueda'
                : 'No hay cuotas creadas'
              }
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : 'Crea la primera cuota haciendo clic en "Nueva Cuota"'
              }
            </p>
          </div>
        ) : (
          filteredQuotas.map(quota => {
            const progress = calculateQuotaProgress(quota);
            const isExpanded = expandedQuotas[quota.id];
            return (
              <div key={quota.id} className="card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => toggleQuotaExpansion(quota.id)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title={isExpanded ? "Ocultar detalles" : "Mostrar detalles"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        )}
                      </button>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{quota.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quota.status)}`}>
                        {getStatusLabel(quota.status)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30">
                        {getCategoryLabel(quota.category)}
                      </span>
                    </div>
                    {quota.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{quota.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                      <span>Vence: {quota.dueDate.toDate().toLocaleDateString('es-CL')}</span>
                      <span>Distribución: {getDistributionLabel(quota.distributionType)}</span>
                      {quota.startDate && (
                        <span className="text-blue-600 dark:text-blue-400">
                          Inicio: {quota.startDate.toDate().toLocaleDateString('es-CL')}
                        </span>
                      )}
                      {quota.endDate && (
                        <span className="text-amber-600 dark:text-amber-400">
                          Fin: {quota.endDate.toDate().toLocaleDateString('es-CL')}
                          {new Date(quota.endDate.toDate()) < new Date() && ' ✓ Finalizada'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuota(quota)}
                      className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuota(quota.id)}
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Progreso</span>
                    <span className="text-slate-900 dark:text-white font-medium">{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-green-600 dark:text-green-400">Recaudado: ${progress.collected.toLocaleString('es-CL')}</span>
                    <span className="text-red-600 dark:text-red-400">Pendiente: ${progress.pending.toLocaleString('es-CL')}</span>
                  </div>
                </div>

                {/* Payments Table - Solo visible cuando está expandida */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Parcela</th>
                          <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Monto</th>
                          <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Estado</th>
                          <th className="text-left text-slate-600 dark:text-slate-400 font-medium p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortHousesNumerically(Object.entries(quota.payments || {})).map(([houseId, payment]) => {
                          // Extraer el número de la parcela para mostrar "Parcela 10" en lugar de "house10"
                          const parcelaNum = houseId.replace('house', '');
                          return (
                            <tr key={houseId} className="border-b border-slate-200 dark:border-slate-700/50">
                              <td className="p-2 text-slate-900 dark:text-white">Parcela {parcelaNum}</td>
                              <td className="p-2">
                                {(() => {
                                  const totalOwed = payment.amount;
                                  const partialPaid = payment.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                                  const remaining = totalOwed - partialPaid;
                                  
                                  if (payment.partialPayments && payment.partialPayments.length > 0) {
                                    return (
                                      <div className="flex flex-col">
                                        <span className="text-slate-400 dark:text-slate-500 text-xs line-through">
                                          ${totalOwed.toLocaleString('es-CL')}
                                        </span>
                                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                                          Saldo: ${remaining.toLocaleString('es-CL')}
                                        </span>
                                        <span className="text-green-600 dark:text-green-400 text-xs">
                                          Pagado: ${partialPaid.toLocaleString('es-CL')}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return (
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      ${totalOwed.toLocaleString('es-CL')}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-2">
                                {payment.status === 'paid' ? (
                                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Pagado
                                  </span>
                                ) : payment.status === 'partial' ? (
                                  <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {payment.partialPayments ? (
                                      `Abonos (${payment.partialPayments.length})`
                                    ) : (
                                      `Parcial (${payment.installmentsPaid || 0}/${quota.installments?.total || 1})`
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Pendiente
                                    {quota.paymentType === PAYMENT_TYPES.INSTALLMENTS && (
                                      <span className="text-xs">(0/{quota.installments?.total || 1})</span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="p-2">
                                <div className="flex flex-col gap-1">
                                  {payment.status !== 'paid' && (
                                    <button
                                      onClick={() => handleMarkAsPaid(quota.id, houseId)}
                                      disabled={loading}
                                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs flex items-center gap-1"
                                    >
                                      {quota.paymentType === PAYMENT_TYPES.INSTALLMENTS ? (
                                        <>
                                          <Receipt className="w-3 h-3" />
                                          Registrar Cuota
                                        </>
                                      ) : (
                                        <>
                                          <Receipt className="w-3 h-3" />
                                          Registrar Pago
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {(payment.status === 'paid' || payment.status === 'partial') && (
                                    <button
                                      onClick={() => handleDeletePayment(quota.id, houseId)}
                                      disabled={loading}
                                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs flex items-center gap-1"
                                      title="Eliminar todos los pagos registrados"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Eliminar Pagos
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingQuota ? 'Editar Cuota' : 'Nueva Cuota'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ej: Cuota de Agua Octubre 2024"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Detalles adicionales..."
                />
              </div>

              {/* Categoría y Monto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {Object.entries(QUOTA_CATEGORIES).map(([key, value]) => (
                      <option key={value} value={value}>
                        {getCategoryLabel(value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Monto Total *
                  </label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="input"
                    placeholder="150000"
                  />
                </div>
              </div>

              {/* Tipo de Pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Pago *
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="input"
                  >
                    {Object.entries(PAYMENT_TYPES).map(([key, value]) => (
                      <option key={value} value={value}>
                        {getPaymentTypeLabel(value)}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.paymentType === PAYMENT_TYPES.INSTALLMENTS && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Número de Cuotas *
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="24"
                      value={formData.installmentsCount}
                      onChange={(e) => setFormData({ ...formData, installmentsCount: e.target.value })}
                      className="input"
                    />
                  </div>
                )}
              </div>

              {/* Fecha de Vencimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              {/* Fechas de Vigencia */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Desde cuándo aplica esta cuota
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Fecha de Fin (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Hasta cuándo está vigente
                  </p>
                </div>
              </div>

              {/* Indicador de cuota histórica */}
              {formData.startDate && new Date(formData.startDate) < new Date() && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      Cuota Histórica
                    </p>
                    <p className="text-amber-700 dark:text-amber-400">
                      Esta cuota comenzó en el pasado. Es útil para registrar cuotas de años anteriores.
                    </p>
                  </div>
                </div>
              )}

              {/* Indicador de cuota finalizada */}
              {formData.endDate && new Date(formData.endDate) < new Date() && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-lg p-3 flex items-start gap-2">
                  <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-800 dark:text-slate-300">
                      Cuota Finalizada
                    </p>
                    <p className="text-slate-700 dark:text-slate-400">
                      Esta cuota ya no está vigente. Aparecerá como finalizada en la lista.
                    </p>
                  </div>
                </div>
              )}

              {/* Selección de Parcelas */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Parcelas a Asignar Cuota *
                </label>
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-700/50">
                  {houses.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {houses
                        .sort((a, b) => {
                          const numA = parseInt(a.id.replace('house', '')) || 0;
                          const numB = parseInt(b.id.replace('house', '')) || 0;
                          return numA - numB;
                        })
                        .map(house => {
                          const houseNum = house.id.replace('house', '');
                          return (
                            <label key={house.id} className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.selectedHouses.includes(house.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      selectedHouses: [...formData.selectedHouses, house.id]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedHouses: formData.selectedHouses.filter(id => id !== house.id)
                                    });
                                  }
                                }}
                                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                              />
                              <span className="text-sm text-slate-900 dark:text-white">
                                Parcela {houseNum}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No hay parcelas disponibles</p>
                  )}
                </div>
                {formData.selectedHouses.length > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    {formData.selectedHouses.length} parcela{formData.selectedHouses.length > 1 ? 's' : ''} seleccionada{formData.selectedHouses.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Preview de distribución */}
              {formData.totalAmount && formData.selectedHouses.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                    Vista Previa de Distribución
                  </p>
                  <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    <p>Total: ${parseFloat(formData.totalAmount).toLocaleString('es-CL')}</p>
                    <p>Por parcela: ${(parseFloat(formData.totalAmount) / formData.selectedHouses.length).toLocaleString('es-CL')}</p>
                    {formData.paymentType === PAYMENT_TYPES.INSTALLMENTS && (
                      <>
                        <p className="text-yellow-600 dark:text-yellow-400 font-medium mt-2">Cuotas Mensuales:</p>
                        <p>Número de cuotas: {formData.installmentsCount}</p>
                        <p>Cuota mensual por parcela: ${Math.round((parseFloat(formData.totalAmount) / formData.selectedHouses.length) / parseInt(formData.installmentsCount)).toLocaleString('es-CL')}</p>
                      </>
                    )}
                    <p>Parcelas asignadas: {formData.selectedHouses.length}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQuota}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Guardando...' : editingQuota ? 'Actualizar' : 'Crear Cuota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro de Pago con Voucher */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {(() => {
                  const quota = quotas.find(q => q.id === paymentData.quotaId);
                  const isOneTime = quota?.paymentType === PAYMENT_TYPES.ONE_TIME;
                  const isPartial = paymentData.paymentMode === 'partial';
                  
                  return (
                    <>
                      {isPartial ? (
                        <Plus className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {isOneTime && isPartial ? 'Registrar Abono' : 'Registrar Pago'}
                      </h2>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {(() => {
                const quota = quotas.find(q => q.id === paymentData.quotaId);
                const isOneTime = quota?.paymentType === PAYMENT_TYPES.ONE_TIME;
                const payment = quota?.payments?.[paymentData.houseId];

                return (
                  <>
                    {isOneTime && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                          Tipo de Pago *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPaymentData({ ...paymentData, paymentMode: 'full' })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              paymentData.paymentMode === 'full'
                                ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                            }`}
                          >
                            <div className="text-center">
                              <CheckCircle2 className={`w-6 h-6 mx-auto mb-2 ${
                                paymentData.paymentMode === 'full' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                              }`} />
                              <p className="font-medium text-slate-900 dark:text-white">Pago Completo</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                ${payment?.amount.toLocaleString('es-CL')}
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => setPaymentData({ ...paymentData, paymentMode: 'partial' })}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              paymentData.paymentMode === 'partial'
                                ? 'border-green-500 bg-green-100 dark:bg-green-900/30'
                                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                            }`}
                          >
                            <div className="text-center">
                              <Plus className={`w-6 h-6 mx-auto mb-2 ${
                                paymentData.paymentMode === 'partial' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'
                              }`} />
                              <p className="font-medium text-slate-900 dark:text-white">Abono</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Pago parcial</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {paymentData.paymentMode === 'partial' && isOneTime && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">Monto total:</span>
                          <span className="text-slate-900 dark:text-white font-medium">${payment?.amount.toLocaleString('es-CL')}</span>
                        </div>
                        {payment?.partialPayments && payment.partialPayments.length > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-700 dark:text-slate-300">Ya pagado:</span>
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ${payment.partialPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('es-CL')}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                              <span className="text-slate-900 dark:text-white font-medium">Saldo pendiente:</span>
                              <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                                ${(payment.amount - payment.partialPayments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString('es-CL')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {paymentData.paymentMode === 'partial' && isOneTime && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Monto del Abono *
                        </label>
                        <input
                          type="number"
                          value={paymentData.partialAmount}
                          onChange={(e) => setPaymentData({ ...paymentData, partialAmount: e.target.value })}
                          className="input"
                          placeholder="Ej: 50000"
                          min="0"
                          max={payment?.amount - (payment?.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0)}
                        />
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Ingresa el número de voucher o boleta del talonario numerado para registrar este pago.
                      </p>
                      
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Número de Voucher/Boleta *
                      </label>
                      <input
                        type="text"
                        value={paymentData.voucherNumber}
                        onChange={(e) => setPaymentData({ ...paymentData, voucherNumber: e.target.value })}
                        className="input"
                        placeholder="Ej: 001234"
                        autoFocus
                      />
                    </div>
                  </>
                );
              })()}

              {paymentData.maxInstallments > 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ¿Cuántas cuotas pagar con este voucher? *
                  </label>
                  <select
                    value={paymentData.installmentsCount}
                    onChange={(e) => setPaymentData({ ...paymentData, installmentsCount: e.target.value })}
                    className="input"
                  >
                    {Array.from({ length: paymentData.maxInstallments }, (_, i) => i + 1).map(num => {
                      const quota = quotas.find(q => q.id === paymentData.quotaId);
                      const payment = quota?.payments?.[paymentData.houseId];
                      const amount = payment?.monthlyAmount || quota?.monthlyAmount || 0;
                      const totalAmount = amount * num;
                      
                      return (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'cuota' : 'cuotas'} (${totalAmount.toLocaleString('es-CL')})
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Quedarán {paymentData.maxInstallments - paymentData.installmentsCount} {paymentData.maxInstallments - paymentData.installmentsCount === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Nota:</strong> Este número quedará registrado para control y trazabilidad del pago.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentData({ quotaId: null, houseId: null, voucherNumber: '', installmentsCount: 1, partialAmount: '', paymentMode: 'full' });
                  setError('');
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordInstallmentPayment}
                disabled={loading || !paymentData.voucherNumber.trim() || (paymentData.paymentMode === 'partial' && !paymentData.partialAmount)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Registrando...' : (
                  paymentData.paymentMode === 'partial' ? 'Registrar Abono' : 'Registrar Pago'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Búsqueda de Vouchers */}
      {showVoucherSearchModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Buscar Voucher</h2>
                </div>
                <button
                  onClick={() => {
                    setShowVoucherSearchModal(false);
                    setVoucherSearch('');
                    setVoucherResults([]);
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  placeholder="Ingresa número de voucher o boleta (Ej: 001234)..."
                  className="flex-1 input"
                  autoFocus
                />
                <button
                  onClick={handleSearchVoucher}
                  disabled={!voucherSearch.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <Receipt className="w-5 h-5" />
                  Buscar
                </button>
              </div>

              {voucherResults.length > 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100 dark:bg-slate-700">
                        <tr>
                          <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-medium">Voucher</th>
                          <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-medium">Cuota</th>
                          <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-medium">Parcela</th>
                          <th className="text-right p-3 text-slate-700 dark:text-slate-300 font-medium">Monto</th>
                          <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-medium">Fecha Pago</th>
                          <th className="text-left p-3 text-slate-700 dark:text-slate-300 font-medium">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {voucherResults.map((result, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="p-3">
                              <span className="text-yellow-600 dark:text-yellow-400 font-mono font-bold">
                                {result.voucherNumber}
                              </span>
                            </td>
                            <td className="p-3 text-slate-900 dark:text-white">{result.quotaName}</td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">
                              Parcela {result.houseId.replace('house', '')}
                            </td>
                            <td className="p-3 text-right text-green-600 dark:text-green-400 font-medium">
                              ${result.amount.toLocaleString('es-CL')}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">
                              {new Date(result.paidAt).toLocaleDateString('es-CL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="p-3">
                              {result.type === 'installment' ? (
                                <span className="text-blue-600 dark:text-blue-400 text-sm">
                                  Cuota mensual {result.installmentNumber}
                                </span>
                              ) : result.type === 'partial' ? (
                                <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                                  <Plus className="w-3 h-3" />
                                  Abono {result.partialNumber}
                                </span>
                              ) : (
                                <span className="text-purple-600 dark:text-purple-400 text-sm">
                                  Pago Único
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Se encontraron <span className="text-slate-900 dark:text-white font-medium">{voucherResults.length}</span> registro(s) con el voucher <span className="text-yellow-600 dark:text-yellow-400 font-mono">{voucherSearch}</span>
                    </p>
                  </div>
                </div>
              ) : voucherSearch && (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-700 dark:text-slate-300">No se encontraron pagos con ese número de voucher</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Verifica que el número sea correcto</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => {
                  setShowVoucherSearchModal(false);
                  setVoucherSearch('');
                  setVoucherResults([]);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Abono Parcial */}
      {showPartialPaymentModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Registrar Abono</h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {(() => {
                const quota = quotas.find(q => q.id === paymentData.quotaId);
                const payment = quota?.payments?.[paymentData.houseId];
                const totalOwed = payment?.amount || 0;
                const alreadyPaid = payment?.partialPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
                const remaining = totalOwed - alreadyPaid;

                return (
                  <>
                    <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Monto total:</span>
                        <span className="text-white font-medium">${totalOwed.toLocaleString('es-CL')}</span>
                      </div>
                      {alreadyPaid > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Ya pagado:</span>
                          <span className="text-green-400 font-medium">${alreadyPaid.toLocaleString('es-CL')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-gray-300 font-medium">Saldo pendiente:</span>
                        <span className="text-yellow-400 font-bold">${remaining.toLocaleString('es-CL')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Monto del Abono *
                      </label>
                      <input
                        type="number"
                        value={paymentData.partialAmount}
                        onChange={(e) => setPaymentData({ ...paymentData, partialAmount: e.target.value })}
                        className="input"
                        placeholder="Ej: 50000"
                        min="0"
                        max={remaining}
                        autoFocus
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Máximo: ${remaining.toLocaleString('es-CL')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Número de Voucher/Boleta *
                      </label>
                      <input
                        type="text"
                        value={paymentData.voucherNumber}
                        onChange={(e) => setPaymentData({ ...paymentData, voucherNumber: e.target.value })}
                        className="input"
                        placeholder="Ej: 001234"
                      />
                    </div>

                    {payment?.partialPayments && payment.partialPayments.length > 0 && (
                      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                        <p className="text-sm text-blue-300 font-medium mb-2">
                          Abonos anteriores ({payment.partialPayments.length}):
                        </p>
                        <div className="space-y-1">
                          {payment.partialPayments.map((p, i) => (
                            <div key={i} className="flex justify-between text-xs text-blue-200">
                              <span>Voucher: {p.voucherNumber}</span>
                              <span>${p.amount.toLocaleString('es-CL')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-300">
                  <strong>Nota:</strong> El abono se registrará con el número de voucher para control y trazabilidad. El saldo se actualizará automáticamente.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPartialPaymentModal(false);
                  setPaymentData({ quotaId: null, houseId: null, voucherNumber: '', installmentsCount: 1, partialAmount: '', paymentMode: 'full' });
                  setError('');
                }}
                className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecordPartialPayment}
                disabled={loading || !paymentData.voucherNumber.trim() || !paymentData.partialAmount}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium"
              >
                {loading ? 'Registrando...' : 'Registrar Abono'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





