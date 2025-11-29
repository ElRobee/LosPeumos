/**
 * Modal para subir comprobante de pago
 * Permite seleccionar archivo, vista previa y subir a Storage
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, File, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { uploadPaymentProof, validateFile } from '../services/storageService';
import { formatCurrency } from '../utils/currencyUtils';
import { getMonthName } from '../utils/dateUtils';

const UploadPaymentProof = ({ bill, userId, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const validation = validateFile(file, allowedTypes, 5 * 1024 * 1024); // 5MB max

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);
    setError('');

    // Generar vista previa para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Convertir archivo a base64 (sin usar Storage)
      const base64Data = await uploadPaymentProof(selectedFile, userId, bill.id);

      // Crear registro de pago en Firestore con base64
      const paymentData = {
        billId: bill.id,
        houseId: bill.houseId,
        userId,
        amount: bill.total,
        method: 'transfer', // transferencia bancaria
        proofData: base64Data, // Guardamos el base64 en lugar de URL
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        validated: false,
        validatedBy: null,
        validatedAt: null,
        createdAt: new Date().toISOString(),
        notes: `Comprobante subido por residente para boleta ${bill.year}-${String(bill.month).padStart(2, '0')}`
      };

      await addDoc(collection(firestore, 'payments'), paymentData);

      setSuccess(true);
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error al subir comprobante:', err);
      setError(`Error al subir el comprobante: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Subir Comprobante
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {getMonthName(bill.month)} {bill.year} • {formatCurrency(bill.total)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Información de pago */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Datos para transferencia:
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <p><strong>Banco:</strong> Banco Estado</p>
            <p><strong>Tipo de cuenta:</strong> Cuenta Corriente</p>
            <p><strong>Número de cuenta:</strong> 12345678</p>
            <p><strong>RUT:</strong> 76.XXX.XXX-X</p>
            <p><strong>Referencia:</strong> BILL-{bill.year}-{String(bill.month).padStart(2, '0')}-{bill.houseId}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">
              ¡Comprobante subido exitosamente! Se notificará al administrador para su validación.
            </p>
          </div>
        )}

        {/* Área de selección de archivo */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
          >
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-medium mb-1">
              Haz clic para seleccionar archivo
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Formatos: JPG, PNG, PDF (máx. 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vista previa */}
            {preview ? (
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Vista previa"
                  className="w-full h-64 object-contain bg-slate-50 dark:bg-slate-800"
                />
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                <File className="w-16 h-16 text-slate-400" />
              </div>
            )}

            {/* Info del archivo */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <File className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                  setError('');
                }}
                disabled={uploading}
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || success}
            className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Subir Comprobante
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {success ? 'Cerrar' : 'Cancelar'}
          </button>
        </div>

        {/* Nota */}
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center">
          El comprobante será validado por el administrador. Recibirás una notificación una vez validado.
        </p>
      </div>
    </div>
  );
};

export default UploadPaymentProof;
