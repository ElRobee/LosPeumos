import { useState, useEffect } from 'react';
import { Settings, Users, Building2, Database, Save, Download, Upload, Trash2, User, Shield, Mail, Lock, CheckCircle, XCircle, AlertTriangle, Loader, FlaskConical } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateSeedData, cleanSeedData, generateRealData, cleanRealData, cleanLegacySubdivisions } from '../utils/seedDataManager';
import LoadingOverlay from '../components/LoadingOverlay';

export default function Configuracion() {
  const { userData } = useAuth();
  const isAdmin = userData?.role === 'admin';
  const isTecnico = userData?.role === 'tecnico';
  const [activeTab, setActiveTab] = useState(isTecnico ? 'condo' : 'users'); // users, condo, backup, testdata
  const [loading, setLoading] = useState(false);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationMessage, setOperationMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Estados para gestión de usuarios
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para configuración del condominio
  const [condoSettings, setCondoSettings] = useState({
    name: 'Condominio Los Peumos',
    address: 'Camino Los Peumos s/n, Colina',
    phone: '+56 9 1234 5678',
    email: 'contacto@lospeumos.cl',
    electricityFixedRate: 0,
    electricityVariableRate: 150,
    emailSenderName: 'Administración Los Peumos',
    logoUrl: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'users') {
        // Cargar usuarios
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
      } else if (activeTab === 'condo') {
        // Cargar configuración del condominio desde el documento específico
        const settingsRef = doc(firestore, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          console.log('⚙️ Configuración cargada:', data);
          setCondoSettings({ ...condoSettings, ...data });
        } else {
          console.warn('⚠️ No existe configuración guardada, usando valores por defecto');
        }
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      setLoading(true);
      await updateDoc(doc(firestore, 'users', userId), {
        role: newRole
      });
      await loadData();
      setSuccess('Rol actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      setError('Error al actualizar el rol');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      await updateDoc(doc(firestore, 'users', userId), {
        isActive: !currentStatus
      });
      await loadData();
      setSuccess('Estado actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCondoSettings = async () => {
    try {
      setLoading(true);
      await setDoc(doc(firestore, 'settings', 'general'), condoSettings);
      setSuccess('Configuración guardada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setError('Error al guardar la configuración');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para modales de usuario
  const handleOpenUserDetails = (user) => {
    setSelectedUser({ ...user });
    setShowUserDetailsModal(true);
  };

  const handleCloseUserDetails = () => {
    setShowUserDetailsModal(false);
    setSelectedUser(null);
  };

  const handleSaveUserDetails = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await updateDoc(doc(firestore, 'users', selectedUser.id), {
        name: selectedUser.name,
        email: selectedUser.email,
        houseId: selectedUser.houseId,
        phone: selectedUser.phone || ''
      });
      await loadData();
      setSuccess('Usuario actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
      handleCloseUserDetails();
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      setError('Error al actualizar el usuario');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPasswordChange = (user) => {
    setUserForPasswordChange(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setUserForPasswordChange(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async () => {
    if (!userForPasswordChange) return;
    
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      // Nota: Firebase Auth no permite cambiar contraseñas directamente desde Firestore
      // Necesitarías implementar una Cloud Function para esto
      // Por ahora, solo mostraremos un mensaje
      setError('Esta funcionalidad requiere configuración adicional en Firebase Functions');
      setTimeout(() => setError(''), 5000);
      // handleClosePasswordModal();
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setError('Error al cambiar la contraseña');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);

      // Exportar todas las colecciones
      const collections = ['users', 'houses', 'bills', 'payments', 'quotas', 'meetings', 'certificates', 'vehicles'];
      const exportData = {};

      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(firestore, collectionName));
        exportData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convertir Timestamps a strings
          createdAt: doc.data().createdAt?.toDate().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate().toISOString(),
          date: doc.data().date?.toDate().toISOString(),
          dueDate: doc.data().dueDate?.toDate().toISOString(),
        }));
      }

      // Crear archivo JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LosPeumos_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      setSuccess('Datos exportados correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error al exportar datos:', err);
      setError('Error al exportar los datos');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      presidente: 'Presidente',
      tecnico: 'Técnico',
      secretaria: 'Secretaria',
      residente: 'Residente'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
      presidente: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
      tecnico: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      secretaria: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      residente: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30'
    };
    return colors[role] || 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Configuración del Sistema</h1>
        <p className="text-slate-600 dark:text-slate-400">Administración general del condominio</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="card p-0">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {/* Tab Usuarios - Solo Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'users'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Gestión de Usuarios</span>
            </button>
          )}

          {/* Tab Datos del Condominio - Todos */}
          <button
            onClick={() => setActiveTab('condo')}
            className={`flex items-center gap-2 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'condo'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="hidden sm:inline">Datos del Condominio</span>
          </button>

          {/* Tab Backup - Solo Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Database className="w-5 h-5" />
              <span className="hidden sm:inline">Backup & Datos</span>
            </button>
          )}

          {/* Tab Datos de Prueba - Solo Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('testdata')}
              className={`flex items-center gap-2 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'testdata'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
              <span className="hidden sm:inline">Datos de Prueba</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {/* TAB: Gestión de Usuarios */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Usuarios Registrados ({users.length})</h2>
              </div>

              {loading && users.length === 0 ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  Cargando usuarios...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  No hay usuarios registrados
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Usuario</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Casa</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Rol</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Estado</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700/30">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="text-slate-900 dark:text-white font-medium">{user.name || 'Sin nombre'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.houseId || '-'}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{user.email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                              disabled={user.id === userData?.uid}
                              className="input input-sm disabled:opacity-50"
                            >
                              <option value="admin">Administrador</option>
                              <option value="presidente">Presidente</option>
                              <option value="tecnico">Técnico</option>
                              <option value="secretaria">Secretaria</option>
                              <option value="residente">Residente</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              disabled={user.id === userData?.uid}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.isActive !== false
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-red-900/30 text-red-400'
                              } disabled:opacity-50`}
                            >
                              {user.isActive !== false ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenUserDetails(user)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Ver detalles"
                              >
                                <User className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenPasswordChange(user)}
                                className="p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                                title="Cambiar contraseña"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Datos del Condominio */}
          {activeTab === 'condo' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Información del Condominio</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Condominio
                  </label>
                  <input
                    type="text"
                    value={condoSettings.name}
                    onChange={(e) => !isTecnico && setCondoSettings({ ...condoSettings, name: e.target.value })}
                    disabled={isTecnico}
                    className={`w-full input ${isTecnico ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={condoSettings.address}
                    onChange={(e) => !isTecnico && setCondoSettings({ ...condoSettings, address: e.target.value })}
                    disabled={isTecnico}
                    className={`w-full input ${isTecnico ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={condoSettings.phone}
                    onChange={(e) => !isTecnico && setCondoSettings({ ...condoSettings, phone: e.target.value })}
                    disabled={isTecnico}
                    className={`w-full input ${isTecnico ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={condoSettings.email}
                    onChange={(e) => !isTecnico && setCondoSettings({ ...condoSettings, email: e.target.value })}
                    disabled={isTecnico}
                    className={`w-full input ${isTecnico ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>

                {/* Tarifa Fija Electricidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tarifa Fija Electricidad (CLP)
                  </label>
                  <input
                    type="number"
                    value={condoSettings.electricityFixedRate}
                    onChange={(e) => !isTecnico && setCondoSettings({ ...condoSettings, electricityFixedRate: parseFloat(e.target.value) })}
                    disabled={isTecnico}
                    className={`w-full input ${isTecnico ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>

                {/* Tarifa Variable Electricidad */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tarifa Variable Electricidad (CLP/kWh)
                  </label>
                  <input
                    type="number"
                    value={condoSettings.electricityVariableRate}
                    onChange={(e) => setCondoSettings({ ...condoSettings, electricityVariableRate: parseFloat(e.target.value) })}
                    className="w-full input"
                  />
                </div>

                {/* Nombre del Remitente de Emails */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre del Remitente de Emails
                  </label>
                  <input
                    type="text"
                    value={condoSettings.emailSenderName}
                    onChange={(e) => !isTecnico && setCondoSettings({ ...condoSettings, emailSenderName: e.target.value })}
                    disabled={isTecnico}
                    className={`w-full input ${isTecnico ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-700">
                <button
                  onClick={handleSaveCondoSettings}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Guardar Configuración
                </button>
              </div>
            </div>
          )}

          {/* TAB: Backup & Datos */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Gestión de Datos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Exportar Datos */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-900/30 rounded-lg">
                      <Download className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Exportar Datos</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Descargar backup completo</p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
                    Exporta todos los datos del sistema a un archivo JSON. Incluye usuarios, casas, lecturas, pagos, reuniones y certificados.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Exportar Todo
                  </button>
                </div>

                {/* Importar Datos */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-900/30 rounded-lg">
                      <Upload className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Importar Datos</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Restaurar desde backup</p>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
                    Importa datos desde un archivo JSON previamente exportado. Esta acción sobrescribirá los datos existentes.
                  </p>
                  <button
                    disabled
                    className="w-full bg-gray-600 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Upload className="w-5 h-5" />
                    Próximamente
                  </button>
                </div>
              </div>

              {/* Información del Sistema */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Información del Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Versión</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Base de Datos</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">Firestore</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Usuarios Totales</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{users.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Estado</p>
                    <p className="text-lg font-semibold text-green-400">Activo</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Datos de Prueba */}
          {activeTab === 'testdata' && (
            <div className="space-y-6">
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">⚠️ Solo para Desarrollo y Testing</h3>
                  <p className="text-sm text-yellow-300/80">
                    Estas herramientas permiten generar y limpiar datos de prueba. <strong>No usar en producción con datos reales.</strong>
                  </p>
                </div>
              </div>

              {/* Generar Datos de Prueba */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-900/30 rounded-lg">
                    <FlaskConical className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Generar Datos de Prueba</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Crear datos ficticios para testing</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    Esta acción creará los siguientes datos de prueba en Firestore:
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-4">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">31</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">Parcelas</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">house0 (Portón) + house1-30</div>
                    </div>

                    <div className="card p-4">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">~60</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">Boletas</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">3 meses × 20 parcelas</div>
                    </div>

                    <div className="card p-4">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">~48</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">Pagos</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">80% de boletas pagadas</div>
                    </div>

                    <div className="card p-4">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">40</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">Vehículos</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">2 por parcela (20)</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Nota:</strong> Los datos generados incluyen house0 (Portón para electricidad) + 
                      parcelas numeradas (house1, house2... hasta house30), boletas de electricidad de los últimos 3 meses, 
                      pagos validados para el 80% de las boletas, y 2 vehículos por parcela con marcas y modelos variados.
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm('¿Estás seguro de generar datos de prueba? Esto creará 31 casas (incluyendo Portón), ~60 boletas, ~48 pagos y 40 vehículos.')) return;
                    
                    try {
                      setOperationInProgress(true);
                      setOperationMessage('Generando datos de prueba... Esto puede tardar 10-20 segundos');
                      setError('');
                      setSuccess('');
                      
                      const result = await generateSeedData();
                      
                      if (result.success) {
                        setSuccess(
                          `✅ Datos generados: ${result.results.houses} casas, ${result.results.bills} boletas, ${result.results.payments} pagos, ${result.results.vehicles} vehículos`
                        );
                      }
                    } catch (err) {
                      setError(`Error al generar datos: ${err.message}`);
                    } finally {
                      setOperationInProgress(false);
                      setOperationMessage('');
                    }
                  }}
                  disabled={operationInProgress}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {operationInProgress ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-5 h-5" />
                      Generar Datos de Prueba
                    </>
                  )}
                </button>
              </div>

              {/* Generar Parcelas REALES (115) */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 border-2 border-primary-500 dark:border-primary-600">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-primary-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Generar Parcelas REALES</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Crear estructura completa de Los Peumos</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    Esta acción creará las <strong>126 parcelas reales</strong> de Los Peumos en Firestore:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card p-4">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">126</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">Parcelas Totales</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">house0 (Portón) + house1-115</div>
                    </div>

                    <div className="card p-4">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">20</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300">Subdivisiones</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">10 parcelas con A y B</div>
                    </div>
                  </div>

                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-500/30 rounded-lg p-4">
                    <p className="text-sm text-primary-700 dark:text-primary-300 mb-2">
                      <strong>📍 Parcelas incluidas:</strong>
                    </p>
                    <ul className="text-xs text-primary-700 dark:text-primary-300 space-y-1 list-disc list-inside">
                      <li>house0 → Portón Comunidad</li>
                      <li>house1 a house115 → Parcelas numeradas</li>
                      <li>Subdivisiones A/B: 6, 18, 20, 26, 28, 35, 36, 41, 48, 51</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-lg p-4">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>⚠️ Importante:</strong> Esta acción solo crea las parcelas. No genera boletas, pagos ni vehículos.
                      Es ideal para comenzar con la estructura real de tu comunidad.
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm('¿Generar 126 parcelas REALES de Los Peumos? Esto incluye house0 (Portón) + house1-115 con subdivisiones.')) return;
                    
                    try {
                      setOperationInProgress(true);
                      setOperationMessage('Generando 126 parcelas reales... Esto puede tardar 20-30 segundos');
                      setError('');
                      setSuccess('');
                      
                      const result = await generateRealData();
                      
                      if (result.success) {
                        setSuccess(
                          `✅ ${result.results.houses} parcelas reales creadas exitosamente (house0 + house1-115 con subdivisiones)`
                        );
                      }
                    } catch (err) {
                      setError(`Error al generar parcelas: ${err.message}`);
                    } finally {
                      setOperationInProgress(false);
                      setOperationMessage('');
                    }
                  }}
                  disabled={operationInProgress}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {operationInProgress ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Generando parcelas...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-5 h-5" />
                      Generar 126 Parcelas REALES
                    </>
                  )}
                </button>
              </div>

              {/* Limpiar Parcelas Legacy Duplicadas */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <Trash2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300">Limpiar Parcelas Duplicadas Legacy</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400">Eliminar house6, house18, house20, etc. (mantiene 6A, 6B, etc.)</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-amber-800 dark:text-amber-300 text-sm">
                    Esta acción eliminará SOLO las versiones sin letra de las parcelas subdivididas:
                  </p>

                  <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                      house6, house18, house20, house26, house28 (versiones sin letra)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></div>
                      house35, house36, house41, house48, house51 (versiones sin letra)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></div>
                      <strong>Mantiene</strong>: house6A, house6B, house18A, etc. (con letra)
                    </li>
                  </ul>

                  <div className="bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 rounded-lg p-3 mt-4">
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      <strong>💡 Uso:</strong> Si tienes parcelas duplicadas de versiones antiguas, usa este botón para limpiarlas sin borrar todo.
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm('¿Eliminar parcelas legacy duplicadas (house6, house18, etc.)?\n\nSe mantendrán las versiones con letra (6A, 6B, etc.)')) return;
                    
                    try {
                      setOperationInProgress(true);
                      setOperationMessage('Eliminando parcelas legacy duplicadas...');
                      setError('');
                      setSuccess('');
                      
                      const result = await cleanLegacySubdivisions();
                      
                      if (result.success) {
                        setSuccess(
                          `✅ ${result.results.houses} parcelas legacy eliminadas, ${result.results.bills} boletas asociadas eliminadas`
                        );
                      }
                    } catch (err) {
                      setError(`Error: ${err.message}`);
                    } finally {
                      setOperationInProgress(false);
                      setOperationMessage('');
                    }
                  }}
                  disabled={operationInProgress}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {operationInProgress ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Limpiar Parcelas Legacy
                    </>
                  )}
                </button>
              </div>

              {/* Limpiar Datos de Prueba */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-900/30 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Limpiar Datos de Prueba</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Eliminar todos los datos ficticios</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    Esta acción eliminará permanentemente:
                  </p>

                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></div>
                      Todas las casas de prueba (house0 + house1 a house30)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></div>
                      Todas las boletas asociadas a esas casas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></div>
                      Todos los pagos asociados a esas casas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400"></div>
                      Todos los vehículos asociados a esas casas
                    </li>
                  </ul>

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>⚠️ Advertencia:</strong> Esta acción es irreversible. Solo elimina datos de prueba 
                      (house0 y house1-house30), no afecta otras casas con numeración diferente.
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm('⚠️ ¿Estás SEGURO de eliminar TODOS los datos de prueba? Esta acción NO se puede deshacer.')) return;
                    if (!window.confirm('Confirma nuevamente: ¿Eliminar datos de prueba (house1-house30 y todo relacionado)?')) return;
                    
                    try {
                      setOperationInProgress(true);
                      setOperationMessage('Limpiando datos de prueba... Esto puede tardar 15-30 segundos');
                      setError('');
                      setSuccess('');
                      
                      const result = await cleanSeedData();
                      
                      if (result.success) {
                        setSuccess(
                          `🧹 Datos eliminados: ${result.results.houses} casas, ${result.results.bills} boletas, ${result.results.payments} pagos, ${result.results.vehicles} vehículos`
                        );
                      }
                    } catch (err) {
                      setError(`Error al limpiar datos: ${err.message}`);
                    } finally {
                      setOperationInProgress(false);
                      setOperationMessage('');
                    }
                  }}
                  disabled={operationInProgress}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {operationInProgress ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Limpiando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Limpiar Datos de Prueba
                    </>
                  )}
                </button>
              </div>

              {/* Limpiar Parcelas REALES */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 border-2 border-red-600 dark:border-red-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-900/40 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Eliminar TODAS las Parcelas Reales</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">⚠️ PELIGRO: Elimina las 126 parcelas reales</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="bg-red-100 dark:bg-red-900/40 border-2 border-red-600 dark:border-red-500 rounded-lg p-4">
                    <p className="text-red-800 dark:text-red-300 font-bold mb-2">
                      🚨 ADVERTENCIA CRÍTICA
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Esta acción eliminará <strong>PERMANENTEMENTE</strong> las 126 parcelas reales de Los Peumos 
                      (house0 + house1-115 con subdivisiones A/B) y <strong>TODOS</strong> los datos asociados:
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400"></div>
                      <strong>126 parcelas</strong> (house0 + house1-115 + subdivisiones)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400"></div>
                      <strong>TODAS las boletas</strong> de electricidad asociadas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400"></div>
                      <strong>TODOS los pagos</strong> registrados
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400"></div>
                      <strong>TODOS los vehículos</strong> registrados
                    </li>
                  </ul>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-500 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      <strong>💡 Uso:</strong> Esta función es solo para casos extremos (resetear sistema, 
                      corregir errores masivos). <strong>NO HAY FORMA DE RECUPERAR LOS DATOS</strong> eliminados.
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!window.confirm('🚨 PELIGRO: ¿Eliminar las 126 PARCELAS REALES y TODOS sus datos? Esta acción NO se puede deshacer.')) return;
                    if (!window.confirm('⚠️ SEGUNDA CONFIRMACIÓN: ¿Estás ABSOLUTAMENTE SEGURO? Se eliminará TODO.')) return;
                    if (!window.confirm('🔴 ÚLTIMA ADVERTENCIA: Escribe OK en tu mente y confirma para proceder con la eliminación TOTAL.')) return;
                    
                    try {
                      setOperationInProgress(true);
                      setOperationMessage('Eliminando 126 parcelas reales y TODOS los datos asociados... Puede tardar 30-60 segundos');
                      setError('');
                      setSuccess('');
                      
                      const result = await cleanRealData();
                      
                      if (result.success) {
                        setSuccess(
                          `🧹 Eliminación completa: ${result.results.houses} parcelas, ${result.results.bills} boletas, ${result.results.payments} pagos, ${result.results.vehicles} vehículos`
                        );
                      }
                    } catch (err) {
                      setError(`Error al eliminar parcelas: ${err.message}`);
                    } finally {
                      setOperationInProgress(false);
                      setOperationMessage('');
                    }
                  }}
                  disabled={operationInProgress}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {operationInProgress ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Eliminando TODO...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Eliminar 126 Parcelas REALES
                    </>
                  )}
                </button>
              </div>

              {/* Información */}
              <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">💡 Uso Recomendado</h3>
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-green-600 dark:text-green-400 font-bold">1.</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Desarrollo:</strong> Genera datos de prueba para desarrollar 
                      y probar funcionalidades sin afectar datos reales.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Testing:</strong> Usa estos datos para hacer pruebas 
                      de reportes, filtros, exportaciones y flujos de trabajo.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">3.</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Pre-Producción:</strong> Antes de poner el sistema en 
                      producción, limpia todos los datos de prueba para empezar limpio.
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-red-600 dark:text-red-400 font-bold">4.</span>
                    <div>
                      <strong className="text-slate-900 dark:text-white">Producción:</strong> Una vez en producción con datos reales, 
                      <strong className="text-red-600 dark:text-red-400"> NO uses estas herramientas</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles de Usuario */}
      {showUserDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalles de Usuario</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Editar información del usuario</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseUserDetails}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={selectedUser.name || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    className="input"
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={selectedUser.email || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                    className="input"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Parcela
                  </label>
                  <input
                    type="text"
                    value={selectedUser.houseId || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, houseId: e.target.value })}
                    className="input"
                    placeholder="house1, house2, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={selectedUser.phone || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                    className="input"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              {/* Información del sistema (solo lectura) */}
              <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Información del Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">ID de Usuario:</span>
                    <p className="text-slate-900 dark:text-white font-mono text-xs break-all">{selectedUser.id}</p>
                  </div>
                  
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Rol:</span>
                    <p className="text-slate-900 dark:text-white">{getRoleLabel(selectedUser.role)}</p>
                  </div>
                  
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Estado:</span>
                    <p className={selectedUser.isActive !== false ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {selectedUser.isActive !== false ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  
                  {selectedUser.createdAt && (
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Fecha de Registro:</span>
                      <p className="text-slate-900 dark:text-white">
                        {typeof selectedUser.createdAt === 'string' 
                          ? new Date(selectedUser.createdAt).toLocaleDateString('es-CL')
                          : selectedUser.createdAt.toDate 
                            ? selectedUser.createdAt.toDate().toLocaleDateString('es-CL')
                            : 'N/A'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCloseUserDetails}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUserDetails}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambiar Contraseña */}
      {showPasswordModal && userForPasswordChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cambiar Contraseña</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{userForPasswordChange.name}</p>
                  </div>
                </div>
                <button
                  onClick={handleClosePasswordModal}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      <strong>Nota:</strong> Esta funcionalidad requiere configuración adicional con Firebase Functions 
                      para cambiar contraseñas de usuarios de forma segura. Por ahora, se recomienda que los usuarios 
                      usen "Olvidé mi contraseña" en la página de login.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Repite la contraseña"
                  disabled
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-6">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleClosePasswordModal}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={true}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Cambiar Contraseña (Próximamente)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay para operaciones pesadas */}
      {operationInProgress && (
        <LoadingOverlay 
          fullScreen 
          message={operationMessage} 
        />
      )}
    </div>
  );
}













