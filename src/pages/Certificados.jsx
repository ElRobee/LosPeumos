import { useState, useEffect } from 'react';
import { FileText, Download, Search, Calendar, User, Home, X, Edit2, Trash2 } from 'lucide-react';
import { collection, query, getDocs, addDoc, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import {
  generateCertificatePDF,
  generateCertificateNumber,
  blobToBase64,
  downloadCertificatePDF,
  formatRut
} from '../services/certificateGenerator';

export default function Certificados() {
  const [certificates, setCertificates] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    houseId: '',
    residentName: '',
    residentRut: '',
    purpose: '',
    issuedBy: 'Administración'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar casas
      const housesSnapshot = await getDocs(collection(firestore, 'houses'));
      const housesData = housesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHouses(housesData);

      // Cargar certificados
      const certsQuery = query(
        collection(firestore, 'certificates'),
        orderBy('issuedAt', 'desc')
      );
      const certsSnapshot = await getDocs(certsQuery);
      const certsData = certsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCertificates(certsData);

    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    // Si está en modo edición, llamar a la función de actualización
    if (editingId) {
      return handleUpdateCertificate();
    }

    try {
      setLoading(true);
      setError('');

      // Validar campos
      if (!formData.houseId || !formData.residentName || !formData.residentRut) {
        setError('Completa todos los campos obligatorios');
        return;
      }

      // Buscar información de la casa
      const house = houses.find(h => h.id === formData.houseId);
      if (!house) {
        setError('Casa no encontrada');
        return;
      }

      // Generar número de certificado
      const certificateNumber = generateCertificateNumber();

      // Preparar datos
      const certData = {
        certificateNumber,
        residentName: formData.residentName,
        residentRut: formatRut(formData.residentRut),
        houseId: formData.houseId,
        houseAddress: house.address || 'Camino Los Peumos s/n',
        issueDate: new Date().toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        purpose: formData.purpose || 'Fines administrativos',
        issuedBy: formData.issuedBy
      };

      // Generar PDF
      const pdfBlob = generateCertificatePDF(certData);

      // Convertir a base64 para guardar en Firestore
      const pdfBase64 = await blobToBase64(pdfBlob);

      // Guardar en Firestore
      await addDoc(collection(firestore, 'certificates'), {
        certificateNumber,
        houseId: formData.houseId,
        residentName: formData.residentName,
        residentRut: certData.residentRut,
        purpose: certData.purpose,
        issuedBy: formData.issuedBy,
        issuedAt: new Date(),
        pdfData: pdfBase64
      });

      // Descargar automáticamente
      const fileName = `Certificado_${certificateNumber}.pdf`;
      downloadCertificatePDF(pdfBlob, fileName);

      // Recargar lista y cerrar modal
      await loadData();
      handleCloseModal();

    } catch (err) {
      console.error('Error al generar certificado:', err);
      setError('Error al generar el certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (certificate) => {
    if (!certificate.pdfData) {
      setError('PDF no disponible');
      return;
    }

    // Convertir base64 a blob
    const byteCharacters = atob(certificate.pdfData.split(',')[1]);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    // Descargar
    const fileName = `Certificado_${certificate.certificateNumber}.pdf`;
    downloadCertificatePDF(blob, fileName);
  };

  const handleCloseModal = () => {
    setShowGenerateModal(false);
    setEditingId(null);
    setFormData({
      houseId: '',
      residentName: '',
      residentRut: '',
      purpose: '',
      issuedBy: 'Administración'
    });
    setError('');
  };

  const handleEditCertificate = (cert) => {
    setEditingId(cert.id);
    setFormData({
      houseId: cert.houseId,
      residentName: cert.residentName,
      residentRut: cert.residentRut,
      purpose: cert.purpose,
      issuedBy: cert.issuedBy
    });
    setShowGenerateModal(true);
  };

  const handleUpdateCertificate = async () => {
    try {
      setLoading(true);
      setError('');

      if (!formData.houseId || !formData.residentName || !formData.residentRut) {
        setError('Completa todos los campos obligatorios');
        setLoading(false);
        return;
      }

      const certRef = doc(firestore, 'certificates', editingId);
      await updateDoc(certRef, {
        residentName: formData.residentName,
        residentRut: formData.residentRut,
        houseId: formData.houseId,
        purpose: formData.purpose,
        issuedBy: formData.issuedBy
      });

      // Actualizar state local
      setCertificates(certificates.map(c => 
        c.id === editingId 
          ? { ...c, ...formData }
          : c
      ));

      handleCloseModal();
    } catch (err) {
      console.error('Error al actualizar certificado:', err);
      setError('Error al actualizar certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (certId) => {
    try {
      setLoading(true);
      await deleteDoc(doc(firestore, 'certificates', certId));
      setCertificates(certificates.filter(c => c.id !== certId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error al eliminar certificado:', err);
      setError('Error al eliminar certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleHouseChange = (houseId) => {
    setFormData({ ...formData, houseId });

    // Auto-completar nombre si la casa tiene owner
    const house = houses.find(h => h.id === houseId);
    if (house && house.owner) {
      setFormData(prev => ({
        ...prev,
        houseId,
        residentName: house.owner
      }));
    }
  };

  // Filtrar certificados
  const filteredCertificates = certificates.filter(cert =>
    cert.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.houseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Certificados de Residencia</h1>
          <p className="text-slate-600 dark:text-slate-400">Genera y descarga certificados para residentes</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          Generar Certificado
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 w-5 h-5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, casa o número de certificado..."
          className="w-full input pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Limpiar búsqueda"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Certificados</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{certificates.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Este Mes</p>
              <p className="text-2xl font-bold text-green-400">
                {certificates.filter(c => {
                  const certDate = c.issuedAt.toDate();
                  const now = new Date();
                  return certDate.getMonth() === now.getMonth() &&
                         certDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Casas Atendidas</p>
              <p className="text-2xl font-bold text-purple-400">
                {new Set(certificates.map(c => c.houseId)).size}
              </p>
            </div>
            <Home className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-3">
        {loading && certificates.length === 0 ? (
          <div className="text-center py-12 text-slate-600 dark:text-slate-400">Cargando certificados...</div>
        ) : filteredCertificates.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {searchTerm ? 'No se encontraron resultados' : 'No hay certificados generados'}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Genera el primer certificado haciendo clic en "Generar Certificado"'
              }
            </p>
          </div>
        ) : (
          filteredCertificates.map(cert => (
            <div key={cert.id} className="card p-6 flex items-center justify-between hover:bg-gray-750 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-blue-900/30 rounded-lg p-3">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{cert.residentName}</h3>
                    <span className="text-sm text-slate-600 dark:text-slate-400">|</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{cert.houseId}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {cert.residentRut}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {cert.issuedAt.toDate().toLocaleDateString('es-CL')}
                    </span>
                    <span className="text-xs text-blue-400">
                      N° {cert.certificateNumber}
                    </span>
                  </div>
                  {cert.purpose && (
                    <p className="text-sm text-gray-500 mt-1">Para: {cert.purpose}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadCertificate(cert)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                  title="Descargar certificado"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
                <button
                  onClick={() => handleEditCertificate(cert)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                  title="Editar certificado"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(cert.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                  title="Eliminar certificado"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>

              {/* Delete Confirmation */}
              {showDeleteConfirm === cert.id && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="card p-6 max-w-sm">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                      ¿Eliminar certificado?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar el certificado de {cert.residentName}?
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {editingId ? 'Editar Certificado' : 'Generar Certificado de Residencia'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {editingId ? 'Actualiza los datos del certificado' : 'Completa los datos para generar el certificado'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Casa */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Casa / Parcela *
                </label>
                <select
                  value={formData.houseId}
                  onChange={(e) => handleHouseChange(e.target.value)}
                  className="input"
                >
                  <option value="">Seleccionar casa...</option>
                  {houses.map(house => (
                    <option key={house.id} value={house.id}>
                      {house.id} {house.owner && `- ${house.owner}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre Completo del Residente *
                </label>
                <input
                  type="text"
                  value={formData.residentName}
                  onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
                  className="input"
                  placeholder="Juan Pérez González"
                />
              </div>

              {/* RUT */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  RUT *
                </label>
                <input
                  type="text"
                  value={formData.residentRut}
                  onChange={(e) => setFormData({ ...formData, residentRut: e.target.value })}
                  className="input"
                  placeholder="12345678-9"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ingresa el RUT sin puntos, con guión
                </p>
              </div>

              {/* Propósito */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Propósito / Para ser presentado en
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="input"
                  placeholder="Banco, municipalidad, empresa, etc."
                />
              </div>

              {/* Emitido por */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Emitido por
                </label>
                <input
                  type="text"
                  value={formData.issuedBy}
                  onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                  className="input"
                  placeholder="Nombre del administrador"
                />
              </div>

              {/* Preview info */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300 mb-2">📄 Información del certificado:</p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Se generará un PDF descargable automáticamente</li>
                  <li>• El certificado incluirá un número único de identificación</li>
                  <li>• Válido por 90 días desde su emisión</li>
                  <li>• Incluye firma digital de la administración</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateCertificate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                {loading ? (
                  editingId ? 'Actualizando...' : 'Generando...'
                ) : (
                  <>
                    {editingId ? (
                      <>
                        <Edit2 className="w-4 h-4" />
                        Actualizar
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generar y Descargar
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









