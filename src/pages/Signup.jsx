import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { UserPlus, Mail, Lock, User, Home, Phone, AlertCircle, Loader, Shield } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'residente',
    houseId: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableHouses, setAvailableHouses] = useState([]);
  const [loadingHouses, setLoadingHouses] = useState(false);
  const [useCustomHouse, setUseCustomHouse] = useState(false);

  useEffect(() => {
    if (formData.role === 'residente') {
      loadAvailableHouses();
    }
  }, [formData.role]);

  const loadAvailableHouses = async () => {
    try {
      setLoadingHouses(true);
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      // Obtener todas las parcelas ocupadas
      const occupiedHouses = new Set();
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.houseId && userData.houseId.startsWith('house')) {
          occupiedHouses.add(userData.houseId);
        }
      });

      // Generar lista de parcelas disponibles (1-50)
      const houses = [];
      for (let i = 1; i <= 50; i++) {
        const houseId = `house${i}`;
        if (!occupiedHouses.has(houseId)) {
          houses.push({ id: i, houseId, label: `Parcela ${i}` });
        }
      }
      
      setAvailableHouses(houses);
    } catch (error) {
      console.error('Error loading houses:', error);
    } finally {
      setLoadingHouses(false);
    }
  };

  const roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'presidente', label: 'Presidente' },
    { value: 'tecnico', label: 'Técnico' },
    { value: 'secretaria', label: 'Secretaria' },
    { value: 'residente', label: 'Residente' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('Por favor completa todos los campos obligatorios');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (formData.role === 'residente' && !formData.houseId) {
      setError('Los residentes deben tener una parcela asignada');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Formatear houseId: si es residente, convertir "10" a "house10"
      const houseIdFormatted = formData.role === 'residente' && formData.houseId
        ? `house${formData.houseId}`
        : formData.houseId || null;

      await signup(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        houseId: houseIdFormatted,
        phone: formData.phone
      });
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      
      // Mensajes de error en español
      if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este correo');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña es muy débil');
      } else {
        setError('Error al crear la cuenta. Intenta nuevamente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Registrar Usuario
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Solo administradores pueden crear nuevas cuentas
          </p>
        </div>

        {/* Formulario */}
        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid de 2 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                    placeholder="usuario@lospeumos.cl"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="input-field pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="input-field pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="input-field pl-10"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parcela/Casa */}
              <div>
                <label htmlFor="houseId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Número de Parcela {formData.role === 'residente' && <span className="text-red-500">*</span>}
                </label>
                
                {formData.role === 'residente' && availableHouses.length > 0 && !useCustomHouse ? (
                  <>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        id="houseId"
                        name="houseId"
                        value={formData.houseId}
                        onChange={handleChange}
                        required={formData.role === 'residente'}
                        className="input-field pl-10"
                      >
                        <option value="">Seleccione una parcela</option>
                        {availableHouses.map((house) => (
                          <option key={house.id} value={house.id}>
                            {house.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomHouse(true);
                        setFormData({ ...formData, houseId: '' });
                      }}
                      className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      ¿Ingresar número manualmente?
                    </button>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        id="houseId"
                        name="houseId"
                        value={formData.houseId}
                        onChange={handleChange}
                        required={formData.role === 'residente'}
                        className="input-field pl-10"
                        placeholder="Ej: 1, 2, 3..."
                      />
                    </div>
                    {formData.role === 'residente' && availableHouses.length > 0 && useCustomHouse && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomHouse(false);
                          setFormData({ ...formData, houseId: '' });
                        }}
                        className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ← Volver al selector
                      </button>
                    )}
                  </>
                )}
                
                {loadingHouses && (
                  <p className="mt-1 text-xs text-slate-500">Cargando parcelas disponibles...</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="md:col-span-2">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teléfono (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Crear Usuario
                  </>
                )}
              </button>
              
              <Link
                to="/login"
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
