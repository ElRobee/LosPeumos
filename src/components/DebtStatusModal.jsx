import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { X, FileText, Download, MessageCircle } from 'lucide-react';
import jsPDF from 'jspdf';

export default function DebtStatusModal({ isOpen, onClose }) {
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState('');
  const [loading, setLoading] = useState(false);
  const [debtData, setDebtData] = useState(null);

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('role', '==', 'residente'));
      const snapshot = await getDocs(q);
      
      const housesData = snapshot.docs
        .map(doc => ({
          id: doc.data().houseId,
          name: `Parcela ${doc.data().houseId.replace('house', '')}`,
          resident: doc.data().displayName || doc.data().email,
          phone: doc.data().phone || ''
        }))
        .sort((a, b) => {
          const numA = parseInt(a.id.replace('house', ''));
          const numB = parseInt(b.id.replace('house', ''));
          return numA - numB;
        });
      
      setHouses(housesData);
    } catch (error) {
      console.error('Error loading houses:', error);
    }
  };

  const loadDebtData = async (houseId) => {
    try {
      setLoading(true);

      // Cargar cuotas pendientes
      const quotasRef = collection(firestore, 'quotas');
      const quotasSnapshot = await getDocs(quotasRef);
      const pendingQuotas = [];
      const paidQuotas = [];
      
      quotasSnapshot.docs.forEach(doc => {
        const quota = { id: doc.id, ...doc.data() };
        if (quota.payments && quota.payments[houseId]) {
          const payment = quota.payments[houseId];
          
          // Calcular monto pagado
          let amountPaid = 0;
          if (payment.status === 'paid') {
            amountPaid = payment.amount;
          } else if (payment.status === 'partial') {
            if (payment.installmentPayments && payment.installmentPayments.length > 0) {
              amountPaid = payment.installmentPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            } else if (payment.partialPayments && payment.partialPayments.length > 0) {
              amountPaid = payment.partialPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            }
          }
          
          const amountPending = payment.amount - amountPaid;
          
          const quotaData = {
            id: quota.id,
            name: quota.name,
            category: quota.category,
            totalAmount: payment.amount,
            amountPaid,
            amountPending,
            status: payment.status,
            dueDate: quota.dueDate,
            paymentType: quota.paymentType,
            installmentsPaid: payment.installmentsPaid,
            installmentsTotal: quota.installments?.total
          };
          
          if (amountPending > 0) {
            pendingQuotas.push(quotaData);
          } else {
            paidQuotas.push(quotaData);
          }
        }
      });

      // Ordenar por fecha
      pendingQuotas.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

      setDebtData({
        houseId,
        pendingQuotas
      });
      
    } catch (error) {
      console.error('Error loading debt data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseChange = (houseId) => {
    setSelectedHouse(houseId);
    if (houseId) {
      loadDebtData(houseId);
    } else {
      setDebtData(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const generatePDF = () => {
    if (!debtData) return;

    const doc = new jsPDF();
    const house = houses.find(h => h.id === debtData.houseId);
    
    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE DEUDA', 105, 22, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Comunidad Los Peumos', 105, 33, { align: 'center' });
    
    // Información de la parcela
    let yPos = 60;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Parcela: ${house.name}`, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Residente: ${house.resident}`, 20, yPos + 7);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 20, yPos + 14);
    
    yPos += 30;
    
    // Calcular total de deuda
    const totalPendingQuotas = debtData.pendingQuotas.reduce((sum, q) => sum + (q.amountPending || 0), 0);
    
    // Resumen de deuda
    doc.setFillColor(239, 246, 255);
    doc.rect(20, yPos, 170, 30, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('RESUMEN DE DEUDA', 105, yPos + 10, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 38);
    doc.text(`TOTAL: ${formatCurrency(totalPendingQuotas)}`, 105, yPos + 23, { align: 'center' });
    
    yPos += 45;
    
    // Cuotas extraordinarias pendientes
    if (debtData.pendingQuotas.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('CUOTAS EXTRAORDINARIAS PENDIENTES', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      debtData.pendingQuotas.forEach((quota, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Determinar la altura según el tipo de cuota
        const cellHeight = (quota.paymentType === 'installments' || quota.amountPaid > 0) ? 14 : 12;
        
        // Fondo alternado para mejor lectura
        doc.setFillColor(index % 2 === 0 ? 249 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 251 : 255);
        doc.rect(20, yPos - 4, 170, cellHeight, 'F');
        
        // Nombre de la cuota
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${quota.name}`, 25, yPos + 2);
        
        // Detalles según el tipo de pago
        if (quota.paymentType === 'installments' && quota.installmentsPaid !== undefined) {
          // Cuotas mensuales
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`Cuotas pagadas: ${quota.installmentsPaid} de ${quota.installmentsTotal}`, 25, yPos + 7);
          doc.text(`Monto pagado: ${formatCurrency(quota.amountPaid)}`, 100, yPos + 7);
          doc.setTextColor(0, 0, 0);
        } else if (quota.amountPaid > 0) {
          // Pago único con abonos
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`Monto total: ${formatCurrency(quota.totalAmount)}`, 25, yPos + 7);
          doc.text(`Monto pagado: ${formatCurrency(quota.amountPaid)}`, 100, yPos + 7);
          doc.setTextColor(0, 0, 0);
        } else {
          // Pago único sin abonos
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(`Monto total: ${formatCurrency(quota.totalAmount)}`, 25, yPos + 7);
          doc.setTextColor(0, 0, 0);
        }
        
        // Monto pendiente (destacado)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38);
        doc.text(`${formatCurrency(quota.amountPending)}`, 185, yPos + 4, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        yPos += cellHeight;
      });
      
      yPos += 8;
      
      // Total final
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.line(130, yPos, 185, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`TOTAL ADEUDADO:`, 130, yPos);
      doc.setTextColor(220, 38, 38);
      doc.text(`${formatCurrency(totalPendingQuotas)}`, 185, yPos, { align: 'right' });
      yPos += 10;
    } else {
      // Sin deudas
      doc.setFillColor(240, 253, 244);
      doc.rect(20, yPos, 170, 20, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94);
      doc.text('¡No hay cuotas pendientes!', 105, yPos + 12, { align: 'center' });
      yPos += 30;
    }
    
    // Footer
    yPos = 275;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPos, 190, yPos);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es un estado de cuenta informativo.', 105, yPos + 5, { align: 'center' });
    doc.text('Para consultas, contactar a la administración de la comunidad.', 105, yPos + 10, { align: 'center' });
    
    // Guardar
    doc.save(`Estado_Deuda_${house.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const sendWhatsApp = () => {
    if (!debtData) return;

    const house = houses.find(h => h.id === debtData.houseId);
    const totalPendingQuotas = debtData.pendingQuotas.reduce((sum, q) => sum + (q.amountPending || 0), 0);
    
    // Limpiar número de teléfono
    const cleanPhone = house.phone ? house.phone.replace(/[^0-9]/g, '') : '';
    
    // Construir el mensaje sin emojis
    let message = `*ESTADO DE DEUDA*\n`;
    message += `*Comunidad Los Peumos*\n\n`;
    message += `----------------------------------------\n\n`;
    message += `*PARCELA:* ${house.name}\n`;
    message += `*RESIDENTE:* ${house.resident}\n`;
    message += `*FECHA:* ${new Date().toLocaleDateString('es-CL')}\n\n`;
    message += `----------------------------------------\n\n`;
    
    if (debtData.pendingQuotas.length > 0) {
      message += `*TOTAL ADEUDADO: ${formatCurrency(totalPendingQuotas)}*\n\n`;
      message += `*DETALLE DE CUOTAS PENDIENTES:*\n\n`;
      
      debtData.pendingQuotas.forEach((quota, index) => {
        message += `${index + 1}. *${quota.name}*\n`;
        
        if (quota.paymentType === 'installments') {
          message += `   - Cuotas pagadas: ${quota.installmentsPaid} de ${quota.installmentsTotal}\n`;
          message += `   - Monto pagado: ${formatCurrency(quota.amountPaid)}\n`;
        } else if (quota.amountPaid > 0) {
          message += `   - Monto total: ${formatCurrency(quota.totalAmount)}\n`;
          message += `   - Monto pagado: ${formatCurrency(quota.amountPaid)}\n`;
        } else {
          message += `   - Monto total: ${formatCurrency(quota.totalAmount)}\n`;
        }
        
        message += `   *- PENDIENTE: ${formatCurrency(quota.amountPending)}*\n\n`;
      });
    } else {
      message += `*NO HAY CUOTAS PENDIENTES*\n`;
      message += `Esta parcela esta al dia con sus pagos.\n\n`;
    }
    
    message += `----------------------------------------\n\n`;
    message += `_Documento informativo generado el ${new Date().toLocaleDateString('es-CL')}_\n\n`;
    message += `Para consultas, contactar a la administracion de la comunidad.`;
    
    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Abrir WhatsApp con el número de teléfono si existe
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Estado de Deuda</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Selector de parcela */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Seleccionar Parcela
            </label>
            <select
              value={selectedHouse}
              onChange={(e) => handleHouseChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="">-- Seleccione una parcela --</option>
              {houses.map(house => (
                <option key={house.id} value={house.id}>
                  {house.name} - {house.resident}
                </option>
              ))}
            </select>
          </div>

          {/* Contenido */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-4">Cargando información...</p>
            </div>
          ) : debtData ? (
            <div className="space-y-6">
              {/* Resumen */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumen de Deuda</h3>
                <div className="flex justify-center">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Adeudado</p>
                    <p className="text-4xl font-bold text-red-700 dark:text-red-500">
                      {formatCurrency(debtData.pendingQuotas.reduce((sum, q) => sum + (q.amountPending || 0), 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalle de cuotas */}
              {debtData.pendingQuotas.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Cuotas Extraordinarias Pendientes ({debtData.pendingQuotas.length})</h4>
                  <div className="space-y-2">
                    {debtData.pendingQuotas.map(quota => (
                      <div key={quota.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{quota.name}</p>
                            {quota.paymentType === 'installments' && (
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                Cuotas pagadas: {quota.installmentsPaid}/{quota.installmentsTotal}
                              </p>
                            )}
                            {quota.amountPaid > 0 && (
                              <p className="text-sm text-green-600 dark:text-green-400">
                                Pagado: {formatCurrency(quota.amountPaid)}
                              </p>
                            )}
                          </div>
                          <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(quota.amountPending)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">¡No hay cuotas pendientes!</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Esta parcela está al día con sus pagos.</p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={generatePDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar PDF
                </button>
                <button
                  onClick={sendWhatsApp}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar por WhatsApp
                </button>
              </div>
            </div>
          ) : selectedHouse ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Cargando información de la parcela...</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Seleccione una parcela para ver su estado de deuda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

